"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@heroui/react";
import { apiFetch, ClientError, post } from "@/lib/client";
import type {
  GenerationDTO,
  GenerationListDTO,
  GenerationParams,
  GenerationType,
  QuotaDTO,
} from "@/types";

const POLL_INTERVAL = 3000;

export interface SubmitResult {
  generation: GenerationDTO;
  quota: QuotaDTO;
}

function isPending(item: GenerationDTO) {
  return item.status === "queued" || item.status === "processing";
}

/**
 * Galeri bersama: infinite scroll (cursor, 10/halaman) + polling 3 detik untuk
 * hasil milik sendiri yang masih berjalan (FR-GAL-6, FR-GEN-3).
 */
export function useGenerations(
  type: GenerationType,
  scope: "all" | "mine" = "all",
  onCompleted?: (item: GenerationDTO) => void,
) {
  const [items, setItems] = useState<GenerationDTO[]>([]);
  const [quota, setQuota] = useState<QuotaDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | null>(null);
  const itemsRef = useRef<GenerationDTO[]>([]);
  const completedRef = useRef(onCompleted);
  useEffect(() => {
    completedRef.current = onCompleted;
  }, [onCompleted]);

  const applyQuota = useCallback((next: QuotaDTO | null | undefined) => {
    if (next) setQuota(next);
  }, []);

  const merge = useCallback((incoming: GenerationDTO[], allowNew = true) => {
    if (!incoming.length) return;
    setItems((prev) => {
      const map = new Map(prev.map((item) => [item.id, item]));
      const order = prev.map((item) => item.id);
      for (const item of incoming) {
        const before = map.get(item.id);
        if (!before && !allowNew) continue;
        map.set(item.id, item);
        if (!order.includes(item.id)) order.push(item.id);
        if (before && isPending(before) && item.status === "completed") {
          completedRef.current?.(item);
        }
      }
      return order.map((id) => map.get(id)!).filter(Boolean);
    });
  }, []);

  const load = useCallback(
    async (mode: "reset" | "more" | "poll") => {
      if (mode === "more" && (!cursorRef.current || loadingMore)) return;
      if (mode === "reset") {
        setLoading(true);
        setHasMore(true);
      }
      if (mode === "more") setLoadingMore(true);
      try {
        const params = new URLSearchParams({ type, limit: "10", scope });
        if (mode === "more" && cursorRef.current) params.set("cursor", cursorRef.current);
        const data = await apiFetch<GenerationListDTO>(`/api/generations?${params.toString()}`);
        if (mode === "poll") {
          // FR-GAL-8: hasil baru milik user lain tidak muncul otomatis saat polling.
          merge(data.items, false);
        } else if (mode === "more") {
          merge(data.items);
          cursorRef.current = data.nextCursor;
          setNextCursor(data.nextCursor);
          setHasMore(Boolean(data.nextCursor));
        } else {
          setItems(data.items);
          itemsRef.current = data.items;
          cursorRef.current = data.nextCursor;
          setNextCursor(data.nextCursor);
          setHasMore(Boolean(data.nextCursor));
        }
        setError(null);
      } catch (err) {
        if (mode === "reset") setError((err as Error).message ?? "Gagal memuat hasil.");
      } finally {
        if (mode === "reset") setLoading(false);
        if (mode === "more") setLoadingMore(false);
      }
    },
    [type, scope, loadingMore, merge],
  );

  useEffect(() => {
    cursorRef.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load("reset");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, scope]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (!navigator.onLine) return;
      const hasPending = itemsRef.current.some((item) => item.isOwner && isPending(item));
      if (hasPending) void load("poll");
    }, POLL_INTERVAL);

    function onOnline() {
      const hasPending = itemsRef.current.some((item) => item.isOwner && isPending(item));
      if (hasPending) void load("poll");
    }
    window.addEventListener("online", onOnline);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("online", onOnline);
    };
  }, [load]);

  const loadMore = useCallback(() => {
    if (nextCursor) void load("more");
  }, [nextCursor, load]);

  const refresh = useCallback(() => {
    cursorRef.current = null;
    void load("reset");
  }, [load]);

  const submit = useCallback(
    async (prompt: string, params: GenerationParams): Promise<SubmitResult> => {
      const result = await post<SubmitResult>("/api/generations", { type, prompt, params });
      applyQuota(result.quota);
      setItems((prev) => [result.generation, ...prev.filter((i) => i.id !== result.generation.id)]);
      return result;
    },
    [type, applyQuota],
  );

  const remove = useCallback(async (id: string) => {
    await apiFetch(`/api/generations/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Hasil dihapus dari galeri.");
  }, []);

  const retry = useCallback(
    async (id: string) => {
      try {
        const result = await post<SubmitResult>(`/api/generations/${id}/retry`);
        applyQuota(result.quota);
        merge([result.generation]);
        toast.success("Proses dijalankan ulang.");
      } catch (err) {
        if (err instanceof ClientError) {
          toast.danger(err.message);
          return;
        }
        throw err;
      }
    },
    [applyQuota, merge],
  );

  const upsert = useCallback(
    (item: GenerationDTO) => {
      merge([item]);
    },
    [merge],
  );

  return {
    items,
    quota,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    submit,
    remove,
    retry,
    upsert,
    setQuota: applyQuota,
  };
}

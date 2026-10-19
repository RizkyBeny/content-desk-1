"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/client";
import { LoadingState, ErrorState, SpinnerBlock } from "@/components/ui/states";
import { EditorShell } from "@/components/editor/editor-shell";
import type { CreationDTO } from "@/types";

/**
 * Shared fetch-and-render view for /studio/[id] and /desain/[id].
 * `backHref` controls where the toolbar back link points.
 */
export function CreationEditorView({ backHref }: { backHref?: string }) {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [creation, setCreation] = useState<CreationDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!id) return;
    let aborted = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load(silent: boolean) {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await apiFetch<{ creation: CreationDTO }>(`/api/creations/${id}`);
        if (aborted) return;
        setCreation(res.creation);
        if (res.creation.status === "generating" && !res.creation.editorState) {
          timer = setTimeout(() => void load(true), 2000);
        }
      } catch (e) {
        if (aborted) return;
        if (silent) {
          timer = setTimeout(() => void load(true), 4000);
        } else {
          setError((e as Error).message ?? "Gagal memuat konten.");
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    void load(false);
    return () => {
      aborted = true;
      if (timer) clearTimeout(timer);
    };
  }, [id, reload]);

  if (loading) return <div className="py-6"><LoadingState rows={3} /></div>;
  if (error || !creation) {
    return (
      <div className="py-6">
        <ErrorState message={error ?? "Konten tidak ditemukan."} onRetry={() => setReload((n) => n + 1)} />
      </div>
    );
  }

  if (!creation.editorState) {
    if (creation.status === "generating") {
      return (
        <div className="py-6">
          <SpinnerBlock label="Menyiapkan konten…" />
        </div>
      );
    }
    return (
      <div className="py-6">
        <ErrorState
          message={
            creation.status === "failed"
              ? "Generate gagal sehingga konten tidak bisa diedit."
              : "Konten tidak memiliki data yang bisa diedit."
          }
          onRetry={() => setReload((n) => n + 1)}
        />
      </div>
    );
  }

  return <EditorShell creation={creation} backHref={backHref} />;
}

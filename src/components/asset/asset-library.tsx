"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react";
import { apiFetch } from "@/lib/client";
import { EmptyBlock, ErrorState, LoadingState } from "@/components/ui/states";
import { AssetIcon } from "@/components/ui/icons";
import { AssetCard } from "./asset-card";
import { AssetEditDialog } from "./asset-edit-dialog";
import { AssetDeleteDialog } from "./asset-delete-dialog";
import { AssetFilters, EMPTY_ASSET_FILTERS, type AssetFilterState } from "./asset-filters";
import { UploadZone } from "./upload-zone";
import type { AssetDTO, AssetType } from "@/types";

const PAGE_SIZE = 24;

export function AssetLibrary({
  selectable = false,
  selectedId = null,
  onSelect,
  typeFilter,
  showUpload = true,
}: {
  selectable?: boolean;
  selectedId?: string | null;
  onSelect?: (asset: AssetDTO) => void;
  typeFilter?: AssetType;
  showUpload?: boolean;
}) {
  const [filters, setFilters] = useState<AssetFilterState>({ ...EMPTY_ASSET_FILTERS, type: (typeFilter as AssetFilterState['type']) || 'image' });
  const [debouncedQ, setDebouncedQ] = useState("");
  const [items, setItems] = useState<AssetDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState<AssetDTO | null>(null);
  const [deleting, setDeleting] = useState<AssetDTO | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(filters.q.trim()), 300);
    return () => clearTimeout(t);
  }, [filters.q]);

  const query = useMemo(() => {
    const p = new URLSearchParams({ limit: String(PAGE_SIZE), offset: "0" });
    if (debouncedQ) p.set("q", debouncedQ);
    const type = filters.type || typeFilter || "image";
    if (type) p.set("type", type);
    if (filters.origin) p.set("origin", filters.origin);
    return p;
  }, [debouncedQ, filters.type, filters.origin, typeFilter]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<{ items: AssetDTO[]; total: number }>(`/api/assets?${query}`);
        if (aborted) return;
        setItems(res.items);
        setTotal(res.total);
      } catch (e) {
        if (!aborted) setError((e as Error).message ?? "Gagal memuat aset.");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [query, reload]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const p = new URLSearchParams(query);
      p.set("offset", String(items.length));
      const res = await apiFetch<{ items: AssetDTO[]; total: number }>(`/api/assets?${p}`);
      setItems((prev) => [...prev, ...res.items]);
      setTotal(res.total);
    } catch (e) {
      setError((e as Error).message ?? "Gagal memuat lebih banyak.");
    } finally {
      setLoadingMore(false);
    }
  }

  const tags = useMemo(() => Array.from(new Set(items.flatMap((i) => i.tags))).sort(), [items]);
  const visible = useMemo(
    () => (filters.tag ? items.filter((i) => i.tags.includes(filters.tag)) : items),
    [items, filters.tag],
  );

  const hasFilters = Boolean(filters.q || filters.origin || filters.tag);

  return (
    <div className="space-y-4">
      {showUpload && (
        <UploadZone
          onUploaded={(asset) => {
            setItems((prev) => [asset, ...prev]);
            setTotal((n) => n + 1);
          }}
        />
      )}

      <AssetFilters value={filters} onChange={setFilters} tags={tags} />

      {loading && <LoadingState rows={2} />}
      {error && !loading && <ErrorState message={error} onRetry={() => setReload((n) => n + 1)} />}

      {!loading && !error && (
        <>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {visible.length} dari {total} aset
          </p>
          {visible.length === 0 ? (
            <EmptyBlock
              icon={<AssetIcon />}
              title={hasFilters ? "Tidak ada aset yang cocok" : "Belum ada aset"}
              description={
                hasFilters
                  ? "Coba ubah kata kunci atau filter."
                  : "Unggah berkas atau hasilkan konten untuk mulai mengisi pustaka."
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visible.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  selected={selectedId === asset.id}
                  onSelect={selectable ? onSelect : undefined}
                  onEdit={selectable ? undefined : setEditing}
                  onDelete={selectable ? undefined : setDeleting}
                />
              ))}
            </div>
          )}

          {!filters.tag && items.length < total && (
            <div className="flex justify-center pt-2">
              <Button variant="secondary" onPress={loadMore} isDisabled={loadingMore}>
                {loadingMore ? "Memuat…" : "Muat lebih banyak"}
              </Button>
            </div>
          )}
        </>
      )}

      <AssetEditDialog
        asset={editing}
        onClose={() => setEditing(null)}
        onSaved={(updated) => setItems((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))}
      />
      <AssetDeleteDialog
        asset={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={(removed) => {
          setItems((prev) => prev.filter((a) => a.id !== removed.id));
          setTotal((n) => Math.max(0, n - 1));
        }}
      />
    </div>
  );
}

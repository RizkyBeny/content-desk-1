"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "@heroui/react";
import { apiFetch } from "@/lib/client";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, SearchIcon, UploadIcon, VideoIcon } from "@/components/ui/icons";
import { UploadZone } from "@/components/asset/upload-zone";
import type { AssetDTO, CreationDTO, RailTabValue } from "./types";

const TYPE_FILTER: Record<string, string | undefined> = {
  image: "image",
  carousel: "image",
  video: "video",
  audio: "audio",
  article: undefined,
};

function Thumb({ asset }: { asset: AssetDTO }) {
  if (asset.type === "image" && asset.fileUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={asset.fileUrl} alt={asset.name} className="h-full w-full object-cover" loading="lazy" />
    );
  }
  if (asset.type === "video" && asset.fileUrl) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-zinc-900 text-white/80">
        <VideoIcon width={20} height={20} />
      </span>
    );
  }
  return (
    <span className="flex h-full w-full items-center justify-center bg-zinc-100 px-1 text-center text-[10px] leading-tight text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
      {asset.type === "audio" ? "Audio" : "Aset"}
    </span>
  );
}

export function AssetRail({
  creation,
  onPickAsset,
  backHref,
}: {
  creation: CreationDTO;
  onPickAsset?: (asset: AssetDTO) => void;
  backHref?: string;
}) {
  const [tab, setTab] = useState<RailTabValue>("pustaka");
  const [query, setQuery] = useState("");
  const [assets, setAssets] = useState<AssetDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const back = backHref ?? `/proyek/${creation.projectId}`;

  useEffect(() => {
    let aborted = false;
    async function load() {
      try {
        const type = TYPE_FILTER[creation.type];
        const qs = new URLSearchParams({ limit: "24" });
        if (type) qs.set("type", type);
        const res = await apiFetch<{ assets: AssetDTO[] }>(`/api/assets?${qs.toString()}`);
        if (!aborted) setAssets(res.assets);
      } catch (e) {
        if (!aborted) setError((e as Error).message ?? "Gagal memuat aset.");
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    void load();
    return () => {
      aborted = true;
    };
  }, [creation.type]);

  const suggested = useMemo(() => {
    const ids = new Set((creation.items?.map((i) => i.asset?.id).filter(Boolean) as string[]) ?? []);
    return (assets ?? []).filter((a) => ids.has(a.id));
  }, [assets, creation.items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets ?? [];
    return (assets ?? []).filter((a) => a.name.toLowerCase().includes(q) || (a.tags ?? []).some((t) => t.toLowerCase().includes(q)));
  }, [assets, query]);

  const others = filtered.filter((a) => !suggested.some((s) => s.id === a.id));

  function pick(asset: AssetDTO) {
    if (!onPickAsset) {
      toast.info("Pilih aset lewat kontrol panel untuk menerapkannya.");
      return;
    }
    onPickAsset(asset);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-zinc-200/60 px-3 py-2 dark:border-white/10">
        <a
          href={back}
          className="group flex items-center gap-2 rounded-lg px-1 py-1 text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
        >
          <ChevronLeftIcon width={16} height={16} className="transition-transform group-hover:-translate-x-0.5" />
          Kembali ke brief
        </a>
      </div>

      <div className="flex shrink-0 gap-1 px-3 pt-3">
        {(
          [
            { value: "pustaka", label: "Pustaka" },
            { value: "upload", label: "Upload" },
          ] as { value: RailTabValue; label: string }[]
        ).map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            aria-pressed={tab === t.value}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              tab === t.value
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pustaka" ? (
        <>
          <div className="shrink-0 px-3 py-3">
            <div className="relative">
              <SearchIcon
                width={15}
                height={15}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari aset…"
                aria-label="Cari aset"
                className="w-full rounded-lg border border-zinc-200/70 bg-white/80 py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:border-indigo-400/70 dark:border-white/10 dark:bg-zinc-900/70"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            {loading ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-20" />
                ))}
              </div>
            ) : error ? (
              <p className="text-xs text-red-500">{error}</p>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {query ? "Tidak ada aset yang cocok." : "Belum ada aset. Unggah di tab Upload."}
              </p>
            ) : (
              <div className="space-y-4">
                {suggested.length > 0 ? (
                  <div>
                    <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Aset Disarankan
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {suggested.map((a) => (
                        <RailTile key={a.id} asset={a} onPick={pick} />
                      ))}
                    </div>
                  </div>
                ) : null}

                {others.length > 0 ? (
                  <div>
                    <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Aset Lainnya
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {others.map((a) => (
                        <RailTile key={a.id} asset={a} onPick={pick} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <UploadIcon width={14} height={14} /> Unggah aset baru
          </div>
          <UploadZone
            onUploaded={(asset) => {
              toast.success("Aset diunggah.");
              setAssets((prev) => [asset, ...prev]);
              if (onPickAsset) onPickAsset(asset);
            }}
          />
        </div>
      )}
    </div>
  );
}

function RailTile({ asset, onPick }: { asset: AssetDTO; onPick: (a: AssetDTO) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(asset)}
      title={asset.name}
      className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-zinc-200/60 transition-transform hover:-translate-y-0.5 hover:shadow-md dark:border-white/10"
    >
      <Thumb asset={asset} />
      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-4 text-left text-[10px] leading-tight text-white opacity-0 transition-opacity group-hover:opacity-100">
        {asset.name}
      </span>
    </button>
  );
}

export { Thumb as AssetRailThumb };

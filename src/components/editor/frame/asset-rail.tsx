"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "@heroui/react";
import { apiFetch } from "@/lib/client";
import { ArrowLeftIcon, ImageIcon, PlusIcon, UploadIcon, VideoIcon } from "@/components/ui/icons";
import { UploadZone } from "@/components/asset/upload-zone";
import { InputGroup, TabList } from "./ui";
import type { AssetDTO, CreationDTO, RailTabValue } from "./types";

const RAIL_TABS: { value: RailTabValue; label: string }[] = [
  { value: "pustaka", label: "Data Journalism" },
  { value: "upload", label: "Upload" },
];

function Thumb({ asset }: { asset: AssetDTO }) {
  if (asset.type === "image" && asset.fileUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={asset.fileUrl} alt={asset.name} className="h-full w-full object-cover" loading="lazy" />
    );
  }
  if (asset.type === "video" && asset.fileUrl) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-ed-elev text-ed-dim">
        <VideoIcon width={20} height={20} />
      </span>
    );
  }
  return (
    <span className="flex h-full w-full items-center justify-center bg-ed-elev px-1 text-center text-[10px] leading-tight text-ed-dim">
      {asset.type === "audio" ? "Audio" : "Aset"}
    </span>
  );
}

/**
 * Rail aset di kiri (256px) — tab underlined "Data Journalism" / "Upload",
 * search, dan grid kartu aset sesuai Figma "Video Editor".
 */
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
        const qs = new URLSearchParams({ limit: "24" });
        const res = await apiFetch<{ items: AssetDTO[]; total: number }>(`/api/assets?${qs.toString()}`);
        if (!aborted) setAssets(res.items ?? []);
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
  }, []);

  const suggested = useMemo(() => {
    const fromBrief = (creation.items ?? [])
      .map((i) => i.asset)
      .filter((a): a is AssetDTO => Boolean(a && a.id));
    const seen = new Set<string>();
    return fromBrief.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
  }, [creation.items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets ?? [];
    return (assets ?? []).filter((a) => a.name.toLowerCase().includes(q) || (a.tags ?? []).some((t) => t.toLowerCase().includes(q)));
  }, [assets, query]);

  const others = filtered.filter((a) => !suggested.some((s) => s.id === a.id));
  const usedIds = useMemo(() => new Set(suggested.map((s) => s.id)), [suggested]);

  function pick(asset: AssetDTO) {
    if (!onPickAsset) {
      toast.info("Pilih aset lewat kontrol panel untuk menerapkannya.");
      return;
    }
    onPickAsset(asset);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Back to brief */}
      <div className="shrink-0 px-2 py-1.5">
        <a
          href={back}
          className="group flex items-center gap-2 px-1 py-1.5 text-xs leading-4 text-ed-dim transition-colors hover:text-ed-text"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-ed-line-strong bg-transparent transition-colors group-hover:text-ed-text">
            <ArrowLeftIcon width={16} height={16} />
          </span>
          Back to brief
        </a>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <div className="flex flex-col gap-4">
          <TabList
            items={RAIL_TABS}
            value={tab}
            onChange={setTab}
            ariaLabel="Tab aset"
            barClassName="bg-transparent"
          />

          {tab === "pustaka" ? (
            <>
              <InputGroup
                value={query}
                onChange={setQuery}
                placeholder="Search Asset"
                ariaLabel="Cari aset"
              />

              {loading ? (
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton h-20" />
                  ))}
                </div>
              ) : error ? (
                <p className="text-xs text-ed-danger">{error}</p>
              ) : filtered.length === 0 && suggested.length === 0 ? (
                <p className="px-1 text-xs text-ed-dim">
                  {query ? "Tidak ada aset yang cocok." : "Belum ada aset. Unggah di tab Upload."}
                </p>
              ) : (
                <div className="space-y-4">
                  {suggested.length > 0 ? (
                    <section>
                      <h4 className="mb-2 px-1 font-[family-name:var(--ed-label-font)] text-xs leading-4 font-medium text-ed-dim">
                        Suggested Asset
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {suggested.map((a) => (
                          <RailTile key={a.id} asset={a} onPick={pick} used={usedIds.has(a.id)} />
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {others.length > 0 ? (
                    <section>
                      <h4 className="mb-2 px-1 font-[family-name:var(--ed-label-font)] text-xs leading-4 font-medium text-ed-dim">
                        Asset Lainnya
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {others.map((a) => (
                          <RailTile key={a.id} asset={a} onPick={pick} used={usedIds.has(a.id)} />
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              )}
            </>
          ) : (
            <div>
              <div className="mb-2 flex items-center gap-2 px-1 text-xs text-ed-dim">
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
      </div>
    </div>
  );
}

function RailTile({ asset, onPick, used }: { asset: AssetDTO; onPick: (a: AssetDTO) => void; used?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onPick(asset)}
      title={asset.name}
      className="group relative aspect-[4/3] overflow-hidden rounded transition-transform hover:-translate-y-0.5"
    >
      <Thumb asset={asset} />
      {asset.type !== "image" && asset.type !== "video" ? (
        <span className="absolute inset-0 flex items-center justify-center text-ed-dim">
          <ImageIcon width={18} height={18} />
        </span>
      ) : null}
      {used ? (
        <span className="absolute right-1.5 top-1.5 rounded bg-ed-play px-1 py-0.5 font-[family-name:var(--font-ed-alt)] text-[10px] leading-5 text-white">
          Dipakai
        </span>
      ) : null}
      <span className="absolute bottom-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-ed-play text-white opacity-0 transition-opacity group-hover:opacity-100">
        <PlusIcon width={14} height={14} />
      </span>
      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-4 text-left text-[10px] leading-tight text-white opacity-0 transition-opacity group-hover:opacity-100">
        {asset.name}
      </span>
    </button>
  );
}

export { Thumb as AssetRailThumb };

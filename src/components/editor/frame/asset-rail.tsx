"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "@heroui/react";
import { apiFetch } from "@/lib/client";
import { ArrowLeftIcon, AudioIcon, ImageIcon, PlusIcon, UploadIcon } from "@/components/ui/icons";
import { UploadZone } from "@/components/asset/upload-zone";
import { InputGroup, TabList } from "./ui";
import type { AssetDTO, CreationDTO, RailTabValue } from "./types";

const RAIL_TABS: { value: RailTabValue; label: string }[] = [
  { value: "pustaka", label: "Data Journalism" },
  { value: "upload", label: "Upload" },
];

const ASSET_TYPE_LABEL: Record<AssetDTO["type"], string> = {
  image: "Image",
  video: "Video",
  audio: "Audio",
  text: "Text",
  reference: "Reference",
};

interface RailUser {
  name: string;
  role: string;
}

function Thumb({ asset }: { asset: AssetDTO }) {
  if (asset.type === "image" && asset.fileUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={asset.fileUrl} alt={asset.name} className="h-full w-full object-cover" loading="lazy" />
    );
  }
  if (asset.type === "video" && asset.fileUrl) {
    return (
      <video
        src={`${asset.fileUrl}${asset.fileUrl.includes("#") ? "" : "#t=0.1"}`}
        className="h-full w-full object-cover"
        muted
        playsInline
        preload="metadata"
        aria-label={asset.name}
      />
    );
  }
  return (
    <span className="flex h-full w-full items-center justify-center bg-ed-elev text-ed-dim">
      {asset.type === "audio" ? <AudioIcon width={20} height={20} /> : <ImageIcon width={20} height={20} />}
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
  onBack,
  isSwapping,
  onCancelSwap,
}: {
  creation: CreationDTO;
  onPickAsset?: (asset: AssetDTO) => void;
  backHref?: string;
  onBack?: () => void;
  isSwapping?: boolean;
  onCancelSwap?: () => void;
}) {
  const [tab, setTab] = useState<RailTabValue>("pustaka");
  const [query, setQuery] = useState("");
  const [assets, setAssets] = useState<AssetDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<RailUser | null>(null);

  const back = backHref ?? `/proyek/${creation.projectId}`;

  useEffect(() => {
    let aborted = false;
    apiFetch<{ user: RailUser }>("/api/me")
      .then((res) => {
        if (!aborted) setUser(res.user);
      })
      .catch(() => {
        /* footer opsional */
      });
    return () => {
      aborted = true;
    };
  }, []);

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
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="group flex w-full items-center gap-2 px-1 py-1.5 text-xs leading-4 text-ed-dim transition-colors hover:text-ed-text text-left"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-ed-line-strong bg-transparent transition-colors group-hover:text-ed-text">
              <ArrowLeftIcon width={16} height={16} />
            </span>
            Back to brief
          </button>
        ) : (
          <a
            href={back}
            className="group flex items-center gap-2 px-1 py-1.5 text-xs leading-4 text-ed-dim transition-colors hover:text-ed-text"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-ed-line-strong bg-transparent transition-colors group-hover:text-ed-text">
              <ArrowLeftIcon width={16} height={16} />
            </span>
            Back to brief
          </a>
        )}
      </div>

      {isSwapping ? (
        <div className="mx-2 mb-2 flex items-center justify-between gap-1.5 rounded-lg border border-indigo-400/50 bg-indigo-500/10 px-2.5 py-1.5 text-xs text-indigo-400">
          <span className="truncate font-medium">Pilih aset pengganti di bawah</span>
          {onCancelSwap ? (
            <button
              type="button"
              onClick={onCancelSwap}
              className="shrink-0 font-semibold text-ed-dim hover:text-ed-text underline text-[11px]"
            >
              Batal
            </button>
          ) : null}
        </div>
      ) : null}

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

      <div className="shrink-0 border-t border-ed-line-2 p-2">
        <div className="flex items-center gap-2 rounded-lg px-1 py-1.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ed-elev font-[family-name:var(--font-ed)] text-xs font-semibold text-ed-text">
            {user?.name?.slice(0, 1).toUpperCase() || "K"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-[family-name:var(--font-ed)] text-xs leading-4 font-medium text-ed-text">
              {user?.name || "Creator"}
            </p>
            <p className="truncate font-[family-name:var(--font-ed-alt)] text-[10px] leading-4 text-ed-dim">
              {user?.role === "admin" ? "Admin" : "Creator"}
            </p>
          </div>
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
      className="group flex min-w-0 flex-col gap-1 text-left transition-transform hover:-translate-y-0.5"
    >
      <span className="relative block aspect-[4/3] overflow-hidden rounded">
        <Thumb asset={asset} />
        {used ? (
          <span className="absolute right-1.5 top-1.5 rounded bg-ed-play px-1 py-0.5 font-[family-name:var(--font-ed-alt)] text-[10px] leading-5 text-white">
            Dipakai
          </span>
        ) : null}
        <span className="absolute bottom-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-ed-play text-white opacity-0 transition-opacity group-hover:opacity-100">
          <PlusIcon width={14} height={14} />
        </span>
      </span>
      <span className="truncate font-[family-name:var(--font-ed)] text-[11px] leading-4 font-medium text-ed-sub">
        {asset.name}
      </span>
      <span className="font-[family-name:var(--font-ed-alt)] text-[10px] leading-4 text-ed-dim">
        {ASSET_TYPE_LABEL[asset.type]}
      </span>
    </button>
  );
}

export { Thumb as AssetRailThumb };

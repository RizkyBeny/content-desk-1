"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Chip, toast } from "@heroui/react";
import { apiFetch, post } from "@/lib/client";
import { MediaSourcePicker, type MediaSelection } from "@/components/media/media-source-picker";
import { CreationProgress } from "./creation-progress";
import { AssetIcon, SparkIcon, UploadIcon } from "@/components/ui/icons";
import type { AssetDTO, BriefRow, ContentType, CreationDTO, MediaSource } from "@/types";

interface SourceChoice {
  source: MediaSource;
  asset?: AssetDTO;
  prompt?: string;
}

const SOURCE_LABEL: Record<MediaSource, string> = {
  ai_generated: "Generate AI",
  creator_asset: "Unggahan",
  asset_management: "Pustaka",
};

function rowLabel(type: ContentType, row: number): string {
  switch (type) {
    case "carousel":
      return `Slide ${row}`;
    case "video":
      return `Scene ${row}`;
    case "audio":
      return `Segmen ${row}`;
    case "article":
      return "Artikel";
    default:
      return "Gambar utama";
  }
}

function derivedPrompt(type: ContentType, row: BriefRow): string {
  if (type === "carousel") return [row.visual, row.judul, row.isi].filter(Boolean).join(". ");
  if (type === "audio") return row.naskah ?? "";
  if (type === "video") return row.visual ?? "";
  if (type === "article") return row.poin ?? "";
  return [row.elemenVisual, row.gaya, row.teks].filter(Boolean).join(". ");
}

export function GenerateStep({
  projectId,
  contentType,
  rows,
  briefReady,
}: {
  projectId: string;
  contentType: ContentType;
  rows: BriefRow[];
  briefReady: boolean;
}) {
  const router = useRouter();
  const single = contentType === "image" || contentType === "article";
  const rowCount = single ? 1 : Math.max(1, rows.length);
  const rowNums = Array.from({ length: rowCount }, (_, i) => i + 1);

  const [choices, setChoices] = useState<Record<number, SourceChoice>>({});
  const [pickerRow, setPickerRow] = useState<number | null>(null);
  const [creation, setCreation] = useState<CreationDTO | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async (creationId: string) => {
    try {
      const res = await apiFetch<{ creation: CreationDTO }>(`/api/creations/${creationId}`);
      setCreation(res.creation);
    } catch {
      /* keep last known state */
    }
  }, []);

  // Restore the latest creation for this project, if any.
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await apiFetch<{ items: { id: string; projectId: string }[] }>("/api/creations?limit=60");
        const match = res.items.find((c) => c.projectId === projectId);
        if (match && !aborted) {
          const detail = await apiFetch<{ creation: CreationDTO }>(`/api/creations/${match.id}`);
          if (!aborted) setCreation(detail.creation);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      aborted = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (!creation || creation.status !== "generating") return;
    const id = setInterval(() => refresh(creation.id), 2000);
    return () => clearInterval(id);
  }, [creation, refresh]);

  async function generate() {
    setCreating(true);
    try {
      const mediaSources = rowNums.map((n) => {
        const c = choices[n];
        if (!c || c.source === "ai_generated") {
          return {
            briefRow: n,
            source: "ai_generated" as MediaSource,
            prompt: c?.prompt ?? derivedPrompt(contentType, rows[n - 1] ?? {}),
          };
        }
        return { briefRow: n, source: c.source, assetId: c.asset?.id, prompt: c.prompt };
      });
      const res = await post<{ creationId: string }>("/api/creations", { projectId, mediaSources });
      toast.success("Generate dimulai.");
      router.push(`/studio/${res.creationId}`);
    } catch (e) {
      toast.danger((e as Error).message ?? "Gagal memulai generate.");
    } finally {
      setCreating(false);
    }
  }

  const promptFor = (n: number) => choices[n]?.prompt ?? derivedPrompt(contentType, rows[n - 1] ?? {});

  if (creation) {
    return (
      <CreationProgress
        creation={creation}
        onRefresh={() => refresh(creation.id)}
        onOpenEditor={(id) => router.push(`/studio/${id}`)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-card space-y-3 p-5">
        <ul className="space-y-2">
          {rowNums.map((n) => {
            const c = choices[n];
            const source = c?.source ?? "ai_generated";
            const icon =
              source === "asset_management" ? (
                <AssetIcon width={16} height={16} />
              ) : source === "creator_asset" ? (
                <UploadIcon width={16} height={16} />
              ) : (
                <SparkIcon width={16} height={16} />
              );
            return (
              <li key={n} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/60 p-3 dark:border-white/10">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{rowLabel(contentType, n)}</p>
                  <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">{promptFor(n) || "—"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden text-zinc-500 sm:inline dark:text-zinc-400">{icon}</span>
                  <Chip size="sm" variant="soft">
                    {SOURCE_LABEL[source]}
                    {c?.asset ? `: ${c.asset.name}` : ""}
                  </Chip>
                  <Button variant="secondary" size="sm" onPress={() => setPickerRow(n)}>
                    Ubah
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>

        {!briefReady && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Tandai brief sebagai “siap” sebelum generate.
          </p>
        )}

        <div className="flex justify-end">
          <Button variant="primary" onPress={generate} isDisabled={creating || !briefReady}>
            {creating ? "Memulai…" : "Generate Konten"}
          </Button>
        </div>
      </div>

      <MediaSourcePicker
        open={pickerRow !== null}
        onClose={() => setPickerRow(null)}
        type={contentType === "video" ? "video" : contentType === "audio" ? "audio" : "image"}
        initialPrompt={pickerRow ? promptFor(pickerRow) : ""}
        onSelect={(sel: MediaSelection) =>
          setChoices((prev) => ({
            ...prev,
            [pickerRow ?? 1]: { source: sel.source, asset: sel.asset, prompt: sel.prompt },
          }))
        }
      />
    </div>
  );
}

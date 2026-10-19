"use client";

import { useState } from "react";
import Image from "next/image";
import { Button, Chip, toast } from "@heroui/react";
import { post } from "@/lib/client";
import { AudioIcon, FileTextIcon, RefreshIcon, SparkIcon, VideoIcon } from "@/components/ui/icons";
import type { ContentType, CreationDTO, CreationItemDTO, ItemStatus } from "@/types";

const STATUS_META: Record<ItemStatus, { label: string; color: "default" | "warning" | "success" | "danger" }> = {
  queued: { label: "Menunggu", color: "default" },
  processing: { label: "Memproses", color: "warning" },
  completed: { label: "Selesai", color: "success" },
  failed: { label: "Gagal", color: "danger" },
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

function Thumb({ item }: { item: CreationItemDTO }) {
  const asset = item.asset;
  if (asset?.type === "image" && asset.fileUrl) {
    return (
      <Image
        src={asset.fileUrl}
        alt={rowLabel("image", item.briefRowRef)}
        width={64}
        height={64}
        unoptimized
        className="size-16 rounded-lg object-cover"
      />
    );
  }
  const icon =
    asset?.type === "video" ? (
      <VideoIcon />
    ) : asset?.type === "audio" ? (
      <AudioIcon />
    ) : asset?.type === "text" ? (
      <FileTextIcon />
    ) : (
      <SparkIcon />
    );
  return (
    <span className="flex size-16 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
      {icon}
    </span>
  );
}

export function CreationProgress({
  creation,
  onRefresh,
  onOpenEditor,
}: {
  creation: CreationDTO;
  onRefresh: () => void;
  onOpenEditor?: (id: string) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const total = creation.items.length;
  const done = creation.items.filter((i) => i.status === "completed").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const allReady = creation.status === "ready";

  async function regenerate(item: CreationItemDTO) {
    setBusyId(item.id);
    try {
      await post(`/api/creation-items/${item.id}/regenerate`);
      toast.success("Generasi ulang dimulai.");
      onRefresh();
    } catch (e) {
      toast.danger((e as Error).message ?? "Gagal memulai generasi ulang.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass-card space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              {allReady ? "Konten siap" : "Menghasilkan konten…"}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {done}/{total} item selesai
            </p>
          </div>
          {allReady ? (
            <Chip size="sm" color="success" variant="soft">
              Siap
            </Chip>
          ) : (
            <Chip size="sm" color="warning" variant="soft">
              Diproses
            </Chip>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all dark:bg-white"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progres generate"
          />
        </div>
        {allReady && onOpenEditor && (
          <div className="flex justify-end pt-1">
            <Button variant="primary" size="sm" onPress={() => onOpenEditor(creation.id)}>
              Buka di Editor
            </Button>
          </div>
        )}
      </div>

      <ul className="space-y-2">
        {creation.items.map((item) => {
          const meta = STATUS_META[item.status];
          const isAI = item.mediaSource === "ai_generated";
          return (
            <li key={item.id} className="glass-card flex items-center gap-3 p-3">
              <Thumb item={item} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{rowLabel(creation.type, item.briefRowRef)}</p>
                <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400" title={item.prompt ?? ""}>
                  {item.prompt || (item.mediaSource === "asset_management" ? "Dari pustaka aset" : "Unggahan sendiri")}
                </p>
                {item.status === "failed" && item.errorMessage && (
                  <p className="mt-0.5 text-xs text-red-500">{item.errorMessage}</p>
                )}
              </div>
              <Chip size="sm" color={meta.color} variant="soft">
                {meta.label}
              </Chip>
              {isAI && (item.status === "completed" || item.status === "failed") && (
                <Button
                  variant="ghost"
                  size="sm"
                  isDisabled={busyId === item.id}
                  onPress={() => regenerate(item)}
                  aria-label="Generate ulang"
                >
                  <RefreshIcon width={16} height={16} />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

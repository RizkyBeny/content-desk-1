"use client";

import Image from "next/image";
import { Button, Chip } from "@heroui/react";
import { cn } from "@/lib/utils";
import { PencilIcon, TrashIcon, VideoIcon } from "@/components/ui/icons";
import { assetTypeMeta, formatBytes, originLabel } from "./asset-meta";
import type { AssetDTO } from "@/types";

function Preview({ asset }: { asset: AssetDTO }) {
  const meta = assetTypeMeta(asset.type);
  if (asset.type === "image" && asset.fileUrl) {
    return (
      <Image
        src={asset.fileUrl}
        alt={asset.name}
        fill
        unoptimized
        sizes="240px"
        className="object-cover"
      />
    );
  }
  if (asset.type === "video" && asset.fileUrl) {
    return (
      <>
        <video src={asset.fileUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
        <span className="absolute inset-0 flex items-center justify-center text-white/90">
          <span className="flex size-10 items-center justify-center rounded-full bg-black/45">
            <VideoIcon width={22} height={22} />
          </span>
        </span>
      </>
    );
  }
  return (
    <span className="flex h-full w-full items-center justify-center text-zinc-400 dark:text-zinc-500">
      <span className="scale-[2]">{meta.icon}</span>
    </span>
  );
}

export function AssetCard({
  asset,
  onEdit,
  onDelete,
  onSelect,
  selected = false,
}: {
  asset: AssetDTO;
  onEdit?: (asset: AssetDTO) => void;
  onDelete?: (asset: AssetDTO) => void;
  onSelect?: (asset: AssetDTO) => void;
  selected?: boolean;
}) {
  const meta = assetTypeMeta(asset.type);
  const interactive = Boolean(onSelect);

  return (
    <div
      className={cn(
        "glass-card flex flex-col overflow-hidden p-0",
        selected && "ring-2 ring-zinc-900 dark:ring-white",
      )}
    >
      <button
        type="button"
        onClick={onSelect ? () => onSelect(asset) : undefined}
        disabled={!interactive}
        className={cn(
          "relative block aspect-video w-full overflow-hidden bg-zinc-100 text-left dark:bg-zinc-800",
          interactive && "cursor-pointer",
        )}
        aria-label={interactive ? `Pilih ${asset.name}` : asset.name}
      >
        <Preview asset={asset} />
        <span className="absolute left-2 top-2 rounded-full bg-black/55 p-1.5 text-white">{meta.icon}</span>
      </button>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-1 text-sm font-medium" title={asset.name}>
          {asset.name}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <Chip size="sm" variant="soft">
            {originLabel(asset.origin)}
          </Chip>
          <Chip size="sm" variant="soft" color={asset.visibility === "workspace" ? "accent" : "default"}>
            {asset.visibility === "workspace" ? "Workspace" : "Pribadi"}
          </Chip>
          <span>{formatBytes(asset.sizeBytes)}</span>
        </div>

        {asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {(onEdit || onDelete) && (
          <div className="mt-auto flex items-center justify-end gap-1 pt-1">
            {onEdit && (
              <Button variant="ghost" size="sm" aria-label="Ubah aset" onPress={() => onEdit(asset)}>
                <PencilIcon width={16} height={16} />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" aria-label="Hapus aset" onPress={() => onDelete(asset)}>
                <TrashIcon width={16} height={16} />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

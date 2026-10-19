"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Chip } from "@heroui/react";
import { cn, formatDuration, formatRelativeId } from "@/lib/utils";
import {
  AlertIcon,
  AudioIcon,
  FileTextIcon,
  ImageIcon,
  PauseIcon,
  PlayIcon,
  RefreshIcon,
  VideoIcon,
} from "@/components/ui/icons";
import type { GenerationDTO, GenerationType, BriefResult } from "@/types";
import { WaveformBars } from "./waveform";

const TYPE_LABEL: Record<GenerationType, string> = {
  image: "Image",
  video: "Video",
  audio: "Audio",
  brief: "Brief",
};

export interface TileProps {
  item: GenerationDTO;
  span?: { col: number; row: number };
  onOpen: (item: GenerationDTO) => void;
  onRetry: (item: GenerationDTO) => void;
  playing?: boolean;
  onToggleAudio?: (item: GenerationDTO) => void;
}

export function OwnerBadge({ item }: { item: GenerationDTO }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex size-5 items-center justify-center rounded-full bg-black/55 text-[9px] font-semibold text-white">
        {item.owner?.initials ?? "?"}
      </span>
      <span className="truncate">{item.owner?.name ?? "Tanpa nama"}</span>
    </span>
  );
}

function MetaFooter({ item }: { item: GenerationDTO }) {
  return (
    <span className="flex items-center gap-2 text-[11px] text-white/90">
      <OwnerBadge item={item} />
      <span className="ml-auto shrink-0">{formatRelativeId(item.createdAt)}</span>
    </span>
  );
}

export function ImageTile({ item, onOpen }: TileProps) {
  return (
    <TileShell
      item={item}
      onOpen={onOpen}
      className="p-0"
      ariaLabel={`Buka hasil image: ${item.prompt.slice(0, 120)}`}
    >
      {item.thumbnailUrl || item.fileUrl ? (
        <Image
          src={(item.thumbnailUrl ?? item.fileUrl) as string}
          alt={item.prompt.slice(0, 120)}
          fill
          unoptimized
          sizes="(max-width:768px) 50vw, 320px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
        />
      ) : (
        <FallbackIcon icon={<ImageIcon width={28} height={28} />} />
      )}
      <Overlay>
        <MetaFooter item={item} />
      </Overlay>
    </TileShell>
  );
}

export function VideoTile({ item, onOpen }: TileProps) {
  const [preview, setPreview] = useState(false);
  const timer = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  function startPreview() {
    timer.current = window.setTimeout(() => {
      setPreview(true);
      void videoRef.current?.play().catch(() => {});
    }, 300);
  }

  function stopPreview() {
    if (timer.current) window.clearTimeout(timer.current);
    setPreview(false);
    videoRef.current?.pause();
  }

  return (
    <TileShell
      item={item}
      onOpen={onOpen}
      className="p-0"
      ariaLabel={`Buka hasil video: ${item.prompt.slice(0, 120)}`}
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
    >
      {item.thumbnailUrl ? (
        <Image
          src={item.thumbnailUrl}
          alt={item.prompt.slice(0, 120)}
          fill
          unoptimized
          sizes="(max-width:768px) 50vw, 320px"
          className="object-cover"
        />
      ) : (
        <FallbackIcon icon={<VideoIcon width={28} height={28} />} />
      )}
      {item.fileUrl ? (
        <video
          ref={videoRef}
          src={item.fileUrl}
          muted
          loop
          playsInline
          preload="none"
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            preview ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-[4.8px]">
          <PlayIcon width={20} height={20} />
        </span>
      </span>
      <Overlay>
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
          {formatDuration(item.durationSeconds)}
        </span>
        <MetaFooter item={item} />
      </Overlay>
    </TileShell>
  );
}

export function AudioTile({ item, onOpen, playing, onToggleAudio }: TileProps) {
  const points = item.waveform ?? [];
  return (
    <div
      className="glass-card group relative flex flex-col gap-3 overflow-hidden p-3 text-left"
      role="group"
      aria-label={`Hasil audio: ${item.prompt.slice(0, 120)}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => (onToggleAudio ? onToggleAudio(item) : onOpen(item))}
          aria-label={playing ? "Jeda audio" : "Putar audio"}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-transform hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none dark:bg-white dark:text-zinc-900"
        >
          {playing ? <PauseIcon width={16} height={16} /> : <PlayIcon width={16} height={16} />}
        </button>
        <button type="button" onClick={() => onOpen(item)} className="min-w-0 flex-1 text-left">
          <p className="line-clamp-2 text-sm font-medium">{item.prompt}</p>
          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            {formatDuration(item.durationSeconds)} · voice
          </p>
        </button>
      </div>
      <button type="button" onClick={() => onOpen(item)} aria-label="Buka detail audio" className="w-full">
        <WaveformBars points={points} height={36} />
      </button>
      <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
        <AudioIcon width={14} height={14} />
        <OwnerBadge item={item} />
        <span className="ml-auto">{formatRelativeId(item.createdAt)}</span>
      </div>
    </div>
  );
}

export function BriefTile({ item, onOpen }: TileProps) {
  const result = item.result as BriefResult | null;
  return (
    <TileShell
      item={item}
      onOpen={onOpen}
      className="bg-white/80 p-3 dark:bg-zinc-900/60"
      ariaLabel={`Buka brief: ${item.prompt.slice(0, 120)}`}
      plain
    >
      <div className="flex h-full flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
            <FileTextIcon width={15} height={15} />
          </span>
          <Chip size="sm" variant="soft">
            {TYPE_LABEL.brief}
          </Chip>
          {result?.summary.platforms.slice(0, 1).map((p) => (
            <Chip key={p} size="sm" variant="soft" color="accent">
              {p}
            </Chip>
          ))}
        </div>
        <p className="line-clamp-2 text-sm font-semibold">{result?.summary.title ?? item.prompt}</p>
        <p className="line-clamp-3 text-xs text-zinc-500 dark:text-zinc-400">
          {result?.summary.goal ?? item.prompt}
        </p>
        <div className="mt-auto flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
          <OwnerBadge item={item} />
          <span>{formatRelativeId(item.createdAt)}</span>
        </div>
      </div>
    </TileShell>
  );
}

export function ProcessingTile({ item }: { item: GenerationDTO }) {
  const label = item.status === "queued" ? "Menunggu antrean…" : "Sedang diproses…";
  const hint =
    item.type === "video" ? "Biasanya selesai 1–3 menit." : "Biasanya selesai kurang dari 1 menit.";
  return (
    <div className="glass-card relative flex flex-col gap-2 overflow-hidden p-3" role="status" aria-live="polite">
      <div className="flex items-center gap-2">
        <Chip size="sm" variant="soft" color="accent">
          {TYPE_LABEL[item.type]}
        </Chip>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      </div>
      <div className="shimmer h-16 rounded-xl" />
      <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{item.prompt}</p>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{hint}</p>
    </div>
  );
}

export function FailedTile({ item, onRetry, onOpen }: TileProps) {
  return (
    <div className="glass-card flex flex-col gap-2 border border-red-200/70 p-3 dark:border-red-500/25">
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
        <AlertIcon width={16} height={16} />
        <span className="text-xs font-semibold">Gagal diproses</span>
      </div>
      <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
        {item.errorMessage ?? "Prompt tidak dapat diproses. Coba ubah sedikit kalimatnya."}
      </p>
      <p className="line-clamp-1 text-[11px] text-zinc-500 dark:text-zinc-400">{item.prompt}</p>
      {item.isOwner ? (
        <div className="mt-auto flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => onRetry(item)}
            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-white dark:bg-white dark:text-zinc-900"
          >
            <RefreshIcon width={13} height={13} /> Coba lagi
          </button>
          <button
            type="button"
            onClick={() => onOpen(item)}
            className="rounded-full px-3 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            Detail
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute inset-x-0 bottom-0 block bg-gradient-to-t from-black/70 to-transparent p-2 pt-6 text-[11px] font-medium text-white">
      {children}
    </span>
  );
}

function FallbackIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <span className="flex h-full w-full items-center justify-center text-zinc-500 dark:text-zinc-400">
      {icon}
    </span>
  );
}

function TileShell({
  item,
  onOpen,
  children,
  className,
  ariaLabel,
  plain,
  onMouseEnter,
  onMouseLeave,
}: {
  item: GenerationDTO;
  onOpen: (item: GenerationDTO) => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel: string;
  plain?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={ariaLabel}
      className={cn(
        "group relative block h-full w-full overflow-hidden rounded-2xl text-left transition-shadow",
        plain ? "glass-card" : "glass-card bg-zinc-100 dark:bg-zinc-800",
        "hover:shadow-lg hover:shadow-zinc-900/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500",
        className,
      )}
    >
      {children}
    </button>
  );
}

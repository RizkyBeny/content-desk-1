"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Bar timeline di bawah canvas — menampung strip scene/slide/segment
 * (disediakan per tipe) plus tombol Voice Over / Tambah Backsound dan zoom.
 */
export function TimelineBar({
  children,
  onVoiceOver,
  onAddBacksound,
  showBacksound = true,
  zoom,
  onZoom,
  pageLabel,
}: {
  children: ReactNode;
  onVoiceOver?: () => void;
  onAddBacksound?: () => void;
  showBacksound?: boolean;
  zoom: number;
  onZoom: (v: number) => void;
  pageLabel?: string;
}) {
  return (
    <div className="flex shrink-0 flex-col border-t border-zinc-200/60 bg-zinc-50/70 dark:border-white/10 dark:bg-zinc-900/40">
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex items-center gap-2">{children}</div>
        </div>

        <div className="flex w-44 shrink-0 flex-col gap-1.5">
          {onVoiceOver ? (
            <button
              type="button"
              onClick={onVoiceOver}
              className="w-full rounded-lg border border-zinc-200/70 bg-white/70 px-2 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-white dark:border-white/10 dark:bg-zinc-800/60 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Voice Over
            </button>
          ) : null}
          {showBacksound && onAddBacksound ? (
            <button
              type="button"
              onClick={onAddBacksound}
              className="w-full rounded-lg border border-zinc-200/70 bg-white/70 px-2 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-white dark:border-white/10 dark:bg-zinc-800/60 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Tambah Backsound
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-zinc-200/60 px-4 py-2 dark:border-white/10">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{pageLabel ?? "Halaman 1/1"}</span>
        <label className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          Zoom
          <input
            type="range"
            min={10}
            max={200}
            value={zoom}
            onChange={(e) => onZoom(Number(e.target.value))}
            aria-label="Zoom timeline"
            className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-indigo-600 dark:bg-zinc-700"
          />
          <span className="w-9 text-right tabular-nums">{zoom}%</span>
        </label>
      </div>
    </div>
  );
}

/** Item strip timeline (thumbnail) — dipakai video (scene) & carousel (slide). */
export function TimelineItem({
  active,
  onClick,
  label,
  sublabel,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sublabel?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-32 shrink-0 overflow-hidden rounded-lg border text-left transition-colors",
        active
          ? "border-indigo-500 ring-2 ring-indigo-500/30"
          : "border-zinc-200/70 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20",
      )}
    >
      <div className="flex h-16 items-center justify-center bg-zinc-100 dark:bg-zinc-800">{children}</div>
      <div className="truncate px-2 py-1 text-[10px] text-zinc-600 dark:text-zinc-300">
        {label}
        {sublabel ? <span className="text-zinc-400 dark:text-zinc-500"> · {sublabel}</span> : null}
      </div>
    </button>
  );
}

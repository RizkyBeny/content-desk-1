"use client";

import type { DragEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AudioIcon, GripIcon } from "@/components/ui/icons";
import { EdSlider, EditorButton } from "./ui";

function durationLabel(sec: number) {
  const total = Math.max(0, Math.round(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

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
  const hasActions = Boolean(onVoiceOver || (showBacksound && onAddBacksound));

  return (
    <div className="flex shrink-0 flex-col border-t border-ed-line-3 bg-ed-timeline backdrop-blur-[10px]">
      <div className="flex flex-col gap-2 px-4 py-4">
        <div className="min-w-0 overflow-x-auto">
          <div className="flex w-max items-center gap-2">{children}</div>
        </div>

        {hasActions ? (
          <div className="flex flex-col gap-1">
            {onVoiceOver ? (
              <EditorButton
                variant="timeline"
                size={28}
                className="w-full justify-center rounded-md"
                onClick={onVoiceOver}
                icon={<AudioIcon width={14} height={14} />}
              >
                Voice Over
              </EditorButton>
            ) : null}
            {showBacksound && onAddBacksound ? (
              <EditorButton
                variant="timeline"
                size={28}
                className="w-full justify-center rounded-md"
                onClick={onAddBacksound}
                icon={<AudioIcon width={14} height={14} />}
              >
                Tambah Backsound
              </EditorButton>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex h-[57px] shrink-0 items-center justify-end gap-3 border-t border-ed-line-3 px-4">
        <div className="flex items-center gap-4">
          <div className="flex w-[204px] items-center gap-4">
            <span className="font-[family-name:var(--font-ed-alt)] text-xs leading-4 text-ed-dim">Zoom</span>
            <EdSlider
              value={zoom}
              min={10}
              max={200}
              step={5}
              onChange={onZoom}
              ariaLabel="Zoom timeline"
              variant="zoom"
              className="min-w-0 flex-1"
            />
            <span className="w-9 shrink-0 text-right font-[family-name:var(--font-ed-alt)] text-xs leading-4 tabular-nums text-ed-dim">
              {zoom}%
            </span>
          </div>
          <EditorButton variant="chip" size={28} className="rounded-full">
            {pageLabel ?? "Page 1/1"}
          </EditorButton>
        </div>
      </div>
    </div>
  );
}

export function TimelineItem({
  active,
  onClick,
  label,
  sublabel,
  durationSec,
  showLabel = true,
  width = 100,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  className,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sublabel?: string;
  durationSec?: number;
  showLabel?: boolean;
  width?: number;
  draggable?: boolean;
  onDragStart?: (e: DragEvent<HTMLButtonElement>) => void;
  onDragOver?: (e: DragEvent<HTMLButtonElement>) => void;
  onDrop?: (e: DragEvent<HTMLButtonElement>) => void;
  className?: string;
  children: ReactNode;
}) {
  const badge = durationSec !== undefined ? durationLabel(durationSec) : sublabel ?? "00:00";
  return (
    <button
      type="button"
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      aria-label={label}
      className={cn(
        "group relative shrink-0 overflow-hidden rounded-md border text-left transition-colors",
        active ? "border-[1.5px] border-ed-sel-b shadow-sm" : "border-transparent hover:border-ed-input-b",
        className,
      )}
      style={{ width }}
    >
      <div className={cn("flex items-center justify-center bg-black/20", showLabel ? "h-[52px]" : "h-[52px]")}>
        {children}
      </div>
      <div className="absolute bottom-1 left-1.5 rounded bg-black/55 px-1 py-0.5">
        <span className="font-[family-name:var(--font-ed)] text-[8px] leading-4 font-medium text-white">
          {badge}
        </span>
      </div>
      {active ? (
        <span className="pointer-events-none absolute right-1 top-1 text-white/70">
          <GripIcon width={12} height={12} />
        </span>
      ) : null}
      {showLabel ? (
        <div className="truncate px-1.5 py-0.5 text-[9px] leading-tight text-ed-dim">{label}</div>
      ) : null}
    </button>
  );
}

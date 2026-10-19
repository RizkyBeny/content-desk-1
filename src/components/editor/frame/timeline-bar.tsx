"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AudioIcon } from "@/components/ui/icons";
import { EdSlider, EditorButton } from "./ui";

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
    <div className="flex shrink-0 flex-col border-t border-ed-line-3 bg-ed-timeline backdrop-blur-[10px]">
      <div className="flex items-start gap-3 px-4 py-4">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex items-center gap-2">{children}</div>
        </div>

        <div className="flex w-[779px] shrink-0 flex-col gap-1">
          {onVoiceOver ? (
            <EditorButton variant="timeline" size={28} className="w-full justify-center rounded-md" onClick={onVoiceOver}>
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
      </div>

      <div className="flex h-[57px] shrink-0 items-center justify-end gap-3 border-t border-ed-line-3 px-4">
        <div className="flex items-center gap-4">
          <div className="flex w-[204px] items-center gap-4">
            <span className="font-[family-name:var(--font-ed-alt)] text-xs leading-4 text-ed-dim">
              Zoom
            </span>
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
        "relative w-[100px] shrink-0 overflow-hidden rounded-md border text-left transition-colors",
        active
          ? "border-ed-sel-b shadow-sm"
          : "border-transparent hover:border-ed-input-b",
      )}
    >
      <div className="flex h-[52px] items-center justify-center bg-black/20">
        {children}
      </div>
      <div className="absolute bottom-1 left-1.5 rounded bg-black/55 px-1 py-0.5">
        <span className="font-[family-name:var(--font-ed)] text-[8px] leading-4 font-medium text-white">
          {sublabel ?? "00:00"}
        </span>
      </div>
      <div className="truncate px-1.5 py-0.5 text-[9px] leading-tight text-ed-dim">
        {label}
      </div>
    </button>
  );
}

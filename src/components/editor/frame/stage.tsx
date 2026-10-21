"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  ImageRemoveIcon,
  PauseIcon,
  PlayIcon,
  RedoIcon,
  UndoIcon,
} from "@/components/ui/icons";
import type { EditorController } from "../use-editor-state";

export function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function fitFrame(ratio: string): CSSProperties {
  const [w, h] = ratio.split(":").map(Number);
  const rw = Number.isFinite(w) && w > 0 ? w : 1;
  const rh = Number.isFinite(h) && h > 0 ? h : 1;
  return {
    aspectRatio: `${rw} / ${rh}`,
    width: `min(100cqw, calc(100cqh * ${rw} / ${rh}))`,
    maxWidth: "100%",
    maxHeight: "100%",
  };
}

export function StageBar({
  controller,
  onSwapAsset,
  swapLabel = "Ganti Aset",
  right,
  className,
}: {
  controller: EditorController;
  onSwapAsset?: () => void;
  swapLabel?: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-3 px-4",
        onSwapAsset ? "justify-between" : "justify-center",
        className,
      )}
    >
      {onSwapAsset && (
        <button
          type="button"
          onClick={onSwapAsset}
          className="inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-full border border-ed-ghost-b bg-ed-ghost px-3 font-[family-name:var(--font-ed)] text-xs leading-4 font-medium text-ed-ghost-t transition-colors hover:text-ed-text"
        >
          <ImageRemoveIcon width={15} height={15} />
          {swapLabel}
        </button>
      )}
      <div className="flex items-center gap-2">
        {right}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Undo"
            disabled={!controller.canUndo}
            onClick={controller.undo}
            className="inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-lg border border-ed-input-b bg-ed-elev px-2 font-[family-name:var(--font-ed)] text-xs leading-4 font-medium text-ed-dim transition-colors hover:text-ed-text disabled:pointer-events-none disabled:opacity-50"
          >
            <UndoIcon width={15} height={15} />
            Undo
          </button>
          <button
            type="button"
            aria-label="Redo"
            disabled={!controller.canRedo}
            onClick={controller.redo}
            className="inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-lg border border-ed-input-b bg-ed-elev px-2 font-[family-name:var(--font-ed)] text-xs leading-4 font-medium text-ed-dim transition-colors hover:text-ed-text disabled:pointer-events-none disabled:opacity-50"
          >
            <RedoIcon width={15} height={15} />
            Redo
          </button>
        </div>
      </div>
    </div>
  );
}

export function Playbar({
  current,
  total,
  playing,
  onToggle,
  className,
}: {
  current: number;
  total: number;
  playing?: boolean;
  onToggle?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center gap-4 px-4 pb-1",
        className,
      )}
    >
      <span className="font-[family-name:var(--font-ed-alt)] text-xs leading-4 tabular-nums text-ed-dim">
        {fmt(current)}
      </span>
      {onToggle ? (
        <button
          type="button"
          aria-label={playing ? "Jeda" : "Putar"}
          onClick={onToggle}
          className="flex h-9 shrink-0 items-center justify-center rounded-full bg-ed-play px-2.5 text-ed-dim shadow-sm transition-colors hover:text-ed-text"
        >
          {playing ? (
            <PauseIcon width={16} height={16} />
          ) : (
            <PlayIcon width={16} height={16} />
          )}
        </button>
      ) : (
        <span className="flex h-9 items-center justify-center rounded-full bg-ed-play px-2.5 text-ed-dim">
          <PlayIcon width={16} height={16} />
        </span>
      )}
      <span className="font-[family-name:var(--font-ed-alt)] text-xs leading-4 tabular-nums text-ed-dim">
        {fmt(total)}
      </span>
    </div>
  );
}

export { fmt as formatTime };

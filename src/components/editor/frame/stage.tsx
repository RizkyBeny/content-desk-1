"use client";

import type { CSSProperties, ReactNode } from "react";
import { Button } from "@heroui/react";
import { PauseIcon, PlayIcon, RedoIcon, RefreshIcon, UndoIcon } from "@/components/ui/icons";
import type { EditorController } from "../use-editor-state";

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Gaya bingkai preview yang muat penuh di dalam container bertipe `size`
 * (container query): lebar = min(lebar tersedia, tinggi × rasio).
 * Pakai bersama elemen induk ber-`style={{ containerType: "size" }}`.
 */
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

/**
 * Bar atas area canvas — tombol “Ganti Aset” (aksi spesifik tipe) di kiri,
 * Undo/Redo dari controller di kanan, sesuai desain Figma.
 */
export function StageBar({
  controller,
  onSwapAsset,
  swapLabel = "Ganti Aset",
  right,
}: {
  controller: EditorController;
  onSwapAsset?: () => void;
  swapLabel?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2">
      {onSwapAsset ? (
        <Button size="sm" variant="secondary" onPress={onSwapAsset}>
          <RefreshIcon width={14} height={14} /> {swapLabel}
        </Button>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-1">
        {right}
        <Button
          size="sm"
          variant="secondary"
          isIconOnly
          aria-label="Undo"
          isDisabled={!controller.canUndo}
          onPress={controller.undo}
        >
          <UndoIcon width={15} height={15} />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          isIconOnly
          aria-label="Redo"
          isDisabled={!controller.canRedo}
          onPress={controller.redo}
        >
          <RedoIcon width={15} height={15} />
        </Button>
      </div>
    </div>
  );
}

/**
 * Playbar di bawah preview — penanda waktu, tombol putar/jeda, dan durasi total.
 * `playing`/`onToggle` dikontrol oleh tipe editor (video/audio).
 */
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
    <div className={`flex shrink-0 items-center justify-center gap-4 text-xs tabular-nums text-zinc-500 dark:text-zinc-400 ${className ?? ""}`}>
      <span>{fmt(current)}</span>
      {onToggle ? (
        <Button size="sm" variant="secondary" isIconOnly aria-label={playing ? "Jeda" : "Putar"} onPress={onToggle}>
          {playing ? <PauseIcon width={16} height={16} /> : <PlayIcon width={16} height={16} />}
        </Button>
      ) : (
        <span className="flex size-8 items-center justify-center">
          <PlayIcon width={16} height={16} />
        </span>
      )}
      <span>{fmt(total)}</span>
    </div>
  );
}

export { fmt as formatTime };

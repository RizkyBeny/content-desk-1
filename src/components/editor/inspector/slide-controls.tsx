"use client";

import { Button } from "@heroui/react";
import { ImageIcon, RotateIcon, XIcon } from "@/components/ui/icons";
import { FiltersControls } from "./filters-controls";
import { RATIOS } from "../canvas/dims";
import type { CanvasFilters, Ratio, SlideObject } from "@/types";

const inputCls =
  "w-full rounded-lg border border-zinc-200/70 bg-white/80 px-2 py-1 text-sm dark:border-white/10 dark:bg-zinc-900/70";
const labelCls = "block text-xs text-zinc-600 dark:text-zinc-300";

export function SlideControls({
  slide,
  ratio,
  showRatio,
  onPatchSlide,
  onPatchFilters,
  onSwapBackground,
  onRemoveBackground,
}: {
  slide: SlideObject;
  ratio: Ratio;
  showRatio: boolean;
  onPatchSlide: (patch: Partial<SlideObject>) => void;
  onPatchFilters: (f: CanvasFilters) => void;
  onSwapBackground: () => void;
  onRemoveBackground: () => void;
}) {
  return (
    <div className="space-y-3">
      {showRatio && (
        <label className={labelCls}>
          <span>Rasio</span>
          <select value={ratio} onChange={(e) => onPatchSlide({ ratio: e.target.value } as never)} className={`mt-1 ${inputCls}`}>
            {RATIOS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
      )}

      <div className="space-y-1.5">
        <span className={labelCls}>Latar belakang</span>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onPress={onSwapBackground}>
            <ImageIcon width={16} height={16} /> Gambar
          </Button>
          <Button variant="ghost" size="sm" onPress={onRemoveBackground}>
            <XIcon width={16} height={16} /> Hapus
          </Button>
          <label className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
            <input type="color" value={slide.background_color ?? "#111318"} onChange={(e) => onPatchSlide({ background_color: e.target.value })} className="h-8 w-8 rounded border border-zinc-200/70 dark:border-white/10" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className={labelCls}>
          <span>Zoom</span>
          <input type="range" min={1} max={2} step={0.05} value={slide.scale ?? 1} onChange={(e) => onPatchSlide({ scale: Number(e.target.value) })} className="mt-1 w-full accent-zinc-900 dark:accent-white" />
        </label>
        <label className={labelCls}>
          <span>Rotasi ({slide.rotation ?? 0}°)</span>
          <input type="range" min={-180} max={180} value={slide.rotation ?? 0} onChange={(e) => onPatchSlide({ rotation: Number(e.target.value) })} className="mt-1 w-full accent-zinc-900 dark:accent-white" />
        </label>
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <RotateIcon width={14} height={14} /> Filter dasar
      </div>
      <FiltersControls value={slide.filters ?? { brightness: 0, contrast: 0, saturation: 0 }} onChange={onPatchFilters} />
    </div>
  );
}

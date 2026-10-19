"use client";

import { Button } from "@heroui/react";
import { TrashIcon } from "@/components/ui/icons";
import type { CanvasLayer, LayerPatch } from "@/types";

const FONTS = ["Inter", "Arial", "Helvetica", "Georgia", "Times New Roman", "Courier New"];
const inputCls =
  "w-full rounded-lg border border-zinc-200/70 bg-white/80 px-2 py-1 text-sm dark:border-white/10 dark:bg-zinc-900/70";
const labelCls = "block text-xs text-zinc-600 dark:text-zinc-300";

function Num({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <label className={labelCls}>
      <span>{label}</span>
      <input type="number" step={step} value={Math.round(value * 100) / 100} onChange={(e) => onChange(Number(e.target.value))} className={`mt-1 ${inputCls}`} />
    </label>
  );
}

export function LayerInspector({
  layer,
  onPatch,
  onDelete,
  onReplaceImage,
}: {
  layer: CanvasLayer;
  onPatch: (patch: LayerPatch) => void;
  onDelete: () => void;
  onReplaceImage: () => void;
}) {
  const hasStyle = (k: "bold" | "italic") =>
    layer.type === "text" && (layer.fontStyle ?? "normal").includes(k);

  const toggleStyle = (k: "bold" | "italic") => {
    if (layer.type !== "text") return;
    const current = (layer.fontStyle ?? "normal").split(" ");
    const next = current.includes(k) ? current.filter((s) => s !== k) : [...current, k];
    const value = ["italic", "bold"].filter((s) => next.includes(s)).join(" ");
    onPatch({ fontStyle: value || "normal" });
  };

  const styleBtn = (on: boolean) =>
    `h-7 w-7 rounded-lg text-xs transition-colors ${
      on
        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
    }`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{layer.type === "text" ? "Layer Teks" : "Layer Gambar"}</p>
        <Button variant="ghost" size="sm" onPress={onDelete} aria-label="Hapus layer">
          <TrashIcon width={16} height={16} />
        </Button>
      </div>

      {layer.type === "text" ? (
        <>
          <label className={labelCls}>
            <span>Teks</span>
            <textarea rows={2} value={layer.text} onChange={(e) => onPatch({ text: e.target.value })} className={`mt-1 ${inputCls}`} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className={labelCls}>
              <span>Font</span>
              <select value={layer.fontFamily} onChange={(e) => onPatch({ fontFamily: e.target.value })} className={`mt-1 ${inputCls}`}>
                {FONTS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </label>
            <Num label="Ukuran" value={layer.fontSize} onChange={(n) => onPatch({ fontSize: Math.max(8, n) })} />
            <label className={labelCls}>
              <span>Warna</span>
              <input type="color" value={layer.color} onChange={(e) => onPatch({ color: e.target.value })} className="mt-1 h-9 w-full rounded-lg border border-zinc-200/70 bg-transparent dark:border-white/10" />
            </label>
            <label className={labelCls}>
              <span>Perataan</span>
              <select value={layer.align} onChange={(e) => onPatch({ align: e.target.value as "left" | "center" | "right" })} className={`mt-1 ${inputCls}`}>
                <option value="left">Kiri</option>
                <option value="center">Tengah</option>
                <option value="right">Kanan</option>
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600 dark:text-zinc-300">Gaya teks</span>
            <button type="button" onClick={() => toggleStyle("bold")} aria-pressed={hasStyle("bold")} className={`${styleBtn(hasStyle("bold"))} font-bold`}>
              B
            </button>
            <button type="button" onClick={() => toggleStyle("italic")} aria-pressed={hasStyle("italic")} className={`${styleBtn(hasStyle("italic"))} italic`}>
              I
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
            <input type="checkbox" checked={Boolean(layer.shadow)} onChange={(e) => onPatch({ shadow: e.target.checked })} />
            Bayangan teks
          </label>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Num label="Lebar" value={layer.width} onChange={(n) => onPatch({ width: Math.max(24, n) })} />
            <Num label="Tinggi" value={layer.height} onChange={(n) => onPatch({ height: Math.max(24, n) })} />
            <Num label="Opacity" value={layer.opacity ?? 1} step={0.05} onChange={(n) => onPatch({ opacity: Math.min(1, Math.max(0, n)) })} />
            <Num label="Rotasi" value={layer.rotation ?? 0} onChange={(n) => onPatch({ rotation: n })} />
          </div>
          <Button variant="secondary" size="sm" onPress={onReplaceImage}>
            Ganti gambar
          </Button>
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Num label="X" value={layer.x} onChange={(n) => onPatch({ x: n })} />
        <Num label="Y" value={layer.y} onChange={(n) => onPatch({ y: n })} />
      </div>
    </div>
  );
}

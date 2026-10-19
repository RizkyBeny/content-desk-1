"use client";

import type { CanvasFilters } from "@/types";

const ROWS: { key: keyof CanvasFilters; label: string }[] = [
  { key: "brightness", label: "Kecerahan" },
  { key: "contrast", label: "Kontras" },
  { key: "saturation", label: "Saturasi" },
];

export function FiltersControls({
  value,
  onChange,
}: {
  value: CanvasFilters;
  onChange: (next: CanvasFilters) => void;
}) {
  return (
    <div className="space-y-2">
      {ROWS.map((row) => (
        <label key={row.key} className="block text-xs text-zinc-600 dark:text-zinc-300">
          <span className="flex justify-between">
            <span>{row.label}</span>
            <span className="tabular-nums text-zinc-400">{value[row.key]}</span>
          </span>
          <input
            type="range"
            min={-100}
            max={100}
            value={value[row.key]}
            onChange={(e) => onChange({ ...value, [row.key]: Number(e.target.value) })}
            className="mt-1 w-full accent-zinc-900 dark:accent-white"
          />
        </label>
      ))}
    </div>
  );
}

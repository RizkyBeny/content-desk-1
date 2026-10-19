"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Gaya input yang konsisten dengan panel inspector yang sudah ada. */
export const inputCls =
  "w-full rounded-lg border border-zinc-200/70 bg-white/80 px-2 py-1 text-sm outline-none transition-colors focus:border-indigo-400/70 dark:border-white/10 dark:bg-zinc-900/70 dark:focus:border-indigo-400/60";

export const selectCls = `${inputCls} appearance-none pr-7`;

export const labelCls = "block text-xs font-medium text-zinc-600 dark:text-zinc-300";

export const hintCls = "mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400";

/**
 * Blok seksi pada panel Properties — judul + deskripsi + isi,
 * dipisah garis tipis seperti pada desain Figma.
 */
export function SectionBlock({
  title,
  description,
  action,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-zinc-200/60 px-4 py-4 last:border-b-0 dark:border-white/10", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold leading-tight">{title}</h3>
          {description ? <p className={cn(hintCls, "mt-1")}>{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children ? <div className="mt-3 space-y-3">{children}</div> : null}
    </section>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
}

/** Kontrol tab-segmen (ikon atau teks) — dipakai untuk alignment, ratio, dll. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {label ? <span className={cn(labelCls, "mb-1.5")}>{label}</span> : null}
      <div
        role="group"
        aria-label={label}
        className="inline-flex w-full items-center gap-1 rounded-lg border border-zinc-200/70 bg-zinc-100/70 p-1 dark:border-white/10 dark:bg-zinc-800/60"
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              title={opt.title}
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Baris label + kontrol (input, slider, tombol) sejajar. */
export function FieldRow({
  label,
  children,
  htmlFor,
}: {
  label: ReactNode;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="flex items-center justify-between gap-3 text-sm">
      <span className="text-zinc-600 dark:text-zinc-300">{label}</span>
      <span className="flex items-center gap-2">{children}</span>
    </label>
  );
}

/** Pilihan warna highlight (swatch + nama). */
export const HIGHLIGHT_SWATCHES = [
  { value: "#4F46E5", label: "Indigo" },
  { value: "#0EA5E9", label: "Sky" },
  { value: "#10B981", label: "Emerald" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EF4444", label: "Red" },
  { value: "#8B5CF6", label: "Violet" },
];

export const HIGHLIGHT_SELECT = HIGHLIGHT_SWATCHES;

/** Select untuk mode overlay (UI-only). */
export function OverlaySelect({
  value,
  onChange,
}: {
  value: "none" | "gradient" | "blur" | "vignette";
  onChange: (v: "none" | "gradient" | "blur" | "vignette") => void;
}) {
  return (
    <label className={labelCls}>
      <span>Tambah Overlay</span>
      <select value={value} onChange={(e) => onChange(e.target.value as typeof value)} className={`${selectCls} mt-1`}>
        <option value="none">Tanpa overlay</option>
        <option value="gradient">Gradien bawah</option>
        <option value="blur">Blur latar</option>
        <option value="vignette">Vignette</option>
      </select>
      <span className={hintCls}>Overlay diterapkan di atas media untuk keterbacaan teks.</span>
    </label>
  );
}

/** Slider horizontal dengan nilai persen/angka di kanan. */
export function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <span className="shrink-0 text-zinc-600 dark:text-zinc-300">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-indigo-600 dark:bg-zinc-700"
      />
      <span className="w-10 shrink-0 text-right tabular-nums text-xs text-zinc-500 dark:text-zinc-400">
        {format ? format(value) : value}
      </span>
    </label>
  );
}

/** Sakelar on/off sederhana (kontrol UI-only). */
export function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 text-sm"
    >
      <span className="text-zinc-600 dark:text-zinc-300">{label}</span>
      <span
        aria-hidden="true"
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-600",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

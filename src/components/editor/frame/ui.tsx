"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
   Primitives panel editor — mengikuti spesifikasi Figma "Video Editor"
   (node 660-13750). Semua warna memakai token `--ed-*` (lihat globals.css).
   ───────────────────────────────────────────────────────────────────────── */

/** Gaya input dasar (input, textarea) — h32, elev #1E1E1E, border #2A2A2A. */
export const inputCls =
  "w-full rounded-[var(--ed-ctl-r)] border border-ed-input-b bg-ed-elev px-2 py-1 font-[family-name:var(--font-ed)] text-sm leading-5 text-ed-text placeholder:text-ed-dim outline-none transition-colors focus:border-ed-accent/60";

export const selectCls = `${inputCls} appearance-none pr-7`;

export const labelCls = "block text-xs font-medium leading-4 text-ed-dim";

export const hintCls = "text-xs leading-4 text-ed-dim";

/**
 * Label kontrol (12px) — Inter di tema dark, Geist di tema light lewat
 * `--ed-label-font`; varian "alt" selalu Geist (dipakai label tertentu di dark).
 */
export function FieldLabel({ children, alt, className }: { children: ReactNode; alt?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "block text-xs font-medium leading-4 text-ed-dim",
        alt ? "font-[family-name:var(--font-ed-alt)]" : "font-[family-name:var(--ed-label-font)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── SectionBlock ──────────────────────────────────────────────────────── */

/**
 * Blok seksi pada panel Properties — judul Inter Bold 13 #E8E8E8 (14 #262626
 * di light) + deskripsi Geist 12 + isi, dipakai bersama `PanelDivider`.
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
    <section className={cn("flex flex-col gap-4 px-4 py-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-[family-name:var(--font-ed)] text-[length:var(--ed-sec-title)] font-bold leading-5 text-ed-title">
            {title}
          </h3>
          {description ? <p className={cn(hintCls, "mt-1 font-[family-name:var(--font-ed-alt)]")}>{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children ? <div className="flex flex-col gap-4">{children}</div> : null}
    </section>
  );
}

/** Garis pemisah antar seksi — 1px penuh #202020. */
export function PanelDivider() {
  return <div className="h-px w-full shrink-0 bg-ed-line" />;
}

/* ── EditorButton ──────────────────────────────────────────────────────── */

export type EditorButtonVariant =
  | "default" // #1E1E1E / border #2A2A2A — tombol normal (Simpan draft, Undo, dll.)
  | "light" // #EFEFEF / teks #111 — Publish Content
  | "ghost-pill" // #252530 / border #303040 r20 — Ganti Aset
  | "dark-pill" // #171717 r40 — tombol play
  | "chip" // #1E1E24 / border #2A2A32 / teks #525264 r20 — Page 1/1
  | "timeline"; // #1E1E22 r6 — Voice Over / Tambah Backsound

const BTN_VARIANT: Record<EditorButtonVariant, string> = {
  default: "border border-ed-input-b bg-ed-elev text-ed-dim hover:text-ed-text",
  light: "bg-ed-light-btn text-ed-light-t hover:opacity-90",
  "ghost-pill": "rounded-full border border-ed-ghost-b bg-ed-ghost text-ed-ghost-t hover:text-ed-text",
  "dark-pill": "rounded-full bg-ed-play text-ed-dim hover:text-ed-text",
  chip: "rounded-full border border-ed-page-b bg-ed-page text-ed-page-t hover:text-ed-dim",
  timeline: "rounded-md bg-ed-tl-btn text-ed-dim hover:text-ed-text",
};

export function EditorButton({
  variant = "default",
  size = 28,
  icon,
  children,
  className,
  ...rest
}: {
  variant?: EditorButtonVariant;
  /** Tinggi tombol — 28 (default) atau 36 (play). */
  size?: 28 | 36;
  icon?: ReactNode;
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1 rounded-lg px-[10px] font-[family-name:var(--font-ed)] text-xs leading-4 font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        size === 28 ? "h-7" : "h-9",
        BTN_VARIANT[variant],
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/* ── TabList (sidebar — indikator bawah 4px) ───────────────────────────── */

export interface TabItem<T extends string> {
  value: T;
  label: string;
}

/**
 * Deret tab sidebar — tab hug (padding 12/16), strip penuh dengan underline
 * 1px (`--ed-tabbar-line`, hanya terlihat di light) dan background
 * `--ed-tabbar` (panel dark #1A1A1A, rail transparan via `barClassName`).
 * Indikator aktif 4px di-inset 8px dan mengikuti warna teks aktif.
 */
export function TabList<T extends string>({
  items,
  value,
  onChange,
  size = 14,
  ariaLabel,
  barClassName,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  /** 13 = panel properties, 14 = rail kiri (ukuran final mengikuti token tema). */
  size?: 13 | 14;
  ariaLabel?: string;
  barClassName?: string;
}) {
  const panel = size === 13;
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex w-full bg-ed-tabbar shadow-[inset_0_-1px_0_var(--ed-tabbar-line)]",
        barClassName,
      )}
    >
      {items.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              "relative px-4 py-3 leading-5 transition-colors",
              panel
                ? "text-[length:var(--ed-panel-tab-size)]"
                : "text-[length:var(--ed-rail-tab-size)]",
              active
                ? cn(
                    "font-[family-name:var(--ed-tab-font)] font-semibold",
                    panel ? "text-ed-tab-active" : "text-ed-rail-active",
                  )
                : "font-[family-name:var(--font-ed)] font-normal text-ed-tab-inactive hover:text-ed-text",
            )}
          >
            {t.label}
            {active ? <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-1 bg-current" /> : null}
          </button>
        );
      })}
    </div>
  );
}

/* ── Segmented (kontrol tab dlm panel — h25, aktif putih) ──────────────── */

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
}

/** Kontrol tab-segmen (ikon + label) — container #1E1E1E r8 p-[3px]. */
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
  label?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <div role="group" className="inline-flex w-fit items-center gap-1 rounded-[var(--ed-ctl-r)] bg-ed-seg p-[3px]">
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
                "flex h-[25px] items-center gap-1.5 rounded-lg px-[10px] font-[family-name:var(--font-ed)] text-sm leading-5 font-medium shadow-sm transition-colors",
                active ? "bg-ed-active-bg text-ed-active-t" : "text-ed-dim hover:text-ed-text",
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

/* ── InputGroup (input h32 + addon ikon) ───────────────────────────────── */

/**
 * Input h32 #1E1E1E r8 — `addon` dirender di kanan dengan pemisah gap 8
 * (chevron, upload, stepper sesuai desain Figma).
 */
export function InputGroup({
  value,
  onChange,
  placeholder,
  type = "text",
  addon,
  disabled,
  readOnly,
  ariaLabel,
  className,
  inputClassName,
  min,
  max,
}: {
  value: string | number;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  addon?: ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  ariaLabel?: string;
  className?: string;
  inputClassName?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div
      className={cn(
        "flex h-8 items-center gap-2 rounded-[var(--ed-ctl-r)] border border-ed-input-b bg-ed-elev pr-2 pl-2",
        disabled && "opacity-50",
        className,
      )}
    >
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        readOnly={readOnly}
        aria-label={ariaLabel}
        placeholder={placeholder}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent font-[family-name:var(--font-ed)] text-sm leading-5 text-ed-text placeholder:text-ed-dim outline-none",
          type === "number" && "tabular-nums [&::-webkit-inner-spin-button]:appearance-none",
          inputClassName,
        )}
      />
      {addon ? <span className="flex h-5 shrink-0 items-center text-ed-dim">{addon}</span> : null}
    </div>
  );
}

/** Addon terpisah (kotak sendiri) — mis. tombol upload di Audio Latar. */
export function InputAddonButton({
  onClick,
  icon,
  ariaLabel,
  disabled,
}: {
  onClick?: () => void;
  icon: ReactNode;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="flex h-8 shrink-0 items-center justify-center rounded-[var(--ed-ctl-r)] border border-ed-input-b bg-ed-elev px-2 text-ed-dim transition-colors hover:text-ed-text disabled:pointer-events-none disabled:opacity-50"
    >
      {icon}
    </button>
  );
}

/* ── TextareaField (h64 + grip resize) ─────────────────────────────────── */

/** Textarea tinggi tetap 64px dengan grip resize di kanan-bawah (7×7). */
export function TextareaField({
  value,
  onChange,
  placeholder,
  rows = 2,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <textarea
        value={value}
        rows={rows}
        aria-label={ariaLabel}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} h-16 resize-none py-2 pr-6 pl-[10px]`}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 7 7"
        className="pointer-events-none absolute right-1.5 bottom-1.5 h-[7px] w-[7px] text-ed-dim opacity-50"
      >
        <path d="M6 1 1 6M6 4v2H4" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ── EdSwitch (w32, aktif #171717) ─────────────────────────────────────── */

/** Sakelar 32px — aktif #171717/thumb #FAFAFA, non-aktif #E5E5E5/thumb putih. */
export function EdSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex h-[18px] w-8 shrink-0 items-center rounded-full p-px transition-colors",
        checked ? "justify-end bg-[#171717]" : "justify-start bg-ed-swatch-b",
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-4 rounded-full shadow-sm transition-colors", checked ? "bg-[#FAFAFA]" : "bg-white")}
      />
    </button>
  );
}

/** Baris judul + deskripsi + switch (blok "Sorotan Teks Judul" dsb.). */
export function SwitchRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <span className="block font-[family-name:var(--ed-switch-font)] text-xs leading-4 text-ed-sub [font-weight:var(--ed-switch-weight)]">
          {title}
        </span>
        {description ? (
          <p className="mt-0.5 font-[family-name:var(--font-ed-alt)] text-xs leading-4 text-ed-dim">{description}</p>
        ) : null}
      </div>
      <EdSwitch checked={checked} onChange={onChange} ariaLabel={title} />
    </div>
  );
}

/* ── EdSlider (track 4px + thumb 22px) ─────────────────────────────────── */

/**
 * Slider horizontal custom — track 4px r-full, thumb 22px r40 dengan titik
 * 10px. Varian "volume" (biru) dan "zoom" (abu) sesuai desain Figma.
 */
export function EdSlider({
  value,
  min,
  max,
  step,
  onChange,
  ariaLabel,
  variant = "zoom",
  className,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  ariaLabel: string;
  variant?: "volume" | "zoom";
  className?: string;
}) {
  const pct = max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;
  const vol = variant === "volume";
  return (
    <div className={cn("group relative flex h-[22px] items-center", className)}>
      <div
        className="relative h-1 w-full rounded-full"
        style={{ background: vol ? "#F5F5F5" : "var(--ed-zoom-track)" }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, background: vol ? "#1447E6" : "var(--ed-zoom-fill)" }}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute flex h-[22px] w-[22px] items-center justify-center rounded-full"
        style={{ left: `calc(${pct}% - 11px)`, background: vol ? "var(--ed-accent-soft)" : "var(--ed-zoom-thumb)" }}
      >
        <span
          className="size-2.5 rounded-full"
          style={{ background: vol ? "#1D4ED8" : "var(--ed-zoom-dot)" }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

/* ── SwatchRow ─────────────────────────────────────────────────────────── */

/** Pilihan warna highlight — swatch 32px r10 border #E5E5E5 + tombol “+”. */
export function SwatchRow({
  value,
  onChange,
  swatches,
}: {
  value: string;
  onChange: (v: string) => void;
  swatches: string[];
}) {
  return (
    <div className="flex items-center gap-1">
      {swatches.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Warna ${c}`}
          aria-pressed={value.toLowerCase() === c.toLowerCase()}
          onClick={() => onChange(c)}
          className={cn(
            "size-8 rounded-[10px] border transition-transform",
            value.toLowerCase() === c.toLowerCase()
              ? "border-ed-accent ring-2 ring-ed-accent/30"
              : "border-ed-swatch-b hover:scale-105",
          )}
          style={{ backgroundColor: c }}
        />
      ))}
      <label
        className="flex size-8 cursor-pointer items-center justify-center rounded-[10px] border border-ed-swatch-b bg-white text-zinc-500 opacity-50 transition-opacity hover:opacity-80"
        title="Pilih warna lain"
      >
        <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 3.5v9M3.5 8h9" strokeLinecap="round" />
        </svg>
        <input
          type="color"
          value={value}
          aria-label="Pilih warna custom"
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
      </label>
    </div>
  );
}

/* ── FieldRow (label kiri + kontrol kanan) ─────────────────────────────── */

export function FieldRow({
  label,
  children,
  htmlFor,
  alt,
}: {
  label: ReactNode;
  children: ReactNode;
  htmlFor?: string;
  alt?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="flex items-center justify-between gap-3 text-sm">
      <FieldLabel alt={alt}>{label}</FieldLabel>
      <span className="flex items-center gap-2">{children}</span>
    </label>
  );
}

/** Slider + nilai persen/angka di kanan (label di atas track, dlm blok). */
export function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  variant,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  variant?: "volume" | "zoom";
}) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <EdSlider
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          ariaLabel={typeof label === "string" ? label : "Slider"}
          variant={variant}
          className="min-w-0 flex-1"
        />
        <span className="w-10 shrink-0 text-right font-[family-name:var(--font-ed-alt)] text-xs leading-4 text-ed-dim tabular-nums">
          {format ? format(value) : value}
        </span>
      </div>
    </div>
  );
}

/** Sakelar on/off bergaya lama (dipakai kontrol inspector lama). */
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
      <span className="font-[family-name:var(--font-ed)] text-ed-dim">{label}</span>
      <EdSwitch checked={checked} onChange={onChange} ariaLabel={typeof label === "string" ? label : "Toggle"} />
    </button>
  );
}

/* ── Highlight swatches (nilai persis dari Figma) ──────────────────────── */

export const HIGHLIGHT_SWATCHES = ["#00B1B0", "#1877F2", "#1D4ED8"];

export const HIGHLIGHT_SELECT = HIGHLIGHT_SWATCHES;

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDownIcon, XIcon } from "@/components/ui/icons";
import type { Option } from "../../../config/generation";
import { DESKTOP_QUERY, useMediaQuery } from "./use-media-query";

/**
 * Chip konfigurasi: label + nilai aktif. Desktop → popover di bawah chip;
 * mobile → bottom sheet (FR-CMP-4).
 */
export function ConfigChip({
  label,
  value,
  icon,
  disabled,
  children,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !isDesktop) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, isDesktop]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-zinc-200/70 bg-white/70 px-3 py-1.5 text-xs font-medium transition-colors dark:border-white/10 dark:bg-white/5",
          open
            ? "border-zinc-400 text-zinc-900 dark:border-white/25 dark:text-white"
            : "text-zinc-600 hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-white/10",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {icon}
        <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
        <span className="max-w-[10rem] truncate">{value}</span>
        <ChevronDownIcon width={14} height={14} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && isDesktop ? (
        <div
          role="dialog"
          aria-label={label}
          className="glass-panel absolute left-0 top-full z-40 mt-2 w-72 rounded-2xl border border-white/15 p-3 shadow-xl"
        >
          {children}
        </div>
      ) : null}

      {open && !isDesktop ? (
        <div className="fixed inset-0 z-50 flex items-end" role="presentation">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="glass-strong relative max-h-[80vh] w-full overflow-y-auto rounded-t-3xl border-t border-white/15 p-4 pb-6"
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold">{label}</h4>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-900/5 dark:hover:bg-white/10"
              >
                <XIcon width={16} height={16} />
              </button>
            </div>
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Daftar opsi bergaya radio; menutup panel saat dipilih. */
export function OptionList({
  options,
  value,
  onChange,
}: {
  options: Option[] | { value: string | number; label: string }[];
  value: string | number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      {options.map((option) => {
        const active = String(option.value) === String(value);
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(String(option.value))}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
              active
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-white/10",
            )}
          >
            {option.label}
            {active ? <CheckIcon width={16} height={16} /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function FieldRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5 px-1 py-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
        {hint ? <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

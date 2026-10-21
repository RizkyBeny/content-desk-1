"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Tooltip ringan berbasis hover/focus untuk statistik & grafik pada Overview.
 * Tanpa dependency baru: tampil lewat group-hover + group-focus-within sehingga
 * tetap bisa dipakai pada elemen non-interaktif (angka, badge, bar chart).
 */
export function HoverTip({
  children,
  tip,
  className,
  align = "center",
  side = "top",
}: {
  children: ReactNode;
  tip: ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
}) {
  return (
    <span
      tabIndex={0}
      className={cn(
        "group/tip relative inline-flex cursor-default rounded-sm outline-none",
        className,
      )}
    >
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none invisible absolute z-30 w-max max-w-[220px] whitespace-normal rounded-lg bg-zinc-900 px-2 py-1 text-[10px] font-medium leading-tight text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:visible group-hover/tip:opacity-100 group-focus-within/tip:visible group-focus-within/tip:opacity-100 dark:bg-white dark:text-zinc-900",
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
          align === "center" && "left-1/2 -translate-x-1/2",
          align === "start" && "left-0",
          align === "end" && "right-0",
        )}
      >
        {tip}
      </span>
    </span>
  );
}

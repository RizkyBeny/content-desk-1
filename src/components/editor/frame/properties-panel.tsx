"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { PanelTab } from "./use-editor-ui";

const TABS: { value: PanelTab; label: string }[] = [
  { value: "properties", label: "Properties" },
  { value: "watermark", label: "Watermark" },
  { value: "voiceover", label: "Voice Over" },
];

/**
 * Panel Properties di kanan (356px) — tab Properties / Watermark / Voice Over.
 * `children` adalah isi tab Properties (seksi-seksi per tipe),
 * `watermark`/`voiceover` adalah isi dua tab lainnya.
 */
export function PropertiesPanel({
  tab,
  onTab,
  children,
  watermark,
  voiceover,
  className,
}: {
  tab: PanelTab;
  onTab: (t: PanelTab) => void;
  children: ReactNode;
  watermark: ReactNode;
  voiceover: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "flex min-h-0 w-[356px] shrink-0 flex-col border-l border-zinc-200/60 bg-white/60 dark:border-white/10 dark:bg-zinc-950/40",
        className,
      )}
    >
      <div className="shrink-0 px-3 pt-3">
        <div
          role="tablist"
          aria-label="Panel properties"
          className="flex gap-1 rounded-lg border border-zinc-200/70 bg-zinc-100/70 p-1 dark:border-white/10 dark:bg-zinc-800/60"
        >
          {TABS.map((t) => {
            const active = t.value === tab;
            return (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTab(t.value)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {tab === "properties" ? <div className="divide-y divide-zinc-200/60 dark:divide-white/10">{children}</div> : null}
        {tab === "watermark" ? watermark : null}
        {tab === "voiceover" ? voiceover : null}
      </div>
    </aside>
  );
}

"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TabList } from "./ui";
import type { PanelTab } from "./use-editor-ui";

export const PANEL_TABS: { value: PanelTab; label: string }[] = [
  { value: "properties", label: "Properties" },
  { value: "watermark", label: "Watermark" },
  { value: "voiceover", label: "Voice Over" },
];

/**
 * Kartu seksi Figma: blok pertama menempel di atas kartu dan blok terakhir di
 * bawahnya; jarak antar-seksi tetap 16px + garis 1px.
 */
function PanelSections({ children }: { children: ReactNode }) {
  return (
    <div className="divide-y divide-ed-line [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
      {children}
    </div>
  );
}

/**
 * Panel Properties di kanan (356px) — tab strip underlined #1A1A1A
 * (Inter 13, aktif SemiBold + indikator 4px) sesuai Figma.
 * `children` adalah isi tab Properties (seksi-seksi per tipe),
 * `watermark`/`voiceover` adalah isi dua tab lainnya.
 */
export function PropertiesPanel({
  tab,
  onTab,
  tabs = PANEL_TABS,
  children,
  watermark,
  voiceover,
  className,
}: {
  tab: PanelTab;
  onTab: (t: PanelTab) => void;
  /** Tab yang ditampilkan — image/carousel tanpa Voice Over; audio/article hanya Properties. */
  tabs?: { value: PanelTab; label: string }[];
  children: ReactNode;
  watermark: ReactNode;
  voiceover: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "min-h-0 w-[356px] shrink-0 flex-col border-l border-ed-line bg-ed-panel",
        className,
      )}
    >
      <div className="shrink-0 py-2">
        <TabList items={tabs} value={tab} onChange={onTab} size={13} ariaLabel="Panel properties" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-0 py-2">
        <div className="rounded-lg bg-ed-panel">
          {tab === "properties" ? <PanelSections>{children}</PanelSections> : null}
          {tab === "watermark" ? <PanelSections>{watermark}</PanelSections> : null}
          {tab === "voiceover" ? <PanelSections>{voiceover}</PanelSections> : null}
        </div>
      </div>
    </aside>
  );
}

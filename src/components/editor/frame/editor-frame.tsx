"use client";

import { useState, type ReactNode } from "react";
import { toast } from "@heroui/react";
import { cn } from "@/lib/utils";
import { patch } from "@/lib/client";
import {
  LayersIcon,
  PanelLeftIcon,
  PencilIcon,
  SaveIcon,
} from "@/components/ui/icons";
import type { Caption, CreationDTO } from "@/types";
import { PANEL_TABS, PropertiesPanel } from "./properties-panel";
import { EditorButton } from "./ui";
import type { PanelTab } from "./use-editor-ui";

/**
 * Props chrome yang dibangun EditorShell dan dipakai semua tipe editor.
 * Disesuaikan dengan Figma "Video Editor" (node 660-13750): tanpa chip
 * status, tombol muat ulang, maupun blok caption — autosave tetap
 * berjalan senyap; banner konflik ditampilkan terpisah via `conflictBanner`.
 */
export interface FrameChrome {
  creation: CreationDTO;
  title: string;
  backHref?: string;
  onBack: () => void;
  onSave: () => void;
  onExport: () => void;
  panelTab: PanelTab;
  onPanelTab: (t: PanelTab) => void;
  watermark: ReactNode;
  voiceover: ReactNode;
  conflictBanner?: ReactNode;
}

/**
 * Kerangka editor canvas: rail aset (kiri, 256px), header (57px), stage
 * (tengah), panel Properties (kanan, 356px), dan timeline (bawah) —
 * mengikuti geometri & palet Figma "Video Editor".
 */
export function EditorFrame({
  chrome,
  rail,
  stage,
  panel,
  timeline,
}: {
  chrome: FrameChrome;
  rail: ReactNode;
  stage: ReactNode;
  panel: ReactNode;
  timeline?: ReactNode;
}) {
  const { creation, title, onSave, onExport, panelTab, onPanelTab, watermark, voiceover, conflictBanner } = chrome;
  const [railOpen, setRailOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  // Voice Over hanya relevan untuk konten video (node video 362-16647).
  const tabs =
    creation.type === "video"
      ? PANEL_TABS
      : creation.type === "image" || creation.type === "carousel"
        ? PANEL_TABS.filter((t) => t.value !== "voiceover")
        : PANEL_TABS.filter((t) => t.value === "properties");
  const activeTab = tabs.some((t) => t.value === panelTab) ? panelTab : "properties";

  // ── Edit judul inline (header) — persist ke caption pertama brief ────────
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [titleOverride, setTitleOverride] = useState<string | null>(null);
  const shownTitle = titleOverride ?? title;

  async function commitTitle() {
    setEditing(false);
    const next = draft.trim();
    if (!next || next === shownTitle) {
      setDraft(shownTitle);
      return;
    }
    if (!creation.briefId || creation.captions.length === 0) {
      // Tanpa brief terkait — judul hanya hidup di sesi ini.
      setTitleOverride(next);
      return;
    }
    const captions: Caption[] = creation.captions.map((c, i) => {
      if (i !== 0) return c;
      const rest = c.text.split("\n").slice(1).join("\n").trimStart();
      return { ...c, text: rest ? `${next}\n${rest}` : next };
    });
    try {
      await patch(`/api/briefs/${creation.briefId}`, { captions });
      setTitleOverride(next);
      toast.success("Judul diperbarui.");
    } catch (e) {
      toast.danger((e as Error).message ?? "Gagal memperbarui judul.");
      setDraft(shownTitle);
    }
  }

  return (
    <div
      data-ed-theme="auto"
      className="relative flex h-full min-h-[420px] w-full flex-col overflow-hidden rounded-2xl bg-ed-bg font-[family-name:var(--font-ed)] text-ed-text"
    >
      {/* Aksen latar belakang — dua elips ter-blur sesuai desain */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-14px] top-[-347px] size-[406px] rounded-full bg-[#14B8A6] opacity-70"
        style={{ filter: "blur(182px)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[985px] top-[632px] size-[406px] rounded-full bg-[#E1306C] opacity-30"
        style={{ filter: "blur(182px)" }}
      />

      <div className="relative flex min-h-0 flex-1">
        {/* Rail aset (kiri, 256px) — desktop lg+ */}
        <aside
          className={cn(
            "hidden w-64 shrink-0 flex-col border-r border-ed-line-2 bg-ed-panel lg:flex",
            railCollapsed && "lg:hidden",
          )}
        >
          {rail}
        </aside>

        {/* Kolom kanan: header + (stage | panel) */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header (57px) */}
          <header className="flex h-[57px] shrink-0 items-center justify-between gap-3 border-b border-ed-line-2 bg-ed-header px-4 backdrop-blur-[10px]">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
                    setRailCollapsed((v) => !v);
                  } else {
                    setRailOpen(true);
                  }
                }}
                aria-label={railCollapsed ? "Buka panel aset" : "Tutup panel aset"}
                className="flex size-7 shrink-0 items-center justify-center rounded-md bg-ed-elev text-ed-dim transition-colors hover:text-ed-text"
              >
                <PanelLeftIcon width={16} height={16} />
              </button>
              <span aria-hidden="true" className="h-[26px] w-px shrink-0 bg-ed-line-strong" />
              {editing ? (
                <input
                  value={draft}
                  autoFocus
                  aria-label="Judul konten"
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => void commitTitle()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void commitTitle();
                    if (e.key === "Escape") {
                      setDraft(shownTitle);
                      setEditing(false);
                    }
                  }}
                  className="h-7 w-full min-w-0 max-w-80 rounded-md border border-ed-input-b bg-ed-elev px-2 text-sm font-medium text-ed-text outline-none"
                />
              ) : (
                <div className="flex min-w-0 items-center gap-1.5">
                  <h1 className="truncate text-sm font-medium leading-5 text-ed-text">
                    {shownTitle || "Editor konten"}
                  </h1>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(shownTitle);
                      setEditing(true);
                    }}
                    aria-label="Edit judul"
                    className="flex size-7 shrink-0 items-center justify-center rounded-md bg-ed-elev text-ed-dim transition-colors hover:text-ed-text"
                  >
                    <PencilIcon width={16} height={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <EditorButton variant="default" onClick={onSave} icon={<SaveIcon width={16} height={16} />}>
                Simpan draft
              </EditorButton>
              <EditorButton variant="light" onClick={onExport} className="font-semibold">
                Publish Content
              </EditorButton>
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                aria-label="Buka properties"
                className="flex size-7 shrink-0 items-center justify-center rounded-md bg-ed-elev text-ed-dim transition-colors hover:text-ed-text xl:hidden"
              >
                <LayersIcon width={16} height={16} />
              </button>
            </div>
          </header>

          {/* Body: stage (tengah) + panel Properties (kanan, 356px) */}
          <div className="flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col">
              {conflictBanner}
              <div className="min-h-0 flex-1 overflow-y-auto">{stage}</div>
              {timeline}
            </div>

            <PropertiesPanel
              tab={activeTab}
              onTab={onPanelTab}
              tabs={tabs}
              watermark={watermark}
              voiceover={voiceover}
              className="hidden xl:flex border-l border-ed-line bg-ed-panel"
            >
              {panel}
            </PropertiesPanel>
          </div>
        </div>
      </div>

      {/* Rail drawer (mobile/tablet < lg) */}
      {railOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRailOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-ed-panel shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-ed-line-2 px-3 py-2">
              <span className="text-sm font-semibold">Aset</span>
              <button
                type="button"
                onClick={() => setRailOpen(false)}
                aria-label="Tutup"
                className="flex size-7 items-center justify-center rounded-md bg-ed-elev text-ed-dim"
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1">{rail}</div>
          </div>
        </div>
      ) : null}

      {/* Panel drawer (mobile/tablet < xl) */}
      {panelOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPanelOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[356px] max-w-full flex-col bg-ed-panel shadow-xl">
            <PropertiesPanel
              tab={activeTab}
              onTab={onPanelTab}
              tabs={tabs}
              watermark={watermark}
              voiceover={voiceover}
              className="flex h-full border-l-0"
            >
              {panel}
            </PropertiesPanel>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="shrink-0 border-t border-ed-line-2 px-4 py-2 text-sm font-medium text-ed-dim"
            >
              Tutup
            </button>
          </div>
        </div>
      ) : null}

      {/* Tombol buka rail (mobile/tablet < lg) */}
      <button
        type="button"
        onClick={() => setRailOpen(true)}
        aria-label="Buka aset"
        className="absolute bottom-3 left-3 z-40 flex size-11 items-center justify-center rounded-full bg-ed-accent text-white shadow-lg transition-transform hover:scale-105 lg:hidden"
      >
        <LayersIcon width={18} height={18} />
      </button>
    </div>
  );
}

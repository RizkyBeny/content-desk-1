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
  isSwapping,
}: {
  chrome: FrameChrome;
  rail: ReactNode;
  stage: ReactNode;
  panel: ReactNode;
  timeline?: ReactNode;
  isSwapping?: boolean;
}) {
  const { creation, title, onSave, onExport, panelTab, onPanelTab, watermark, voiceover, conflictBanner } = chrome;
  const [railOpen, setRailOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  // Jika sedang swapping, paksa rail aktif
  const isRailHiddenDesktop = railCollapsed && !isSwapping;
  const isRailVisibleMobile = railOpen || isSwapping;

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
            isRailHiddenDesktop && "lg:hidden",
          )}
        >
          {rail}
        </aside>

        {/* Kolom kanan: header + (stage | panel) */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header (57px) */}
          <header className="flex h-[57px] shrink-0 items-center justify-between gap-2 border-b border-ed-line-2 bg-ed-header px-2.5 sm:gap-3 sm:px-4 backdrop-blur-[10px]">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
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
              <span aria-hidden="true" className="h-[22px] w-px shrink-0 bg-ed-line-strong sm:h-[26px]" />
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
                  className="h-7 w-full min-w-0 max-w-44 rounded-md border border-ed-input-b bg-ed-elev px-2 text-xs font-medium text-ed-text outline-none sm:max-w-80 sm:text-sm"
                />
              ) : (
                <div className="flex min-w-0 items-center gap-1">
                  <h1 className="max-w-[110px] truncate text-xs font-medium leading-5 text-ed-text sm:max-w-xs sm:text-sm">
                    {shownTitle || "Editor konten"}
                  </h1>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(shownTitle);
                      setEditing(true);
                    }}
                    aria-label="Edit judul"
                    className="flex size-6 shrink-0 items-center justify-center rounded-md bg-ed-elev text-ed-dim transition-colors hover:text-ed-text sm:size-7"
                  >
                    <PencilIcon width={14} height={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <EditorButton
                variant="default"
                onClick={onSave}
                icon={<SaveIcon width={15} height={15} />}
                className="px-2 text-xs sm:px-3"
              >
                <span className="hidden sm:inline">Simpan draft</span>
                <span className="sm:hidden">Simpan</span>
              </EditorButton>
              <EditorButton
                variant="light"
                onClick={onExport}
                className="px-2.5 text-xs font-semibold sm:px-3"
              >
                <span className="hidden sm:inline">Publish Content</span>
                <span className="sm:hidden">Publish</span>
              </EditorButton>
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                aria-label="Buka properties"
                className="flex size-7 shrink-0 items-center justify-center rounded-md bg-ed-elev text-ed-dim transition-colors hover:text-ed-text xl:hidden"
              >
                <LayersIcon width={15} height={15} />
              </button>
            </div>
          </header>

          {/* Body: stage (tengah) + panel Properties (kanan, 356px) */}
          <div className="flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col">
              {conflictBanner}
              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">{stage}</div>
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
      {isRailVisibleMobile ? (
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

      {/* Panel drawer (mobile/tablet < xl) - Bottom Sheet di mobile, Side Drawer di tablet */}
      {panelOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setPanelOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] flex flex-col rounded-t-2xl bg-ed-panel shadow-2xl sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:w-[356px] sm:max-h-full sm:rounded-none">
            {/* Grab handle di mobile */}
            <div className="flex shrink-0 items-center justify-center pt-2 sm:hidden">
              <span className="h-1 w-10 rounded-full bg-zinc-400/40" />
            </div>
            <div className="flex shrink-0 items-center justify-between border-b border-ed-line-2 px-4 py-2 sm:hidden">
              <span className="text-sm font-semibold">Pengaturan Kanvas</span>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Tutup"
                className="flex size-7 items-center justify-center rounded-md bg-ed-elev text-xs text-ed-dim"
              >
                ✕
              </button>
            </div>
            <PropertiesPanel
              tab={activeTab}
              onTab={onPanelTab}
              tabs={tabs}
              watermark={watermark}
              voiceover={voiceover}
              className="flex h-full w-full border-l-0"
            >
              {panel}
            </PropertiesPanel>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="hidden sm:block shrink-0 border-t border-ed-line-2 px-4 py-2 text-sm font-medium text-ed-dim"
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
        className="absolute bottom-16 sm:bottom-3 left-3 z-40 flex size-10 sm:size-11 items-center justify-center rounded-full bg-ed-accent text-white shadow-lg transition-transform hover:scale-105 lg:hidden"
      >
        <LayersIcon width={17} height={17} />
      </button>
    </div>
  );
}

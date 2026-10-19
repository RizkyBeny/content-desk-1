"use client";

import { useState, type ReactNode } from "react";
import { Button, Chip } from "@heroui/react";
import { cn } from "@/lib/utils";
import {
  AudioIcon,
  ChevronLeftIcon,
  DownloadIcon,
  LayersIcon,
  MoonIcon,
  SaveIcon,
  SettingsIcon,
  SunIcon,
  VideoIcon,
} from "@/components/ui/icons";
import { useTheme } from "@/components/theme/theme-provider";
import type { SaveStatus } from "../use-editor-state";
import type { CreationDTO } from "@/types";
import { PropertiesPanel } from "./properties-panel";
import type { PanelTab } from "./use-editor-ui";

const STATUS: Record<SaveStatus, { label: string; color: "default" | "warning" | "success" | "danger" }> = {
  idle: { label: "Tersimpan", color: "default" },
  saving: { label: "Menyimpan…", color: "warning" },
  saved: { label: "Tersimpan", color: "success" },
  error: { label: "Gagal menyimpan", color: "danger" },
  conflict: { label: "Konflik", color: "danger" },
};

const TYPE_META: Record<CreationDTO["type"], { label: string; icon: ReactNode }> = {
  image: { label: "Gambar", icon: <LayersIcon width={15} height={15} /> },
  carousel: { label: "Carousel", icon: <LayersIcon width={15} height={15} /> },
  video: { label: "Video", icon: <VideoIcon width={15} height={15} /> },
  audio: { label: "Audio", icon: <AudioIcon width={15} height={15} /> },
  article: { label: "Artikel", icon: <SettingsIcon width={15} height={15} /> },
};

/** Props chrome yang dibangun EditorShell dan dipakai semua tipe editor. */
export interface FrameChrome {
  creation: CreationDTO;
  title: string;
  status: SaveStatus;
  backHref?: string;
  onBack: () => void;
  onSave: () => void;
  onExport: () => void;
  reload: () => void;
  reloading: boolean;
  panelTab: PanelTab;
  onPanelTab: (t: PanelTab) => void;
  watermark: ReactNode;
  voiceover: ReactNode;
  /** CaptionPanel — dirender otomatis di bawah tab Properties. */
  caption?: ReactNode;
  conflictBanner?: ReactNode;
}

/**
 * Kerangka editor canvas: rail aset (kiri), header, stage (tengah),
 * panel Properties (kanan), dan timeline (bawah) — mengikuti geometri Figma.
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
  const { creation, title, status, onBack, onSave, onExport, reload, reloading, panelTab, onPanelTab, watermark, voiceover, caption, conflictBanner } = chrome;
  const [railOpen, setRailOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const s = STATUS[status];
  const meta = TYPE_META[creation.type];

  return (
    <div className="relative flex h-[calc(100dvh-7rem)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/50 md:h-[calc(100dvh-3.5rem)] dark:border-white/10 dark:bg-zinc-950/30">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200/60 px-4 py-2.5 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <ChevronLeftIcon width={18} height={18} />
          </button>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            {meta.icon}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold leading-tight">{title || "Editor konten"}</h1>
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <Chip size="sm" color={s.color} variant="soft">
                {s.label}
              </Chip>
              <span className="hidden sm:inline">{meta.label}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            aria-label="Ganti tema"
            onPress={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
          </Button>
          <Button size="sm" variant="secondary" onPress={reload} isDisabled={reloading}>
            <DownloadIcon width={14} height={14} />
            <span className="hidden md:inline">{reloading ? "Memuat…" : "Muat ulang"}</span>
          </Button>
          <Button size="sm" variant="secondary" onPress={onSave}>
            <SaveIcon width={14} height={14} />
            <span className="hidden sm:inline">Simpan draft</span>
          </Button>
          <Button size="sm" variant="primary" onPress={onExport}>
            Publish Content
          </Button>
          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            aria-label="Buka properties"
            className="xl:hidden"
            onPress={() => setPanelOpen(true)}
          >
            <SettingsIcon width={16} height={16} />
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Rail aset (kiri) — desktop lg+ */}
        <div className="hidden w-64 shrink-0 border-r border-zinc-200/60 bg-white/40 dark:border-white/10 dark:bg-zinc-900/30 lg:block">
          {rail}
        </div>

        {/* Kolom tengah: stage + timeline */}
        <div className="flex min-w-0 flex-1 flex-col">
          {conflictBanner}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{stage}</div>
          {timeline}
        </div>

        {/* Panel Properties (kanan) — desktop xl+ */}
        <PropertiesPanel
          tab={panelTab}
          onTab={onPanelTab}
          watermark={watermark}
          voiceover={voiceover}
          className="hidden xl:flex"
        >
          {panel}
          {panelTab === "properties" ? caption : null}
        </PropertiesPanel>
      </div>

      {/* Rail drawer (mobile/tablet < lg) */}
      {railOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRailOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl dark:bg-zinc-900">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-200/60 px-3 py-2 dark:border-white/10">
              <span className="text-sm font-semibold">Aset</span>
              <Button size="sm" variant="ghost" isIconOnly aria-label="Tutup" onPress={() => setRailOpen(false)}>
                ✕
              </Button>
            </div>
            <div className="min-h-0 flex-1">{rail}</div>
          </div>
        </div>
      ) : null}

      {/* Panel drawer (mobile/tablet < xl) */}
      {panelOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPanelOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[356px] max-w-full flex-col bg-white shadow-xl dark:bg-zinc-900">
            <PropertiesPanel
              tab={panelTab}
              onTab={onPanelTab}
              watermark={watermark}
              voiceover={voiceover}
              className="h-full border-l-0"
            >
              {panel}
            </PropertiesPanel>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="shrink-0 border-t border-zinc-200/60 px-4 py-2 text-sm font-medium text-zinc-600 dark:border-white/10 dark:text-zinc-300"
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
        className="absolute bottom-3 left-3 z-40 flex size-11 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-105 lg:hidden"
      >
        <LayersIcon width={18} height={18} />
      </button>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CheckIcon, SparkIcon } from "@/components/ui/icons";
import type { BriefRow } from "@/types";

export interface StoryboardPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => Promise<void> | void;
  rows: BriefRow[];
  topicTitle?: string;
  angleTitle?: string;
  isGenerating?: boolean;
}

const FALLBACK_THUMBNAILS = [
  "/seed/unsplash/abstract-01.jpg",
  "/seed/unsplash/abstract-02.jpg",
  "/seed/unsplash/abstract-03.jpg",
  "/seed/unsplash/abstract-04.jpg",
  "/seed/unsplash/abstract-05.jpg",
  "/seed/unsplash/abstract-06.jpg",
];

export function StoryboardPreviewModal({
  isOpen,
  onClose,
  onGenerate,
  rows,
  angleTitle,
  isGenerating = false,
}: StoryboardPreviewModalProps) {
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);

  // Jalankan animasi progress rendering AI persis seperti alur di /ai-studio/video saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    const t0 = setTimeout(() => {
      setPreviewLoading(true);
      setPreviewProgress(25);
    }, 0);

    const t1 = setTimeout(() => setPreviewProgress(60), 400);
    const t2 = setTimeout(() => setPreviewProgress(85), 850);
    const t3 = setTimeout(() => {
      setPreviewProgress(100);
      setPreviewLoading(false);
    }, 1300);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen]);

  // Durasi kalkulasi: default 12 detik per scene jika belum diatur
  const totalSeconds = useMemo(() => {
    return rows.reduce((acc, row) => {
      const d = parseInt(row.durasi || "12", 10);
      return acc + (isNaN(d) ? 12 : d);
    }, 0);
  }, [rows]);

  const sceneCards = useMemo(() => {
    const durations = rows.map((r) => parseInt(r.durasi || "12", 10) || 12);
    const fmtTime = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    };

    return rows.map((row, idx) => {
      const startSec = durations.slice(0, idx).reduce((a, b) => a + b, 0);
      const endSec = startSec + durations[idx];
      const imgSrc =
        (row as { visualMediaUrl?: string }).visualMediaUrl ||
        FALLBACK_THUMBNAILS[idx % FALLBACK_THUMBNAILS.length];

      return {
        row,
        idx,
        timeRange: `${fmtTime(startSec)} - ${fmtTime(endSec)}`,
        imgSrc,
      };
    });
  }, [rows]);

  if (!isOpen) return null;

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins > 0) return `${mins} Menit ${secs} Detik`;
    return `${secs} Detik`;
  };

  async function handleProceed() {
    await onGenerate();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-storyboard-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Modal Container */}
      <div className="glass-panel angle-card relative w-full max-w-5xl rounded-3xl p-6 shadow-2xl max-h-[90vh] flex flex-col justify-between animate-in zoom-in-95 duration-200 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/80 dark:border-white/10">
        {/* Header Modal */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4">
          <div className="flex flex-col gap-1.5">
            <h2
              id="preview-storyboard-title"
              className="text-2xl font-bold tracking-tight text-foreground"
            >
              Preview Storyboard
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Silahkan cek kembali preview storyboard di bawah sebelum generate scene
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Total Durasi {formatDuration(totalSeconds)}
              </span>
              <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {rows.length} Scene
              </span>
              {angleTitle && (
                <span className="hidden sm:inline-flex items-center rounded-md bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand-strong dark:bg-brand/20 dark:text-brand truncate max-w-[260px]">
                  {angleTitle}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons Top-Right */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={previewLoading || isGenerating}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Kembali ke brief
            </button>
            <button
              type="button"
              onClick={handleProceed}
              disabled={previewLoading || isGenerating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F0F0F] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-black active:scale-95 dark:bg-brand dark:hover:bg-brand-hover dark:text-white transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckIcon className="size-3.5" />
              <span>{isGenerating ? "Menyiapkan Editor..." : "Lanjut ke Editor"}</span>
            </button>
          </div>
        </div>

        {/* PROGRESS LOADING BAR MODAL PREVIEW */}
        {previewLoading && (
          <div className="my-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              <span className="flex items-center gap-1.5">
                <SparkIcon className="size-3.5 text-brand animate-spin" />
                <span>Sedang merender adegan storyboard otomatis oleh AI…</span>
              </span>
              <span className="font-mono text-brand font-bold">{previewProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full bg-brand transition-all duration-300 rounded-full"
                style={{ width: `${previewProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Kartu Visual Preview Scene (Grid Rasio 9:16) */}
        <div className="w-full overflow-x-auto py-4">
          <div className="grid grid-flow-col auto-cols-[minmax(190px,1fr)] gap-3.5 pb-2">
            {sceneCards.map(({ row, idx, timeRange, imgSrc }) => {
              // Jika scene sedang dalam proses generate AI awal
              if (previewLoading && previewProgress < 85 && idx >= 2) {
                return (
                  <div
                    key={`loading-${idx}`}
                    className="group relative aspect-[9/16] w-full min-w-[190px] rounded-xl border border-zinc-800 bg-[#18181B] p-4 flex flex-col justify-between text-white shadow-lg animate-pulse"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                      <span className="text-xs font-medium text-zinc-300">
                        Proses generate ...
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span>Scene {idx + 1}</span>
                      <span>{timeRange}</span>
                    </div>
                  </div>
                );
              }

              // Kartu Scene yang siap (visual rasio 9:16)
              return (
                <div
                  key={row.__id || idx}
                  className="group relative aspect-[9/16] w-full min-w-[190px] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-900 shadow-md transition-all hover:scale-[1.02] dark:border-white/10 animate-in fade-in zoom-in-95 duration-500"
                >
                  {/* Background Image */}
                  <Image
                    src={imgSrc}
                    alt={`Scene ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Durasi Badge (Kiri Atas) */}
                  <div className="absolute top-2.5 left-2.5 z-10 rounded bg-black/75 px-2 py-0.5 font-mono text-[11px] font-medium text-white backdrop-blur-md">
                    {timeRange}
                  </div>

                  {/* Overlay Gelap Bawah dengan Judul & Deskripsi Visual */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 pt-6 text-white">
                    <p className="text-xs font-semibold leading-snug line-clamp-2">
                      {row.visual || row.teks_onscreen || `Scene ${idx + 1}`}
                    </p>
                    {row.narasi && (
                      <p className="mt-1 line-clamp-2 text-[10px] text-zinc-300 leading-tight">
                        {row.narasi}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

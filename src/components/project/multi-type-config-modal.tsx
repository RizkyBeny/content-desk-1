"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import {
  ChevronDownIcon,
  ImageIcon,
  LayersIcon,
  SparkIcon,
  VideoIcon,
  XIcon,
} from "@/components/ui/icons";

export type AspectRatio = "1:1" | "4:3" | "16:9" | "9:16";

export interface MultiTypeConfig {
  image: {
    ratio: AspectRatio;
    persona: string;
  };
  carousel: {
    ratio: AspectRatio;
    slideCount: number;
    persona: string;
  };
  video: {
    ratio: AspectRatio;
    persona: string;
    voiceOver: string;
  };
}

export interface MultiTypeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: MultiTypeConfig) => void;
  onSwitchToSingleType?: (type: "image" | "carousel" | "video") => void;
}

const RATIOS: AspectRatio[] = ["1:1", "4:3", "16:9", "9:16"];

const PERSONA_OPTIONS = [
  "Investigatif",
  "Edukatif & Informatif",
  "Storyteller Emosional",
  "Kasual & Ramah",
  "Otoritatif & Formal",
];

const SLIDE_COUNT_OPTIONS = [
  { label: "4 Gambar", value: 4 },
  { label: "6 Gambar", value: 6 },
  { label: "8 Gambar", value: 8 },
  { label: "10 Gambar", value: 10 },
];

const VOICEOVER_OPTIONS = [
  "Investigatif & Tegas",
  "Narator Tenang (Storytelling)",
  "Enerjik & Cepat (Viral Hook)",
  "Hangat & Percakapan",
];

export function MultiTypeConfigModal({
  isOpen,
  onClose,
  onConfirm,
  onSwitchToSingleType,
}: MultiTypeConfigModalProps) {
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [config, setConfig] = useState<MultiTypeConfig>({
    image: {
      ratio: "1:1",
      persona: "Investigatif",
    },
    carousel: {
      ratio: "1:1",
      slideCount: 6,
      persona: "Investigatif",
    },
    video: {
      ratio: "9:16",
      persona: "Investigatif",
      voiceOver: "Investigatif & Tegas",
    },
  });

  if (!isOpen) return null;

  function handleSave() {
    onConfirm(config);
  }

  function handleSwitch(type: "image" | "carousel" | "video") {
    setShowSwitchMenu(false);
    onSwitchToSingleType?.(type);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl transition-all dark:border-white/15 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand/15 text-brand-strong dark:bg-brand/20 dark:text-brand">
              <SparkIcon width={16} height={16} />
            </span>
            <div>
              <h2 id="modal-title" className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Create Multiple Type Content
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Sesuaikan rasio visual, persona gaya penulisan, dan voice over untuk tiap format.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Entry point switch ke pilihan lain */}
            {onSwitchToSingleType && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  <span>Ganti ke Tipe Lain</span>
                  <ChevronDownIcon width={12} height={12} />
                </button>

                {showSwitchMenu && (
                  <div className="absolute right-0 top-9 z-50 w-56 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/15 dark:bg-zinc-800">
                    <span className="block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Pilih Satu Tipe Konten
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSwitch("image")}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10"
                    >
                      <ImageIcon width={14} height={14} className="text-brand" />
                      <span>Single Image (Gambar)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitch("carousel")}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10"
                    >
                      <LayersIcon width={14} height={14} className="text-brand" />
                      <span>Multiple Gambar (Carousel)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitch("video")}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10"
                    >
                      <VideoIcon width={14} height={14} className="text-brand" />
                      <span>Video Storyboard</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="Tutup modal"
            >
              <XIcon width={18} height={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
          {/* SECTION 1: GAMBAR */}
          <div className="space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-white/5 dark:bg-zinc-800/30">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-2.5 dark:border-white/5">
              <ImageIcon width={16} height={16} className="text-brand-strong dark:text-brand" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Gambar (Single Image)
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Ratio */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Rasio Gambar
                </label>
                <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 dark:border-white/10 dark:bg-zinc-800">
                  {RATIOS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          image: { ...prev.image, ratio: r },
                        }))
                      }
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        config.image.ratio === r
                          ? "bg-zinc-900 text-white shadow-sm dark:bg-brand dark:text-zinc-950"
                          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Persona */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Persona Gaya
                </label>
                <div className="relative">
                  <select
                    value={config.image.persona}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        image: { ...prev.image, persona: e.target.value },
                      }))
                    }
                    className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-8 text-xs font-medium text-zinc-800 shadow-sm focus:border-brand focus:outline-none dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    {PERSONA_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon
                    width={14}
                    height={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: MULTIPLE GAMBAR (CAROUSEL) */}
          <div className="space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-white/5 dark:bg-zinc-800/30">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-2.5 dark:border-white/5">
              <LayersIcon width={16} height={16} className="text-brand-strong dark:text-brand" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Multiple Gambar (Carousel)
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Ratio */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Rasio Slide
                </label>
                <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 dark:border-white/10 dark:bg-zinc-800">
                  {RATIOS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          carousel: { ...prev.carousel, ratio: r },
                        }))
                      }
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                        config.carousel.ratio === r
                          ? "bg-zinc-900 text-white shadow-sm dark:bg-brand dark:text-zinc-950"
                          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jumlah Gambar */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Jumlah Gambar
                </label>
                <div className="relative">
                  <select
                    value={config.carousel.slideCount}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        carousel: {
                          ...prev.carousel,
                          slideCount: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-8 text-xs font-medium text-zinc-800 shadow-sm focus:border-brand focus:outline-none dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    {SLIDE_COUNT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon
                    width={14}
                    height={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                </div>
              </div>

              {/* Persona */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Persona Gaya
                </label>
                <div className="relative">
                  <select
                    value={config.carousel.persona}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        carousel: { ...prev.carousel, persona: e.target.value },
                      }))
                    }
                    className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-8 text-xs font-medium text-zinc-800 shadow-sm focus:border-brand focus:outline-none dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    {PERSONA_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon
                    width={14}
                    height={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: VIDEO */}
          <div className="space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-white/5 dark:bg-zinc-800/30">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-2.5 dark:border-white/5">
              <VideoIcon width={16} height={16} className="text-brand-strong dark:text-brand" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Video Storyboard
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Ratio */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Rasio Video
                </label>
                <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 dark:border-white/10 dark:bg-zinc-800">
                  {RATIOS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          video: { ...prev.video, ratio: r },
                        }))
                      }
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                        config.video.ratio === r
                          ? "bg-zinc-900 text-white shadow-sm dark:bg-brand dark:text-zinc-950"
                          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Persona */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Persona Gaya
                </label>
                <div className="relative">
                  <select
                    value={config.video.persona}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        video: { ...prev.video, persona: e.target.value },
                      }))
                    }
                    className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-8 text-xs font-medium text-zinc-800 shadow-sm focus:border-brand focus:outline-none dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    {PERSONA_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon
                    width={14}
                    height={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                </div>
              </div>

              {/* Voice Over */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Voice Over
                </label>
                <div className="relative">
                  <select
                    value={config.video.voiceOver}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        video: { ...prev.video, voiceOver: e.target.value },
                      }))
                    }
                    className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-8 text-xs font-medium text-zinc-800 shadow-sm focus:border-brand focus:outline-none dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    {VOICEOVER_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon
                    width={14}
                    height={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-white/5 dark:bg-zinc-900">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            3 kelompok pengaturan tersedia
          </span>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onPress={onClose}
              className="text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="md"
              onPress={handleSave}
              className="gap-2 text-xs font-semibold shadow-md"
            >
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

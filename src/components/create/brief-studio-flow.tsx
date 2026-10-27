"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, toast } from "@heroui/react";
import { post } from "@/lib/client";
import { cn } from "@/lib/utils";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  ImageIcon,
  LayersIcon,
  LockIcon,
  PencilIcon,
  RefreshIcon,
  SlidersIcon,
  SparkIcon,
  VideoIcon,
  XIcon,
} from "@/components/ui/icons";
import {
  MultiTypeConfigModal,
  type MultiTypeConfig,
} from "@/components/project/multi-type-config-modal";
import { SingleImageBriefSection } from "./single-image-brief-section";
import { VideoStoryboardBriefSection } from "./video-storyboard-brief-section";

interface BriefStudioFlowProps {
  canModerate?: boolean;
}

const DEFAULT_PROMPT =
  "Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.";

const SINGLE_IMAGE_VARIATIONS = [
  {
    id: "img-var-1",
    title: "AI Variasi: Liputan Investigasi #1",
    url: "/post-media/card-1.png",
    aspect: "9:16",
    prompt: "Investigative documentary visual lighting cinematic mood",
  },
  {
    id: "img-var-2",
    title: "AI Variasi: Sorotan Fakta #2",
    url: "/post-media/card-2.png",
    aspect: "9:16",
    prompt: "Data journalism portrait infographic background bold tone",
  },
  {
    id: "img-var-3",
    title: "AI Variasi: Standarisasi & Data #3",
    url: "/post-media/card-3.png",
    aspect: "9:16",
    prompt: "Clean editorial graphics minimalist clean light contrast",
  },
  {
    id: "img-var-4",
    title: "AI Variasi: Nuansa Visual Editorial #4",
    url: "/seed/unsplash/abstract-03.jpg",
    aspect: "9:16",
    prompt: "Abstract editorial textured dark blue neon accent",
  },
];

const CAROUSEL_SLIDES = [
  {
    slideNumber: 1,
    title: "AI Variasi: Standarisasi & Data #1",
    subtitle: "Cover & Opening Hook",
    url: "/seed/unsplash/abstract-01.jpg",
    textSnippet: "Bagaimana regulasi baru berdampak ke masyarakat?",
  },
  {
    slideNumber: 2,
    title: "AI Variasi: Komposisi Berita Terkini #1",
    subtitle: "Konteks Kronologi",
    url: "/seed/unsplash/abstract-02.jpg",
    textSnippet: "Fakta-fakta utama yang terjadi dalam 24 jam terakhir.",
  },
  {
    slideNumber: 3,
    title: "AI Variasi: Sorotan Pelaku UMKM #1",
    subtitle: "Dampak Langsung",
    url: "/seed/unsplash/abstract-03.jpg",
    textSnippet: "Suara dan tanggapan dari pelaku lapangan.",
  },
  {
    slideNumber: 4,
    title: "AI Variasi: Nuansa Visual Editorial #1",
    subtitle: "Analisis Angka",
    url: "/seed/unsplash/abstract-04.jpg",
    textSnippet: "Perbandingan data tahun ini vs tahun sebelumnya.",
  },
  {
    slideNumber: 5,
    title: "AI Variasi: Pandangan Ahli & Solusi #1",
    subtitle: "Rekomendasi",
    url: "/seed/unsplash/abstract-05.jpg",
    textSnippet: "Langkah mitigasi yang disarankan pengamat.",
  },
  {
    slideNumber: 6,
    title: "AI Variasi: Kesimpulan & Diskusi #1",
    subtitle: "Call to Action",
    url: "/seed/unsplash/abstract-06.jpg",
    textSnippet: "Bagikan pendapatmu di kolom komentar kumparan.",
  },
];

const VIDEO_SCENES = [
  {
    scene: 1,
    duration: "00:00 - 00:03",
    visual: "Breaking news opener / tease visual dramatis",
    visualText: "Breaking",
    voiceOver: '"Kabar terbaru seputar topik utama yang ramai diperbincangkan."',
  },
  {
    scene: 2,
    duration: "00:03 - 00:08",
    visual: "B-roll kronologi peristiwa dan lokasi kejadian",
    visualText: "Kronologi",
    voiceOver: '"Ini penjelasan lengkap fakta dan duduk perkara dalam 60 detik."',
  },
  {
    scene: 3,
    duration: "00:08 - 00:14",
    visual: "Grafik infografis data pendukung dan statistik resmi",
    visualText: "Fakta Kunci",
    voiceOver: '"Lonjakan tercatat mencapai angka signifikan dibanding periode lalu."',
  },
  {
    scene: 4,
    duration: "00:14 - 00:20",
    visual: "Kompilasi respon dan kutipan narasumber terpercaya",
    visualText: "Tanggapan",
    voiceOver: '"Berbagai pihak mendesak adanya transparansi dan evaluasi menyeluruh."',
  },
  {
    scene: 5,
    duration: "00:20 - 00:25",
    visual: "Outro branded kumparan dengan ajakan diskusi",
    visualText: "Simak Lengkapnya",
    voiceOver: '"Ikuti liputan mendalam dan update terkini hanya di kumparan."',
  },
];

export function BriefStudioFlow({ canModerate = false }: BriefStudioFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL params if returning from editor publish
  const activeStepParam = searchParams.get("activeStep");
  const doneParam = searchParams.get("done");

  // Stage: "composer" (Figma 314:27494) or "brief-view" (Figma 314:23703)
  const [step, setStep] = useState<"composer" | "brief-view">(() => {
    return activeStepParam || doneParam ? "brief-view" : "composer";
  });

  const [promptText, setPromptText] = useState(DEFAULT_PROMPT);
  const [selectedMediaFormat, setSelectedMediaFormat] = useState<"all" | "image" | "carousel" | "video">("all");
  const [isMediaMenuOpen, setIsMediaMenuOpen] = useState(false);

  // List of completed types
  const [completedTypes, setCompletedTypes] = useState<string[]>(() => {
    const list: string[] = [];
    if (doneParam) {
      doneParam.split(",").map((s) => s.trim()).filter(Boolean).forEach((t) => list.push(t));
    }
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("done_types_brief_studio");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((t) => {
              if (!list.includes(t)) list.push(t);
            });
          }
        }
      } catch {}
    }
    return list;
  });

  // Active section (0: Single Image, 1: Carousel, 2: Video Storyboard)
  const [activeSection, setActiveSection] = useState<number>(() => {
    if (activeStepParam === "carousel") return 1;
    if (activeStepParam === "video") return 2;
    if (activeStepParam === "complete") return 3;
    if (completedTypes.includes("image") && !completedTypes.includes("carousel")) return 1;
    if (completedTypes.includes("carousel") && !completedTypes.includes("video")) return 2;
    return 0;
  });

  const [carouselGenerated, setCarouselGenerated] = useState<boolean>(true);
  const [isGeneratingCarousel, setIsGeneratingCarousel] = useState<boolean>(false);

  // Modals state
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);

  // Configuration options
  const [config, setConfig] = useState<MultiTypeConfig>({
    image: { ratio: "9:16", persona: "Investigatif", enabled: true },
    carousel: { ratio: "16:9", slideCount: 6, persona: "Investigatif", enabled: true },
    video: { ratio: "9:16", persona: "Investigatif", voiceOver: "Ya", enabled: true },
  });

  const [isNavigatingEditor, setIsNavigatingEditor] = useState<string | null>(null);

  // Sync state if search params change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (doneParam) {
        const parts = doneParam.split(",").map((s) => s.trim()).filter(Boolean);
        setCompletedTypes((prev) => Array.from(new Set([...prev, ...parts])));
        setStep("brief-view");
      }
      if (activeStepParam === "carousel") setActiveSection(1);
      else if (activeStepParam === "video") setActiveSection(2);
      else if (activeStepParam === "complete") setActiveSection(3);
    }, 0);
    return () => clearTimeout(timer);
  }, [doneParam, activeStepParam]);

  // Handle Submit from Composer
  function handleKirim() {
    if (!promptText.trim()) {
      toast.warning("Silakan tulis isi brief terlebih dahulu.");
      return;
    }
    toast.success("Brief berhasil dibuat. Memulai dari Bagian 1 (Single Image)...");
    setStep("brief-view");
    setActiveSection(0);
  }

  // Handle open editor with return URL pointing back to /ai-studio/brief
  async function handleOpenEditor(type: "image" | "carousel" | "video") {
    setIsNavigatingEditor(type);
    try {
      const backUrl = "/ai-studio/brief";
      let targetUrl = `/studio/demo-${type}?from=${type}&backHref=${encodeURIComponent(backUrl)}`;
      try {
        const res = await post<{ projectId: string }>("/api/projects", {
          origin: "brief_flow",
          topicTitle: promptText.slice(0, 80),
          topicSource: "brief_studio",
          contentType: type,
        });
        if (res?.projectId) {
          try {
            const creationRes = await post<{ creationId: string }>("/api/creations", {
              projectId: res.projectId,
              mediaSources: [{ briefRow: 1, source: "ai_generated", prompt: promptText }],
            });
            if (creationRes?.creationId) {
              targetUrl = `/studio/${creationRes.creationId}?from=${type}&backHref=${encodeURIComponent(backUrl)}`;
            }
          } catch {}
        }
      } catch {}

      toast.success(`Membuka editor ${type}...`);
      router.push(targetUrl);
    } catch {
      router.push(`/studio/demo-${type}?from=${type}&backHref=${encodeURIComponent("/ai-studio/brief")}`);
    } finally {
      setIsNavigatingEditor(null);
    }
  }

  // Reset all and start new brief
  function handleResetAll() {
    try {
      localStorage.removeItem("done_types_brief_studio");
    } catch {}
    setCompletedTypes([]);
    setActiveSection(0);
    setStep("composer");
    router.replace("/ai-studio/brief");
  }

  const isImageDone = completedTypes.includes("image");
  const isCarouselDone = completedTypes.includes("carousel");
  const isVideoDone = completedTypes.includes("video");
  const isAllDone = isImageDone && isCarouselDone && isVideoDone;

  // ─────────────────────────────────────────────────────────────
  // STAGE 1: BUAT BRIEF COMPOSER (Figma #314:27494)
  // ─────────────────────────────────────────────────────────────
  if (step === "composer") {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-4xl flex-col items-center justify-start px-4 py-8 sm:px-6">
        {/* Back Link to Image Dashboard */}
        <div className="w-full pb-6">
          <Link
            href="/ai-studio/image"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            <span>← Kembali ke Dashboard Gambar</span>
          </Link>
        </div>

        {/* Header Title & Subtitle */}
        <div className="flex flex-col items-center gap-2 pb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            Buat Brief
          </h1>
          <p className="max-w-xl text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Template produksi gambar siap diisi untuk semua jenis konten.
          </p>
        </div>

        {/* Composer Card (Figma Overlay+Border #290:29020) */}
        <div className="w-full rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-xl transition-all dark:border-white/10 dark:bg-zinc-900/90">
          {/* Top Identifier Row */}
          <div className="flex items-center justify-between pb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-[#01AFAE]/15 text-[#01AFAE]">
                <SparkIcon className="size-3.5" />
              </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                Generate Image
              </span>
            </div>
            <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              Produksi konten
            </span>
          </div>

          {/* Textarea Prompt Context */}
          <div className="py-2">
            <textarea
              rows={6}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Tuliskan brief ide konten, narasi, atau konteks materi di sini..."
              className="w-full resize-none border-none bg-transparent p-0 text-sm leading-relaxed text-zinc-800 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500 sm:text-base"
            />
          </div>

          {/* Horizontal Divider */}
          <div className="my-4 border-t border-zinc-200/80 dark:border-white/10" />

          {/* Bottom Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Pilih Media Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMediaMenuOpen(!isMediaMenuOpen)}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <LayersIcon className="size-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>
                  {selectedMediaFormat === "all"
                    ? "Pilih Media (Multi-format)"
                    : selectedMediaFormat === "image"
                    ? "Single Image"
                    : selectedMediaFormat === "carousel"
                    ? "Multiple Image (Carousel)"
                    : "Video Storyboard"}
                </span>
                <ChevronDownIcon className="size-3 text-zinc-400" />
              </button>

              {isMediaMenuOpen && (
                <div className="absolute left-0 top-full z-20 mt-1.5 w-60 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/15 dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMediaFormat("all");
                      setIsMediaMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10"
                  >
                    <SparkIcon className="size-3.5 text-brand-strong dark:text-brand" />
                    <span>Semua Format (3 Bagian)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMediaFormat("image");
                      setIsMediaMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10"
                  >
                    <ImageIcon className="size-3.5 text-zinc-400" />
                    <span>Single Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMediaFormat("carousel");
                      setIsMediaMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10"
                  >
                    <LayersIcon className="size-3.5 text-zinc-400" />
                    <span>Multiple Image (Carousel)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMediaFormat("video");
                      setIsMediaMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10"
                  >
                    <VideoIcon className="size-3.5 text-zinc-400" />
                    <span>Video Storyboard</span>
                  </button>
                </div>
              )}
            </div>

            {/* Kirim Button */}
            <button
              type="button"
              onClick={handleKirim}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-6 text-xs font-semibold text-white shadow-sm transition-all hover:bg-black active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Kirim
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // STAGE 2: CONTENT BRIEF 3-FORMAT VIEW (Figma #314:23703)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6 sm:px-6">
      {/* Top Celebration Banner when All Done */}
      {isAllDone && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-emerald-950 sm:flex-row dark:border-emerald-400/20 dark:bg-emerald-950/40 dark:text-emerald-200">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-lg font-bold sm:text-xl">
              🎉 Semua Format Konten Berhasil Dipublikasikan!
            </h2>
            <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
              Single Image, Carousel, dan Video Storyboard telah selesai dipublish ke channel Kumparan.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetAll}
            className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 dark:bg-emerald-500 dark:text-zinc-900 dark:hover:bg-emerald-400"
          >
            Buat Brief Baru
          </button>
        </div>
      )}

      {/* Top Header & Back to Composer */}
      <div className="flex flex-col gap-4 border-b border-zinc-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <div>
          <button
            type="button"
            onClick={() => setStep("composer")}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            <ArrowLeftIcon className="size-3.5" />
            <span>Kembali ke Buat Brief</span>
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
            Content Brief
          </h1>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
            Selesaikan konten secara berurutan: Brief → Generate → Canvas Editor → Publish ke channel.
          </p>
        </div>

        {/* Global Multi-Type Config Button */}
        <button
          type="button"
          onClick={() => setIsConfigModalOpen(true)}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 sm:self-auto dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700/60"
        >
          <SlidersIcon className="size-3.5 text-zinc-500 dark:text-zinc-400" />
          <span>Konfigurasi Format</span>
        </button>
      </div>

      {/* CONTEXT CARD with "Ubah" Action (Figma #314:23703 Context section) */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-zinc-900/80">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
              Context
            </span>
            <p className="line-clamp-3 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-sm">
              {promptText}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Ubah
          </button>
        </div>
      </div>

      {/* 3 PROGRESSIVE MULTI-FORMAT SECTIONS */}
      <div className="space-y-6">
        {/* ═════════════════════════════════════════════════════════ */}
        {/* CARD 1: SINGLE IMAGE MODE (BAGIAN 1 DARI 3) */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div
          className={cn(
            "overflow-hidden rounded-2xl border transition-all duration-300",
            isImageDone
              ? "border-emerald-500/30 bg-emerald-50/40 dark:border-emerald-500/20 dark:bg-emerald-950/20"
              : activeSection === 0
              ? "border-zinc-300 bg-white shadow-md dark:border-white/20 dark:bg-zinc-900/90"
              : "border-zinc-200/80 bg-zinc-50/60 opacity-85 dark:border-white/10 dark:bg-zinc-900/40"
          )}
        >
          {/* Card Header Accordion Bar */}
          <div
            onClick={() => {
              if (!isImageDone) setActiveSection(0);
            }}
            className={cn(
              "flex items-center justify-between border-b p-5",
              isImageDone
                ? "cursor-default border-emerald-500/20 dark:border-emerald-500/10"
                : "cursor-pointer border-zinc-100 dark:border-white/5"
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg text-xs font-bold",
                  isImageDone
                    ? "bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400"
                    : "bg-teal-500/15 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400"
                )}
              >
                {isImageDone ? <CheckIcon className="size-4" /> : "1"}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                    BAGIAN 1 DARI 3
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                      isImageDone
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                        : "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                    )}
                  >
                    Single Image
                  </span>
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Single Image Mode
                </h3>
              </div>
            </div>

            {/* Badges & Status */}
            <div className="flex items-center gap-2.5">
              {isImageDone ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-2xs">
                  <CheckIcon className="size-3.5" />
                  <span>Done · Published</span>
                </span>
              ) : (
                <>
                  <span className="hidden rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 sm:inline dark:bg-zinc-800 dark:text-zinc-300">
                    Rasio {config.image.ratio}
                  </span>
                  <span className="hidden rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 sm:inline dark:bg-zinc-800 dark:text-zinc-300">
                    {config.image.persona}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsImageModalOpen(true);
                    }}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    title="Konfigurasi Gambar"
                  >
                    <SlidersIcon className="size-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* If Done: Collapsed & Locked permanently (sesuai arahan user) */}
          {isImageDone ? (
            <div className="flex items-center justify-between p-4 px-5 text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-3">
                <div className="relative size-12 overflow-hidden rounded-lg border border-emerald-500/30">
                  <Image
                    src={SINGLE_IMAGE_VARIATIONS[0].url}
                    alt="Single Image Published"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {SINGLE_IMAGE_VARIATIONS[0].title}
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Format visual Single Image telah dipublish. Lanjutkan menyelesaikan Carousel.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                Terkunci (Selesai)
              </span>
            </div>
          ) : (
            /* Card Body Active */
            activeSection === 0 && (
              <div className="p-5 sm:p-6">
                <SingleImageBriefSection
                  initialTopic={promptText}
                  ratio={config.image.ratio as "9:16" | "1:1" | "16:9" | "4:5"}
                  persona={config.image.persona}
                  onOpenEditor={() => handleOpenEditor("image")}
                  isNavigatingEditor={isNavigatingEditor === "image"}
                />
              </div>
            )
          )}
        </div>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* CARD 2: MULTIPLE IMAGE (CAROUSEL) MODE (BAGIAN 2 DARI 3) */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div
          className={cn(
            "overflow-hidden rounded-2xl border transition-all duration-300",
            isCarouselDone
              ? "border-emerald-500/30 bg-emerald-50/40 dark:border-emerald-500/20 dark:bg-emerald-950/20"
              : !isImageDone
              ? "border-zinc-200/60 bg-zinc-50/40 opacity-60 dark:border-white/5 dark:bg-zinc-900/20"
              : activeSection === 1
              ? "border-zinc-300 bg-white shadow-md dark:border-white/20 dark:bg-zinc-900/90"
              : "border-zinc-200/80 bg-zinc-50/60 opacity-85 dark:border-white/10 dark:bg-zinc-900/40"
          )}
        >
          {/* Card Header Accordion Bar */}
          <div
            onClick={() => {
              if (isImageDone && !isCarouselDone) setActiveSection(1);
            }}
            className={cn(
              "flex items-center justify-between border-b p-5",
              isCarouselDone || !isImageDone
                ? "cursor-default border-zinc-100 dark:border-white/5"
                : "cursor-pointer border-zinc-100 dark:border-white/5"
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg text-xs font-bold",
                  isCarouselDone
                    ? "bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400"
                    : isImageDone
                    ? "bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                    : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                )}
              >
                {isCarouselDone ? <CheckIcon className="size-4" /> : "2"}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                    BAGIAN 2 DARI 3
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                      isCarouselDone
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                        : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                    )}
                  >
                    Multiple Image (Carousel)
                  </span>
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Multiple Image (Carousel) Mode
                </h3>
              </div>
            </div>

            {/* Badges & Actions */}
            <div className="flex items-center gap-2.5">
              {isCarouselDone ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-2xs">
                  <CheckIcon className="size-3.5" />
                  <span>Done · Published</span>
                </span>
              ) : !isImageDone ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-200/80 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  <LockIcon className="size-3" />
                  <span>Selesaikan Single Image dahulu</span>
                </span>
              ) : (
                <>
                  <span className="hidden rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 sm:inline dark:bg-zinc-800 dark:text-zinc-300">
                    Rasio {config.carousel.ratio} · {config.carousel.slideCount} Slide
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsConfigModalOpen(true);
                    }}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    title="Konfigurasi Carousel"
                  >
                    <SlidersIcon className="size-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* If Carousel Done: Collapsed & Locked permanently */}
          {isCarouselDone ? (
            <div className="flex items-center justify-between p-4 px-5 text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-3">
                <div className="relative size-12 overflow-hidden rounded-lg border border-emerald-500/30">
                  <Image
                    src={CAROUSEL_SLIDES[0].url}
                    alt="Carousel Published"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    Storytelling Carousel (6 Slide)
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Format visual Carousel telah dipublish. Lanjutkan menyelesaikan Video Storyboard.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                Terkunci (Selesai)
              </span>
            </div>
          ) : (
            /* Card Body Active */
            isImageDone &&
            activeSection === 1 && (
              <div className="space-y-6 p-5 sm:p-6">
                {!carouselGenerated ? (
                  /* Ready/Empty State (Figma #314:23705) */
                  <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-white/15">
                    <div className="flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                      <LayersIcon className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                        Carousel Belum Dibuat
                      </h4>
                      <p className="max-w-md text-xs text-zinc-500 dark:text-zinc-400">
                        Rangkaian 6 slide visual untuk storytelling carousel siap disusun otomatis.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isGeneratingCarousel}
                      onClick={() => {
                        setIsGeneratingCarousel(true);
                        setTimeout(() => {
                          setCarouselGenerated(true);
                          setIsGeneratingCarousel(false);
                          toast.success("6 slide carousel berhasil disusun!");
                        }, 800);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-black active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                    >
                      {isGeneratingCarousel ? "Menyusun Slide..." : "Generate Variasi Carousel"}
                    </button>
                  </div>
                ) : (
                  /* Generated State with 6 Slide Previews (Figma #332:35071) */
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                          Slide Storytelling Carousel (6 Slide)
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Buka Carousel Editor untuk mengedit isi slide dan publish ke format berikutnya.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toast.success("PDF Carousel berhasil diunduh.")}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200"
                        >
                          <DownloadIcon className="size-3.5" />
                          <span>Unduh PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditor("carousel")}
                          disabled={isNavigatingEditor === "carousel"}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-black active:scale-[0.98] disabled:opacity-75 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                        >
                          <PencilIcon className="size-3.5" />
                          <span>
                            {isNavigatingEditor === "carousel"
                              ? "Membuka..."
                              : "Buka Carousel Editor"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* 6 Slides Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                      {CAROUSEL_SLIDES.map((slide) => (
                        <div
                          key={slide.slideNumber}
                          className="flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-200 bg-white p-2.5 shadow-2xs transition-all hover:border-zinc-300 dark:border-white/10 dark:bg-zinc-800/80"
                        >
                          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
                            <Image
                              src={slide.url}
                              alt={slide.title}
                              fill
                              sizes="(max-width: 640px) 50vw, 16vw"
                              className="object-cover"
                            />
                            <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
                              Slide {slide.slideNumber}
                            </span>
                          </div>
                          <div className="space-y-1 pt-2">
                            <span className="line-clamp-1 text-[11px] font-bold text-zinc-900 dark:text-white">
                              {slide.subtitle}
                            </span>
                            <p className="line-clamp-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                              {slide.textSnippet}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-50/50 p-4 text-xs text-indigo-900 dark:border-indigo-400/20 dark:bg-indigo-950/20 dark:text-indigo-200">
                      <p>
                        💡 <strong>Alur Produksi:</strong> Klik <strong>&quot;Buka Carousel Editor&quot;</strong>, susun teks dan gambar slide di editor multi-slide, lalu klik <strong>&quot;Publish Content&quot;</strong> untuk otomatis beralih ke Video Storyboard!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* CARD 3: STORYBOARD VIDEO MODE (BAGIAN 3 DARI 3) */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div
          className={cn(
            "overflow-hidden rounded-2xl border transition-all duration-300",
            isVideoDone
              ? "border-emerald-500/30 bg-emerald-50/40 dark:border-emerald-500/20 dark:bg-emerald-950/20"
              : !isCarouselDone
              ? "border-zinc-200/60 bg-zinc-50/40 opacity-60 dark:border-white/5 dark:bg-zinc-900/20"
              : activeSection === 2
              ? "border-zinc-300 bg-white shadow-md dark:border-white/20 dark:bg-zinc-900/90"
              : "border-zinc-200/80 bg-zinc-50/60 opacity-85 dark:border-white/10 dark:bg-zinc-900/40"
          )}
        >
          {/* Card Header Accordion Bar */}
          <div
            onClick={() => {
              if (isCarouselDone && !isVideoDone) setActiveSection(2);
            }}
            className={cn(
              "flex items-center justify-between border-b p-5",
              isVideoDone || !isCarouselDone
                ? "cursor-default border-zinc-100 dark:border-white/5"
                : "cursor-pointer border-zinc-100 dark:border-white/5"
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg text-xs font-bold",
                  isVideoDone
                    ? "bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400"
                    : isCarouselDone
                    ? "bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
                    : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                )}
              >
                {isVideoDone ? <CheckIcon className="size-4" /> : "3"}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                    BAGIAN 3 DARI 3
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                      isVideoDone
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                    )}
                  >
                    Video Storyboard
                  </span>
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Storyboard Video Mode
                </h3>
              </div>
            </div>

            {/* Badges & Actions */}
            <div className="flex items-center gap-2.5">
              {isVideoDone ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-2xs">
                  <CheckIcon className="size-3.5" />
                  <span>Done · Published</span>
                </span>
              ) : !isCarouselDone ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-200/80 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  <LockIcon className="size-3" />
                  <span>Selesaikan Carousel dahulu</span>
                </span>
              ) : (
                <>
                  <span className="hidden rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 sm:inline dark:bg-zinc-800 dark:text-zinc-300">
                    25 detik · 5 Scene · With Voice Over
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsVideoModalOpen(true);
                    }}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    title="Konfigurasi Video"
                  >
                    <SlidersIcon className="size-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* If Video Done: Collapsed & Locked permanently */}
          {isVideoDone ? (
            <div className="flex items-center justify-between p-4 px-5 text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <VideoIcon className="size-6" />
                </div>
                <div>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    Video Storyboard (5 Scene · 25 detik)
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Format Video Storyboard telah selesai dipublish ke channel Kumparan.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                Terkunci (Selesai)
              </span>
            </div>
          ) : (
            /* Card Body Active */
            isCarouselDone &&
            activeSection === 2 && (
              <div className="p-5 sm:p-6">
                <VideoStoryboardBriefSection
                  initialTopic={promptText}
                  ratio={config.video.ratio}
                  duration="25 detik"
                  angle={config.video.persona || "Investigatif"}
                  voiceover={config.video.voiceOver || "Dalipin"}
                  onOpenEditor={() => handleOpenEditor("video")}
                  isNavigatingEditor={isNavigatingEditor === "video"}
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: MULTI-TYPE CONFIG MODAL (Figma #348:38852)
      ───────────────────────────────────────────────────────────── */}
      <MultiTypeConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfirm={(newConfig) => {
          setConfig(newConfig);
          setIsConfigModalOpen(false);
          toast.success("Konfigurasi format berhasil disimpan.");
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: POPUP VIDEO CONFIGURATION (Figma #314:27704)
      ───────────────────────────────────────────────────────────── */}
      {isVideoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsVideoModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900">
            <div className="flex items-center justify-between pb-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Konfigurasi Video
              </h3>
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Aspect Ratio
                </label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {(["1:1", "4:3", "16:9", "9:16"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, video: { ...prev.video, ratio: r } }))}
                      className={cn(
                        "rounded-lg border py-2 text-center font-medium transition-colors",
                        config.video.ratio === r
                          ? "border-brand bg-brand/10 font-bold text-brand-strong dark:text-brand"
                          : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Voice Over
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {["Yes", "No"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          video: { ...prev.video, voiceOver: v === "Yes" ? "Ya" : "Tidak perlu" },
                        }))
                      }
                      className={cn(
                        "rounded-lg border py-2 text-center font-medium transition-colors",
                        (v === "Yes" && config.video.voiceOver === "Ya") ||
                          (v === "No" && config.video.voiceOver !== "Ya")
                          ? "border-brand bg-brand/10 font-bold text-brand-strong dark:text-brand"
                          : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Persona Gaya
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {["Investigatif", "Fun & Casual"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, video: { ...prev.video, persona: p } }))
                      }
                      className={cn(
                        "rounded-lg border py-2 text-center font-medium transition-colors",
                        config.video.persona === p
                          ? "border-brand bg-brand/10 font-bold text-brand-strong dark:text-brand"
                          : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-6">
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsVideoModalOpen(false);
                  toast.success("Konfigurasi video disimpan.");
                }}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: POPUP IMAGE CONFIGURATION (Figma #314:27705)
      ───────────────────────────────────────────────────────────── */}
      {isImageModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsImageModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900">
            <div className="flex items-center justify-between pb-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Konfigurasi Gambar
              </h3>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Persona Visual
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {["Investigatif", "Fun & Casual"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, image: { ...prev.image, persona: p } }))
                      }
                      className={cn(
                        "rounded-lg border py-2 text-center font-medium transition-colors",
                        config.image.persona === p
                          ? "border-brand bg-brand/10 font-bold text-brand-strong dark:text-brand"
                          : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-6">
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsImageModalOpen(false);
                  toast.success("Konfigurasi gambar disimpan & diregenerasi.");
                }}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

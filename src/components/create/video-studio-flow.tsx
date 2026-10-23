"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react";
import { cn } from "@/lib/utils";
import type { GenerationDTO } from "@/types";
import { INSIGHT_VIDEO_SECTION } from "../../../config/generation";
import { IMAGE_TEMPLATES } from "../../../config/templates";
import {
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  DownloadIcon,
  SlidersIcon,
  UploadIcon,
  XIcon,
} from "@/components/ui/icons";
import { SectionHeader } from "@/components/ui/primitives";
import { InsightSection } from "./insight-section";
import { ReferenceOutputGrid } from "./reference-output-grid";
import { DetailModal } from "./detail-modal";

// ── Icons Khusus Video Studio ───────────────────────────────────────────────

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "w-4 h-4"}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className ?? "w-4 h-4"}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "w-4 h-4"}
    >
      <path d="M12 3l1.912 5.885L20 10l-6.088 1.115L12 17l-1.912-5.885L4 10l6.088-1.115z" />
      <path d="M19 16l.956 2.943L23 20l-3.044.557L19 23l-.956-2.943L15 20l3.044-.557z" />
    </svg>
  );
}

function AspectRatioIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "w-4 h-4"}
    >
      <rect x="6" y="3" width="12" height="18" rx="2" />
    </svg>
  );
}

function UserPersonaIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "w-4 h-4"}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function FilmSceneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "w-4 h-4"}
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 8h20" />
      <path d="M2 16h20" />
      <path d="M7 4v4M12 4v4M17 4v4" />
      <path d="M7 16v4M12 16v4M17 16v4" />
    </svg>
  );
}

// ── Tipe & Data Bawaan ───────────────────────────────────────────────────────

export type VideoProductionParams = {
  scenes: number;
  ratio: "9:16" | "16:9" | "1:1" | "4:5";
  duration: "15 dtk" | "30 dtk" | "60 dtk" | "90 dtk";
  style: "Cinematic" | "3D Animation" | "Realistis" | "Vintage" | "Minimalis";
  persona: "Persona" | "Formal" | "Kasual" | "Enerjik" | "Storytelling" | "Informatif";
};

export type StoryboardScene = {
  sceneNumber: number;
  duration: string;
  visual: {
    description: string;
    thumbnailUrl?: string | null;
  };
  visualText: string;
  voiceover: string;
};

export type Scenario2SceneInput = {
  description: string;
  cameraMovement: string;
};

const CAMERA_MOVEMENTS = [
  "Static",
  "Zoom In",
  "Zoom Out",
  "Pan Left",
  "Pan Right",
  "Tilt Up",
  "Tilt Down",
  "Tracking",
] as const;

export type GalleryAsset = {
  id: string;
  url: string;
  title: string;
  duration?: string;
  type: "video" | "image";
};

export const SAMPLE_GALLERY_VIDEOS: GalleryAsset[] = [
  {
    id: "v1",
    url: "/seed/unsplash/abstract-01.jpg",
    title: "B-roll kabut asap tebal menyelimuti jalanan",
    duration: "00:30",
    type: "video",
  },
  {
    id: "v2",
    url: "/seed/unsplash/abstract-02.jpg",
    title: "Peta sebaran titik api satelit BMKG",
    duration: "00:20",
    type: "video",
  },
  {
    id: "v3",
    url: "/seed/unsplash/abstract-03.jpg",
    title: "Penumpukan penumpang di bandara akibat kabut",
    duration: "00:15",
    type: "video",
  },
  {
    id: "v4",
    url: "/seed/unsplash/abstract-04.jpg",
    title: "Bara api lahan gambut membara dari dalam",
    duration: "00:25",
    type: "video",
  },
  {
    id: "v5",
    url: "/seed/unsplash/abstract-05.jpg",
    title: "Petugas Manggala Agni memadamkan api",
    duration: "00:30",
    type: "video",
  },
  {
    id: "v6",
    url: "/seed/unsplash/abstract-06.jpg",
    title: "Warga berkendara memakai masker N95",
    duration: "00:20",
    type: "video",
  },
];

export const SAMPLE_GALLERY_IMAGES: GalleryAsset[] = [
  {
    id: "i1",
    url: "/seed/unsplash/abstract-07.jpg",
    title: "Grafis peringatan darurat kabut asap",
    type: "image",
  },
  {
    id: "i2",
    url: "/seed/unsplash/abstract-08.jpg",
    title: "Infografis bahaya ISPA dan indeks polusi",
    type: "image",
  },
  {
    id: "i3",
    url: "/seed/unsplash/abstract-09.jpg",
    title: "Peta deteksi titik panas Kalimantan",
    type: "image",
  },
  {
    id: "i4",
    url: "/seed/unsplash/abstract-10.jpg",
    title: "Poster imbauan stop pembakaran lahan",
    type: "image",
  },
];

// Opsi filter dropdown
const SCENE_OPTIONS = [3, 4, 5, 6, 8, 10];
const RATIO_OPTIONS: VideoProductionParams["ratio"][] = ["9:16", "16:9", "1:1", "4:5"];
const DURATION_OPTIONS: VideoProductionParams["duration"][] = ["15 dtk", "30 dtk", "60 dtk", "90 dtk"];
const STYLE_OPTIONS: VideoProductionParams["style"][] = [
  "Cinematic",
  "3D Animation",
  "Realistis",
  "Vintage",
  "Minimalis",
];
const PERSONA_OPTIONS: VideoProductionParams["persona"][] = [
  "Persona",
  "Formal",
  "Kasual",
  "Enerjik",
  "Storytelling",
  "Informatif",
];

// ── Dropdown Filter Button Component ────────────────────────────────────────

function FilterDropdown<T extends string | number>({
  icon: Icon,
  label,
  value,
  options,
  onSelect,
}: {
  icon: (props: { className?: string }) => React.JSX.Element;
  label: string;
  value: T;
  options: T[];
  onSelect: (val: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-all select-none",
          open
            ? "border-brand bg-brand/10 text-brand dark:border-brand dark:bg-brand/15 dark:text-brand-light"
            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-white/20 dark:hover:bg-zinc-800",
        )}
      >
        <Icon className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
        <span>{label}</span>
        <ChevronDownIcon
          className={cn("h-3.5 w-3.5 text-zinc-400 transition-transform duration-200", open && "rotate-180 text-brand")}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1.5 z-50 min-w-[140px] rounded-xl border border-zinc-200 bg-white p-1 shadow-lg animate-in fade-in zoom-in-95 duration-150 dark:border-white/15 dark:bg-zinc-900">
          <div className="max-h-56 overflow-y-auto py-0.5">
            {options.map((opt) => (
              <button
                key={String(opt)}
                type="button"
                onClick={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                  opt === value
                    ? "bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-light"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                )}
              >
                <span>{String(opt)}</span>
                {opt === value && <CheckIcon className="h-3.5 w-3.5 text-brand" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Video Studio Flow Component ────────────────────────────────────────

export function VideoStudioFlow({
  items = [],
  canModerate,
}: {
  items?: GenerationDTO[];
  canModerate?: boolean;
}) {
  const router = useRouter();

  // 0: Entry Point (Figma 977:8374), 1: Brief & Parameter, 2: Asisten AI, 3: Story Board Table
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  // Bersihkan teks default: user mengisi teks sendiri tanpa teks bawaan yang dipaksakan
  const [prompt, setPrompt] = useState("");

  const [params, setParams] = useState<VideoProductionParams>({
    scenes: 6,
    ratio: "9:16",
    duration: "60 dtk",
    style: "Cinematic",
    persona: "Persona",
  });
  const [attachment, setAttachment] = useState<{ name: string; url: string } | null>(null);

  // Detail Modal untuk Entry Point Reference Output
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationDTO | null>(null);

  // Step 2 State (Asisten AI)
  const [conceptChoice, setConceptChoice] = useState<"scratch" | "existing" | null>(null);
  const [assistantReplied, setAssistantReplied] = useState(false);
  const [loadingStoryboard, setLoadingStoryboard] = useState(false);
  const [storyboardProgress, setStoryboardProgress] = useState(0);

  // Skenario 2 State (Lengkapi Detail Scene Accordion)
  const [topicDescription, setTopicDescription] = useState("");
  const [activeAccordion, setActiveAccordion] = useState<string | null>("topic");
  const [sceneInputs, setSceneInputs] = useState<Record<number, Scenario2SceneInput>>({});

  // Step 3 State: Aset pilihan pengguna per nomor scene: { url, title, type, duration }
  const [sceneAssets, setSceneAssets] = useState<
    Record<number, { url: string; title: string; type: "video" | "image"; duration?: string }>
  >({});

  // State untuk modal "Pilih Video Aset" (Figma 986:21951)
  const [activeSceneForAssetModal, setActiveSceneForAssetModal] = useState<number | null>(null);
  const [selectedAssetInModal, setSelectedAssetInModal] = useState<GalleryAsset | null>(null);
  const [assetModalTab, setAssetModalTab] = useState<"video" | "image">("video");
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Step 3 & 4 State (Storyboard & Modal Preview)
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);

  // Ref file input & anchor auto-scroll
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll halus gaya Gemini saat ada pesan baru atau perubahan interaksi di Step 2
  useEffect(() => {
    if (step !== 2) return;

    const timer = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 120);

    return () => clearTimeout(timer);
  }, [step, conceptChoice, assistantReplied, activeAccordion, loadingStoryboard]);

  // Susun data tabel adegan secara dinamis sesuai jumlah scene & input pengguna
  const scenes: StoryboardScene[] = useMemo(() => {
    const list: StoryboardScene[] = [];
    const durSec = parseInt(params.duration, 10) || 60;
    const count = params.scenes || 6;
    const stepDuration = Math.max(4, Math.floor(durSec / count));

    for (let i = 1; i <= count; i += 1) {
      const start = (i - 1) * stepDuration;
      const end = i === count ? durSec : i * stepDuration;
      const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      };

      const userScene = sceneInputs[i];
      const customDesc = userScene?.description?.trim();
      const camera = userScene?.cameraMovement;
      const chosenAsset = sceneAssets[i];

      // Deskripsi visual dinamis: gunakan input pengguna jika ada, atau buatkan deskripsi bersih berbasis brief
      const fallbackDesc = prompt.trim()
        ? `Visual Scene ${i}: Penggambaran adegan "${prompt.slice(0, 50)}..." dengan pergerakan kamera ${camera || "sinematik"}.`
        : `Visual Scene ${i}: Objek utama dan suasana adegan pendukung dengan komposisi terarah.`;

      const visualDesc = customDesc
        ? `${customDesc}${camera ? ` (Pergerakan Kamera: ${camera})` : ""}`
        : fallbackDesc;

      list.push({
        sceneNumber: i,
        duration: `${formatTime(start)} - ${formatTime(end)}`,
        visual: {
          description: visualDesc,
          thumbnailUrl: chosenAsset?.url ?? null,
        },
        visualText: chosenAsset?.title
          ? chosenAsset.title
          : (customDesc
              ? (customDesc.length > 35 ? `${customDesc.slice(0, 32)}…` : customDesc)
              : `Adegan ${i}: ${prompt ? prompt.slice(0, 24) : "Poin Utama Video"}`),
        voiceover: prompt.trim()
          ? `Narasi adegan ${i} menyampaikan pesan: "${prompt.slice(0, 80)}…"`
          : `Narasi suara voiceover pendukung untuk adegan ${i}.`,
      });
    }

    return list;
  }, [params.scenes, params.duration, prompt, sceneInputs, sceneAssets]);

  function handleModalFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video");
    const uploadedAsset: GalleryAsset = {
      id: `uploaded-${Date.now()}`,
      url,
      title: file.name.replace(/\.[^/.]+$/, ""),
      duration: isVideo ? "00:30" : undefined,
      type: isVideo ? "video" : "image",
    };
    setSelectedAssetInModal(uploadedAsset);
    toast.success(`Media "${file.name}" siap ditambahkan ke preview!`);
  }

  function handleApplyAssetToScene() {
    if (!activeSceneForAssetModal || !selectedAssetInModal) return;
    setSceneAssets((prev) => ({
      ...prev,
      [activeSceneForAssetModal]: {
        url: selectedAssetInModal.url,
        title: selectedAssetInModal.title,
        type: selectedAssetInModal.type,
        duration: selectedAssetInModal.duration,
      },
    }));
    toast.success(`Aset berhasil diterapkan pada Scene ${activeSceneForAssetModal}!`);
    setActiveSceneForAssetModal(null);
    setSelectedAssetInModal(null);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAttachment({ name: file.name, url });
    toast.success(`Gambar "${file.name}" ditambahkan sebagai referensi.`);
  }

  function handlePromptSubmit() {
    if (!prompt.trim()) {
      toast.danger("Mohon masukkan konsep atau brief video terlebih dahulu.");
      return;
    }
    setStep(2);
  }

  function handleSelectConcept(choice: "scratch" | "existing") {
    setConceptChoice(choice);
    // Simulasikan balasan asisten interaktif
    setTimeout(() => {
      setAssistantReplied(true);
    }, 450);
  }

  // Loading proses transisi dari Asisten AI / Skenario 2 ke Storyboard
  function handleStartStoryboardLoading() {
    setLoadingStoryboard(true);
    setStoryboardProgress(15);

    const t1 = setTimeout(() => setStoryboardProgress(45), 400);
    const t2 = setTimeout(() => setStoryboardProgress(75), 900);
    const t3 = setTimeout(() => setStoryboardProgress(100), 1400);
    const t4 = setTimeout(() => {
      setLoadingStoryboard(false);
      setStep(3);
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }

  function handleDownloadPdf() {
    toast.success("PDF Storyboard siap! Mengunduh dokumen ringkasan storyboard…");
  }

  // Buka Modal Preview Storyboard: Scene dengan aset langsung siap, scene kosong di-generate AI
  function handleOpenPreviewModal() {
    setPreviewModalOpen(true);
    const hasEmpty = scenes.some((s) => !sceneAssets[s.sceneNumber]);
    if (hasEmpty) {
      setPreviewLoading(true);
      setPreviewProgress(25);
      const t1 = setTimeout(() => setPreviewProgress(60), 450);
      const t2 = setTimeout(() => setPreviewProgress(85), 950);
      const t3 = setTimeout(() => {
        setPreviewProgress(100);
        setPreviewLoading(false);
      }, 1450);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setPreviewLoading(false);
      setPreviewProgress(100);
    }
  }

  function handleProceedToEditor() {
    setPreviewModalOpen(false);
    toast.success("Mengarahkan ke Canvas Editor…");
    router.push("/studio/canvas-1");
  }

  function updateSceneInput(sceneNum: number, delta: Partial<Scenario2SceneInput>) {
    setSceneInputs((prev) => ({
      ...prev,
      [sceneNum]: {
        description: prev[sceneNum]?.description ?? "",
        cameraMovement: prev[sceneNum]?.cameraMovement ?? "",
        ...delta,
      },
    }));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 0: ENTRY POINT (FIGMA 977:8374 - Generate Video Hero + Insights + Output)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 0) {
    const completedVideos = items.filter((item) => item.status === "completed" && (item.thumbnailUrl || item.fileUrl));

    return (
      <div className="space-y-8 py-2 pb-10 animate-in fade-in duration-200">
        {/* Hero Section dengan Tombol "Buat Video Sekarang" */}
        <header className="flex flex-col items-center gap-4 text-center pt-4 pb-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-[54px] md:leading-[60px]">
            Generate Video
          </h1>
          <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
            Generate video kini makin mudah dengan mode panduan memberikan output yang lebih maksimal tanpa harus bikin prompt yang panjang
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center justify-center rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-brand-hover hover:scale-105 active:scale-95"
            >
              Buat Video Sekarang
            </button>
          </div>
        </header>

        {/* Section Insights */}
        <section className="space-y-5">
          <InsightSection
            data={INSIGHT_VIDEO_SECTION}
            onSimilar={(topic) => {
              setPrompt(`Buat video tentang: ${topic}. Tampilkan visual yang memikat dan narasi yang kuat.`);
              setStep(1);
            }}
          />

          <SectionHeader title="Referensi Output" />
          <ReferenceOutputGrid
            generations={completedVideos}
            templates={IMAGE_TEMPLATES}
            onOpenGeneration={setSelectedGeneration}
          />
        </section>

        <DetailModal
          item={selectedGeneration}
          canModerate={canModerate}
          onClose={() => setSelectedGeneration(null)}
          onSimilar={(item) => {
            setPrompt(item.prompt);
            setSelectedGeneration(null);
            setStep(1);
          }}
          onDeleted={() => setSelectedGeneration(null)}
        />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1: WIREFRAME-9 (Input Brief & Parameter "Mode AI")
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 1) {
    return (
      <div className="mx-auto flex flex-1 w-full max-w-4xl flex-col items-center gap-6 py-4 animate-in fade-in duration-200">
        {/* Tombol Kembali ke Entry Point */}
        <div className="w-full flex items-center justify-start">
          <button
            type="button"
            onClick={() => setStep(0)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            ← Kembali ke Dashboard Video
          </button>
        </div>

        {/* Title Group */}
        <header className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Buat Video
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Template produksi video siap diisi untuk semua jenis konten.
          </p>
        </header>

        {/* Composer Card ("Mode AI") dengan hover effect angle-card & glass-panel */}
        <div className="glass-panel angle-card w-full flex flex-col gap-3 rounded-2xl p-6 transition-all duration-300">
          {/* Identitas Mode */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">
              <SparklesIcon className="h-4 w-4 text-brand" />
              <span>Mode AI</span>
            </div>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-normal">
              Produksi konten
            </span>
          </div>

          {/* Area Prompt (Bersih tanpa teks default) */}
          <div className="w-full pt-1 pb-2">
            <textarea
              id="video-composer-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handlePromptSubmit();
                }
              }}
              rows={6}
              placeholder="Tulis konsep, naskah, atau brief video yang ingin Anda produksi…"
              className="w-full resize-none border-0 bg-transparent text-[16px] leading-[26px] text-zinc-800 placeholder-zinc-400 outline-none focus:outline-none focus:ring-0 dark:text-zinc-100 dark:placeholder-zinc-600"
            />

            {/* Lampiran Gambar jika ada */}
            {attachment && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-1.5 pr-3 dark:border-white/10 dark:bg-zinc-800/80">
                <div className="relative h-10 w-10 overflow-hidden rounded-md bg-zinc-200 dark:bg-zinc-700">
                  <Image src={attachment.url} alt="Referensi visual" fill className="object-cover" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-medium text-foreground truncate max-w-[180px]">
                    {attachment.name}
                  </span>
                  <span className="text-[10px] text-zinc-400">Referensi visual</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="ml-1 text-zinc-400 hover:text-red-500"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Pemisah Pengaturan */}
          <div className="h-px w-full bg-zinc-200/80 dark:bg-white/10 my-1" />

          {/* Pengaturan dan Kirim */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Filter Produksi */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter 1: Scene */}
              <FilterDropdown
                icon={FilmSceneIcon}
                label={`${params.scenes} Scene`}
                value={params.scenes}
                options={SCENE_OPTIONS}
                onSelect={(scenes) => setParams((p) => ({ ...p, scenes }))}
              />

              {/* Filter 2: Rasio */}
              <FilterDropdown
                icon={AspectRatioIcon}
                label={`Rasio ${params.ratio}`}
                value={params.ratio}
                options={RATIO_OPTIONS}
                onSelect={(ratio) => setParams((p) => ({ ...p, ratio }))}
              />

              {/* Filter 3: Durasi */}
              <FilterDropdown
                icon={ClockIcon}
                label={`Durasi ${params.duration}`}
                value={params.duration}
                options={DURATION_OPTIONS}
                onSelect={(duration) => setParams((p) => ({ ...p, duration }))}
              />

              {/* Filter 4: Gaya Visual */}
              <FilterDropdown
                icon={SlidersIcon}
                label={params.style}
                value={params.style}
                options={STYLE_OPTIONS}
                onSelect={(style) => setParams((p) => ({ ...p, style }))}
              />

              {/* Filter 5: Persona */}
              <FilterDropdown
                icon={UserPersonaIcon}
                label={params.persona}
                value={params.persona}
                options={PERSONA_OPTIONS}
                onSelect={(persona) => setParams((p) => ({ ...p, persona }))}
              />
            </div>

            {/* Tombol Kirim */}
            <button
              type="button"
              onClick={handlePromptSubmit}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[#202020] px-5 text-sm font-medium text-white shadow-sm transition-all hover:bg-black active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Kirim
            </button>
          </div>

          {/* Bantuan Prompt */}
          <div className="flex items-center justify-between pt-3 text-[11px] text-zinc-400 dark:text-zinc-500">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 hover:text-brand dark:hover:text-brand-light transition-colors"
            >
              <UploadIcon className="h-3 w-3" />
              <span>Tambahkan gambar sebagai referensi visual.</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <span>Shift + Enter untuk baris baru</span>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2: WIREFRAME-21 / SKENARIO 1 & 2 (Asisten AI & Refinemen Konsep)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 2) {
    return (
      <div className="mx-auto flex flex-1 w-full max-w-4xl flex-col gap-6 py-4 pb-72 md:pb-80 animate-in fade-in duration-200 relative">
        {/* Navigasi Kembali & Header */}
        <div className="w-full">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            ← Kembali ke Brief
          </button>
        </div>

        <header className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Buat Video
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Template produksi video siap diisi untuk semua jenis konten.
          </p>
        </header>

        {/* Chat Thread dengan angle-card pada seluruh message box */}
        <div className="flex w-full flex-col gap-4 py-2">
          {/* User Message (Prompt Awal Pengguna) */}
          <div className="flex justify-end">
            <div className="glass-panel angle-card max-w-2xl rounded-2xl rounded-tr-sm p-4 text-[14px] leading-relaxed text-zinc-800 dark:text-zinc-100 transition-all duration-300">
              <p className="whitespace-pre-line">{prompt}</p>
            </div>
          </div>

          {/* Asisten Message 1 */}
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-light">
              <SparklesIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-1 max-w-2xl">
              <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Asisten konten</span>
                <span>09.41</span>
              </div>
              <div className="glass-panel angle-card rounded-2xl rounded-tl-sm p-4 text-[14px] leading-relaxed text-zinc-800 dark:text-zinc-200 transition-all duration-300">
                <p>
                  Kamu sudah punya konsep scene-by-scene, atau ingin aku bantu menyusunnya dari awal?
                </p>
                <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                  Pilih jawaban yang paling sesuai agar hasil videonya lebih sesuai dengan kebutuhanmu.
                </p>
              </div>
            </div>
          </div>

          {/* Balasan User setelah memilih opsi */}
          {conceptChoice && (
            <div className="flex justify-end animate-in fade-in duration-200">
              <div className="glass-panel angle-card rounded-2xl rounded-tr-sm border-brand/30 bg-brand/10 text-brand-strong p-3.5 text-[14px] font-medium dark:bg-brand/20 dark:text-brand-light transition-all duration-300">
                {conceptChoice === "scratch"
                  ? "Bantu susun dari awal AI membuat rekomendasi"
                  : "Aku sudah punya konsep, Lengkapi detail scene"}
              </div>
            </div>
          )}

          {/* Balasan Asisten Lanjutan */}
          {assistantReplied && (
            <div className="flex items-start gap-3 animate-in fade-in duration-200">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-light">
                <SparklesIcon className="h-4 w-4" />
              </div>
              <div className="flex flex-col gap-1 max-w-2xl">
                <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Asisten konten</span>
                  <span>09.41</span>
                </div>
                <div className="glass-panel angle-card rounded-2xl rounded-tl-sm p-4 text-[14px] leading-relaxed text-zinc-800 dark:text-zinc-200 transition-all duration-300">
                  <p>
                    Tenang aku bisa membantu membuat storyboard berdasarkan tujuan, konsep, dan gaya
                    video yang kamu inginkan. Mulai dari opening hingga closing, aku akan merekomendasikan detail
                    setiap scene.
                  </p>
                </div>

                {/* Skenario 1 (Bantu susun dari awal): Tombol langsung Buka Storyboard */}
                {conceptChoice === "scratch" && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleStartStoryboardLoading}
                      disabled={loadingStoryboard}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover active:scale-95 disabled:opacity-50"
                    >
                      <span>Buka Storyboard</span>
                      <span>→</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SKENARIO 2 (Figma 983:9146 & 983:9156): DAFTAR ACCORDION SCENE 1-6
             ══════════════════════════════════════════════════════════════════ */}
          {conceptChoice === "existing" && assistantReplied && !loadingStoryboard && (
            <div className="flex flex-col gap-3 pt-3 animate-in fade-in duration-300">
              {/* Accordion Item: Topic */}
              <div className="glass-panel angle-card rounded-2xl border border-zinc-200/90 dark:border-white/10 transition-all duration-300 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveAccordion((prev) => (prev === "topic" ? null : "topic"))}
                  className="flex w-full items-center justify-between p-4 text-left font-medium transition-colors hover:bg-zinc-50/60 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      <FilmSceneIcon className="h-3.5 w-3.5 text-brand" />
                      <span>Topic</span>
                    </span>
                    <span className="text-sm font-medium text-foreground">Topic Description</span>
                  </div>
                  <ChevronDownIcon
                    className={cn(
                      "h-4 w-4 text-zinc-400 transition-transform duration-200",
                      activeAccordion === "topic" && "rotate-180",
                    )}
                  />
                </button>

                {activeAccordion === "topic" && (
                  <div className="p-4 pt-0 border-t border-zinc-200/60 dark:border-white/10 space-y-3">
                    <textarea
                      value={topicDescription}
                      onChange={(e) => setTopicDescription(e.target.value)}
                      rows={3}
                      placeholder="Masukkan ringkasan topik atau tema utama konten video Anda…"
                      className="w-full rounded-xl border border-zinc-200 bg-transparent p-3 text-sm text-foreground placeholder-zinc-400 outline-none focus:border-brand dark:border-white/10"
                    />
                  </div>
                )}
              </div>

              {/* Accordion Items: Scene 1 s/d Scene {params.scenes} */}
              {Array.from({ length: params.scenes }, (_, idx) => {
                const sceneNum = idx + 1;
                const id = `scene-${sceneNum}`;
                const isOpen = activeAccordion === id;
                const userVal = sceneInputs[sceneNum] || { description: "", cameraMovement: "" };

                return (
                  <div
                    key={id}
                    className="glass-panel angle-card rounded-2xl border border-zinc-200/90 dark:border-white/10 transition-all duration-300 overflow-hidden"
                  >
                    {/* Header Accordion */}
                    <button
                      type="button"
                      onClick={() => setActiveAccordion((prev) => (prev === id ? null : id))}
                      className="flex w-full items-center justify-between p-4 text-left font-medium transition-colors hover:bg-zinc-50/60 dark:hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                          <FilmSceneIcon className="h-3.5 w-3.5 text-brand" />
                          <span>Scene {sceneNum}</span>
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {userVal.description
                            ? (userVal.description.length > 40 ? `${userVal.description.slice(0, 38)}…` : userVal.description)
                            : "Visual & Action Description"}
                        </span>
                      </div>
                      <ChevronDownIcon
                        className={cn(
                          "h-4 w-4 text-zinc-400 transition-transform duration-200",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>

                    {/* Isi Accordion yang Terbuka */}
                    {isOpen && (
                      <div className="p-4 pt-1 border-t border-zinc-200/60 dark:border-white/10 space-y-4 animate-in fade-in duration-200">
                        {/* Textarea Deskripsi Objek & Lingkungan */}
                        <textarea
                          value={userVal.description}
                          onChange={(e) => updateSceneInput(sceneNum, { description: e.target.value })}
                          rows={4}
                          placeholder="Deskripsikan objek utama, apa yang sedang dilakukan objek tersebut, dan suasana lingkungannya."
                          className="w-full rounded-xl border border-zinc-200 bg-transparent p-3 text-sm text-foreground placeholder-zinc-400 outline-none focus:border-brand dark:border-white/10"
                        />

                        {/* Pilihan Gerakan Kamera */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            Bagaimana pergerakan kamera yang kamu inginkan?
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {CAMERA_MOVEMENTS.map((cam) => {
                              const isSelected = userVal.cameraMovement === cam;
                              return (
                                <button
                                  key={cam}
                                  type="button"
                                  onClick={() =>
                                    updateSceneInput(sceneNum, {
                                      cameraMovement: isSelected ? "" : cam,
                                    })
                                  }
                                  className={cn(
                                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all select-none",
                                    isSelected
                                      ? "border-brand bg-brand text-white shadow-sm"
                                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-white/20",
                                  )}
                                >
                                  {cam}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LOADING STATE STORYBOARD (Skeleton + Progress Bar) */}
        {loadingStoryboard && (
          <div className="glass-panel angle-card w-full rounded-2xl p-6 transition-all duration-300 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between text-xs font-medium text-foreground">
              <span className="flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-brand animate-spin" />
                <span>
                  {storyboardProgress < 30 && "Menganalisis konsep & tema brief…"}
                  {storyboardProgress >= 30 && storyboardProgress < 70 && "Menyusun pembagian scene & durasi adegan…"}
                  {storyboardProgress >= 70 && storyboardProgress < 100 && "Menyiapkan visual prompt & voiceover…"}
                  {storyboardProgress >= 100 && "Tabel storyboard siap!"}
                </span>
              </span>
              <span className="font-mono text-brand font-bold">{storyboardProgress}%</span>
            </div>

            {/* Progress Bar Track */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full bg-brand transition-all duration-300 rounded-full"
                style={{ width: `${storyboardProgress}%` }}
              />
            </div>

            {/* Table Skeleton Rows */}
            <div className="space-y-2.5 pt-2">
              <div className="h-9 w-full rounded-lg bg-zinc-200/70 dark:bg-zinc-800/60 animate-pulse" />
              <div className="h-16 w-full rounded-lg bg-zinc-200/50 dark:bg-zinc-800/40 animate-pulse" />
              <div className="h-16 w-full rounded-lg bg-zinc-200/50 dark:bg-zinc-800/40 animate-pulse" />
            </div>
          </div>
        )}

        {/* Anchor Auto-Scroll Gaya Gemini (dengan scroll-margin-bottom aman dari dock) */}
        <div
          ref={chatEndRef}
          className="scroll-mb-72 md:scroll-mb-80 h-px w-full pointer-events-none"
          aria-hidden="true"
        />

        {/* ══════════════════════════════════════════════════════════════════
            STICKY / FIXED BOTTOM DOCK (Claude / Gemini Messagebox Style)
            Selalu berada di posisi bawah layar (bottom-20 / bottom-4),
            menampung kartu pertanyaan maupun bar aksi interaktif di posisi yang sama.
           ══════════════════════════════════════════════════════════════════ */}
        {!loadingStoryboard && (
          <div className="fixed bottom-20 md:bottom-4 left-0 right-0 md:left-16 lg:left-64 z-30 px-3 sm:px-4 pointer-events-none transition-all duration-300">
            <div className="mx-auto w-full max-w-4xl pointer-events-auto">
              {!assistantReplied ? (
                /* KARTU PERTANYAAN (DOCK BAWAH) */
                <div className="glass-panel angle-card w-full rounded-2xl p-6 shadow-2xl backdrop-blur-xl border border-zinc-200/90 dark:border-white/15 bg-white/95 dark:bg-zinc-900/95 transition-all duration-300">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Kamu sudah punya konsep scene-by-scene, atau ingin aku bantu menyusunnya dari awal?
                  </h3>
                  <div className="h-px w-full bg-zinc-200/80 dark:bg-white/10 mb-4" />

                  <div className="flex flex-col gap-3">
                    {/* Opsi 1 */}
                    <button
                      type="button"
                      onClick={() => handleSelectConcept("existing")}
                      className={cn(
                        "glass-panel angle-card flex w-full items-center gap-3.5 rounded-xl p-4 text-left transition-all duration-300",
                        conceptChoice === "existing"
                          ? "border-brand bg-brand/5 dark:bg-brand/10"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-white/10",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                          conceptChoice === "existing"
                            ? "border-brand bg-brand"
                            : "border-zinc-300 dark:border-zinc-600",
                        )}
                      >
                        {conceptChoice === "existing" && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        Aku sudah punya konsep, Lengkapi detail scene
                      </span>
                    </button>

                    {/* Opsi 2 */}
                    <button
                      type="button"
                      onClick={() => handleSelectConcept("scratch")}
                      className={cn(
                        "glass-panel angle-card flex w-full items-center gap-3.5 rounded-xl p-4 text-left transition-all duration-300",
                        conceptChoice === "scratch"
                          ? "border-brand bg-brand/5 dark:bg-brand/10"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-white/10",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                          conceptChoice === "scratch"
                            ? "border-brand bg-brand"
                            : "border-zinc-300 dark:border-zinc-600",
                        )}
                      >
                        {conceptChoice === "scratch" && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        Bantu susun dari awal AI membuat rekomendasi
                      </span>
                    </button>
                  </div>
                </div>
              ) : conceptChoice === "existing" ? (
                /* ACTION BAR SKENARIO 2 (DOCK BAWAH) */
                <div className="glass-panel angle-card w-full rounded-2xl p-4 px-6 flex flex-wrap items-center justify-between gap-4 shadow-2xl backdrop-blur-xl border border-zinc-200/90 dark:border-white/15 bg-white/95 dark:bg-zinc-900/95 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Simpan perubahan sebelum melanjutkan ke Canvas Editor.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setConceptChoice(null);
                        setAssistantReplied(false);
                      }}
                      className="text-xs text-brand hover:underline font-medium ml-1"
                    >
                      Ubah pilihan
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartStoryboardLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0F0F0F] px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition-all hover:bg-black active:scale-95 dark:bg-brand dark:hover:bg-brand-hover dark:text-white"
                  >
                    <SparklesIcon className="h-3.5 w-3.5" />
                    <span>Lanjut Generate Story Board</span>
                  </button>
                </div>
              ) : (
                /* ACTION BAR SKENARIO 1 (DOCK BAWAH) */
                <div className="glass-panel angle-card w-full rounded-2xl p-4 px-6 flex flex-wrap items-center justify-between gap-4 shadow-2xl backdrop-blur-xl border border-zinc-200/90 dark:border-white/15 bg-white/95 dark:bg-zinc-900/95 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      AI siap merekomendasikan pembagian adegan lengkap untukmu.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setConceptChoice(null);
                        setAssistantReplied(false);
                      }}
                      className="text-xs text-brand hover:underline font-medium ml-1"
                    >
                      Ubah pilihan
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartStoryboardLoading}
                    disabled={loadingStoryboard}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition-all hover:bg-brand-hover active:scale-95 disabled:opacity-50"
                  >
                    <SparklesIcon className="h-3.5 w-3.5" />
                    <span>Buka Storyboard</span>
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3: WIREFRAME-10 (Tabel Story Board)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="mx-auto flex flex-1 w-full max-w-6xl flex-col gap-3 py-1 h-[calc(100dvh-4.5rem)] max-h-[calc(100dvh-4.5rem)] overflow-hidden animate-in fade-in duration-200">
      {/* Navigasi Kembali */}
      <div className="w-full shrink-0">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors"
        >
          ← Kembali ke Asisten AI
        </button>
      </div>

      {/* Card Wrapper Storyboard (Fixed tanpa scroll luar) */}
      <div className="glass-panel angle-card flex flex-1 min-h-0 w-full flex-col rounded-2xl p-6 transition-all duration-300 overflow-hidden">
        {/* Header Story Board (Fixed di atas) */}
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-4 pb-5">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Story Board
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Template produksi video siap diisi untuk semua jenis konten.
            </p>
            {/* Chips Metadata */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Aspect Ratio {params.ratio}
              </span>
              <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {params.duration}
              </span>
              <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {scenes.length} Scene
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <DownloadIcon className="h-4 w-4" />
              <span>Unduh PDF</span>
            </button>
            <button
              type="button"
              onClick={handleOpenPreviewModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F0F0F] px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-black active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              <span>Generate Story Board</span>
            </button>
          </div>
        </div>

        {/* Banner Peringatan Asset Kosong (Figma 986:22136) */}
        <div className="w-full rounded-xl bg-[#FEEBEC] dark:bg-[#7F1D1D]/20 border border-[#FCA5A5]/60 dark:border-[#991B1B]/40 px-4 py-2.5 flex items-center gap-2.5 text-xs text-[#B91C1C] dark:text-[#F87171] font-medium shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Jika video/asset dalam keadaan kosong maka akan digenerate otomatis oleh AI</span>
        </div>

        {/* Tabel Story Board (Scrollable hanya di dalam konten tabel, header sticky) */}
        <div className="w-full flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/10">
          <table className="w-full border-collapse text-left text-xs">
            {/* Header Tabel Sticky */}
            <thead className="sticky top-0 z-10 bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-sm border-b border-zinc-200 dark:border-white/10">
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-400">
                <th className="py-3 px-4 w-16 text-center">SCENE</th>
                <th className="py-3 px-4 w-32">DURASI</th>
                <th className="py-3 px-4 w-[360px]">VISUAL</th>
                <th className="py-3 px-4 w-[240px]">TEXT PADA VISUAL</th>
                <th className="py-3 px-4">VOICEOVER (VO)</th>
              </tr>
            </thead>

            {/* Isi Tabel */}
            <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
              {scenes.map((scene) => (
                <tr
                  key={scene.sceneNumber}
                  className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]"
                >
                  {/* Kolom SCENE */}
                  <td className="py-4 px-4 text-center font-bold text-sm text-foreground align-top">
                    {scene.sceneNumber}
                  </td>

                  {/* Kolom DURASI */}
                  <td className="py-4 px-4 font-mono text-zinc-600 dark:text-zinc-400 align-top whitespace-nowrap">
                    {scene.duration}
                  </td>

                  {/* Kolom VISUAL (Thumbnail Interaktif + Deskripsi) */}
                  <td className="py-4 px-4 align-top">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSceneForAssetModal(scene.sceneNumber);
                          setSelectedAssetInModal(
                            sceneAssets[scene.sceneNumber]
                              ? {
                                  id: `current-${scene.sceneNumber}`,
                                  url: sceneAssets[scene.sceneNumber].url,
                                  title: sceneAssets[scene.sceneNumber].title,
                                  type: sceneAssets[scene.sceneNumber].type,
                                  duration: sceneAssets[scene.sceneNumber].duration,
                                }
                              : null
                          );
                        }}
                        className={cn(
                          "group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition-all duration-200 flex items-center justify-center cursor-pointer",
                          scene.visual.thumbnailUrl
                            ? "border-zinc-200 dark:border-white/10 hover:border-[#00B1B0] hover:ring-2 hover:ring-[#00B1B0]/30"
                            : "border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50 hover:border-[#00B1B0] hover:border-solid hover:bg-[#00B1B0]/5 dark:hover:bg-[#00B1B0]/10"
                        )}
                        title="Pilih atau ganti aset video"
                      >
                        {scene.visual.thumbnailUrl ? (
                          <>
                            <Image
                              src={scene.visual.thumbnailUrl}
                              alt={`Visual Scene ${scene.sceneNumber}`}
                              fill
                              className="object-cover"
                            />
                            {/* Hover overlay untuk mengganti aset */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <PlusIcon className="h-5 w-5" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-zinc-400 group-hover:text-[#00B1B0] transition-colors">
                            <PlusIcon className="h-5 w-5" />
                          </div>
                        )}
                      </button>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-xs">
                        {scene.visual.description}
                      </p>
                    </div>
                  </td>

                  {/* Kolom TEXT PADA VISUAL */}
                  <td className="py-4 px-4 font-medium text-foreground align-top leading-relaxed">
                    {scene.visualText}
                  </td>

                  {/* Kolom VOICEOVER (VO) */}
                  <td className="py-4 px-4 text-zinc-600 dark:text-zinc-300 italic align-top leading-relaxed">
                    &quot;{scene.voiceover}&quot;
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL PILIH VIDEO ASET (Figma 986:21951)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeSceneForAssetModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel angle-card relative w-full max-w-4xl rounded-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col justify-between animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-white/10">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Pilih Video Aset
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Silahkan pilih aset media di bawah atau unggah berkas baru untuk Scene {activeSceneForAssetModal}
                </p>
              </div>

              {/* Action Buttons Header */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSceneForAssetModal(null);
                    setSelectedAssetInModal(null);
                  }}
                  className="rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplyAssetToScene}
                  disabled={!selectedAssetInModal}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#00B1B0] hover:bg-[#009b9a] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  <span>Tambah ke Preview</span>
                </button>
              </div>
            </div>

            {/* Tabs (Video Asset / Image Asset) */}
            <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-white/10 pt-3">
              <button
                type="button"
                onClick={() => setAssetModalTab("video")}
                className={cn(
                  "pb-2.5 text-sm font-semibold transition-colors relative",
                  assetModalTab === "video"
                    ? "text-[#00B1B0]"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                Video Asset
                {assetModalTab === "video" && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#00B1B0] rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setAssetModalTab("image")}
                className={cn(
                  "pb-2.5 text-sm font-semibold transition-colors relative",
                  assetModalTab === "image"
                    ? "text-[#00B1B0]"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                Image Asset
                {assetModalTab === "image" && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#00B1B0] rounded-full" />
                )}
              </button>
            </div>

            {/* Grid Galeri & Upload (Scrollable) */}
            <div className="flex-1 min-h-0 overflow-y-auto py-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {/* Upload Card */}
                <div
                  onClick={() => modalFileInputRef.current?.click()}
                  className="group relative flex aspect-[9/14] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 p-4 text-center transition-all hover:border-[#00B1B0] hover:bg-[#00B1B0]/5 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-[#00B1B0] dark:hover:bg-[#00B1B0]/10"
                >
                  <input
                    type="file"
                    ref={modalFileInputRef}
                    accept="video/*,image/*"
                    onChange={handleModalFileUpload}
                    className="hidden"
                  />
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-[#00B1B0] group-hover:text-white dark:bg-zinc-800 dark:text-zinc-400">
                    <UploadIcon className="h-5 w-5" />
                  </div>
                  <h4 className="mt-3 text-xs font-semibold text-foreground">Upload media</h4>
                  <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                    Pilih berkas media dari perangkat
                  </p>
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-1 rounded-md bg-[#00B1B0] px-2.5 py-1 text-[11px] font-medium text-white shadow-xs"
                  >
                    <PlusIcon className="h-3 w-3" />
                    <span>Select file</span>
                  </button>
                </div>

                {/* Asset Gallery Cards */}
                {(assetModalTab === "video" ? SAMPLE_GALLERY_VIDEOS : SAMPLE_GALLERY_IMAGES).map((asset) => {
                  const isSelected = selectedAssetInModal?.url === asset.url;
                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAssetInModal(asset)}
                      className={cn(
                        "group relative aspect-[9/14] overflow-hidden rounded-xl border transition-all cursor-pointer shadow-xs",
                        isSelected
                          ? "border-[#00B1B0] ring-2 ring-[#00B1B0]"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20"
                      )}
                    >
                      <Image
                        src={asset.url}
                        alt={asset.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Top Badges (Duration / Type) */}
                      {asset.duration && (
                        <div className="absolute top-2 left-2 z-10 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white backdrop-blur-xs">
                          {asset.duration}
                        </div>
                      )}

                      {/* Radio / Selection Indicator (Top Right) */}
                      <div
                        className={cn(
                          "absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                          isSelected
                            ? "border-[#00B1B0] bg-[#00B1B0] text-white shadow-xs"
                            : "border-white/70 bg-black/40 text-transparent group-hover:border-white"
                        )}
                      >
                        {isSelected && <CheckIcon className="h-3 w-3 stroke-[3]" />}
                      </div>

                      {/* Play Button Overlay for Videos */}
                      {asset.type === "video" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-xs transition-transform group-hover:scale-110">
                            <PlayIcon className="h-4 w-4 ml-0.5" />
                          </div>
                        </div>
                      )}

                      {/* Bottom Info Gradient */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2.5 pt-6 text-white">
                        <p className="text-[11px] font-medium leading-snug line-clamp-2">
                          {asset.title}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 4: MODAL DIALOG PREVIEW STORYBOARD (Figma 988:26508)
         ══════════════════════════════════════════════════════════════════════ */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel angle-card relative w-full max-w-5xl rounded-3xl p-6 shadow-2xl max-h-[90vh] flex flex-col justify-between animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Preview Storyboard
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Silahkan cek kembali preview storyboard di bawah sebelum generate scene
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    Total Durasi {params.duration}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {scenes.length} Scene
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Kembali ke brief
                </button>
                <button
                  type="button"
                  onClick={handleProceedToEditor}
                  disabled={previewLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F0F0F] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-black active:scale-95 dark:bg-brand dark:hover:bg-brand-hover dark:text-white transition-all disabled:opacity-50"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  <span>Lanjut ke Editor</span>
                </button>
              </div>
            </div>

            {/* PROGRESS LOADING BAR MODAL PREVIEW */}
            {previewLoading && (
              <div className="my-2 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <SparklesIcon className="h-3.5 w-3.5 text-brand animate-spin" />
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

            {/* Kartu Visual Preview Scene (Grid Rasio 9:16) — Selektif Generate */}
            <div className="w-full overflow-x-auto py-4">
              <div className="grid grid-flow-col auto-cols-[minmax(190px,1fr)] gap-3.5 pb-2">
                {scenes.map((item, idx) => {
                  const hasUserAsset = Boolean(sceneAssets[item.sceneNumber]);
                  const fallbackThumbs = [
                    "/seed/unsplash/abstract-01.jpg",
                    "/seed/unsplash/abstract-02.jpg",
                    "/seed/unsplash/abstract-03.jpg",
                    "/seed/unsplash/abstract-04.jpg",
                    "/seed/unsplash/abstract-05.jpg",
                    "/seed/unsplash/abstract-06.jpg",
                  ];
                  const imgSrc =
                    item.visual.thumbnailUrl ||
                    fallbackThumbs[idx % fallbackThumbs.length];

                  // Jika scene kosong dan sedang dalam proses generate AI (Figma 988:26508)
                  if (!hasUserAsset && previewLoading) {
                    return (
                      <div
                        key={`loading-${item.sceneNumber}`}
                        className="group relative aspect-[9/16] w-full min-w-[190px] rounded-xl border border-zinc-800 bg-[#18181B] p-4 flex flex-col justify-between text-white shadow-lg animate-pulse"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#00B1B0] border-t-transparent" />
                          <span className="text-xs font-medium text-zinc-300">
                            Proses generate ...
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                          <span>Scene {item.sceneNumber}</span>
                          <span>{item.duration}</span>
                        </div>
                      </div>
                    );
                  }

                  // Kartu Scene yang siap (baik dari aset pilihan user atau hasil generate AI)
                  return (
                    <div
                      key={item.sceneNumber}
                      className="group relative aspect-[9/16] w-full min-w-[190px] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-900 shadow-md transition-all hover:scale-[1.02] dark:border-white/10 animate-in fade-in zoom-in-95 duration-500"
                    >
                      {/* Background Image / Video Thumbnail */}
                      <Image
                        src={imgSrc}
                        alt={`Scene ${item.sceneNumber}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Durasi Badge (Kiri Atas) */}
                      <div className="absolute top-2.5 left-2.5 z-10 rounded bg-black/75 px-2 py-0.5 font-mono text-[11px] font-medium text-white backdrop-blur-md">
                        {item.duration}
                      </div>

                      {/* Badge Custom Asset (Kanan Atas jika dipilih user) */}
                      {hasUserAsset && (
                        <div className="absolute top-2.5 right-2.5 z-10 rounded bg-[#00B1B0] px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                          User Asset
                        </div>
                      )}

                      {/* Overlay Gelap Bawah dengan Judul Visual */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 pt-6 text-white">
                        <p className="text-xs font-semibold leading-snug line-clamp-2">
                          {item.visualText}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

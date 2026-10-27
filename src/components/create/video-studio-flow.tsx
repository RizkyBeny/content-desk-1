"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@heroui/react";
import { put } from "@/lib/client";
import { cn } from "@/lib/utils";
import type { GenerationDTO } from "@/types";
import { INSIGHT_VIDEO_SECTION } from "../../../config/generation";
import { IMAGE_TEMPLATES } from "../../../config/templates";
import {
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  CopyIcon,
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

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className ?? "w-4 h-4"}>
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
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

function MicIcon({ className }: { className?: string }) {
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
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
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
  angle: "Investigatif" | "Edukasi" | "Entertainment" | "Storytelling" | "Formal" | "Kasual";
  voiceover: "Dalipin" | "Siti" | "Budi" | "Tanpa Voiceover";
  persona?: string;
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
  referenceUrl?: string;
};

const CAMERA_MOVEMENTS = [
  "Static",
  "Zoom In",
  "Zoom Out",
  "Pan Left / Right",
  "Tilt Up / Down",
  "Tracking / Follow",
] as const;

export type GalleryAsset = {
  id: string;
  url: string;
  videoUrl?: string;
  title: string;
  duration?: string;
  type: "video" | "image";
};

export const SAMPLE_GALLERY_VIDEOS: GalleryAsset[] = [
  {
    id: "v1",
    url: "/seed/unsplash/abstract-01.jpg",
    videoUrl: "/seed/videos/sample-video-1.mp4",
    title: "B-roll kabut asap tebal menyelimuti jalanan kota",
    duration: "00:30",
    type: "video",
  },
  {
    id: "v2",
    url: "/seed/unsplash/abstract-02.jpg",
    videoUrl: "/seed/videos/sample-video-2.mp4",
    title: "Peta sebaran titik api satelit pantauan udara",
    duration: "00:20",
    type: "video",
  },
  {
    id: "v3",
    url: "/seed/unsplash/abstract-03.jpg",
    videoUrl: "/seed/videos/sample-video-1.mp4",
    title: "Penumpukan antrean warga akibat kabut tebal",
    duration: "00:15",
    type: "video",
  },
  {
    id: "v4",
    url: "/seed/unsplash/abstract-04.jpg",
    videoUrl: "/seed/videos/sample-video-2.mp4",
    title: "Bara api lahan gambut membara dari dalam tanah",
    duration: "00:25",
    type: "video",
  },
  {
    id: "v5",
    url: "/seed/unsplash/abstract-05.jpg",
    videoUrl: "/seed/videos/sample-video-1.mp4",
    title: "Petugas gabungan memadamkan titik kobaran api",
    duration: "00:30",
    type: "video",
  },
  {
    id: "v6",
    url: "/seed/unsplash/abstract-06.jpg",
    videoUrl: "/seed/videos/sample-video-2.mp4",
    title: "Warga berkendara memakai masker medis N95",
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
    title: "Infografis bahaya ISPA dan indeks polusi udara",
    type: "image",
  },
  {
    id: "i3",
    url: "/seed/unsplash/abstract-09.jpg",
    title: "Peta deteksi titik panas kebakaran hutan",
    type: "image",
  },
  {
    id: "i4",
    url: "/seed/unsplash/abstract-10.jpg",
    title: "Poster imbauan penanganan polusi udara",
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
const ANGLE_OPTIONS: VideoProductionParams["angle"][] = [
  "Investigatif",
  "Edukasi",
  "Entertainment",
  "Storytelling",
  "Formal",
  "Kasual",
];
const VOICEOVER_OPTIONS: VideoProductionParams["voiceover"][] = [
  "Dalipin",
  "Siti",
  "Budi",
  "Tanpa Voiceover",
];

const STORAGE_SNAPSHOT_KEY = "aistudio:video:snapshot";
const DEFAULT_VISUAL_LABELS = ["Breaking", "Kronologi", "Fakta", "Kutipan", "CTA"] as const;
const DEFAULT_ROW_CATEGORIES = [
  "Breaking news opener / tease",
  "B-roll peristiwa/lokasi",
  "Data & fakta di layar",
  "Kutipan narasumber",
  "Reporter stand-up / closing",
] as const;

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
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");

  // Inisialisasi murni pada SSR untuk mencegah hydration mismatch
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [prompt, setPrompt] = useState("");
  const [params, setParams] = useState<VideoProductionParams>({
    scenes: 5,
    ratio: "9:16",
    duration: "60 dtk",
    style: "Cinematic",
    angle: "Investigatif",
    voiceover: "Dalipin",
  });

  const [attachment, setAttachment] = useState<{ name: string; url: string } | null>(null);
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationDTO | null>(null);

  // Loading state transisi ke Storyboard
  const [loadingStoryboard, setLoadingStoryboard] = useState(false);
  const [storyboardProgress, setStoryboardProgress] = useState(0);

  // Scene customization state
  const [sceneInputs, setSceneInputs] = useState<Record<number, Scenario2SceneInput>>({});
  const [sceneVisualTexts, setSceneVisualTexts] = useState<Record<number, string>>({});
  const [sceneVoiceovers, setSceneVoiceovers] = useState<Record<number, string>>({});

  // Aset pilihan pengguna per nomor scene
  const [sceneAssets, setSceneAssets] = useState<
    Record<
      number,
      { url: string; title: string; type: "video" | "image"; duration?: string; videoUrl?: string }
    >
  >({});

  // State untuk modal "Pilih Video Aset"
  const [activeSceneForAssetModal, setActiveSceneForAssetModal] = useState<number | null>(null);
  const [selectedAssetInModal, setSelectedAssetInModal] = useState<GalleryAsset | null>(null);
  const [assetModalTab, setAssetModalTab] = useState<"video" | "image">("video");
  const [playingAssetId, setPlayingAssetId] = useState<string | null>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Step 4 State (Modal Preview Storyboard - Figma 368:23819)
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [playingSceneNumber, setPlayingSceneNumber] = useState<number | null>(null);

  // Caption Rekomendasi State
  const [customCaption, setCustomCaption] = useState<{
    headline?: string;
    body?: string;
    hashtags?: string;
  }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sceneFileInputRef = useRef<HTMLInputElement>(null);
  const [activeSceneForFileInput, setActiveSceneForFileInput] = useState<number | null>(null);

  // Referensi gambar per-scene (Figma 314:21543 "Add Referensi" & preview kecil)
  const [sceneReferences, setSceneReferences] = useState<Record<number, string[]>>({});
  const [activeSceneForTableRef, setActiveSceneForTableRef] = useState<number | null>(null);
  const tableRefInputRef = useRef<HTMLInputElement>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Hydrate state dari sessionStorage di client-side saja (mencegah React hydration mismatch)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(STORAGE_SNAPSHOT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.prompt) setPrompt(parsed.prompt);
          if (parsed.params) setParams((prev) => ({ ...prev, ...parsed.params }));
          if (parsed.sceneInputs) setSceneInputs(parsed.sceneInputs);
          if (parsed.sceneVisualTexts) setSceneVisualTexts(parsed.sceneVisualTexts);
          if (parsed.sceneVoiceovers) setSceneVoiceovers(parsed.sceneVoiceovers);
          if (parsed.sceneAssets) setSceneAssets(parsed.sceneAssets);
          if (parsed.sceneReferences) setSceneReferences(parsed.sceneReferences);
          if (parsed.customCaption) setCustomCaption(parsed.customCaption);

          if (stepParam === "storyboard") {
            setStep(3);
          } else if (typeof parsed.step === "number") {
            setStep(parsed.step);
          }
        } else if (stepParam === "storyboard") {
          setStep(3);
        }
      } catch {
        /* Fallback default */
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [stepParam]);

  // Simpan snapshot ke sessionStorage saat state berubah
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(
        STORAGE_SNAPSHOT_KEY,
        JSON.stringify({
          step,
          prompt,
          params,
          sceneInputs,
          sceneVisualTexts,
          sceneVoiceovers,
          sceneAssets,
          sceneReferences,
          customCaption,
        }),
      );
    } catch {}
  }, [
    step,
    prompt,
    params,
    sceneInputs,
    sceneVisualTexts,
    sceneVoiceovers,
    sceneAssets,
    sceneReferences,
    customCaption,
  ]);

  // Susun data tabel adegan (Figma 314:21543)
  const scenes: StoryboardScene[] = useMemo(() => {
    const list: StoryboardScene[] = [];
    const durSec = parseInt(params.duration, 10) || 60;
    const count = params.scenes || 5;
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
      const camera = userScene?.cameraMovement || "Pan Left / Right";
      const chosenAsset = sceneAssets[i];

      const fallbackDesc = prompt.trim()
        ? `Visual Scene ${i}: Penggambaran adegan "${prompt.slice(0, 45)}…" dengan pergerakan kamera ${camera}.`
        : `Visual Scene ${i}: Objek utama dan suasana adegan pendukung dengan pergerakan kamera ${camera}.`;

      const visualDesc = customDesc
        ? `${customDesc}${camera ? ` (Kamera: ${camera})` : ""}`
        : fallbackDesc;

      const fallbackLabel = DEFAULT_VISUAL_LABELS[(i - 1) % DEFAULT_VISUAL_LABELS.length];

      const defaultVO =
        i === 1
          ? `"Kabar terbaru soal ${prompt ? prompt.slice(0, 40) : "Kasus Korupsi Indonesia"}."`
          : i === 2
          ? `"Ini penjelasan lengkap kronologinya dalam 60 detik."`
          : i === 3
          ? `"Begini faktanya berdasarkan data yang terhimpun..."`
          : i === 4
          ? `"Kata narasumber, begini penjelasannya secara mendalam."`
          : `"Ikuti kami untuk kabar dan investigasi terkini."`;

      list.push({
        sceneNumber: i,
        duration: `${formatTime(start)} - ${formatTime(end)}`,
        visual: {
          description: visualDesc,
          thumbnailUrl: chosenAsset?.url ?? null,
        },
        visualText: sceneVisualTexts[i] ?? (chosenAsset?.title ? chosenAsset.title : fallbackLabel),
        voiceover: sceneVoiceovers[i] ?? defaultVO,
      });
    }

    return list;
  }, [params.scenes, params.duration, prompt, sceneInputs, sceneAssets, sceneVisualTexts, sceneVoiceovers]);

  // Caption Rekomendasi (Figma 314:21543)
  const caption = useMemo(() => {
    const clean = prompt.trim();
    const shortTopic = clean.length > 50 ? `${clean.slice(0, 48)}…` : clean;
    return {
      headline:
        customCaption.headline ??
        (clean
          ? `${shortTopic}`
          : "Jelaskan Kasus Korupsi Indonesia Dalam 60 Detik."),
      body:
        customCaption.body ??
        (clean
          ? `Kabar terkini soal ${shortTopic} yang perlu kamu tahu. Redaksi kumparan merangkum fakta dan kronologinya. Simak selengkapnya.`
          : "Kabar terkini soal Kasus Korupsi Indonesia yang perlu kamu tahu. Redaksi kumparan merangkum fakta dan kronologinya. Simak selengkapnya."),
      hashtags:
        customCaption.hashtags ??
        "#beritaterkini #kumparan #kabar #kasus #korupsi #indonesia",
    };
  }, [prompt, customCaption]);


  function handleModalFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video");
    const uploadedAsset: GalleryAsset = {
      id: `uploaded-${Date.now()}`,
      url,
      videoUrl: isVideo ? url : undefined,
      title: file.name.replace(/\.[^/.]+$/, ""),
      duration: isVideo ? "00:30" : undefined,
      type: isVideo ? "video" : "image",
    };
    setSelectedAssetInModal(uploadedAsset);
    toast.success(`Media "${file.name}" siap diterapkan!`);
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
    toast.success(`Aset diterapkan pada Scene ${activeSceneForAssetModal}!`);
    setActiveSceneForAssetModal(null);
    setSelectedAssetInModal(null);
    setPlayingAssetId(null);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAttachment({ name: file.name, url });
    toast.success(`Gambar "${file.name}" ditambahkan sebagai referensi.`);
  }

  function handleSceneReferenceUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeSceneForFileInput) return;
    const url = URL.createObjectURL(file);
    const targetScene = activeSceneForFileInput;
    setSceneInputs((prev) => ({
      ...prev,
      [targetScene]: {
        description: prev[targetScene]?.description ?? "",
        cameraMovement: prev[targetScene]?.cameraMovement ?? "Pan Left / Right",
        referenceUrl: url,
      },
    }));
    setSceneReferences((prev) => ({
      ...prev,
      [targetScene]: Array.from(new Set([...(prev[targetScene] || []), url])),
    }));
    toast.success(`Referensi visual ditambahkan pada Scene ${targetScene}!`);
    setActiveSceneForFileInput(null);
  }

  function handleTableReferenceUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeSceneForTableRef) return;
    const targetScene = activeSceneForTableRef;
    const newUrls = Array.from(files).map((f) => URL.createObjectURL(f));
    setSceneReferences((prev) => ({
      ...prev,
      [targetScene]: [...(prev[targetScene] || []), ...newUrls],
    }));
    toast.success(`${newUrls.length} gambar referensi berhasil ditambahkan ke Scene ${targetScene}!`);
    setActiveSceneForTableRef(null);
    if (tableRefInputRef.current) {
      tableRefInputRef.current.value = "";
    }
  }

  function handleRemoveReference(sceneNum: number, indexToRemove: number) {
    setSceneReferences((prev) => {
      const current = prev[sceneNum] || [];
      return {
        ...prev,
        [sceneNum]: current.filter((_, idx) => idx !== indexToRemove),
      };
    });
    toast.info(`Referensi Scene ${sceneNum} dihapus.`);
  }

  function handlePromptSubmit() {
    if (!prompt.trim()) {
      toast.danger("Mohon masukkan konsep atau brief video terlebih dahulu.");
      return;
    }
    setStep(2);
  }

  function handleStartStoryboardLoading() {
    setLoadingStoryboard(true);
    setStoryboardProgress(15);

    const t1 = setTimeout(() => setStoryboardProgress(45), 350);
    const t2 = setTimeout(() => setStoryboardProgress(80), 800);
    const t3 = setTimeout(() => setStoryboardProgress(100), 1200);
    const t4 = setTimeout(() => {
      setLoadingStoryboard(false);
      setStep(3);
    }, 1500);

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

  function handleOpenPreviewModal() {
    setPreviewModalOpen(true);
    setPreviewLoading(true);
    setPreviewProgress(25);

    const t1 = setTimeout(() => setPreviewProgress(60), 300);
    const t2 = setTimeout(() => setPreviewProgress(85), 650);
    const t3 = setTimeout(() => {
      // Auto-fill visual aset untuk setiap scene yang belum terisi
      setSceneAssets((prev) => {
        const updated = { ...prev };
        scenes.forEach((s) => {
          if (!updated[s.sceneNumber]?.url) {
            const fallbackAsset =
              SAMPLE_GALLERY_VIDEOS[(s.sceneNumber - 1) % SAMPLE_GALLERY_VIDEOS.length];
            updated[s.sceneNumber] = {
              url: fallbackAsset.url,
              title: fallbackAsset.title,
              type: fallbackAsset.type,
              duration: fallbackAsset.duration,
              videoUrl: fallbackAsset.videoUrl,
            };
          }
        });
        return updated;
      });
      setPlayingSceneNumber(null);
      setPreviewProgress(100);
    }, 950);

    const t4 = setTimeout(() => {
      setPreviewLoading(false);
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }

  async function handleProceedToEditor() {
    setPreviewModalOpen(false);
    toast.success("Mengarahkan ke Video Canvas Editor…");
    try {
      await put("/api/creations/canvas-1", {
        type: "video",
        ratio: params.ratio,
        items: scenes.map((s) => ({
          id: s.sceneNumber,
          title: `Scene ${s.sceneNumber}`,
          description: sceneVisualTexts[s.sceneNumber] || s.visual.description || s.voiceover || "",
          imageUrl:
            sceneAssets[s.sceneNumber]?.url ||
            s.visual.thumbnailUrl ||
            SAMPLE_GALLERY_VIDEOS[(s.sceneNumber - 1) % SAMPLE_GALLERY_VIDEOS.length].url,
          videoUrl:
            sceneAssets[s.sceneNumber]?.type === "video" ? sceneAssets[s.sceneNumber]?.url : undefined,
        })),
      });
    } catch (err) {
      console.warn("Gagal sinkronisasi draft video ke canvas-1:", err);
    }
    router.push("/studio/canvas-1?from=video");
  }

  function handleCopyCaption() {
    const fullText = `${caption.headline}\n\n${caption.body}\n\n${caption.hashtags}`;
    navigator.clipboard.writeText(fullText);
    toast.success("Caption & hashtags berhasil disalin ke clipboard!");
  }

  function handleRegenerateCaption() {
    toast.info("Memperbarui rekomendasi caption…");
    const clean = prompt.trim();
    setCustomCaption({
      headline: clean ? `Update: ${clean.slice(0, 45)}` : "Update Fakta Penting Kasus Terkini",
      body: `Berikut rangkuman update terbaru seputar ${clean || "isu terkini"}. Saksikan video lengkapnya untuk penjelasan investigatif yang mendalam.`,
      hashtags: "#beritaterkini #investigasi #kumparan #faktaterbaru #trending",
    });
    toast.success("Caption rekomendasi berhasil diperbarui!");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 0: ENTRY POINT (FIGMA 338:38232 - Hero + Insights + Output)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 0) {
    const completedVideos = items.filter((item) => item.status === "completed" && (item.thumbnailUrl || item.fileUrl));

    return (
      <div className="space-y-8 py-2 pb-12 animate-in fade-in duration-200">
        <header className="flex flex-col items-center gap-4 text-center pt-6 pb-2">
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
              className="relative inline-flex items-center justify-center gap-2 rounded-full bg-[#01AFAE] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#01AFAE]/25 transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-[#009b9a]"
            >
              <SparklesIcon className="h-4 w-4" />
              <span>Buat Video Sekarang</span>
            </button>
          </div>
        </header>

        <section className="space-y-6">
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
  // STEP 1: COMPOSER (FIGMA 270:21161 - Input Brief & Parameter "Mode AI")
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 1) {
    return (
      <div className="mx-auto flex flex-1 w-full max-w-4xl flex-col items-center gap-6 py-4 animate-in fade-in duration-200">
        <div className="w-full flex items-center justify-start">
          <button
            type="button"
            onClick={() => setStep(0)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            ← Kembali ke Dashboard Video
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

        <div className="glass-panel angle-card w-full flex flex-col gap-3 rounded-2xl p-6 transition-all duration-300 border border-zinc-200/90 dark:border-white/10 shadow-xl">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">
              <SparklesIcon className="h-4 w-4 text-[#01AFAE]" />
              <span>Mode AI</span>
            </div>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-normal">
              Produksi konten
            </span>
          </div>

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

          <div className="h-px w-full bg-zinc-200/80 dark:bg-white/10 my-1" />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <FilterDropdown
                icon={FilmSceneIcon}
                label={`${params.scenes} Scene`}
                value={params.scenes}
                options={SCENE_OPTIONS}
                onSelect={(scenes) => setParams((p) => ({ ...p, scenes }))}
              />

              <FilterDropdown
                icon={AspectRatioIcon}
                label={`Rasio ${params.ratio}`}
                value={params.ratio}
                options={RATIO_OPTIONS}
                onSelect={(ratio) => setParams((p) => ({ ...p, ratio }))}
              />

              <FilterDropdown
                icon={ClockIcon}
                label={`${params.duration}`}
                value={params.duration}
                options={DURATION_OPTIONS}
                onSelect={(duration) => setParams((p) => ({ ...p, duration }))}
              />

              <FilterDropdown
                icon={SlidersIcon}
                label={params.style}
                value={params.style}
                options={STYLE_OPTIONS}
                onSelect={(style) => setParams((p) => ({ ...p, style }))}
              />

              <FilterDropdown
                icon={UserPersonaIcon}
                label={params.angle}
                value={params.angle}
                options={ANGLE_OPTIONS}
                onSelect={(angle) => setParams((p) => ({ ...p, angle }))}
              />

              <FilterDropdown
                icon={MicIcon}
                label={`VO: ${params.voiceover}`}
                value={params.voiceover}
                options={VOICEOVER_OPTIONS}
                onSelect={(voiceover) => setParams((p) => ({ ...p, voiceover }))}
              />
            </div>

            <button
              type="button"
              onClick={handlePromptSubmit}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[#01AFAE] hover:bg-[#009b9a] px-6 text-sm font-bold text-white shadow-md shadow-[#01AFAE]/20 transition-all active:scale-95"
            >
              Kirim
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 text-[11px] text-zinc-400 dark:text-zinc-500">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 hover:text-[#01AFAE] transition-colors"
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
  // STEP 2: CONTENT BRIEF (FIGMA 360:40302 - Scene Breakdown Accordions)
  // Sesuai persis Figma 360:40302: Bubble Prompt + Daftar Scene 1 s/d N langsung
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 2) {
    return (
      <div className="mx-auto flex flex-1 w-full max-w-4xl flex-col gap-6 py-4 pb-36 animate-in fade-in duration-200 relative">
        {/* Navigasi Kembali */}
        <div className="w-full">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            ← Kembali ke Brief
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

        {/* User Prompt Bubble on Top Right with Parameter Chips (Figma 360:40302) */}
        <div className="flex flex-col items-end gap-2 w-full">
          <div className="glass-panel angle-card max-w-3xl rounded-2xl rounded-tr-sm p-4 text-[14px] leading-relaxed text-zinc-800 dark:text-zinc-100 transition-all duration-300 border border-zinc-200/90 dark:border-white/10 shadow-sm">
            <p className="whitespace-pre-line">{prompt}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
              {params.scenes} Scene
            </span>
            <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
              Rasio {params.ratio}
            </span>
            <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
              {params.duration}
            </span>
            <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
              {params.style}
            </span>
            <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
              {params.angle}
            </span>
            <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
              VO: {params.voiceover}
            </span>
          </div>
        </div>

        {/* Hidden File Input untuk Add Referensi Per-Scene */}
        <input
          type="file"
          ref={sceneFileInputRef}
          accept="image/*"
          onChange={handleSceneReferenceUpload}
          className="hidden"
        />

        {/* Daftar Scene Breakdown Cards 1 s/d N (Figma 360:40302) */}
        <div className="flex flex-col gap-4 w-full">
          {scenes.map((scene) => {
            const sceneNum = scene.sceneNumber;
            const currentSceneInput = sceneInputs[sceneNum] || {
              description: "",
              cameraMovement: "Pan Left / Right",
            };

            return (
              <div
                key={`brief-scene-card-${sceneNum}`}
                className="glass-panel angle-card rounded-2xl p-5 border border-zinc-200/90 dark:border-white/10 shadow-sm space-y-4"
              >
                {/* Header Scene */}
                <div className="flex items-center justify-between pb-1 border-b border-zinc-200/80 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#01AFAE]/10 px-2.5 py-1 text-xs font-bold text-[#01AFAE] dark:bg-[#01AFAE]/20">
                      <FilmSceneIcon className="h-3.5 w-3.5" />
                      <span>Scene {sceneNum}</span>
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      Visual & Action Description
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">
                    {scene.duration}
                  </span>
                </div>

                {/* Textarea: Deskripsikan objek utama... (Figma 360:40302) */}
                <div className="space-y-1">
                  <textarea
                    value={currentSceneInput.description}
                    onChange={(e) =>
                      setSceneInputs((prev) => ({
                        ...prev,
                        [sceneNum]: {
                          description: e.target.value,
                          cameraMovement: prev[sceneNum]?.cameraMovement || "Pan Left / Right",
                          referenceUrl: prev[sceneNum]?.referenceUrl,
                        },
                      }))
                    }
                    rows={3}
                    placeholder="Deskripsikan objek utama, apa yang sedang dilakukan objek tersebut, dan suasana lingkungannya."
                    className="w-full rounded-xl border border-zinc-200 bg-white/50 dark:bg-zinc-900/50 p-3 text-xs leading-relaxed text-foreground placeholder-zinc-400 outline-none focus:border-[#01AFAE] dark:border-white/10"
                  />
                </div>

                {/* Camera Motion Selection (Figma 360:40302) */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Camera Motion
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CAMERA_MOVEMENTS.map((cam) => {
                      const isSelected = (currentSceneInput.cameraMovement || "Pan Left / Right") === cam;
                      return (
                        <button
                          key={cam}
                          type="button"
                          onClick={() =>
                            setSceneInputs((prev) => ({
                              ...prev,
                              [sceneNum]: {
                                description: prev[sceneNum]?.description ?? "",
                                cameraMovement: cam,
                                referenceUrl: prev[sceneNum]?.referenceUrl,
                              },
                            }))
                          }
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all select-none",
                            isSelected
                              ? "border-[#01AFAE] bg-[#01AFAE] text-white shadow-sm"
                              : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300",
                          )}
                        >
                          {cam}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tombol Add Referensi (Figma 360:40302) */}
                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSceneForFileInput(sceneNum);
                      sceneFileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    <PlusIcon className="h-3.5 w-3.5 text-[#01AFAE]" />
                    <span>Add Referensi</span>
                  </button>

                  {currentSceneInput.referenceUrl && (
                    <div className="flex items-center gap-2">
                      <div className="relative h-7 w-7 overflow-hidden rounded-md border border-[#01AFAE]">
                        <Image
                          src={currentSceneInput.referenceUrl}
                          alt={`Referensi Scene ${sceneNum}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-[11px] text-[#01AFAE] font-medium">
                        Referensi terpasang
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* LOADING STATE STORYBOARD */}
        {loadingStoryboard && (
          <div className="glass-panel angle-card w-full rounded-2xl p-6 transition-all duration-300 space-y-4 animate-in fade-in zoom-in-95 duration-200 border border-zinc-200/90 dark:border-white/10">
            <div className="flex items-center justify-between text-xs font-medium text-foreground">
              <span className="flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-[#01AFAE] animate-spin" />
                <span>
                  {storyboardProgress < 30 && "Menganalisis konsep visual & pembagian adegan…"}
                  {storyboardProgress >= 30 && storyboardProgress < 75 && "Menyiapkan visual prompt sinematik & audio…"}
                  {storyboardProgress >= 75 && "Menyusun Tabel Storyboard interaktif…"}
                </span>
              </span>
              <span className="font-mono text-[#01AFAE] font-bold">{storyboardProgress}%</span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full bg-[#01AFAE] transition-all duration-300 rounded-full"
                style={{ width: `${storyboardProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* FIXED FLOATING DOCK DI TENGAH (Figma 360:40302) */}
        {!loadingStoryboard && (
          <div className="fixed bottom-20 md:bottom-6 left-0 md:left-20 lg:left-64 right-0 z-40 px-4 pointer-events-none flex justify-center">
            <div className="w-full max-w-2xl pointer-events-auto">
              <div className="glass-panel angle-card w-full rounded-2xl p-4 px-6 flex items-center justify-between gap-4 shadow-2xl backdrop-blur-xl border border-zinc-200/90 dark:border-white/15 bg-white/95 dark:bg-zinc-900/95 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 text-left">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Simpan perubahan sebelum melanjutkan ke Canvas Editor.
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-[#01AFAE] hover:underline font-semibold text-left shrink-0"
                  >
                    Ubah pilihan
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleStartStoryboardLoading}
                  className="inline-flex items-center gap-2 rounded-full bg-[#01AFAE] hover:bg-[#009b9a] text-white px-6 py-2.5 text-xs font-bold shadow-lg shadow-[#01AFAE]/20 transition-all active:scale-95 shrink-0"
                >
                  <SparklesIcon className="h-4 w-4" />
                  <span>Buka Storyboard →</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3: STORY BOARD (FIGMA 314:21543 - TABEL 5 KOLOM + CAPTION REKOMENDASI)
  // Sesuai persis Figma 314:21543: Top Summary + Tabel Story Board + Caption Rekomendasi
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="mx-auto flex flex-1 w-full max-w-6xl flex-col gap-5 py-2 pb-36 animate-in fade-in duration-200">
      {/* Navigasi Kembali */}
      <div className="w-full flex items-center justify-start">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors"
        >
          ← Kembali ke Brief
        </button>
      </div>

      {/* ── TOP CONTEXT SUMMARY BAR (FIGMA 314:21543) ────────────────────── */}
      <div className="glass-panel angle-card w-full rounded-2xl p-5 border border-zinc-200/90 dark:border-white/10 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Video Configuration */}
          <div className="md:col-span-5 flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Video CONFIguration
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Video
              </span>
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {params.scenes} Scene
              </span>
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Rasio {params.ratio}
              </span>
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {params.style}
              </span>
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {params.duration}
              </span>
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                With Voice Over
              </span>
            </div>
          </div>

          {/* Context / Topik */}
          <div className="md:col-span-4 flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Context
            </span>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
              {prompt || "Jelaskan Kasus Korupsi Indonesia dalam 60 detik secara komprehensif."}
            </p>
          </div>

          {/* Angle with Dipilih Badge */}
          <div className="md:col-span-3 flex flex-col gap-1 items-start md:items-end">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              ANGLE
            </span>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                Dipilih
              </span>
              <span className="inline-flex items-center rounded-md bg-[#01AFAE]/10 px-2.5 py-0.5 text-xs font-bold text-[#01AFAE] dark:bg-[#01AFAE]/20">
                {params.angle}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate max-w-[200px] text-right mt-0.5">
              {prompt ? prompt.slice(0, 30) : "Investigasi Kasus Terkini"}
            </p>
          </div>
        </div>

        {/* Quota Banner (Figma 314:21543) */}
        <div className="w-full rounded-xl bg-[#01AFAE]/10 border border-[#01AFAE]/20 px-4 py-2 flex items-center justify-between text-xs text-[#01AFAE] font-medium">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 shrink-0" />
            <span>Maksimal 3x generate video visual AI. Sisa kuota produksi: 3/3</span>
          </div>
          <span className="text-[11px] font-bold">Mode Aktif</span>
        </div>
      </div>

      {/* ── HEADER STORY BOARD (FIGMA 314:21543) ─────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Story Board
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Template produksi video siap diisi untuk semua jenis konten.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Aspect Ratio {params.ratio}
            </span>
            <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {params.duration}
            </span>
            <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {scenes.length} Scene
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toast.info("Mode edit aktif. Anda dapat langsung mengedit teks dan naskah di dalam tabel.")}
            className="rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 transition-colors shadow-xs"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 transition-colors shadow-xs"
          >
            Unduh PDF
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

      {/* Hidden File Input untuk Add Referensi di Tabel Story Board */}
      <input
        type="file"
        ref={tableRefInputRef}
        accept="image/*"
        multiple
        onChange={handleTableReferenceUpload}
        className="hidden"
      />

      {/* ── TABEL 5 KOLOM STORY BOARD (FIGMA 314:21543) ──────────────────── */}
      <div className="w-full overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-white/10 shadow-sm glass-panel angle-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 dark:border-white/10 dark:bg-zinc-900/80 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-16 text-center">SCENE</th>
                <th className="py-3.5 px-4 w-32">DURASI</th>
                <th className="py-3.5 px-4 min-w-[380px]">VISUAL</th>
                <th className="py-3.5 px-4 min-w-[200px]">TEXT PADA VISUAL</th>
                <th className="py-3.5 px-4 min-w-[280px]">VOICEOVER (VO)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
              {scenes.map((scene) => {
                const sceneNum = scene.sceneNumber;
                const userAsset = sceneAssets[sceneNum];
                const thumbUrl = userAsset?.url || scene.visual.thumbnailUrl;
                const rowReferences = sceneReferences[sceneNum] || [];

                return (
                  <tr
                    key={`storyboard-row-${sceneNum}`}
                    className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]"
                  >
                    {/* SCENE */}
                    <td className="py-4 px-4 text-center font-bold text-sm text-foreground align-top">
                      {sceneNum}
                    </td>

                    {/* DURASI */}
                    <td className="py-4 px-4 font-mono text-zinc-600 dark:text-zinc-400 align-top whitespace-nowrap">
                      {scene.duration}
                    </td>

                    {/* VISUAL (Add Media 80x80 + Kategori + Deskripsi + Add Referensi & Previews) */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-start gap-3.5">
                        {/* 80x80 Media Picker (Figma 314:21543 "Add Media") */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSceneForAssetModal(sceneNum);
                            setSelectedAssetInModal(
                              userAsset
                                ? {
                                    id: `current-${sceneNum}`,
                                    url: userAsset.url,
                                    title: userAsset.title,
                                    type: userAsset.type,
                                    duration: userAsset.duration,
                                  }
                                : null,
                            );
                          }}
                          className={cn(
                            "group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border transition-all duration-200 flex flex-col items-center justify-center cursor-pointer",
                            thumbUrl
                              ? "border-zinc-200 dark:border-white/10 hover:border-[#01AFAE] hover:ring-2 hover:ring-[#01AFAE]/30"
                              : "border-dashed border-zinc-300 bg-zinc-50/70 hover:border-[#01AFAE] hover:bg-[#01AFAE]/5 dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:border-[#01AFAE] dark:hover:bg-[#01AFAE]/10",
                          )}
                          title="Klik untuk memilih atau menambahkan aset visual utama"
                        >
                          {thumbUrl ? (
                            <>
                              <Image
                                src={thumbUrl}
                                alt={`Visual Scene ${sceneNum}`}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <PlusIcon className="h-5 w-5" />
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-1 text-zinc-400 group-hover:text-[#01AFAE] transition-colors p-1 text-center">
                              <PlusIcon className="h-4 w-4" />
                              <span className="text-[10px] font-medium leading-tight">Add Media</span>
                            </div>
                          )}
                        </button>

                        {/* Detail Kategori, Deskripsi, dan Referensi */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <span className="text-[11px] font-semibold text-foreground dark:text-zinc-200 block">
                              {DEFAULT_ROW_CATEGORIES[(sceneNum - 1) % DEFAULT_ROW_CATEGORIES.length]}
                            </span>
                            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-xs mt-0.5">
                              {scene.visual.description}
                            </p>
                          </div>

                          {/* Referensi Upload & Preview Kecil-kecil (Figma 314:21543) */}
                          <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                            {/* Previews kecil2 */}
                            {rowReferences.map((refUrl, rIdx) => (
                              <div
                                key={`scene-${sceneNum}-ref-${rIdx}`}
                                className="relative group h-9 w-9 shrink-0 rounded-md overflow-hidden border border-zinc-200 dark:border-white/15 bg-zinc-100 dark:bg-zinc-800 shadow-2xs"
                              >
                                <button
                                  type="button"
                                  onClick={() => setLightboxImage(refUrl)}
                                  className="w-full h-full relative cursor-zoom-in block"
                                  title="Klik untuk memperbesar referensi"
                                >
                                  <Image
                                    src={refUrl}
                                    alt={`Referensi ${rIdx + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveReference(sceneNum, rIdx);
                                  }}
                                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-rose-600 z-10 cursor-pointer"
                                  title="Hapus referensi ini"
                                >
                                  <XIcon className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            ))}

                            {/* Tombol Add Referensi */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSceneForTableRef(sceneNum);
                                tableRefInputRef.current?.click();
                              }}
                              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-zinc-700 shadow-2xs hover:bg-zinc-100 hover:text-foreground dark:border-white/10 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700/60 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
                              title="Unggah berkas gambar referensi (akan tampil sebagai preview thumbnail)"
                            >
                              <PlusIcon className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                              <span>Add Referensi</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* TEXT PADA VISUAL (Editable Input) */}
                    <td className="py-4 px-4 align-top">
                      <input
                        type="text"
                        value={sceneVisualTexts[sceneNum] ?? scene.visualText}
                        onChange={(e) =>
                          setSceneVisualTexts((prev) => ({
                            ...prev,
                            [sceneNum]: e.target.value,
                          }))
                        }
                        placeholder="Teks pada visual…"
                        className="w-full rounded-lg border border-zinc-200 bg-white/60 dark:bg-zinc-900/60 p-2 text-xs font-semibold text-foreground outline-none focus:border-[#01AFAE] dark:border-white/10"
                      />
                    </td>

                    {/* VOICEOVER (VO) (Editable Textarea) */}
                    <td className="py-4 px-4 align-top">
                      <textarea
                        value={sceneVoiceovers[sceneNum] ?? scene.voiceover}
                        onChange={(e) =>
                          setSceneVoiceovers((prev) => ({
                            ...prev,
                            [sceneNum]: e.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Naskah voiceover…"
                        className="w-full rounded-lg border border-zinc-200 bg-white/60 dark:bg-zinc-900/60 p-2 text-xs italic text-foreground leading-relaxed outline-none focus:border-[#01AFAE] dark:border-white/10"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECTION CAPTION REKOMENDASI (FIGMA 314:21543) ────────────────── */}
      <div className="glass-panel angle-card rounded-2xl p-5 border border-zinc-200/90 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#01AFAE]/10 text-[#01AFAE]">
              <SparklesIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                CAPTION REKOMENDASI
              </h3>
              <p className="text-[11px] text-zinc-400">
                Rekomendasi caption untuk posting media sosial
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerateCaption}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 transition-colors"
            >
              <SparklesIcon className="h-3 w-3 text-[#01AFAE]" />
              <span>Buat ulang</span>
            </button>
            <button
              type="button"
              onClick={handleCopyCaption}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 transition-colors"
            >
              <CopyIcon className="h-3.5 w-3.5" />
              <span>Salin Caption</span>
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {/* Headline */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Headline
            </label>
            <input
              type="text"
              value={caption.headline}
              onChange={(e) => setCustomCaption((prev) => ({ ...prev, headline: e.target.value }))}
              className="w-full rounded-xl border border-zinc-200 bg-white/60 dark:bg-zinc-900/60 p-2.5 text-xs font-semibold text-foreground outline-none focus:border-[#01AFAE] dark:border-white/10"
            />
          </div>

          {/* Narasi */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Narasi
            </label>
            <textarea
              value={caption.body}
              onChange={(e) => setCustomCaption((prev) => ({ ...prev, body: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-zinc-200 bg-white/60 dark:bg-zinc-900/60 p-2.5 text-xs text-foreground outline-none focus:border-[#01AFAE] dark:border-white/10"
            />
          </div>

          {/* Hashtags */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Hashtags
            </label>
            <input
              type="text"
              value={caption.hashtags}
              onChange={(e) => setCustomCaption((prev) => ({ ...prev, hashtags: e.target.value }))}
              className="w-full rounded-xl border border-zinc-200 bg-white/60 dark:bg-zinc-900/60 p-2.5 text-xs font-medium text-[#01AFAE] outline-none focus:border-[#01AFAE] dark:border-white/10"
            />
          </div>
        </div>
      </div>

      {/* ── FIXED FLOATING DOCK DI TENGAH: PREVIEW STORYBOARD (FIGMA 314:21543) ── */}
      <div className="fixed bottom-20 md:bottom-6 left-0 md:left-20 lg:left-64 right-0 z-40 px-4 pointer-events-none flex justify-center">
        <div className="w-full max-w-2xl pointer-events-auto">
          <div className="glass-panel angle-card w-full rounded-2xl p-4 px-6 flex items-center justify-between gap-4 shadow-2xl backdrop-blur-xl border border-zinc-200/90 dark:border-white/15 bg-white/95 dark:bg-zinc-900/95 animate-in slide-in-from-bottom-2 duration-300">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Simpan perubahan sebelum melanjutkan ke Canvas Editor.
            </span>
            <button
              type="button"
              onClick={handleOpenPreviewModal}
              className="inline-flex items-center gap-2 rounded-full bg-[#01AFAE] hover:bg-[#009b9a] text-white px-6 py-2.5 text-xs font-bold shadow-lg shadow-[#01AFAE]/20 transition-all active:scale-95 shrink-0"
            >
              <PlayIcon className="h-3.5 w-3.5" />
              <span>Preview Storyboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL PILIH VIDEO ASET (FIGMA 986:21951) ─────────────────────── */}
      {activeSceneForAssetModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel angle-card relative w-full max-w-4xl rounded-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col justify-between animate-in zoom-in-95 duration-200 border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-white/10">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Pilih Media Scene {activeSceneForAssetModal}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Ganti visual adegan dengan aset galeri atau unggah berkas dari perangkat Anda.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSceneForAssetModal(null);
                    setSelectedAssetInModal(null);
                    setPlayingAssetId(null);
                  }}
                  className="rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplyAssetToScene}
                  disabled={!selectedAssetInModal}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#01AFAE] hover:bg-[#009b9a] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  <span>Terapkan ke Scene</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-white/10 pt-3">
              <button
                type="button"
                onClick={() => {
                  setAssetModalTab("video");
                  setPlayingAssetId(null);
                }}
                className={cn(
                  "pb-2.5 text-sm font-semibold transition-colors relative",
                  assetModalTab === "video"
                    ? "text-[#01AFAE]"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                Video Assets
                {assetModalTab === "video" && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#01AFAE] rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssetModalTab("image");
                  setPlayingAssetId(null);
                }}
                className={cn(
                  "pb-2.5 text-sm font-semibold transition-colors relative",
                  assetModalTab === "image"
                    ? "text-[#01AFAE]"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                Image Assets
                {assetModalTab === "image" && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#01AFAE] rounded-full" />
                )}
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto py-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                <div
                  onClick={() => modalFileInputRef.current?.click()}
                  className="group relative flex aspect-[9/14] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 p-4 text-center transition-all hover:border-[#01AFAE] hover:bg-[#01AFAE]/5 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-[#01AFAE]"
                >
                  <input
                    type="file"
                    ref={modalFileInputRef}
                    accept="video/*,image/*"
                    onChange={handleModalFileUpload}
                    className="hidden"
                  />
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-[#01AFAE] group-hover:text-white dark:bg-zinc-800 dark:text-zinc-400">
                    <UploadIcon className="h-5 w-5" />
                  </div>
                  <h4 className="mt-3 text-xs font-semibold text-foreground">Upload Media</h4>
                  <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                    Unggah dari perangkat
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 rounded-md bg-[#01AFAE] px-2.5 py-1 text-[11px] font-medium text-white shadow-xs">
                    <PlusIcon className="h-3 w-3" />
                    <span>Pilih Berkas</span>
                  </span>
                </div>

                {(assetModalTab === "video" ? SAMPLE_GALLERY_VIDEOS : SAMPLE_GALLERY_IMAGES).map((asset) => {
                  const isSelected = selectedAssetInModal?.url === asset.url;
                  const isPlaying = playingAssetId === asset.id;
                  const videoSource = asset.videoUrl || (asset.type === "video" ? asset.url : undefined);

                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAssetInModal(asset)}
                      className={cn(
                        "group relative aspect-[9/14] overflow-hidden rounded-xl border transition-all cursor-pointer shadow-xs",
                        isSelected
                          ? "border-[#01AFAE] ring-2 ring-[#01AFAE]"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20",
                      )}
                    >
                      {isPlaying && videoSource ? (
                        <div className="absolute inset-0 z-20 bg-black flex items-center justify-center">
                          <video
                            src={videoSource}
                            controls
                            autoPlay
                            playsInline
                            className="h-full w-full object-cover rounded-xl"
                            onEnded={() => setPlayingAssetId(null)}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlayingAssetId(null);
                            }}
                            className="absolute top-2 right-2 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-white hover:bg-black transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <Image
                            src={asset.url}
                            alt={asset.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {asset.duration && (
                            <div className="absolute top-2 left-2 z-10 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white backdrop-blur-xs">
                              {asset.duration}
                            </div>
                          )}
                          <div
                            className={cn(
                              "absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                              isSelected
                                ? "border-[#01AFAE] bg-[#01AFAE] text-white shadow-xs"
                                : "border-white/70 bg-black/40 text-transparent group-hover:border-white",
                            )}
                          >
                            {isSelected && <CheckIcon className="h-3 w-3 stroke-[3]" />}
                          </div>

                          {asset.type === "video" && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPlayingAssetId(asset.id);
                                  setSelectedAssetInModal(asset);
                                }}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs transition-all hover:scale-110 hover:bg-[#01AFAE] active:scale-95 shadow-lg cursor-pointer"
                              >
                                <PlayIcon className="h-4 w-4 ml-0.5" />
                              </button>
                            </div>
                          )}

                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2.5 pt-6 text-white">
                            <p className="text-[11px] font-medium leading-snug line-clamp-2">
                              {asset.title}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4: MODAL POPUP PREVIEW STORYBOARD (FIGMA 368:23819) ── */}
      {previewModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-6xl rounded-3xl p-6 md:p-8 shadow-2xl max-h-[92vh] flex flex-col justify-between animate-in zoom-in-95 duration-200 border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0C0D10] overflow-hidden">
            {/* Header Modal (Figma 368:23820) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-white/10 shrink-0">
              <div className="flex flex-col gap-2">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    Preview Storyboard
                  </h2>
                  <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Silahkan cek kembali preview storyboard di bawah sebelum generate scene
                  </p>
                </div>
                {/* Chips / Badges */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="rounded-full bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Total Durasi {params.duration}
                  </span>
                  <span className="rounded-full bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {scenes.length} Scene
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                <button
                  type="button"
                  onClick={() => {
                    setPlayingSceneNumber(null);
                    setPreviewModalOpen(false);
                  }}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700/70 transition-colors shadow-2xs cursor-pointer"
                >
                  Kembali ke brief
                </button>
                <button
                  type="button"
                  onClick={handleProceedToEditor}
                  disabled={previewLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#171717] hover:bg-black text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 px-5 py-2 text-xs font-bold shadow-md transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span>Lanjut Generate Scene</span>
                </button>
              </div>
            </div>

            {/* Loading Indicator saat Auto-fill Visual AI */}
            {previewLoading && (
              <div className="pt-4 pb-1 flex flex-col gap-1.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4 text-[#01AFAE] animate-spin" />
                    <span>Menganalisis storyboard & merender visual adegan AI…</span>
                  </span>
                  <span className="font-mono font-bold text-[#01AFAE]">{previewProgress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full bg-[#01AFAE] transition-all duration-300 rounded-full"
                    style={{ width: `${previewProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Gallery Horizontal Storyboard Cards (Figma 368:23834 & 67:8514) */}
            <div className="flex-1 min-h-0 py-6 overflow-x-auto scrollbar-thin">
              <div className="flex items-center gap-3 md:gap-4 min-w-max pb-2">
                {scenes.map((scene) => {
                  const sceneNum = scene.sceneNumber;
                  const userAsset = sceneAssets[sceneNum];
                  const thumbUrl = userAsset?.url || scene.visual.thumbnailUrl;
                  const sceneVideoUrl =
                    userAsset?.videoUrl ||
                    SAMPLE_GALLERY_VIDEOS[(sceneNum - 1) % SAMPLE_GALLERY_VIDEOS.length].videoUrl;
                  const isPlaying = playingSceneNumber === sceneNum;
                  const sceneHeadline =
                    sceneVisualTexts[sceneNum] ??
                    scene.visualText ??
                    DEFAULT_ROW_CATEGORIES[(sceneNum - 1) % DEFAULT_ROW_CATEGORIES.length];

                  return (
                    <div
                      key={`preview-storyboard-card-${sceneNum}`}
                      className="relative flex flex-col justify-between h-[420px] md:h-[450px] w-[210px] md:w-[240px] shrink-0 rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 bg-zinc-950 group shadow-lg transition-transform duration-200 hover:-translate-y-1"
                    >
                      {/* Media Background */}
                      {previewLoading ? (
                        <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center p-4 text-center animate-pulse">
                          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-[#01AFAE] mb-2">
                            <SparklesIcon className="h-5 w-5 animate-spin" />
                          </div>
                          <span className="text-[11px] font-medium text-zinc-300">
                            Merender Scene {sceneNum}…
                          </span>
                          <span className="text-[10px] text-zinc-500 mt-1">
                            Sinkronisasi Visual AI
                          </span>
                        </div>
                      ) : isPlaying && sceneVideoUrl ? (
                        <video
                          src={sceneVideoUrl}
                          autoPlay
                          loop
                          playsInline
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : thumbUrl ? (
                        <Image
                          src={thumbUrl}
                          alt={`Scene ${sceneNum}`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 via-zinc-900 to-black flex flex-col items-center justify-center p-4 text-center">
                          <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors mb-2">
                            <PlayIcon className="h-5 w-5 text-zinc-400" />
                          </div>
                          <span className="text-[11px] font-medium text-zinc-400">
                            Scene {sceneNum} Visual
                          </span>
                          <span className="text-[10px] text-zinc-500 mt-1">
                            Auto Generate AI
                          </span>
                        </div>
                      )}

                      {/* Tombol Play / Pause Tengah Frame (Muncul ketika selesai load) */}
                      {!previewLoading && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlayingSceneNumber((prev) => (prev === sceneNum ? null : sceneNum));
                            }}
                            className={cn(
                              "h-12 w-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 pointer-events-auto cursor-pointer shadow-2xl",
                              isPlaying
                                ? "bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                                : "bg-black/60 hover:bg-[#01AFAE] text-white hover:scale-110 active:scale-95 group-hover:ring-4 group-hover:ring-[#01AFAE]/30",
                            )}
                            title={isPlaying ? `Jeda Scene ${sceneNum}` : `Putar Video Scene ${sceneNum}`}
                          >
                            {isPlaying ? (
                              <PauseIcon className="h-5 w-5" />
                            ) : (
                              <PlayIcon className="h-5 w-5 ml-0.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Top Bar: Time Badge (Top Left) & Scene Index (Top Right) */}
                      <div className="relative z-10 p-3 flex items-center justify-between w-full pointer-events-none">
                        <div className="rounded-md bg-[#171717]/90 px-2.5 py-1 font-mono text-[11px] font-medium text-white backdrop-blur-md shadow-xs">
                          {scene.duration}
                        </div>
                        <div className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-zinc-300 backdrop-blur-md">
                          Scene {sceneNum}
                        </div>
                      </div>

                      {/* Bottom Gradient Overlay */}
                      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

                      {/* Bottom Content: Scene Title / Headline Box */}
                      <div className="relative z-10 p-3 flex flex-col gap-1.5">
                        <div className="rounded-xl bg-[#171717]/95 dark:bg-black/90 p-3 text-center border border-white/10 backdrop-blur-md shadow-lg">
                          <p className="text-xs font-semibold text-white line-clamp-2 leading-snug">
                            {sceneHeadline}
                          </p>
                          {scene.voiceover && (
                            <p className="text-[10px] text-zinc-400 italic line-clamp-1 mt-1 leading-tight">
                              {scene.voiceover}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL LIGHTBOX PREVIEW REFERENSI BESAR ────────────────── */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full max-h-[85vh] rounded-2xl overflow-hidden border border-white/20 bg-zinc-950 p-2 shadow-2xl flex flex-col items-center cursor-default"
          >
            <div className="w-full flex items-center justify-between pb-2 px-2">
              <span className="text-xs font-semibold text-white/90">Preview Gambar Referensi</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup preview"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="relative w-full h-[60vh] max-h-[540px] rounded-xl overflow-hidden bg-zinc-900">
              <Image
                src={lightboxImage}
                alt="Detail Gambar Referensi"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

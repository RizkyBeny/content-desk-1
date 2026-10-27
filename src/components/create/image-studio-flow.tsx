"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react";
import { put } from "@/lib/client";
import { cn } from "@/lib/utils";
import type { GenerationDTO } from "@/types";
import { IMAGE_TEMPLATES } from "../../../config/templates";
import {
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  LayersIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  SlidersIcon,
  UploadIcon,
  XIcon,
} from "@/components/ui/icons";
import { SectionHeader } from "@/components/ui/primitives";
import { InsightSection } from "./insight-section";
import { ReferenceOutputGrid } from "./reference-output-grid";
import { DetailModal } from "./detail-modal";

// ── Icons Khusus Image Studio ───────────────────────────────────────────────

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

function ImageIcon({ className }: { className?: string }) {
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
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function MultiImageIcon({ className }: { className?: string }) {
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
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
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
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  );
}

function EditImageIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "w-3.5 h-3.5"}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function LibraryIcon({ className }: { className?: string }) {
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
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6 6h10" />
      <path d="M6 10h10" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
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
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
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

// ── Types & Constants ───────────────────────────────────────────────────────

export type ImageProductionParams = {
  images: number;
  ratio: "1:1" | "9:16" | "16:9" | "4:5";
  style: "Cinematic" | "3D Animation" | "Realistis" | "Vintage" | "Minimalis" | "Ilustrasi";
  persona: "Informatif" | "Formal" | "Kasual" | "Enerjik" | "Storytelling" | "Investigatif";
};

export type StoryboardImageCard = {
  id: number;
  title: string;
  description: string;
  visualPrompt: string;
  imageUrl: string;
  variationName: string;
  variations: string[];
  isRegenerating?: boolean;
};

const IMAGE_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10];
const RATIO_OPTIONS = ["9:16", "1:1", "16:9", "4:5"] as const;
const STYLE_OPTIONS = ["Cinematic", "3D Animation", "Realistis", "Vintage", "Minimalis", "Ilustrasi"] as const;
const PERSONA_OPTIONS = ["Investigatif", "Informatif", "Formal", "Kasual", "Enerjik", "Storytelling"] as const;

const DEFAULT_CARD_IMAGES = [
  "/seed/unsplash/abstract-01.jpg",
  "/seed/unsplash/abstract-02.jpg",
  "/seed/unsplash/abstract-03.jpg",
  "/seed/unsplash/abstract-04.jpg",
  "/seed/unsplash/abstract-05.jpg",
  "/seed/unsplash/abstract-06.jpg",
  "/seed/unsplash/abstract-07.jpg",
  "/seed/unsplash/abstract-08.jpg",
  "/seed/unsplash/abstract-09.jpg",
  "/seed/unsplash/abstract-10.jpg",
  "/seed/unsplash/abstract-11.jpg",
  "/seed/unsplash/abstract-12.jpg",
];

const VARIATION_NAMES = [
  "AI Variasi: Standarisasi & Data #1",
  "AI Variasi: Komposisi Berita Terkini #1",
  "AI Variasi: Sorotan Pelaku UMKM #1",
  "AI Variasi: Nuansa Visual Editorial #1",
  "AI Variasi: Liputan Investigasi #1",
  "AI Variasi: Rangkuman & Data Visual #6",
  "AI Variasi: Infografis Terarah #7",
  "AI Variasi: Dokumenter Modern #8",
];

const SAMPLE_GALLERY_ASSETS = [
  { id: "a1", url: "/seed/unsplash/abstract-01.jpg", title: "Latar abstrak 01" },
  { id: "a2", url: "/seed/unsplash/abstract-02.jpg", title: "Latar abstrak 02" },
  { id: "a3", url: "/seed/unsplash/abstract-03.jpg", title: "Latar abstrak 03" },
  { id: "a4", url: "/seed/unsplash/abstract-04.jpg", title: "Latar abstrak 04" },
  { id: "a5", url: "/seed/unsplash/abstract-05.jpg", title: "Latar abstrak 05" },
  { id: "a6", url: "/seed/unsplash/abstract-06.jpg", title: "Latar abstrak 06" },
  { id: "a7", url: "/seed/unsplash/abstract-07.jpg", title: "Latar abstrak 07" },
  { id: "a8", url: "/seed/unsplash/abstract-08.jpg", title: "Latar abstrak 08" },
  { id: "a9", url: "/seed/unsplash/abstract-09.jpg", title: "Latar abstrak 09" },
  { id: "a10", url: "/seed/unsplash/abstract-10.jpg", title: "Latar abstrak 10" },
  { id: "a11", url: "/seed/unsplash/abstract-11.jpg", title: "Latar abstrak 11" },
  { id: "a12", url: "/seed/unsplash/abstract-12.jpg", title: "Latar abstrak 12" },
];

const STORAGE_KEY = "cd2_visual_brief_state";

// ── Dropdown Filter Component ───────────────────────────────────────────────

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
  options: readonly T[];
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
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white/70 px-3 text-xs font-medium text-zinc-700 shadow-2xs backdrop-blur-md transition-all hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 dark:border-white/10 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700/80 dark:hover:text-white"
      >
        <Icon className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
        <span>{label}</span>
        <ChevronDownIcon
          className={cn(
            "h-3 w-3 text-zinc-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 z-50 w-44 origin-top-left rounded-xl border border-zinc-200 bg-white p-1 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 dark:border-white/15 dark:bg-zinc-900">
          {options.map((opt) => {
            const isSelected = opt === value;
            return (
              <button
                key={String(opt)}
                type="button"
                onClick={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs transition-colors",
                  isSelected
                    ? "bg-brand/10 font-semibold text-brand dark:bg-brand/20 dark:text-brand-light"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                )}
              >
                <span>
                  {typeof opt === "number"
                    ? `${opt} Gambar`
                    : opt.includes(":")
                      ? `Rasio ${opt}`
                      : opt}
                </span>
                {isSelected && <CheckIcon className="h-3 w-3 text-brand" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getSavedVisualBrief() {
  if (typeof window === "undefined") return null;
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("step") === "visual-brief") {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        /* abaikan */
      }
    }
  }
  return null;
}

export function ImageStudioFlow({
  items = [],
  canModerate,
}: {
  items?: GenerationDTO[];
  canModerate?: boolean;
}) {
  const router = useRouter();

  const [savedState] = useState(() => getSavedVisualBrief());

  // 0: Entry Point, 1: Buat Image (Composer), 2: Content Brief (Breakdown), 3: Visual Brief (Figma 332:32994)
  const [step, setStep] = useState<0 | 1 | 2 | 3>(() => (savedState?.cards?.length ? 3 : 0));

  // Input prompt user
  const [prompt, setPrompt] = useState(() => savedState?.prompt ?? "");

  // Default Carousel Presets sesuai Figma (6 slide, 9:16, Cinematic, Investigatif)
  const [params, setParams] = useState<ImageProductionParams>(() => savedState?.params ?? {
    images: 6,
    ratio: "9:16",
    style: "Cinematic",
    persona: "Investigatif",
  });
  const [attachment, setAttachment] = useState<{ name: string; url: string } | null>(null);

  // Content Brief state (Step 2)
  const [topicDescription, setTopicDescription] = useState(() => savedState?.topicDescription ?? "");
  const [imageDescriptions, setImageDescriptions] = useState<Record<number, string>>({});

  // Loading transition
  const [loadingStoryboard, setLoadingStoryboard] = useState(false);
  const [storyboardProgress, setStoryboardProgress] = useState(0);

  // Detail Modal untuk Entry Point Reference Output
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationDTO | null>(null);

  // Ref file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);

  // State kartu storyboard gambar (Visual Brief)
  const [cards, setCards] = useState<StoryboardImageCard[]>(() => savedState?.cards ?? []);
  const [activeCardForModal, setActiveCardForModal] = useState<number | null>(null);
  const [selectedAssetInModal, setSelectedAssetInModal] = useState<string | null>(null);
  const [assetModalTab, setAssetModalTab] = useState<"gallery" | "upload">("gallery");

  // Caption Rekomendasi (Figma 332:32994)
  const [captionHeadline, setCaptionHeadline] = useState(
    () => savedState?.captionHeadline ?? "Jelaskan Kasus Korupsi Indonesia Dalam 60 Detik.",
  );
  const [captionBody, setCaptionBody] = useState(
    () =>
      savedState?.captionBody ??
      "Kabar terkini soal Kasus Korupsi Indonesia yang perlu kamu tahu. Redaksi kumparan merangkum fakta dan kronologinya. Simak selengkapnya.",
  );
  const [captionHashtags, setCaptionHashtags] = useState(
    () => savedState?.captionHashtags ?? "#beritaterkini #kumparan #kabar #kasus #korupsi #indonesia",
  );

  // Dropdown menu "Ubah Gambar" popover (per kartu ID)
  const [openMenuCardId, setOpenMenuCardId] = useState<number | null>(null);

  // Click outside listener untuk menutup popover menu "Ubah Gambar"
  useEffect(() => {
    function handleGlobalClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-ubah-menu-container]")) {
        setOpenMenuCardId(null);
      }
    }
    if (openMenuCardId !== null) {
      document.addEventListener("mousedown", handleGlobalClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
    };
  }, [openMenuCardId]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAttachment({ name: file.name, url });
    toast.success(`Gambar "${file.name}" ditambahkan sebagai referensi visual.`);
  }

  function handleCardFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || activeCardForModal === null) return;
    const url = URL.createObjectURL(file);
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== activeCardForModal) return c;
        const updatedVariations = [url, ...c.variations.filter((v) => v !== url)];
        return {
          ...c,
          imageUrl: url,
          variations: updatedVariations,
        };
      }),
    );
    toast.success(`Gambar "${file.name}" berhasil diterapkan pada Visual Image ${activeCardForModal}!`);
    setActiveCardForModal(null);
    setOpenMenuCardId(null);
  }

  // ── AI Prefill Generator Cerdas sesuai Wireframe Kasus Korupsi / Jurnalisme ──
  function buildAIPrefilledCards(count: number, customDescriptions: Record<number, string> = {}): StoryboardImageCard[] {
    const baseTopic = (prompt.trim() || topicDescription.trim() || "Jelaskan Kasus Korupsi Indonesia dalam 60 detik").trim();
    const cleanTopic = baseTopic.replace(/[#*`]/g, "");

    const editorialTemplates = [
      {
        title: "Headline",
        desc: `Buka dengan kabar menohok soal ${cleanTopic}.`,
        promptDetail: "Foto berita + headline besar",
      },
      {
        title: "Fakta 1: Kasus",
        desc: "Rangkuman fakta dan konteks terkait kasus.",
        promptDetail: "Ilustrasi/foto pendukung fakta 1",
      },
      {
        title: "Fakta 2: Korupsi",
        desc: "Rangkuman fakta dan konteks terkait peristiwa serta keterlibatan pihak kunci.",
        promptDetail: "Ilustrasi/foto pendukung fakta 2",
      },
      {
        title: "Fakta 3: Indonesia",
        desc: "Rangkuman fakta dan dampak regulasi maupun sosial terkait Indonesia.",
        promptDetail: "Ilustrasi/foto pendukung fakta 3",
      },
      {
        title: "Fakta 4: Kasus",
        desc: `Rangkuman fakta dan konteks mendalam terkait ${cleanTopic}.`,
        promptDetail: "Ilustrasi/foto pendukung fakta 4",
      },
      {
        title: "Rangkuman & Sumber",
        desc: `Kesimpulan berita & ajak baca lengkap. ${cleanTopic}`,
        promptDetail: "Logo kumparan + CTA",
      },
    ];

    const result: StoryboardImageCard[] = [];

    for (let i = 1; i <= count; i += 1) {
      const userDesc = customDescriptions[i]?.trim();
      const baseIdx = (i - 1) % DEFAULT_CARD_IMAGES.length;
      const baseImg = DEFAULT_CARD_IMAGES[baseIdx];
      const var1 = baseImg;
      const var2 = DEFAULT_CARD_IMAGES[(baseIdx + 1) % DEFAULT_CARD_IMAGES.length];
      const var3 = DEFAULT_CARD_IMAGES[(baseIdx + 2) % DEFAULT_CARD_IMAGES.length];

      const tmpl = editorialTemplates[(i - 1) % editorialTemplates.length];
      const cardTitle = i === 1 && count > 1 ? "Headline" : tmpl.title;
      const cardDesc = userDesc || tmpl.desc;
      const cardVisual = tmpl.promptDetail;
      const variationName = VARIATION_NAMES[(i - 1) % VARIATION_NAMES.length];

      result.push({
        id: i,
        title: cardTitle,
        description: cardDesc,
        visualPrompt: cardVisual,
        imageUrl: baseImg,
        variationName,
        variations: [var1, var2, var3],
        isRegenerating: false,
      });
    }

    return result;
  }

  function startLoadingToStoryboard(count: number, customDescriptions: Record<number, string> = {}) {
    const generated = buildAIPrefilledCards(count, customDescriptions);
    setCards(generated);

    setLoadingStoryboard(true);
    setStoryboardProgress(20);

    const t1 = setTimeout(() => setStoryboardProgress(55), 250);
    const t2 = setTimeout(() => setStoryboardProgress(85), 550);
    const t3 = setTimeout(() => {
      setStoryboardProgress(100);
      setLoadingStoryboard(false);
      setStep(3);

      // Simpan snapshot ke session
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            cards: generated,
            params,
            prompt,
            topicDescription,
            captionHeadline,
            captionBody,
            captionHashtags,
          }),
        );
      }
    }, 850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }

  // ── Penanganan Submit Step 1 ──────────────────────────────────────────────
  function handlePromptSubmit() {
    if (!prompt.trim()) {
      toast.danger("Mohon masukkan konsep atau brief gambar terlebih dahulu.");
      return;
    }

    const clean = prompt.trim();
    setTopicDescription(clean);

    if (params.images === 1) {
      startLoadingToStoryboard(1, {});
    } else {
      // Siapkan initial prefilled descriptions untuk scene 1..N
      const initialDescs: Record<number, string> = {};
      for (let i = 1; i <= params.images; i += 1) {
        if (i === 1) initialDescs[i] = `Buka dengan kabar menohok soal ${clean}.`;
        else if (i === params.images) initialDescs[i] = `Kesimpulan berita & ajak baca lengkap. ${clean}`;
        else initialDescs[i] = `Rangkuman fakta dan konteks adegan ke-${i}...`;
      }
      setImageDescriptions(initialDescs);
      setStep(2);
    }
  }

  function updateImageDescription(id: number, val: string) {
    setImageDescriptions((prev) => ({ ...prev, [id]: val }));
  }

  function updateCardField(cardId: number, field: "title" | "description" | "visualPrompt", val: string) {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, [field]: val } : c)));
  }

  function handleSelectVariation(cardId: number, imgUrl: string) {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, imageUrl: imgUrl } : c)));
  }

  function handleRegenerateCardImage(cardId: number) {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, isRegenerating: true } : c)));
    setOpenMenuCardId(null);

    setTimeout(() => {
      setCards((prev) =>
        prev.map((c) => {
          if (c.id !== cardId) return c;
          const unused = DEFAULT_CARD_IMAGES.filter((img) => !c.variations.includes(img));
          const newImg =
            unused.length > 0
              ? unused[0]
              : DEFAULT_CARD_IMAGES[Math.floor(Math.random() * DEFAULT_CARD_IMAGES.length)];
          const updatedVariations = [...c.variations, newImg];
          return {
            ...c,
            imageUrl: newImg,
            variations: updatedVariations,
            isRegenerating: false,
          };
        }),
      );
      toast.success(`Variasi gambar baru untuk Visual Image ${cardId} berhasil dibuat!`);
    }, 700);
  }

  function handleAddSlide() {
    const nextId = cards.length + 1;
    const baseImg = DEFAULT_CARD_IMAGES[(nextId - 1) % DEFAULT_CARD_IMAGES.length];
    const newCard: StoryboardImageCard = {
      id: nextId,
      title: `Slide ${nextId}`,
      description: `Detail adegan tambahan untuk slide ${nextId}.`,
      visualPrompt: "Ilustrasi/foto pendukung tambahan",
      imageUrl: baseImg,
      variationName: `AI Variasi: Tambahan #${nextId}`,
      variations: [baseImg, DEFAULT_CARD_IMAGES[(nextId) % DEFAULT_CARD_IMAGES.length]],
      isRegenerating: false,
    };
    setCards((prev) => [...prev, newCard]);
    toast.success(`Slide ${nextId} ditambahkan ke Visual Brief!`);
  }

  function handleRegenerateCaption() {
    const topic = topicDescription || prompt || "Berita Terkini";
    setCaptionHeadline(`${topic} Dalam 60 Detik.`);
    setCaptionBody(
      `Update terbaru mengenai ${topic}. Redaksi menyajikan fakta investigatif dan analisis mendalam untuk kamu. Simak selengkapnya.`,
    );
    toast.success("Caption rekomendasi berhasil dibuat ulang!");
  }

  function handleApplyAssetToCard() {
    if (activeCardForModal === null || !selectedAssetInModal) return;
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== activeCardForModal) return c;
        const exists = c.variations.includes(selectedAssetInModal);
        const updatedVariations = exists ? c.variations : [selectedAssetInModal, ...c.variations];
        return {
          ...c,
          imageUrl: selectedAssetInModal,
          variations: updatedVariations,
        };
      }),
    );
    toast.success(`Gambar untuk Visual Image ${activeCardForModal} berhasil diperbarui!`);
    setActiveCardForModal(null);
    setSelectedAssetInModal(null);
    setOpenMenuCardId(null);
  }

  async function handleProceedToEditor() {
    toast.success("Menyimpan draft dan mengarahkan ke Canvas Editor…");

    // Simpan ke session storage agar persisten jika user klik "Back to brief"
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          cards,
          params,
          prompt,
          topicDescription,
          captionHeadline,
          captionBody,
          captionHashtags,
        }),
      );
    }

    try {
      await put("/api/creations/canvas-1", {
        type: "carousel",
        ratio: params.ratio,
        caption: `${captionHeadline}\n\n${captionBody}\n\n${captionHashtags}`,
        items: cards.map((c) => ({
          id: c.id,
          title: c.title || `Visual Image ${c.id}`,
          description: c.description || c.visualPrompt || "",
          imageUrl: c.imageUrl,
        })),
      });
    } catch (err) {
      console.warn("Gagal sinkronisasi draft ke canvas-1:", err);
    }
    router.push("/studio/canvas-1");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 0: ENTRY POINT (Dashboard Gambar & Insights)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 0) {
    const completedImages = items.filter(
      (item) => item.status === "completed" && (item.thumbnailUrl || item.fileUrl),
    );

    return (
      <div className="space-y-8 py-2 pb-10 animate-in fade-in duration-200">
        {/* Hero Section dengan Tombol CTA */}
        <header className="flex flex-col items-center gap-4 text-center pt-4 pb-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-[54px] md:leading-[60px]">
            Generate Image
          </h1>
          <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
            Generate gambar kini makin mudah dengan mode panduan memberikan output yang lebih maksimal tanpa harus bikin prompt yang panjang
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="angle-card relative inline-flex items-center justify-center gap-2 rounded-full bg-[#01AFAE] px-7 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-[#009b9a]"
            >
              <SparklesIcon className="h-4 w-4" />
              <span>Buat Gambar Sekarang</span>
            </button>
          </div>
        </header>

        {/* Section Insights */}
        <section className="space-y-5">
          <InsightSection
            onSimilar={(topic) => {
              setPrompt(`Buat konten visual gambar tentang: ${topic}. Tampilkan visual yang memikat dan narasi yang kuat.`);
              setParams((p) => ({ ...p, images: 6, ratio: "9:16", style: "Cinematic", persona: "Investigatif" }));
              setStep(1);
            }}
          />

          <SectionHeader title="Referensi Output" />
          <ReferenceOutputGrid
            generations={completedImages}
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
  // STEP 1: WIREFRAME - 22 (Buat Image: Input Brief & Parameter "Mode AI")
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
            ← Kembali ke Dashboard Gambar
          </button>
        </div>

        {/* Title Group */}
        <header className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Buat Gambar
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Template produksi gambar siap diisi untuk semua jenis konten.
          </p>
        </header>

        {/* Composer Card ("Mode AI") */}
        <div className="glass-panel angle-card w-full flex flex-col gap-3 rounded-2xl p-6 transition-all duration-300">
          {/* Identitas Mode */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">
              <SparklesIcon className="h-4 w-4 text-[#01AFAE]" />
              <span>Generate Image</span>
            </div>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-normal">
              Produksi konten
            </span>
          </div>

          {/* Area Prompt */}
          <div className="w-full pt-1 pb-2">
            <textarea
              id="image-composer-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handlePromptSubmit();
                }
              }}
              rows={6}
              placeholder="Tulis konsep, ide visual, atau brief gambar yang ingin Anda buat…"
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
              {/* Filter 1: Jumlah Gambar */}
              <FilterDropdown
                icon={MultiImageIcon}
                label={`${params.images} Gambar`}
                value={params.images}
                options={IMAGE_COUNT_OPTIONS}
                onSelect={(images) => setParams((p) => ({ ...p, images }))}
              />

              {/* Filter 2: Rasio */}
              <FilterDropdown
                icon={AspectRatioIcon}
                label={`Rasio ${params.ratio}`}
                value={params.ratio}
                options={RATIO_OPTIONS}
                onSelect={(ratio) => setParams((p) => ({ ...p, ratio }))}
              />

              {/* Filter 3: Gaya Visual */}
              <FilterDropdown
                icon={SlidersIcon}
                label={params.style}
                value={params.style}
                options={STYLE_OPTIONS}
                onSelect={(style) => setParams((p) => ({ ...p, style }))}
              />

              {/* Filter 4: Persona */}
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
              disabled={loadingStoryboard}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[#01AFAE] px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#009b9a] active:scale-95 disabled:opacity-50"
            >
              Kirim
            </button>
          </div>

          {/* Bantuan Prompt */}
          <div className="flex items-center justify-between pt-3 text-[11px] text-zinc-400 dark:text-zinc-500">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 hover:text-[#01AFAE] dark:hover:text-[#7de9e6] transition-colors"
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
  // STEP 2: CONTENT BRIEF / PROMPT BREAKDOWN CONFIRMATION (Figma 270:16304)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 2) {
    return (
      <div className="mx-auto flex flex-1 w-full max-w-4xl flex-col gap-6 py-4 pb-32 animate-in fade-in duration-200 relative">
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

        <header className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Content Brief
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Template produksi gambar siap diisi untuk semua jenis konten.
          </p>
        </header>

        {/* User Prompt Bubble (Kanan) */}
        <div className="flex justify-end w-full">
          <div className="glass-panel angle-card max-w-2xl rounded-2xl rounded-tr-sm p-4 text-[14px] leading-relaxed text-zinc-800 dark:text-zinc-100 transition-all duration-300">
            <p className="whitespace-pre-line">{prompt}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-200/60 dark:border-white/10 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-medium">
                {params.images} Gambar
              </span>
              <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-medium">
                Rasio {params.ratio}
              </span>
              <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-medium">
                {params.style}
              </span>
              <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-medium">
                {params.persona}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown Kartu Scene (Figma 270:16304) */}
        <div className="flex flex-col gap-4 pt-2">
          {/* Card Topik Utama Prefilled */}
          <div className="glass-panel angle-card rounded-2xl border border-zinc-200/90 dark:border-white/10 p-5 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#01AFAE]/15 text-[#01AFAE] dark:text-[#7de9e6] px-2.5 py-1 text-xs font-semibold">
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Topik Utama (Prefilled)</span>
              </span>
            </div>
            <textarea
              rows={2}
              value={topicDescription}
              onChange={(e) => setTopicDescription(e.target.value)}
              placeholder="Topik utama prefilled dari prompt awal..."
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white/60 p-3 text-xs leading-relaxed text-foreground placeholder:text-zinc-400 outline-none focus:border-[#01AFAE] focus:ring-1 focus:ring-[#01AFAE] dark:border-white/10 dark:bg-zinc-900/60"
            />
          </div>

          {/* Cards Gambar 1 s/d N */}
          {Array.from({ length: params.images }, (_, i) => i + 1).map((num) => {
            const desc = imageDescriptions[num] || "";
            return (
              <div
                key={`gambar-card-${num}`}
                className="glass-panel angle-card rounded-2xl border border-zinc-200/90 dark:border-white/10 p-5 transition-all flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-[#01AFAE]/15 text-[#01AFAE] dark:text-[#7de9e6] px-2.5 py-1 text-xs font-semibold">
                      Gambar {num}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Detail visual gambar {num}...
                    </span>
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={desc}
                  onChange={(e) => updateImageDescription(num, e.target.value)}
                  placeholder={`Jelaskan objek, suasana, teks, dan komposisi untuk gambar ${num}...`}
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-white/60 p-3 text-xs leading-relaxed text-foreground placeholder:text-zinc-400 outline-none focus:border-[#01AFAE] focus:ring-1 focus:ring-[#01AFAE] dark:border-white/10 dark:bg-zinc-900/60"
                />
              </div>
            );
          })}
        </div>

        {/* Loading Progress Transition */}
        {loadingStoryboard && (
          <div className="w-full glass-panel angle-card rounded-2xl p-6 shadow-xl border border-zinc-200/80 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300 font-medium mb-3">
              <span className="flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-[#01AFAE] animate-spin" />
                <span>Menyiapkan Visual Brief & Variasi Gambar AI...</span>
              </span>
              <span>{storyboardProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full bg-[#01AFAE] transition-all duration-300 ease-out"
                style={{ width: `${storyboardProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Floating Bottom Dock (Figma 270:16445) */}
        {!loadingStoryboard && (
          <div className="fixed bottom-20 md:bottom-6 left-0 md:left-20 lg:left-64 right-0 z-40 px-4 pointer-events-none flex justify-center">
            <div className="w-full max-w-4xl pointer-events-auto">
              <div className="glass-panel angle-card w-full rounded-2xl p-4 px-6 flex items-center justify-between gap-4 shadow-2xl backdrop-blur-xl border border-zinc-200/90 dark:border-white/15 bg-white/95 dark:bg-zinc-900/95 animate-in slide-in-from-bottom-2 duration-300">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-[#01AFAE] hover:underline"
                >
                  Ubah pilihan
                </button>
                <button
                  type="button"
                  onClick={() => startLoadingToStoryboard(params.images, imageDescriptions)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#01AFAE] hover:bg-[#009b9a] px-6 py-2.5 text-xs font-bold text-white shadow-lg transition-all active:scale-95"
                >
                  <span>Buka Visual Brief</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3: VISUAL BRIEF & AI VARIATION (Figma 332:32994)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="mx-auto w-full max-w-5xl py-4 pb-36 animate-in fade-in duration-200">
      {/* Navigasi Kembali */}
      <div className="w-full shrink-0 mb-4">
        <button
          type="button"
          onClick={() => setStep(params.images === 1 ? 1 : 2)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors"
        >
          {params.images === 1 ? "← Kembali ke Brief" : "← Kembali ke Content Brief"}
        </button>
      </div>

      {/* ── Context & Brief Configuration Summary Bar (Figma #332:33799 / #355:3314) ── */}
      <div className="mb-6 rounded-2xl border border-zinc-200/90 bg-white/95 dark:border-white/10 dark:bg-zinc-900/90 p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-200/80 dark:divide-white/10 gap-4 md:gap-0">
          {/* Kolom 1: Konfigurasi Gambar */}
          <div className="flex flex-col gap-2 md:pr-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              IMAGE CONFIGURATION
            </span>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#002C22]/40 text-[#00D492] px-2 py-0.5 text-xs font-semibold border border-[#00D492]/20">
                <LayersIcon className="h-3 w-3" />
                <span>{params.images > 1 ? "Multiple Image" : "Single Image"}</span>
              </span>
              <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {cards.length} Slide
              </span>
              <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Rasio {params.ratio}
              </span>
              <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {params.style}
              </span>
            </div>
          </div>

          {/* Kolom 2: Topik */}
          <div className="flex flex-col gap-1.5 pt-3 md:pt-0 md:px-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              TOPIK
            </span>
            <p className="text-sm font-bold text-foreground line-clamp-2" title={topicDescription || prompt}>
              {topicDescription || prompt}
            </p>
          </div>

          {/* Kolom 3: Angle & Ubah Button */}
          <div className="flex flex-col justify-between gap-2 pt-3 md:pt-0 md:pl-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  ANGLE
                </span>
                <span className="inline-flex items-center rounded-full bg-[#01AFAE]/15 text-[#01AFAE] dark:text-[#7de9e6] px-2 py-0.5 text-[10px] font-bold">
                  Dipilih
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep(params.images > 1 ? 2 : 1)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#01AFAE] hover:text-[#009b9a] transition-colors"
              >
                <PencilIcon className="h-3 w-3" />
                <span>Ubah</span>
              </button>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 font-medium">
              <span className="font-bold text-foreground">{params.persona}:</span>{" "}
              {topicDescription || prompt}
            </p>
          </div>
        </div>

        {/* Quota Banner Sub-row */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-xs">
            <SparklesIcon className="h-3.5 w-3.5 text-[#01AFAE]" />
            <span>Maksimal 3x generate image (1/3 terpakai)</span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Perubahan visual brief akan disinkronkan otomatis ke Studio Canvas.
          </span>
        </div>
      </div>

      {/* Header Visual Brief */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Visual Brief
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Rangkaian slide visual untuk storytelling carousel.
          </p>

          {/* Metadata Chips (Aspect Ratio, Gambar Count) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center rounded-md bg-[#002C22]/40 text-[#00D492] px-2.5 py-1 text-xs font-medium border border-[#00D492]/20">
              Multiple Image
            </span>
            <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Aspect Ratio {params.ratio}
            </span>
            <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {cards.length} Slide
            </span>
          </div>
        </div>

        {/* Action Button: Unduh PDF */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => toast.success("PDF Visual Brief siap diunduh!")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 shadow-xs transition-colors hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            <span>Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* ── Cards List: Kolom Kiri Visual AI (Figma #355:3413) / Kolom Kanan Detail Teks ── */}
      <div className="flex flex-col gap-5">
        {cards.map((card, idx) => (
          <div
            key={card.id}
            className="rounded-2xl border border-zinc-200/90 bg-white/95 p-5 sm:p-6 shadow-xs dark:border-white/10 dark:bg-zinc-900/90 transition-all"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* ── Kolom Kiri: Visual Preview & AI Variations (5 Cols) (Figma #355:3413) ── */}
              <div className="md:col-span-5 flex flex-col gap-3">
                {/* Box Gambar Preview 9:16 atau 1:1 */}
                <div className="relative group w-full aspect-[9/14] sm:aspect-[9/12] max-h-[380px] overflow-hidden rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-950 shadow-xs">
                  <Image
                    src={card.imageUrl}
                    alt={`Visual Image ${card.id}`}
                    fill
                    className={cn(
                      "object-cover transition-transform duration-300 group-hover:scale-105",
                      card.isRegenerating && "opacity-40 filter blur-xs",
                    )}
                  />

                  {/* Overlay Badge Label AI Variasi */}
                  <div className="absolute top-3 right-3 z-20 pointer-events-none">
                    <span className="inline-flex items-center rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-md border border-white/10">
                      {card.variationName}
                    </span>
                  </div>

                  {/* Loading overlay jika sedang regenerate */}
                  {card.isRegenerating && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/60 text-white backdrop-blur-xs">
                      <SparklesIcon className="h-5 w-5 animate-spin text-[#01AFAE]" />
                      <span className="text-[11px] font-medium tracking-wide">
                        Menghasilkan variasi AI…
                      </span>
                    </div>
                  )}

                  {/* Tombol Ubah Gambar di Pojok Kiri Atas */}
                  <div className="absolute top-3 left-3 z-30" data-ubah-menu-container>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuCardId((prev) => (prev === card.id ? null : card.id))
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-black/80 px-2.5 py-1 text-[11px] font-medium text-white shadow-md backdrop-blur-md transition-all hover:bg-black active:scale-95"
                    >
                      <EditImageIcon className="h-3 w-3" />
                      <span>Ubah</span>
                      <ChevronDownIcon
                        className={cn(
                          "h-3 w-3 transition-transform duration-200",
                          openMenuCardId === card.id && "rotate-180",
                        )}
                      />
                    </button>

                    {/* Popover Menu */}
                    {openMenuCardId === card.id && (
                      <div className="absolute top-full left-0 mt-1.5 z-40 w-52 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150 dark:border-white/15 dark:bg-zinc-900">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCardForModal(card.id);
                            setSelectedAssetInModal(card.imageUrl);
                            setAssetModalTab("gallery");
                            setOpenMenuCardId(null);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <LibraryIcon className="h-3.5 w-3.5 text-zinc-500" />
                          <span>Pilih dari Magneto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCardForModal(card.id);
                            cardFileInputRef.current?.click();
                            setOpenMenuCardId(null);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <FolderIcon className="h-3.5 w-3.5 text-zinc-500" />
                          <span>Pilih dari Komputer</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRegenerateCardImage(card.id)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-[#01AFAE] hover:bg-[#01AFAE]/10 transition-colors"
                        >
                          <SparklesIcon className="h-3.5 w-3.5 text-[#01AFAE]" />
                          <span>Generate by AI</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3 Variasi Thumbnails + Status Kuota & Tombol Generate Lagi */}
                <div className="flex flex-col gap-2 pt-1">
                  {/* Thumbnail Row */}
                  <div className="flex items-center gap-2">
                    {card.variations.map((varImg, varIdx) => {
                      const isSelected = card.imageUrl === varImg;
                      return (
                        <button
                          key={`${varImg}-${varIdx}`}
                          type="button"
                          onClick={() => handleSelectVariation(card.id, varImg)}
                          className={cn(
                            "relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer shadow-2xs",
                            isSelected
                              ? "border-[#01AFAE] ring-2 ring-[#01AFAE]/30 scale-100"
                              : "border-transparent opacity-70 hover:opacity-100 hover:border-zinc-300 dark:hover:border-zinc-600",
                          )}
                        >
                          <Image
                            src={varImg}
                            alt={`Variasi ${varIdx + 1}`}
                            fill
                            className="object-cover"
                          />
                          {isSelected && (
                            <div className="absolute top-0.5 right-0.5 z-10 flex h-3 w-3 items-center justify-center rounded-full bg-[#01AFAE] text-white">
                              <CheckIcon className="h-2 w-2" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quota Text & Tombol Generate Lagi */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] text-zinc-400">
                      Maksimal 3x generate image (1/3 terpakai)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRegenerateCardImage(card.id)}
                      disabled={card.isRegenerating}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#01AFAE]/40 bg-[#01AFAE]/10 px-3 py-1 text-xs font-semibold text-[#01AFAE] hover:bg-[#01AFAE]/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <RefreshIcon className={cn("h-3 w-3", card.isRegenerating && "animate-spin")} />
                      <span>Generate Lagi</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Kolom Kanan: Detail Teks Slide (7 Cols) ── */}
              <div className="md:col-span-7 flex flex-col gap-3.5">
                <div className="flex items-center justify-between pb-1">
                  <span className="inline-flex items-center rounded-md bg-[#01AFAE]/15 text-[#01AFAE] dark:text-[#7de9e6] px-2.5 py-1 text-xs font-bold">
                    Visual Image {idx + 1}
                  </span>
                </div>

                {/* Input Teks Judul */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Headline / Judul
                  </label>
                  <input
                    type="text"
                    value={card.title}
                    onChange={(e) => updateCardField(card.id, "title", e.target.value)}
                    placeholder="Judul slide..."
                    className="w-full rounded-xl border border-zinc-200 bg-white/60 p-2.5 text-sm font-semibold text-foreground placeholder:text-zinc-400 outline-none focus:border-[#01AFAE] focus:ring-1 focus:ring-[#01AFAE] dark:border-white/10 dark:bg-zinc-800/60"
                  />
                </div>

                {/* Input Teks Deskripsi */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Deskripsi Konten
                  </label>
                  <textarea
                    rows={2}
                    value={card.description}
                    onChange={(e) => updateCardField(card.id, "description", e.target.value)}
                    placeholder="Rangkuman narasi untuk slide ini..."
                    className="w-full resize-none rounded-xl border border-zinc-200 bg-white/60 p-2.5 text-xs text-foreground placeholder:text-zinc-400 outline-none focus:border-[#01AFAE] focus:ring-1 focus:ring-[#01AFAE] dark:border-white/10 dark:bg-zinc-800/60"
                  />
                </div>

                {/* Prompt Hint Box */}
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 dark:border-white/5 dark:bg-zinc-800/40">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Rekomendasi Visual
                  </span>
                  <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                    {card.visualPrompt}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tombol Tambah Slide (Figma 270:17502) */}
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={handleAddSlide}
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-zinc-300 dark:border-white/20 bg-zinc-50/50 dark:bg-zinc-800/30 px-6 py-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:border-[#01AFAE] hover:text-[#01AFAE] transition-all"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Tambah Slide</span>
        </button>
      </div>

      {/* ── Section CAPTION REKOMENDASI (Figma 332:32994) ── */}
      <div className="mt-8 rounded-2xl border border-zinc-200/90 bg-white/95 p-6 shadow-xs dark:border-white/10 dark:bg-zinc-900/90 transition-all flex flex-col gap-4">
        <div className="flex items-center justify-between pb-1 border-b border-zinc-200/80 dark:border-white/10">
          <span className="text-xs font-bold tracking-wider uppercase text-zinc-400">
            CAPTION REKOMENDASI
          </span>
          <button
            type="button"
            onClick={handleRegenerateCaption}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-white/15 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshIcon className="h-3 w-3 text-zinc-400" />
            <span>Buat ulang</span>
          </button>
        </div>

        {/* Input Headline Caption */}
        <div className="flex flex-col gap-1">
          <input
            type="text"
            value={captionHeadline}
            onChange={(e) => setCaptionHeadline(e.target.value)}
            className="w-full text-base font-bold text-foreground bg-transparent outline-none border-0 focus:ring-0 p-0"
            placeholder="Judul / Headline caption..."
          />
        </div>

        {/* Textarea Body Caption */}
        <div className="flex flex-col gap-1">
          <textarea
            rows={3}
            value={captionBody}
            onChange={(e) => setCaptionBody(e.target.value)}
            className="w-full resize-none text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 bg-transparent outline-none border-0 focus:ring-0 p-0"
            placeholder="Isi narasi caption..."
          />
        </div>

        {/* Hashtags */}
        <div className="pt-2">
          <input
            type="text"
            value={captionHashtags}
            onChange={(e) => setCaptionHashtags(e.target.value)}
            className="w-full text-xs font-medium text-[#01AFAE] bg-transparent outline-none border-0 focus:ring-0 p-0"
            placeholder="#hashtag"
          />
        </div>
      </div>

      {/* ── Floating Bottom Dock (Figma 332:32994) ── */}
      <div className="fixed bottom-20 md:bottom-6 left-0 md:left-20 lg:left-64 right-0 z-40 px-4 pointer-events-none flex justify-center">
        <div className="w-full max-w-5xl pointer-events-auto">
          <div className="glass-panel angle-card w-full rounded-2xl p-4 px-6 flex items-center justify-between gap-4 shadow-2xl backdrop-blur-xl border border-zinc-200/90 dark:border-white/15 bg-white/95 dark:bg-zinc-900/95 animate-in slide-in-from-bottom-2 duration-300">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Visual Brief siap dialihkan ke Studio Canvas untuk konfigurasi lanjutan.
            </span>
            <button
              type="button"
              onClick={handleProceedToEditor}
              className="inline-flex items-center gap-2 rounded-full bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-100 dark:bg-white dark:text-zinc-900 px-6 py-2.5 text-xs font-bold shadow-lg transition-all active:scale-95 shrink-0"
            >
              <SparklesIcon className="h-4 w-4 text-[#01AFAE]" />
              <span>Lanjut ke Editor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input untuk Kartu */}
      <input
        type="file"
        ref={cardFileInputRef}
        accept="image/*"
        onChange={handleCardFileChange}
        className="hidden"
      />

      {/* ── Modal Pilih Gambar Magneto / Komputer ── */}
      {activeCardForModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel angle-card flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl p-6 shadow-2xl border border-zinc-200/90 dark:border-white/15 bg-white dark:bg-zinc-900">
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-white/10">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Pilih Gambar Aset Magneto
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Ganti visual gambar untuk Visual Image {activeCardForModal}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCardForModal(null);
                    setSelectedAssetInModal(null);
                  }}
                  className="rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplyAssetToCard}
                  disabled={!selectedAssetInModal}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#01AFAE] hover:bg-[#009b9a] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  <span>Terapkan ke Gambar</span>
                </button>
              </div>
            </div>

            {/* Tabs (Gallery / Upload) */}
            <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-white/10 pt-3">
              <button
                type="button"
                onClick={() => setAssetModalTab("gallery")}
                className={cn(
                  "pb-2.5 text-sm font-semibold transition-colors relative",
                  assetModalTab === "gallery"
                    ? "text-[#01AFAE]"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                Galeri Gambar Magneto
                {assetModalTab === "gallery" && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#01AFAE] rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setAssetModalTab("upload")}
                className={cn(
                  "pb-2.5 text-sm font-semibold transition-colors relative",
                  assetModalTab === "upload"
                    ? "text-[#01AFAE]"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                Upload Berkas
                {assetModalTab === "upload" && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#01AFAE] rounded-full" />
                )}
              </button>
            </div>

            {/* Konten Modal Berdasarkan Tab */}
            <div className="flex-1 min-h-0 overflow-y-auto py-4">
              {assetModalTab === "gallery" ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SAMPLE_GALLERY_ASSETS.map((asset) => {
                    const isSelected = selectedAssetInModal === asset.url;
                    return (
                      <div
                        key={asset.id}
                        onClick={() => setSelectedAssetInModal(asset.url)}
                        className={cn(
                          "group relative aspect-square overflow-hidden rounded-xl border transition-all cursor-pointer shadow-xs",
                          isSelected
                            ? "border-[#01AFAE] ring-2 ring-[#01AFAE]"
                            : "border-zinc-200 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20",
                        )}
                      >
                        <Image src={asset.url} alt={asset.title} fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                          <span className="text-[11px] font-medium text-white truncate">
                            {asset.title}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#01AFAE] text-white shadow-md">
                            <CheckIcon className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-2xl">
                  <UploadIcon className="h-8 w-8 text-zinc-400 mb-2" />
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Pilih gambar dari komputer Anda
                  </p>
                  <p className="text-xs text-zinc-500 mb-4">
                    Mendukung JPG, PNG, WEBP hingga 10MB
                  </p>
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    className="rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 text-xs font-semibold hover:bg-black transition-colors"
                  >
                    Pilih File
                  </button>
                  <input
                    type="file"
                    ref={modalFileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = URL.createObjectURL(file);
                      setSelectedAssetInModal(url);
                      toast.success(`File "${file.name}" siap diterapkan.`);
                    }}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

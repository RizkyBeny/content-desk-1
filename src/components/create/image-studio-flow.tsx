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

// ── Tipe & Data Bawaan ───────────────────────────────────────────────────────

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
  variations: string[];
  isRegenerating?: boolean;
};

const IMAGE_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10];
const RATIO_OPTIONS = ["1:1", "9:16", "16:9", "4:5"] as const;
const STYLE_OPTIONS = ["Cinematic", "3D Animation", "Realistis", "Vintage", "Minimalis", "Ilustrasi"] as const;
const PERSONA_OPTIONS = ["Informatif", "Formal", "Kasual", "Enerjik", "Storytelling", "Investigatif"] as const;

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
  "/seed/unsplash/abstract-13.jpg",
  "/seed/unsplash/abstract-14.jpg",
  "/seed/unsplash/abstract-15.jpg",
  "/seed/unsplash/abstract-16.jpg",
  "/seed/unsplash/abstract-17.jpg",
  "/seed/unsplash/abstract-18.jpg",
];

const SAMPLE_GALLERY_ASSETS = [
  { id: "a1", url: "/seed/unsplash/abstract-01.jpg", title: "Kopi Espresso & Gelas Air" },
  { id: "a2", url: "/seed/unsplash/abstract-02.jpg", title: "Mesin Espresso Komersial" },
  { id: "a3", url: "/seed/unsplash/abstract-03.jpg", title: "Ekstraksi Kopi Mengalir" },
  { id: "a4", url: "/seed/unsplash/abstract-04.jpg", title: "Suasana Hangat Kafe Pagi" },
  { id: "a5", url: "/seed/unsplash/abstract-05.jpg", title: "Penyajian Kopi Latte Art" },
  { id: "a6", url: "/seed/unsplash/abstract-06.jpg", title: "Biji Kopi Sangrai Premium" },
  { id: "a7", url: "/seed/unsplash/abstract-07.jpg", title: "Cangkir Keramik Minimalis" },
  { id: "a8", url: "/seed/unsplash/abstract-08.jpg", title: "Interior Coffee Shop Modern" },
  { id: "a9", url: "/seed/unsplash/abstract-09.jpg", title: "Kopi Pour Over Manual Brew" },
  { id: "a10", url: "/seed/unsplash/abstract-10.jpg", title: "Barista Menyeduh Espresso" },
  { id: "a11", url: "/seed/unsplash/abstract-11.jpg", title: "Detail Crema Espresso Tebal" },
  { id: "a12", url: "/seed/unsplash/abstract-12.jpg", title: "Area Meja Bar Kayu Alami" },
];

// ── Dropdown Filter Component (Disamakan dengan Video Studio Flow) ───────────

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
                <span>{typeof opt === "number" ? `${opt} Gambar` : String(opt)}</span>
                {opt === value && <CheckIcon className="h-3.5 w-3.5 text-brand" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Image Studio Flow Component ────────────────────────────────────────

export function ImageStudioFlow({
  items = [],
  canModerate,
}: {
  items?: GenerationDTO[];
  canModerate?: boolean;
}) {
  const router = useRouter();

  // 0: Entry Point, 1: Buat Image (Composer), 2: Asisten AI (khusus >=2 gambar), 3: Visual Brief (Figma 985:9029)
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  // Bersih dari teks predefined: user memasukkan teksnya sendiri
  const [prompt, setPrompt] = useState("");

  const [params, setParams] = useState<ImageProductionParams>({
    images: 3,
    ratio: "9:16",
    style: "Cinematic",
    persona: "Investigatif",
  });
  const [attachment, setAttachment] = useState<{ name: string; url: string } | null>(null);

  // Asisten AI Chat state (Step 2)
  const [conceptChoice, setConceptChoice] = useState<"scratch" | "existing" | null>(null);
  const [assistantReplied, setAssistantReplied] = useState(false);
  const [topicDescription, setTopicDescription] = useState("");
  const [imageDescriptions, setImageDescriptions] = useState<Record<number, string>>({});
  const [activeAccordion, setActiveAccordion] = useState<string | null>("topic");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Loading transition (Step 1/2 -> Step 3)
  const [loadingStoryboard, setLoadingStoryboard] = useState(false);
  const [storyboardProgress, setStoryboardProgress] = useState(0);

  // Detail Modal untuk Entry Point Reference Output
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationDTO | null>(null);

  // Ref file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);

  // State kartu storyboard gambar (Figma 985:9029)
  const [cards, setCards] = useState<StoryboardImageCard[]>([]);
  const [activeCardForModal, setActiveCardForModal] = useState<number | null>(null);
  const [selectedAssetInModal, setSelectedAssetInModal] = useState<string | null>(null);
  const [assetModalTab, setAssetModalTab] = useState<"gallery" | "upload">("gallery");

  // Dropdown menu "Ubah Gambar" popover (per kartu ID)
  const [openMenuCardId, setOpenMenuCardId] = useState<number | null>(null);

  // Auto-scroll untuk Step 2 (Asisten AI)
  useEffect(() => {
    if (step === 2) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [step, conceptChoice, assistantReplied, activeAccordion, loadingStoryboard]);

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

  // ── AI Prefill Generator Cerdas (Anotasi Figma: "Harusnya field ini prefilled dari AI sistemnya") ──
  function buildAIPrefilledCards(count: number, customDescriptions: Record<number, string> = {}): StoryboardImageCard[] {
    const baseTopic = (prompt.trim() || topicDescription.trim() || "Rahasia Kopi Enak Ala Kafe!").trim();
    const cleanTopic = baseTopic.replace(/[#*`]/g, "");

    const narrativeTemplates = [
      {
        titleSuffix: "Rahasia Utama Terungkap! ☕️",
        desc: "Langkah mendasar yang sering dilewatkan namun menentukan 80% hasil akhir kualitas visual dan rasa.",
        promptDetail: `A sleek commercial espresso machine on a coffee bar counter, with a subtle glowing 3D technical cutaway diagram overlay showing the copper internal boiler heating water. Digital graphic overlay showing "90°C - 96°C". Photorealistic stainless steel reflections, warm ambient lighting, highly detailed, 8k resolution`,
      },
      {
        titleSuffix: "Faktor Kunci & Kesalahan Umum",
        desc: "Mengapa banyak yang gagal di tahap awal dan bagaimana menghindari penurunan konsistensi sejak awal.",
        promptDetail: `Macro close-up shot of rich golden crema flowing from a bottomless portafilter into a clear tempered glass cup. Volumetric steam swirls, warm dramatic side rim lighting, cinematic depth of field, 8k resolution`,
      },
      {
        titleSuffix: "Penerapan & Solusi Praktis",
        desc: "Teknik terukur yang dapat langsung diaplikasikan untuk peningkatan performa secara instan.",
        promptDetail: `Top-down minimalist flatlay of freshly roasted specialty coffee beans on dark slate counter with precision digital scale, timer, and artisan ceramic coffee cup, soft natural morning window light, high sharpness, photorealistic`,
      },
      {
        titleSuffix: "Optimasi Lanjutan & Eksplorasi",
        desc: "Langkah penyempurnaan profesional yang membedakan kualitas standar dengan hasil level premium.",
        promptDetail: `Atmospheric modern urban coffee lab interior with warm amber accent lights, barista expertly adjusting commercial grinder, moody cinematic depth of field, photorealistic, 8k resolution`,
      },
      {
        titleSuffix: "Kesimpulan & Langkah Selanjutnya",
        desc: "Rangkuman lengkap dan panduan aksi cepat yang siap dibagikan kepada audiens Anda.",
        promptDetail: `Stylized aesthetic coffee shop table setup with notebook, sleek smartphone displaying analytics chart, and ceramic mug emitting steam, cozy ambient interior lighting, ultra-detailed`,
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

      const tmpl = narrativeTemplates[(i - 1) % narrativeTemplates.length];

      // Judul prefilled
      const cardTitle =
        count === 1
          ? cleanTopic.length > 40 ? `${cleanTopic.slice(0, 40)}...` : cleanTopic
          : i === 1
            ? cleanTopic.length > 35 ? `${cleanTopic.slice(0, 35)}...` : cleanTopic
            : `${i}. ${tmpl.titleSuffix}`;

      // Deskripsi prefilled
      const cardDesc = userDesc || tmpl.desc;

      // Visual prompt prefilled
      const cardVisual = userDesc
        ? `A photorealistic scene showing "${userDesc}" with ${params.style.toLowerCase()} styling, ambient lighting, high detail, 8k resolution`
        : tmpl.promptDetail;

      result.push({
        id: i,
        title: cardTitle,
        description: cardDesc,
        visualPrompt: cardVisual,
        imageUrl: baseImg,
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
    setStoryboardProgress(15);

    const t1 = setTimeout(() => setStoryboardProgress(45), 300);
    const t2 = setTimeout(() => setStoryboardProgress(75), 650);
    const t3 = setTimeout(() => setStoryboardProgress(95), 1000);
    const t4 = setTimeout(() => {
      setStoryboardProgress(100);
      setLoadingStoryboard(false);
      setStep(3);
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }

  // ── Penanganan Submit Step 1 Sesuai Alur Figma 985:9029 ────────────────────
  function handlePromptSubmit() {
    if (!prompt.trim()) {
      toast.danger("Mohon masukkan konsep atau brief gambar terlebih dahulu.");
      return;
    }

    if (params.images === 1) {
      // ── BARIS 1 FIGMA (Single Image): Langsung loading ke Visual Brief (tanpa asisten) ──
      startLoadingToStoryboard(1, {});
    } else {
      // ── BARIS 2 & 3 FIGMA (Multi Image): Masuk ke Asisten AI (Step 2) ──
      // Anotasi Figma: "Topik ini udah prefilled"
      setTopicDescription(prompt.trim());
      setConceptChoice(null);
      setAssistantReplied(false);
      setImageDescriptions({});
      setActiveAccordion("topic");
      setStep(2);
    }
  }

  // ── Penanganan Pilihan Konsep di Step 2 ───────────────────────────────────
  function handleSelectConcept(choice: "scratch" | "existing") {
    setConceptChoice(choice);

    if (choice === "scratch") {
      // ── BARIS 2 FIGMA: "Bantu susun dari awal AI membuat rekomendasi" ──
      // Anotasi Figma: "Ketika ada di step ini, harusnya field ini prefilled dari AI sistemnya sih"
      setTimeout(() => {
        setAssistantReplied(true);
      }, 300);
    } else {
      // ── BARIS 3 FIGMA: "Aku sudah punya konsep, Lengkapi detail scene" ──
      setTimeout(() => {
        setAssistantReplied(true);
        setActiveAccordion("topic");
      }, 300);
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
    }, 850);
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
    try {
      await put("/api/creations/canvas-1", {
        type: "carousel",
        ratio: params.ratio,
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
  // STEP 0: ENTRY POINT (Disamakan dengan Video Studio Flow)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 0) {
    const completedImages = items.filter(
      (item) => item.status === "completed" && (item.thumbnailUrl || item.fileUrl),
    );

    return (
      <div className="space-y-8 py-2 pb-10 animate-in fade-in duration-200">
        {/* Hero Section dengan Tombol CTA angle-card */}
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
              className="angle-card relative inline-flex items-center justify-center gap-2 rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-brand-hover"
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
              <SparklesIcon className="h-4 w-4 text-brand" />
              <span>Mode AI</span>
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

            {/* Tombol Kirim / Buat Konten */}
            <button
              type="button"
              onClick={handlePromptSubmit}
              disabled={loadingStoryboard}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[#202020] px-5 text-sm font-medium text-white shadow-sm transition-all hover:bg-black active:scale-95 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
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

        {/* Loading Progress Transition (Single Image -> Visual Brief) */}
        {loadingStoryboard && (
          <div className="w-full glass-panel angle-card rounded-2xl p-6 shadow-xl border border-zinc-200/80 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300 font-medium mb-3">
              <span className="flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-brand animate-spin" />
                <span>Menyiapkan Visual Brief & Variasi Gambar AI...</span>
              </span>
              <span>{storyboardProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full bg-brand transition-all duration-300 ease-out"
                style={{ width: `${storyboardProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2: ASISTEN AI (Wireframe - 30 & Skenario 1 / 2)
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
            Buat Gambar
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Template produksi gambar siap diisi untuk semua jenis konten.
          </p>
        </header>

        {/* Chat Thread */}
        <div className="flex w-full flex-col gap-4 py-2">
          {/* User Message Bubble */}
          <div className="flex justify-end">
            <div className="glass-panel angle-card max-w-2xl rounded-2xl rounded-tr-sm p-4 text-[14px] leading-relaxed text-zinc-800 dark:text-zinc-100 transition-all duration-300">
              <p className="whitespace-pre-line">{prompt}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-200/60 dark:border-white/10 text-[11px] text-zinc-500 dark:text-zinc-400">
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

          {/* Assistant Message 1 */}
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
                  Kamu sudah punya konsep visual per-gambar, atau ingin aku bantu menyusunnya dari awal?
                </p>
                <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-xs">
                  Pilih jawaban yang paling sesuai agar hasil visual {params.images} gambar lebih terarah dan sesuai ekspektasimu.
                </p>
              </div>
            </div>
          </div>

          {/* User Selection Chip */}
          {conceptChoice && (
            <div className="flex justify-end animate-in fade-in duration-200">
              <div className="glass-panel angle-card rounded-2xl rounded-tr-sm border-brand/30 bg-brand/10 text-brand-strong p-3.5 text-[14px] font-medium dark:bg-brand/20 dark:text-brand-light transition-all duration-300">
                {conceptChoice === "scratch"
                  ? "Bantu susun dari awal AI membuat rekomendasi"
                  : "Aku sudah punya konsep, Lengkapi detail scene"}
              </div>
            </div>
          )}

          {/* Assistant Reply 2 */}
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
                  {conceptChoice === "scratch" ? (
                    <p>
                      Tenang, aku sudah menganalisis konsepmu dan menyiapkan rekomendasi otomatis lengkap dengan teks judul, deskripsi, dan prompt visual untuk setiap slide carousel.
                    </p>
                  ) : (
                    <p>
                      Bagus! Topik utamamu sudah terisi otomatis. Silakan lengkapi detail deskripsi untuk masing-masing adegan agar hasil visual sesuai dengan ekspektasimu:
                    </p>
                  )}
                </div>

                {/* Skenario 1 (Bantu susun dari awal): Tombol langsung Buka Visual Brief dengan AI Prefilled */}
                {conceptChoice === "scratch" && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => startLoadingToStoryboard(params.images, {})}
                      disabled={loadingStoryboard}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover active:scale-95 disabled:opacity-50"
                    >
                      <SparklesIcon className="h-4 w-4" />
                      <span>Buka Visual Brief</span>
                      <span>→</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skenario 2: Accordion Input Gambar (Topik udah prefilled sesuai catatan Figma!) */}
          {conceptChoice === "existing" && assistantReplied && !loadingStoryboard && (
            <div className="flex flex-col gap-3 pt-3 animate-in fade-in duration-300">
              {/* Accordion Item: Topic (Anotasi Figma: "Topik ini udah prefilled") */}
              <div className="glass-panel angle-card rounded-2xl border border-zinc-200/90 dark:border-white/10 transition-all duration-300 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveAccordion((prev) => (prev === "topic" ? null : "topic"))}
                  className="flex w-full items-center justify-between p-4 text-left font-medium transition-colors hover:bg-zinc-50/60 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      <ImageIcon className="h-3.5 w-3.5 text-brand" />
                      <span>Topik Utama (Prefilled)</span>
                    </span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-[280px] sm:max-w-md">
                      {topicDescription || prompt}
                    </span>
                  </div>
                  <ChevronDownIcon
                    className={cn(
                      "h-4 w-4 text-zinc-400 transition-transform duration-200",
                      activeAccordion === "topic" && "rotate-180",
                    )}
                  />
                </button>
                {activeAccordion === "topic" && (
                  <div className="p-4 pt-0 border-t border-zinc-200/60 dark:border-white/10 mt-1">
                    <textarea
                      rows={3}
                      value={topicDescription}
                      onChange={(e) => setTopicDescription(e.target.value)}
                      placeholder="Topik utama prefilled dari prompt awal..."
                      className="w-full resize-none rounded-xl border border-zinc-200 bg-white/60 p-3 text-xs text-foreground placeholder:text-zinc-400 outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-white/10 dark:bg-zinc-900/60"
                    />
                  </div>
                )}
              </div>

              {/* Accordion Items: Gambar 1 s/d N */}
              {Array.from({ length: params.images }, (_, i) => i + 1).map((num) => {
                const key = `img-${num}`;
                const isOpen = activeAccordion === key;
                const desc = imageDescriptions[num] || "";

                return (
                  <div
                    key={key}
                    className="glass-panel angle-card rounded-2xl border border-zinc-200/90 dark:border-white/10 transition-all duration-300 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveAccordion((prev) => (prev === key ? null : key))}
                      className="flex w-full items-center justify-between p-4 text-left font-medium transition-colors hover:bg-zinc-50/60 dark:hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand dark:bg-brand/20 dark:text-brand-light">
                          <span>Gambar {num}</span>
                        </span>
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-[280px] sm:max-w-md">
                          {desc || `Detail visual gambar ${num}...`}
                        </span>
                      </div>
                      <ChevronDownIcon
                        className={cn(
                          "h-4 w-4 text-zinc-400 transition-transform duration-200",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="p-4 pt-0 border-t border-zinc-200/60 dark:border-white/10 mt-1">
                        <textarea
                          rows={3}
                          value={desc}
                          onChange={(e) => updateImageDescription(num, e.target.value)}
                          placeholder={`Jelaskan objek, suasana, teks, dan komposisi untuk gambar ${num}...`}
                          className="w-full resize-none rounded-xl border border-zinc-200 bg-white/60 p-3 text-xs text-foreground placeholder:text-zinc-400 outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-white/10 dark:bg-zinc-900/60"
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Tombol Lanjut ke Visual Brief setelah mengisi accordion */}
              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => startLoadingToStoryboard(params.images, imageDescriptions)}
                  disabled={loadingStoryboard}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-brand-hover active:scale-95 disabled:opacity-50"
                >
                  <SparklesIcon className="h-4 w-4" />
                  <span>Buka Visual Brief</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* Anchor Auto-scroll */}
          <div
            ref={chatEndRef}
            className="scroll-mb-72 md:scroll-mb-80 h-px w-full pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            STICKY / FIXED BOTTOM DOCK (Figma Node 80:16790)
            Menampung kartu pilihan radio konsep sesuai desain Figma 80:16790
           ══════════════════════════════════════════════════════════════════ */}
        {!loadingStoryboard && (
          <div className="fixed bottom-20 md:bottom-4 left-0 right-0 md:left-16 lg:left-64 z-30 px-3 sm:px-4 pointer-events-none transition-all duration-300">
            <div className="mx-auto w-full max-w-4xl pointer-events-auto">
              {!assistantReplied ? (
                /* KARTU PILIHAN KONSEP (FIGMA 80:16790) */
                <div className="glass-panel angle-card w-full rounded-2xl p-6 shadow-2xl backdrop-blur-xl border border-zinc-200/90 dark:border-white/15 bg-white/95 dark:bg-zinc-900/95 transition-all duration-300">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3">
                    Kamu sudah punya konsep scene-by-scene, atau ingin aku bantu menyusunnya dari awal?
                  </h3>
                  <div className="h-px w-full bg-zinc-200/80 dark:bg-white/10 mb-4" />

                  <div className="flex flex-col gap-3">
                    {/* Opsi 1 */}
                    <button
                      type="button"
                      onClick={() => handleSelectConcept("existing")}
                      className={cn(
                        "flex w-full items-center gap-3.5 rounded-xl p-4 text-left transition-all duration-200 border",
                        conceptChoice === "existing"
                          ? "border-2 border-brand bg-brand/5 dark:bg-brand/10"
                          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-white/10 dark:bg-zinc-900/60 dark:hover:border-white/20",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                          conceptChoice === "existing"
                            ? "border-2 border-brand"
                            : "border-2 border-zinc-300 dark:border-zinc-600",
                        )}
                      >
                        {conceptChoice === "existing" && <div className="h-2.5 w-2.5 rounded-full bg-brand" />}
                      </div>
                      <span
                        className={cn(
                          "text-sm text-foreground",
                          conceptChoice === "existing" ? "font-semibold" : "font-medium",
                        )}
                      >
                        Aku sudah punya konsep, Lengkapi detail scene
                      </span>
                    </button>

                    {/* Opsi 2 */}
                    <button
                      type="button"
                      onClick={() => handleSelectConcept("scratch")}
                      className={cn(
                        "flex w-full items-center gap-3.5 rounded-xl p-4 text-left transition-all duration-200 border",
                        conceptChoice === "scratch"
                          ? "border-2 border-brand bg-brand/5 dark:bg-brand/10"
                          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-white/10 dark:bg-zinc-900/60 dark:hover:border-white/20",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                          conceptChoice === "scratch"
                            ? "border-2 border-brand"
                            : "border-2 border-zinc-300 dark:border-zinc-600",
                        )}
                      >
                        {conceptChoice === "scratch" && <div className="h-2.5 w-2.5 rounded-full bg-brand" />}
                      </div>
                      <span
                        className={cn(
                          "text-sm text-foreground",
                          conceptChoice === "scratch" ? "font-semibold" : "font-medium",
                        )}
                      >
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
                    onClick={() => startLoadingToStoryboard(params.images, imageDescriptions)}
                    disabled={loadingStoryboard}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-brand-hover active:scale-95 disabled:opacity-50"
                  >
                    <SparklesIcon className="h-4 w-4" />
                    <span>Buka Visual Brief</span>
                    <span>→</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3: VISUAL BRIEF (Figma Wireframe - 31, 32, 33 Mandiri Sesuai 985:9029)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="mx-auto w-full max-w-5xl py-4 pb-16 animate-in fade-in duration-200">
      {/* Navigasi Kembali */}
      <div className="w-full shrink-0 mb-4">
        <button
          type="button"
          onClick={() => setStep(params.images === 1 ? 1 : 2)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors"
        >
          {params.images === 1 ? "← Kembali ke Brief" : "← Kembali ke Asisten AI"}
        </button>
      </div>

      {/* ── Header Visual Brief (Figma 985:9029) ─────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Visual Brief
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Template produksi gambar siap diisi untuk semua jenis konten.
          </p>

          {/* Metadata Chips (Aspect Ratio, Durasi/Estimasi, Scene Count) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Aspect Ratio {params.ratio}
            </span>
            <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              60 detik
            </span>
            <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {cards.length} Scene / Gambar
            </span>
          </div>
        </div>

        {/* Action Buttons: Unduh PDF & Lanjut ke Editor */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => toast.success("PDF Visual Brief siap diunduh!")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 shadow-xs transition-colors hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            <span>Unduh PDF</span>
          </button>
          <button
            type="button"
            onClick={handleProceedToEditor}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F0F0F] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-black active:scale-95 dark:bg-brand dark:hover:bg-brand-hover dark:text-white"
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            <span>Lanjut ke Editor</span>
          </button>
        </div>
      </div>

      {/* ── Cards List: Visual Image 1 s/d N (Figma 1010:27225) ───────────── */}
      <div className="flex flex-col gap-5">
        {cards.map((card) => (
          <div
            key={card.id}
            className="rounded-2xl border border-zinc-200/90 bg-white/95 p-5 sm:p-6 shadow-xs dark:border-white/10 dark:bg-zinc-900/90 transition-all"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* ── Kolom Kiri: Visual Image Preview + Ubah Gambar + Multi-Regenerate AI (5 Cols) ── */}
              <div className="md:col-span-5 flex flex-col gap-3">
                {/* Box Gambar Preview */}
                <div className="relative group w-full aspect-[16/10] overflow-hidden rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-900 shadow-xs">
                  <Image
                    src={card.imageUrl}
                    alt={`Visual Image ${card.id}`}
                    fill
                    className={cn(
                      "object-cover transition-transform duration-300 group-hover:scale-105",
                      card.isRegenerating && "opacity-40 filter blur-xs",
                    )}
                  />

                  {/* Loading overlay jika sedang regenerate */}
                  {card.isRegenerating && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/60 text-white backdrop-blur-xs">
                      <SparklesIcon className="h-5 w-5 animate-spin text-brand" />
                      <span className="text-[11px] font-medium tracking-wide">
                        Menghasilkan variasi AI…
                      </span>
                    </div>
                  )}

                  {/* Tombol Ubah Gambar Melayang di Pojok Kiri Atas */}
                  <div className="absolute top-3 left-3 z-30" data-ubah-menu-container>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuCardId((prev) => (prev === card.id ? null : card.id))
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-black/80 px-3 py-1.5 text-xs font-medium text-white shadow-md backdrop-blur-md transition-all hover:bg-black active:scale-95"
                    >
                      <EditImageIcon className="h-3 w-3" />
                      <span>Ubah Gambar</span>
                      <ChevronDownIcon
                        className={cn(
                          "h-3 w-3 transition-transform duration-200",
                          openMenuCardId === card.id && "rotate-180",
                        )}
                      />
                    </button>

                    {/* Dropdown Popover Menu (Pilih Magneto / Perangkat / Generate AI) */}
                    {openMenuCardId === card.id && (
                      <div className="absolute top-full left-0 mt-1.5 z-40 w-56 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150 dark:border-white/15 dark:bg-zinc-900">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCardForModal(card.id);
                            setSelectedAssetInModal(card.imageUrl);
                            setAssetModalTab("gallery");
                            setOpenMenuCardId(null);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <LibraryIcon className="h-4 w-4 text-zinc-500" />
                          <span>Pilih dari Magneto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCardForModal(card.id);
                            cardFileInputRef.current?.click();
                            setOpenMenuCardId(null);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <FolderIcon className="h-4 w-4 text-zinc-500" />
                          <span>Pilih dari Perangkat Saya</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRegenerateCardImage(card.id)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-brand hover:bg-brand/10 dark:hover:bg-brand/20 transition-colors"
                        >
                          <SparklesIcon className="h-4 w-4 text-brand" />
                          <span>Generate by AI</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Baris Thumbnail "Generate Image by AI" (Figma 1010:27225) */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      Generate Image by AI
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {card.variations.length} variasi
                    </span>
                  </div>

                  {/* Thumbnail Scroll Tray + Tombol Regenerate */}
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {card.variations.map((varImg, varIdx) => {
                      const isSelected = card.imageUrl === varImg;
                      return (
                        <button
                          key={`${varImg}-${varIdx}`}
                          type="button"
                          onClick={() => handleSelectVariation(card.id, varImg)}
                          className={cn(
                            "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer shadow-2xs",
                            isSelected
                              ? "border-brand ring-2 ring-brand/40 scale-100"
                              : "border-transparent opacity-75 hover:opacity-100 hover:border-zinc-300 dark:hover:border-zinc-600",
                          )}
                        >
                          <Image
                            src={varImg}
                            alt={`Variasi ${varIdx + 1}`}
                            fill
                            className="object-cover"
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand text-white shadow-xs">
                              <CheckIcon className="h-2.5 w-2.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}

                    {/* Shimmering placeholder saat sedang regenerate */}
                    {card.isRegenerating && (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-brand/50 bg-brand/10 animate-pulse flex items-center justify-center text-brand">
                        <SparklesIcon className="h-4 w-4 animate-spin" />
                      </div>
                    )}

                    {/* Tombol + Regenerate Langsung */}
                    <button
                      type="button"
                      onClick={() => handleRegenerateCardImage(card.id)}
                      disabled={card.isRegenerating}
                      className="inline-flex h-14 items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/80 px-2.5 text-[11px] font-medium text-zinc-600 hover:border-brand hover:bg-brand/5 hover:text-brand transition-all dark:border-white/15 dark:bg-zinc-800/40 dark:text-zinc-400 dark:hover:border-brand dark:hover:text-brand-light shrink-0 disabled:opacity-50"
                      title="Regenerate variasi gambar baru dengan AI"
                    >
                      <SparklesIcon className="h-3.5 w-3.5 text-brand" />
                      <span>+ Regenerate</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Kolom Kanan: Input Judul, Deskripsi, dan Visual (7 Cols - Prefilled AI) ── */}
              <div className="md:col-span-7 flex flex-col gap-3.5">
                {/* Header Kartu: Judul + Badge Draft */}
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-base font-bold text-foreground">
                    Visual Image {card.id}
                  </h3>
                  <span className="rounded-md bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    Draft
                  </span>
                </div>

                {/* Field 1: Text Judul Di gambar (Prefilled!) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Text Judul Di gambar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={card.title}
                    onChange={(e) => updateCardField(card.id, "title", e.target.value)}
                    placeholder="Rahasia Kopi Enak Ala Kafe! ☕️"
                    className="w-full rounded-xl border border-zinc-200 bg-white/70 px-3.5 py-2.5 text-xs text-foreground placeholder:text-zinc-400 outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-white/10 dark:bg-zinc-900/60"
                  />
                </div>

                {/* Field 2: Text Deskripsi Di gambar (Prefilled!) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Text Deskripsi Di gambar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={card.description}
                    onChange={(e) => updateCardField(card.id, "description", e.target.value)}
                    placeholder="Deskripsi poin penting teks pada gambar..."
                    className="w-full rounded-xl border border-zinc-200 bg-white/70 px-3.5 py-2.5 text-xs text-foreground placeholder:text-zinc-400 outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-white/10 dark:bg-zinc-900/60"
                  />
                </div>

                {/* Field 3: Visual Prompt (Prefilled!) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Visual <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={card.visualPrompt}
                    onChange={(e) => updateCardField(card.id, "visualPrompt", e.target.value)}
                    placeholder="Prompt detail visual untuk generator AI..."
                    className="w-full resize-none rounded-xl border border-zinc-200 bg-white/70 px-3.5 py-2.5 text-xs text-foreground placeholder:text-zinc-400 outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-white/10 dark:bg-zinc-900/60 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* Hidden File Input untuk Opsi "Pilih dari Perangkat Saya" */}
      <input
        type="file"
        ref={cardFileInputRef}
        accept="image/*"
        onChange={handleCardFileChange}
        className="hidden"
      />

      {/* ── MODAL PILIH MEDIA ASET MAGNETO ─────────────────────────────────── */}
      {activeCardForModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-2xl max-h-[90vh] flex flex-col justify-between animate-in zoom-in-95 duration-200 dark:border-white/15 dark:bg-zinc-900">
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
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand hover:bg-brand-hover px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
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
                    ? "text-brand"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                Galeri Gambar Magneto
                {assetModalTab === "gallery" && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setAssetModalTab("upload")}
                className={cn(
                  "pb-2.5 text-sm font-semibold transition-colors relative",
                  assetModalTab === "upload"
                    ? "text-brand"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                Upload Berkas
                {assetModalTab === "upload" && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand rounded-full" />
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
                            ? "border-brand ring-2 ring-brand"
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
                          <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white shadow-md">
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

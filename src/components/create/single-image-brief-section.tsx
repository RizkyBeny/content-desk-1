"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { toast } from "@heroui/react";
import { cn } from "@/lib/utils";
import {
  CheckIcon,
  DownloadIcon,
  LayersIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  SparkIcon,
  UploadIcon,
  XIcon,
} from "@/components/ui/icons";

export interface SingleImageBriefSectionProps {
  initialTopic?: string;
  initialVisualPrompt?: string;
  ratio?: "9:16" | "1:1" | "16:9" | "4:5";
  style?: string;
  persona?: string;
  onOpenEditor: () => void;
  isNavigatingEditor?: boolean;
}

interface ImageVariationItem {
  id: string;
  url: string;
  title: string;
}

const SAMPLE_GALLERY_ASSETS = [
  { id: "a1", url: "/post-media/card-1.png", title: "AI Variasi: Liputan Investigasi #1" },
  { id: "a2", url: "/post-media/card-2.png", title: "AI Variasi: Sorotan Fakta #2" },
  { id: "a3", url: "/post-media/card-3.png", title: "AI Variasi: Standarisasi & Data #3" },
  { id: "a4", url: "/seed/unsplash/abstract-03.jpg", title: "AI Variasi: Nuansa Visual Editorial #4" },
  { id: "a5", url: "/seed/unsplash/abstract-01.jpg", title: "Latar Abstrak Editorial 01" },
  { id: "a6", url: "/seed/unsplash/abstract-02.jpg", title: "Latar Abstrak Editorial 02" },
];

export function SingleImageBriefSection({
  initialTopic = "Jelaskan Kasus Korupsi Indonesia Dalam 60 Detik.",
  initialVisualPrompt = "Buka dengan visual headline menohok kasus korupsi indonesia, suasana dramatis jurnalistik investigasi, pencahayaan kontras tinggi.",
  ratio = "9:16",
  style = "Cinematic",
  persona = "Investigatif",
  onOpenEditor,
  isNavigatingEditor = false,
}: SingleImageBriefSectionProps) {
  // Step state: 2 = Content Brief, 3 = Visual Brief (Figma 355-4587)
  const [step, setStep] = useState<2 | 3>(3);

  // Content Brief Inputs
  const [topicDescription, setTopicDescription] = useState(initialTopic);
  const [imageDescription, setImageDescription] = useState(initialVisualPrompt);

  // Form Fields Kanan (Figma 355-4587)
  const [textJudul, setTextJudul] = useState("KASUS KORUPSI TERBESAR TAHUN INI");
  const [textDeskripsi, setTextDeskripsi] = useState(
    "Redaksi kumparan merangkum fakta aliran dana mencurigakan dan bukti dokumen audit forensik.",
  );

  // Loading animation state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // State Hasil Generate Image (Maksimal 3 slot)
  const [variations, setVariations] = useState<ImageVariationItem[]>([
    {
      id: "var-1",
      url: "/post-media/card-1.png",
      title: "AI Variasi: Liputan Investigasi #1",
    },
  ]);
  const [selectedVariationIdx, setSelectedVariationIdx] = useState<number>(0);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);

  // Asset picker modal state
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetModalTab, setAssetModalTab] = useState<"gallery" | "upload">("gallery");
  const [selectedAssetUrl, setSelectedAssetUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Caption recommendations
  const [captionHeadline, setCaptionHeadline] = useState(initialTopic);
  const [captionBody, setCaptionBody] = useState(
    "Kabar terkini soal Kasus Korupsi Indonesia yang perlu kamu tahu. Redaksi kumparan merangkum fakta dan kronologinya. Simak selengkapnya.",
  );
  const [captionHashtags, setCaptionHashtags] = useState(
    "#beritaterkini #kumparan #kabar #kasus #korupsi #indonesia",
  );

  const activeImage = variations[selectedVariationIdx]?.url || "/post-media/card-1.png";
  const activeTitle = variations[selectedVariationIdx]?.title || "AI Variasi #1";

  function startGenerateVisualBrief() {
    if (!imageDescription.trim()) {
      toast.danger("Mohon isi deskripsi visual terlebih dahulu.");
      return;
    }
    setLoading(true);
    setProgress(15);

    const t1 = setTimeout(() => setProgress(55), 300);
    const t2 = setTimeout(() => setProgress(88), 650);
    const t3 = setTimeout(() => {
      setProgress(100);
      setLoading(false);
      setStep(3);
      toast.success("Visual Brief & Variasi Gambar AI siap disunting!");
    }, 950);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }

  function handleGenerateMore() {
    if (variations.length >= 3) {
      toast.info("Maksimal 3 variasi gambar telah terpakai.");
      return;
    }
    setIsGeneratingMore(true);
    setTimeout(() => {
      const nextIdx = variations.length;
      const nextAsset =
        SAMPLE_GALLERY_ASSETS[nextIdx % SAMPLE_GALLERY_ASSETS.length] ||
        SAMPLE_GALLERY_ASSETS[0];
      const newItem: ImageVariationItem = {
        id: `var-${Date.now()}`,
        url: nextAsset.url,
        title: `AI Variasi: Sorotan Fakta #${nextIdx + 1}`,
      };
      setVariations((prev) => [...prev, newItem]);
      setSelectedVariationIdx(nextIdx);
      setIsGeneratingMore(false);
      toast.success(`Variasi #${nextIdx + 1} berhasil digenerate!`);
    }, 850);
  }

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setSelectedAssetUrl(objectUrl);
    toast.success(`File ${file.name} berhasil diunggah.`);
  }

  function handleApplySelectedAsset() {
    if (!selectedAssetUrl) return;
    const match = SAMPLE_GALLERY_ASSETS.find((a) => a.url === selectedAssetUrl);
    const newTitle = match ? match.title : "Custom Image Asset";
    setVariations((prev) =>
      prev.map((item, idx) =>
        idx === selectedVariationIdx
          ? { ...item, url: selectedAssetUrl, title: newTitle }
          : item,
      ),
    );
    setIsAssetModalOpen(false);
    toast.success("Gambar visual berhasil diperbarui.");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SUB-STEP 1: CONTENT BRIEF (SEPERTI STEP 2 CREATE IMAGE)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 2) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-white/5">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
              Content Brief: Single Image Production
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Isi deskripsi visual dan rincian komposisi sebelum menyusun variasi gambar visual.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
              1 Gambar
            </span>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
              Rasio {ratio}
            </span>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
              {style}
            </span>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
              {persona}
            </span>
          </div>
        </div>

        {/* Form Breakdown */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200/90 bg-white/70 p-4 transition-all dark:border-white/10 dark:bg-zinc-900/50">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#01AFAE]/15 px-2.5 py-1 text-xs font-semibold text-[#01AFAE] dark:text-[#7de9e6]">
                <LayersIcon className="size-3.5" />
                <span>Topik Utama (Prefilled)</span>
              </span>
            </div>
            <textarea
              rows={2}
              value={topicDescription}
              onChange={(e) => setTopicDescription(e.target.value)}
              placeholder="Topik utama prefilled dari prompt awal..."
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white/80 p-3 text-xs leading-relaxed text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#01AFAE] focus:ring-1 focus:ring-[#01AFAE] dark:border-white/10 dark:bg-zinc-900/70 dark:text-white"
            />
          </div>

          <div className="rounded-xl border border-zinc-200/90 bg-white/70 p-4 transition-all dark:border-white/10 dark:bg-zinc-900/50">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-[#01AFAE]/15 px-2.5 py-1 text-xs font-semibold text-[#01AFAE] dark:text-[#7de9e6]">
                  Gambar 1
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Detail visual gambar 1 (Objek, suasana, pencahayaan, teks layout)...
                </span>
              </div>
            </div>
            <textarea
              rows={3}
              value={imageDescription}
              onChange={(e) => setImageDescription(e.target.value)}
              placeholder="Jelaskan objek, suasana, teks, dan komposisi untuk gambar 1..."
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white/80 p-3 text-xs leading-relaxed text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#01AFAE] focus:ring-1 focus:ring-[#01AFAE] dark:border-white/10 dark:bg-zinc-900/70 dark:text-white"
            />
          </div>
        </div>

        {/* Loading Progress Transition */}
        {loading && (
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 shadow-sm dark:border-white/10 dark:bg-zinc-800/60 animate-in fade-in duration-200">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-zinc-600 dark:text-zinc-300">
              <span className="flex items-center gap-2">
                <RefreshIcon className="size-3.5 animate-spin text-[#01AFAE]" />
                <span>Menyiapkan Visual Brief & Variasi Gambar AI...</span>
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full bg-[#01AFAE] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Button: Buka Visual Brief */}
        {!loading && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-white/5">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Perubahan pada content brief akan diterapkan saat menyusun Visual Brief.
            </span>
            <button
              type="button"
              onClick={startGenerateVisualBrief}
              className="inline-flex items-center gap-2 rounded-lg bg-[#01AFAE] px-5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#009b9a] active:scale-95"
            >
              <span>Buka Visual Brief</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SUB-STEP 2: FIGMA 355-4587 (2-COLUMN SPLIT: PREVIEW & GENERATE + FORM TEKS)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── TOP CONTEXT & CONFIGURATION SUMMARY BAR (Figma 355-4587 / #332:33799) ── */}
      <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/70 p-4 dark:border-white/10 dark:bg-zinc-900/60 shadow-2xs">
        <div className="grid grid-cols-1 divide-y md:grid-cols-3 md:divide-x md:divide-y-0 divide-zinc-200 dark:divide-white/10 gap-3 md:gap-0">
          {/* Kolom 1: Konfigurasi Gambar */}
          <div className="flex flex-col gap-1.5 md:pr-4">
            <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
              IMAGE CONFIGURATION
            </span>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#002C22]/40 px-2 py-0.5 text-xs font-semibold text-[#00D492] border border-[#00D492]/20">
                <LayersIcon className="size-3" />
                <span>Single Image</span>
              </span>
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Rasio {ratio}
              </span>
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {style}
              </span>
            </div>
          </div>

          {/* Kolom 2: Topik */}
          <div className="flex flex-col gap-1.5 pt-3 md:pt-0 md:px-4">
            <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
              TOPIK
            </span>
            <p className="line-clamp-2 text-xs font-bold text-zinc-900 dark:text-white" title={topicDescription}>
              {topicDescription}
            </p>
          </div>

          {/* Kolom 3: Angle & Ubah Button */}
          <div className="flex flex-col justify-between gap-1.5 pt-3 md:pt-0 md:pl-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                  ANGLE
                </span>
                <span className="rounded-full bg-[#01AFAE]/15 px-2 py-0.5 text-[10px] font-bold text-[#01AFAE] dark:text-[#7de9e6]">
                  Dipilih
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#01AFAE] hover:text-[#009b9a] transition-colors"
              >
                <PencilIcon className="size-3" />
                <span>Ubah Brief</span>
              </button>
            </div>
            <p className="line-clamp-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              <span className="font-bold text-zinc-900 dark:text-white">{persona}:</span>{" "}
              {imageDescription}
            </p>
          </div>
        </div>

        {/* Quota Banner Sub-row */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200/80 pt-2.5 text-xs dark:border-white/5">
          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
            <span className="inline-block size-2 rounded-full bg-teal-500" />
            <span>Maksimal 3x generate image ({variations.length}/3 terpakai)</span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Perubahan visual brief disinkronkan otomatis ke Studio Canvas.
          </span>
        </div>
      </div>

      {/* ── 2-COLUMN SPLIT CONTAINER (FIGMA 355-4587 / #I314:23703;270:18371) ── */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900/80">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ═════════════════════════════════════════════════════════════ */}
          {/* KOLOM KIRI (320px / 5-Span): VISUAL PREVIEW & GENERATE SLOTS */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-4">
            {/* Visual Preview Box */}
            <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-white/10 dark:bg-zinc-800 shadow-2xs">
              <Image
                src={activeImage}
                alt={activeTitle}
                fill
                sizes="(max-width: 1024px) 100vw, 380px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Tag Variation Badge */}
              <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                <span className="rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                  #{selectedVariationIdx + 1}
                </span>
                <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md line-clamp-1 max-w-[180px]">
                  {activeTitle}
                </span>
              </div>

              {/* Ubah Gambar Button Overlay */}
              <button
                type="button"
                onClick={() => {
                  setSelectedAssetUrl(activeImage);
                  setIsAssetModalOpen(true);
                }}
                className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-800 shadow-sm backdrop-blur-md hover:bg-white dark:bg-zinc-900/90 dark:text-zinc-100"
              >
                <PencilIcon className="size-3" />
                <span>Ubah Gambar</span>
              </button>
            </div>

            {/* Sub-section: Hasil Generate Image (Figma 355-4587) */}
            <div className="space-y-2.5 rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5 dark:border-white/5 dark:bg-zinc-800/40">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-white">
                    Hasil Generate Image
                  </h5>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Maksimal 3x generate ({variations.length}/3 terpakai)
                  </p>
                </div>

                {variations.length < 3 && (
                  <button
                    type="button"
                    onClick={handleGenerateMore}
                    disabled={isGeneratingMore}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#01AFAE]/30 bg-[#01AFAE]/10 px-2.5 py-1 text-xs font-semibold text-[#01AFAE] transition-all hover:bg-[#01AFAE] hover:text-white disabled:opacity-50"
                  >
                    <SparkIcon className="size-3" />
                    <span>{isGeneratingMore ? "Menyusun..." : "Generate Lagi"}</span>
                  </button>
                )}
              </div>

              {/* 3 Slot Thumbnails (80x80 each, Figma 355-4587) */}
              <div className="flex items-center gap-2.5 pt-1">
                {[0, 1, 2].map((slotIdx) => {
                  const varItem = variations[slotIdx];
                  const isSelected = selectedVariationIdx === slotIdx;
                  const isGeneratingThis = isGeneratingMore && slotIdx === variations.length;

                  if (varItem) {
                    return (
                      <button
                        key={varItem.id}
                        type="button"
                        onClick={() => setSelectedVariationIdx(slotIdx)}
                        className={cn(
                          "relative size-20 shrink-0 overflow-hidden rounded-lg border transition-all text-left group",
                          isSelected
                            ? "border-2 border-[#01AFAE] ring-2 ring-[#01AFAE]/30 shadow-md"
                            : "border-zinc-200 opacity-60 hover:opacity-100 dark:border-white/10",
                        )}
                        title={`${varItem.title} - Klik untuk memilih`}
                      >
                        <Image
                          src={varItem.url}
                          alt={varItem.title}
                          fill
                          className="object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 z-10 flex size-4 items-center justify-center rounded-full bg-[#01AFAE] text-white">
                            <CheckIcon className="size-2.5" />
                          </div>
                        )}
                        <span className="absolute bottom-1 left-1 z-10 rounded bg-black/60 px-1 text-[9px] font-bold text-white">
                          #{slotIdx + 1}
                        </span>
                      </button>
                    );
                  }

                  // Empty Slot (Dashed)
                  return (
                    <button
                      key={`empty-slot-${slotIdx}`}
                      type="button"
                      onClick={handleGenerateMore}
                      disabled={isGeneratingMore}
                      className={cn(
                        "flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition-all",
                        isGeneratingThis
                          ? "border-[#01AFAE] bg-[#01AFAE]/5"
                          : "border-zinc-300 bg-zinc-100/50 hover:border-[#01AFAE] hover:bg-[#01AFAE]/5 dark:border-zinc-700 dark:bg-zinc-800/40",
                      )}
                      title={`Klik untuk generate variasi #${slotIdx + 1}`}
                    >
                      {isGeneratingThis ? (
                        <RefreshIcon className="size-4 text-[#01AFAE] animate-spin" />
                      ) : (
                        <>
                          <PlusIcon className="size-4 text-zinc-400 group-hover:text-[#01AFAE]" />
                          <span className="text-[10px] text-zinc-400 font-medium">#{slotIdx + 1}</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* KOLOM KANAN (7-Span): FORM DETAIL TEKS & VISUAL (FIGMA 355-4587) */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-4">
            {/* Header Judul Visual Image 1 + Badge Draft */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-white/5">
              <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                Visual Image 1
              </h4>
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                Draft
              </span>
            </div>

            {/* Field 1: Text Judul Di gambar (Figma 355-4587) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Text Judul Di gambar
              </label>
              <input
                type="text"
                value={textJudul}
                onChange={(e) => setTextJudul(e.target.value)}
                placeholder="Masukkan judul singkat yang akan muncul di gambar..."
                className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs font-semibold text-zinc-900 outline-none focus:border-[#01AFAE] focus:ring-1 focus:ring-[#01AFAE] dark:border-white/10 dark:bg-zinc-800/80 dark:text-white"
              />
            </div>

            {/* Field 2: Text Deskripsi Di gambar (Figma 355-4587) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Text Deskripsi Di gambar
              </label>
              <textarea
                rows={2}
                value={textDeskripsi}
                onChange={(e) => setTextDeskripsi(e.target.value)}
                placeholder="Tuliskan keterangan pelengkap narasi pada gambar visual..."
                className="w-full resize-none rounded-xl border border-zinc-200 bg-white p-2.5 text-xs leading-relaxed text-zinc-800 outline-none focus:border-[#01AFAE] focus:ring-1 focus:ring-[#01AFAE] dark:border-white/10 dark:bg-zinc-800/80 dark:text-zinc-200"
              />
            </div>

            {/* Field 3: Visual (Figma 355-4587) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Visual
              </label>
              <textarea
                rows={3}
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                placeholder="Deskripsi detail visual AI (suasana, objek utama, pencahayaan, komposisi)..."
                className="w-full resize-none rounded-xl border border-zinc-200 bg-white p-2.5 text-xs leading-relaxed text-zinc-800 outline-none focus:border-[#01AFAE] focus:ring-1 focus:ring-[#01AFAE] dark:border-white/10 dark:bg-zinc-800/80 dark:text-zinc-200"
              />
            </div>

            {/* Bottom Actions di Kolom Kanan */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => toast.success("Gambar visual diunduh.")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200"
                title="Unduh Gambar"
              >
                <DownloadIcon className="size-3.5" />
                <span>Unduh</span>
              </button>
              <button
                type="button"
                onClick={onOpenEditor}
                disabled={isNavigatingEditor}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-black active:scale-[0.98] disabled:opacity-75 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                <span>{isNavigatingEditor ? "Membuka..." : "Buka di Editor"}</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION CAPTION REKOMENDASI (FIGMA 355-4587 / #I314:23703;270:18809) ── */}
      <div className="space-y-3 rounded-xl border border-zinc-200/90 bg-zinc-50/50 p-4 dark:border-white/10 dark:bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-200/70 pb-2 dark:border-white/5">
          <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider dark:text-white">
            CAPTION REKOMENDASI
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCaptionHeadline(topicDescription);
                setCaptionBody(
                  "Kabar terkini soal Kasus Korupsi Indonesia yang perlu kamu tahu. Redaksi kumparan merangkum fakta dan kronologinya. Simak selengkapnya.",
                );
                setCaptionHashtags("#beritaterkini #kumparan #kabar #kasus #korupsi #indonesia");
                toast.success("Caption berhasil dibuat ulang!");
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            >
              <RefreshIcon className="size-3" />
              <span>Buat ulang</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const fullCaption = `${captionHeadline}\n\n${captionBody}\n\n${captionHashtags}`;
                navigator.clipboard?.writeText(fullCaption);
                toast.success("Semua caption berhasil disalin ke clipboard!");
              }}
              className="text-xs font-semibold text-[#01AFAE] hover:underline"
            >
              Salin Semua
            </button>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase">Headline</span>
            <p className="font-semibold text-zinc-800 dark:text-zinc-100">{captionHeadline}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase">Body Narasi</span>
            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">{captionBody}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase">Hashtag</span>
            <p className="text-[#01AFAE] font-medium">{captionHashtags}</p>
          </div>
        </div>
      </div>

      {/* Info Alur Produksi */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-50/50 p-4 text-xs text-blue-900 dark:border-blue-400/20 dark:bg-blue-950/20 dark:text-blue-200">
        <p>
          💡 <strong>Alur Produksi:</strong> Klik <strong>&quot;Buka di Editor&quot;</strong>, lakukan penyesuaian teks/layout di Canvas Editor, lalu tekan <strong>&quot;Publish Content&quot;</strong>. Anda akan otomatis diarahkan kembali ke brief Carousel dengan status Single Image selesai!
        </p>
      </div>

      {/* ── MODAL UBAH GAMBAR (Asset Picker) ── */}
      {isAssetModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-white/15 dark:bg-zinc-900 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-white/5">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Pilih atau Unggah Gambar
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Pilih gambar dari galeri editorial atau unggah aset sendiri.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssetModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            {/* Tab Navigasi */}
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-white/5">
              <button
                type="button"
                onClick={() => setAssetModalTab("gallery")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  assetModalTab === "gallery"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
                )}
              >
                Galeri Aset Editorial
              </button>
              <button
                type="button"
                onClick={() => setAssetModalTab("upload")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  assetModalTab === "upload"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
                )}
              >
                Upload Manual
              </button>
            </div>

            {/* Modal Body */}
            {assetModalTab === "gallery" ? (
              <div className="grid grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1">
                {SAMPLE_GALLERY_ASSETS.map((asset) => {
                  const isSelected = selectedAssetUrl === asset.url;
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setSelectedAssetUrl(asset.url)}
                      className={cn(
                        "group relative aspect-[4/3] overflow-hidden rounded-lg border text-left transition-all",
                        isSelected
                          ? "ring-2 ring-[#01AFAE] border-transparent"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-white/10",
                      )}
                    >
                      <Image src={asset.url} alt={asset.title} fill className="object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-[10px] text-white font-medium line-clamp-1">
                        {asset.title}
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-[#01AFAE] text-white">
                          <CheckIcon className="size-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-200 p-8 text-center dark:border-white/10">
                <UploadIcon className="size-8 text-zinc-400" />
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Pilih file gambar dari komputer Anda
                  </p>
                  <p className="text-[11px] text-zinc-400">JPG, PNG, atau WebP (maksimal 5MB)</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  Pilih Berkas
                </button>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-white/5">
              <button
                type="button"
                onClick={() => setIsAssetModalOpen(false)}
                className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplySelectedAsset}
                disabled={!selectedAssetUrl}
                className="rounded-lg bg-[#01AFAE] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#009b9a] disabled:opacity-50"
              >
                Terapkan Gambar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

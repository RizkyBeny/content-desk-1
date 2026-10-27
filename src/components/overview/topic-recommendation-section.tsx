"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react";
import { EyeIcon, PlusIcon, SparkIcon, TagIcon, XIcon } from "@/components/ui/icons";
import { TOPIC_RECOMMENDATIONS_DATA, type TopicRecommendationItem } from "../../../config/overview";
import { HoverTip } from "./hover-tip";
import { post } from "@/lib/client";
import { TambahTopikModal } from "./tambah-topik-modal";

export interface ContentReference {
  id: string;
  title: string;
  rawText: string;
}

interface TopicRecommendationSectionProps {
  onMakeContent?: (item: TopicRecommendationItem) => void;
  loadingRank?: number | null;
  onCustomPromptSubmit?: (prompt: string, references?: ContentReference[]) => Promise<void>;
}

function extractReferenceTitle(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "Referensi Baru";

  const firstLine = trimmed.split("\n")[0].trim();

  // Jika baris pertama URL, ekstrak slug atau hostname
  if (firstLine.startsWith("http://") || firstLine.startsWith("https://")) {
    try {
      const u = new URL(firstLine);
      const slug = u.pathname.split("/").filter(Boolean).pop();
      if (slug && slug.length > 3) {
        return slug.replace(/[-_]/g, " ").slice(0, 36);
      }
      return u.hostname;
    } catch {
      return "Tautan Referensi";
    }
  }

  // Jika ada kalimat/headline yang ringkas
  if (firstLine.length <= 40) {
    return firstLine;
  }

  const match = firstLine.match(/^[^.!?\n]{5,36}[.!?]?/);
  if (match) {
    return match[0].trim();
  }
  return firstLine.slice(0, 36).trim() + "...";
}

export function TopicRecommendationSection({
  onMakeContent,
  loadingRank,
  onCustomPromptSubmit,
}: TopicRecommendationSectionProps) {
  const router = useRouter();
  const [promptText, setPromptText] = useState("");
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const [isRefModalOpen, setIsRefModalOpen] = useState(false);
  const [isTambahTopikOpen, setIsTambahTopikOpen] = useState(false);
  const [refInputText, setRefInputText] = useState("");
  const [contentReferences, setContentReferences] = useState<ContentReference[]>([]);

  function handleAddReference() {
    const raw = refInputText.trim();
    if (!raw) {
      toast.warning("Silakan tulis atau tempelkan referensi terlebih dahulu.");
      return;
    }

    const title = extractReferenceTitle(raw);
    const newRef: ContentReference = {
      id: `ref-${Date.now()}`,
      title,
      rawText: raw,
    };

    setContentReferences((prev) => [...prev, newRef]);
    setRefInputText("");
    setIsRefModalOpen(false);
    toast.success(`Referensi "${title}" berhasil ditambahkan.`);
  }

  async function handleCustomPrompt() {
    const text =
      promptText.trim() ||
      "Mudik sekarang beda banget sama dulu. Ada aplikasi, tiket online, sampai video call sama keluarga di kampung. Pengen ngulik gimana teknologi ngubah cara perantau pulang kampung.";

    if (onCustomPromptSubmit) {
      setIsSubmittingCustom(true);
      try {
        await onCustomPromptSubmit(text, contentReferences);
      } finally {
        setIsSubmittingCustom(false);
      }
      return;
    }

    setIsSubmittingCustom(true);
    try {
      const res = await post<{ projectId: string }>("/api/projects", {
        origin: "custom",
        topicTitle: text.slice(0, 80),
        topicSource: "custom_prompt",
        topicInsight: {
          summary: text,
          score: 95,
        },
      });
      toast.success("Brief topik kustom berhasil dibuat!");
      router.push(`/proyek/${res.projectId}`);
    } catch {
      router.push("/proyek/demo-angle");
    } finally {
      setIsSubmittingCustom(false);
    }
  }

  return (
    <section className="flex flex-col gap-10 rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-white/10 dark:bg-zinc-900/70">
      {/* 1. BAGIAN ATAS: AI COMPOSER MODE ("Punya topik? Kami bantu jadi konten.") (Figma #1053:9309 / #1022:11485) */}
      <div className="flex flex-col items-center gap-6 pt-2">
        {/* Title Group Centered */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
            Punya topik? Kami bantu jadi konten.
          </h2>
          <p className="max-w-2xl text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Tulis topik yang ingin kamu bahas. Kami susun sudut pandang, struktur, dan naskah awalnya.
          </p>
        </div>

        {/* Composer Card Container */}
        <div className="w-full max-w-4xl rounded-[20px] border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-[0px_6px_24px_0px_rgba(0,0,0,0.03)] transition-all focus-within:border-zinc-300 dark:border-white/10 dark:bg-zinc-900/90 dark:focus-within:border-white/20">
          {/* Top Identifier Row */}
          <div className="flex items-center justify-between pb-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
              <SparkIcon className="size-4 text-brand-strong dark:text-brand" />
              <span>Buat Konten</span>
            </div>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Shift + Enter untuk baris baru
            </span>
          </div>

          {/* Reference Pills if any (Figma #1022:11485) */}
          {contentReferences.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5 pb-3">
              {contentReferences.map((ref, idx) => (
                <div
                  key={ref.id || idx}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200/90 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-2xs dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <TagIcon className="size-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span className="max-w-[200px] truncate sm:max-w-[280px]">
                    {ref.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setContentReferences((prev) => prev.filter((_, i) => i !== idx))}
                    className="flex size-4 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                    title="Hapus referensi"
                  >
                    <XIcon width={12} height={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Prompt Area */}
          <textarea
            rows={3}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCustomPrompt();
              }
            }}
            placeholder="Mudik sekarang beda banget sama dulu. Ada aplikasi, tiket online, sampai video call sama keluarga di kampung. Pengen ngulik gimana teknologi ngubah cara perantau pulang kampung."
            className="w-full resize-none border-none bg-transparent p-0 text-base leading-relaxed text-zinc-800 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500 sm:text-lg"
          />

          {/* Divider */}
          <div className="my-3.5 border-t border-zinc-200/80 dark:border-white/10" />

          {/* Bottom Toolbar & Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
            <button
              type="button"
              onClick={() => setIsRefModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200/90 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-xs transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700/60"
            >
              <TagIcon className="size-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Tambah Referensi</span>
            </button>

            <button
              type="button"
              disabled={isSubmittingCustom}
              onClick={handleCustomPrompt}
              className="inline-flex items-center gap-2 rounded-lg bg-[#202020] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-black active:scale-[0.99] disabled:opacity-75 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              {isSubmittingCustom ? (
                <>
                  <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-zinc-900 dark:border-t-transparent" />
                  <span>Menyusun Brief...</span>
                </>
              ) : (
                <>
                  <SparkIcon className="size-3.5 text-white dark:text-zinc-900" />
                  <span>Buat Brief Konten</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. BAGIAN BAWAH: TOPIC RECOMMENDATION (Figma #1053:9309) */}
      <div className="space-y-5">
        {/* Header & Topic Score Info Callout */}
        <div className="flex flex-col justify-between gap-6 border-t border-zinc-100 pt-8 lg:flex-row lg:items-center dark:border-white/5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-base font-bold tracking-tight text-zinc-900 sm:text-lg dark:text-white">
                Topic Recommendation
              </h3>
              <button
                type="button"
                onClick={() => setIsTambahTopikOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                <PlusIcon className="size-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>Tambah Topik</span>
              </button>
            </div>
            <p className="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
              Topik dengan skor tertinggi (0–100) dari konten di platform & sosial media kumparan
            </p>
          </div>

          {/* Right Info Box: Topic Score (0–100) */}
          <div className="flex max-w-xl items-start gap-3.5 text-xs text-zinc-600 dark:text-zinc-300">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EDF2FE] text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-zinc-900 dark:text-white">Topic Score (0–100)</span>
              <ul className="space-y-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                <li>
                  • Skor prioritas topik berdasarkan tren, performa konten, dan minat audiens. Semakin tinggi skor, semakin kuat prioritasnya
                </li>
                <li>
                  • Baseline Score yang gunakan <strong className="font-semibold text-zinc-900 dark:text-white">diatas 70</strong>
                </li>
                <li>
                  • Skor ini digunakan sebagai referensi untuk menentukan prioritas eksplorasi topik, <strong className="font-semibold text-zinc-900 dark:text-white">bukan penilaian kualitas topik.</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 3 Topic Cards Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {TOPIC_RECOMMENDATIONS_DATA.map((item) => {
            const isLoading = loadingRank === item.rank;
            return (
              <div
                key={item.rank}
                className="flex flex-col justify-between gap-4 rounded-xl border border-blue-100/60 bg-[#F4FAFF] p-4.5 shadow-xs transition-all hover:border-blue-200 dark:border-white/10 dark:bg-zinc-800/60 dark:hover:border-white/20"
              >
                <div className="space-y-2.5">
                  {/* Rank Badge, Title & Score Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-[#0A0A0A] text-xs font-bold text-white dark:bg-white dark:text-zinc-900">
                        {item.rank}
                      </span>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                        {item.title}
                      </h4>
                    </div>
                    <HoverTip
                      align="end"
                      tip="Skor prioritas topik (0–100) berdasarkan tren, performa konten, dan minat audiens"
                      className="shrink-0 rounded-full bg-[#E6F6EB] px-2 py-0.5 text-[11px] font-bold text-[#006045] transition-transform hover:scale-105 dark:bg-emerald-950/40 dark:text-emerald-400"
                    >
                      Score: {item.score}
                    </HoverTip>
                  </div>

                  {/* Description */}
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {item.description}
                  </p>
                </div>

                {/* Stats and Action Button */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                    <HoverTip tip={`Views: ${item.views}`} className="items-center gap-1.5">
                      <EyeIcon width={13} height={13} />
                      <span>{item.views}</span>
                    </HoverTip>
                    <HoverTip tip={`Engagement: ${item.engagement}`} className="items-center gap-1.5">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                      <span>{item.engagement}</span>
                    </HoverTip>
                  </div>

                  {/* Action Button: w-fit Blue Button "Buat Postingan" */}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => onMakeContent?.(item)}
                    className="inline-flex w-fit items-center justify-center gap-1.5 rounded-lg bg-[#1877F2] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-75"
                  >
                    {isLoading ? (
                      <>
                        <span className="size-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Menyiapkan Angle...</span>
                      </>
                    ) : (
                      <span>Bikin Konten</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MODAL POPUP: TAMBAH REFERENSI (Figma #1022:11708) */}
      {isRefModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ref-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setIsRefModalOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Panel (Figma #1022:11896) */}
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-2xl transition-all dark:border-white/15 dark:bg-zinc-900">
            {/* Header */}
            <div className="flex items-center justify-between pb-4">
              <h3 id="ref-modal-title" className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Tambah Referensi
              </h3>
              <button
                type="button"
                onClick={() => setIsRefModalOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-800 dark:bg-white/10 dark:text-zinc-400 dark:hover:bg-white/20 dark:hover:text-white"
                aria-label="Tutup modal"
              >
                <XIcon width={16} height={16} />
              </button>
            </div>

            {/* Textarea Body */}
            <div className="space-y-2">
              <textarea
                rows={7}
                value={refInputText}
                onChange={(e) => setRefInputText(e.target.value)}
                placeholder={`Tiket Mudik yang Cepat Habis KAI mencatat 131.756 tiket mudik Lebaran 2026 sudah terjual hingga 30 Januari 2026. Topik ini bisa mengangkat perilaku pemudik yang berburu tiket sejak dini, sekaligus tips agar tidak kehabisan saat periode Lebaran 2027.\n\nhttps://ekonomi.bisnis.com/read/20260201/98/1948960/131756-tiket-kereta-api-mudik-lebaran-2026-ludes-terjual-masih-ada-sisa`}
                className="w-full resize-y rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-relaxed text-zinc-800 placeholder:text-zinc-400 focus:border-brand focus:outline-none dark:border-white/10 dark:bg-zinc-800/60 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-5">
              <button
                type="button"
                onClick={() => {
                  setRefInputText("");
                  setIsRefModalOpen(false);
                }}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-xs transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700/60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddReference}
                className="rounded-lg bg-[#171717] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-black active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                Tambahkan Referensi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL DIALOG: TAMBAH TOPIK (Figma #314:19393) */}
      <TambahTopikModal
        isOpen={isTambahTopikOpen}
        onClose={() => setIsTambahTopikOpen(false)}
      />
    </section>
  );
}

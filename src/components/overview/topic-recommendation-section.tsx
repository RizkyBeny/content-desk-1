"use client";

import { EyeIcon } from "@/components/ui/icons";
import { TOPIC_RECOMMENDATIONS_DATA, type TopicRecommendationItem } from "../../../config/overview";
import { HoverTip } from "./hover-tip";

interface TopicRecommendationSectionProps {
  onMakeContent?: (item: TopicRecommendationItem) => void;
  loadingRank?: number | null;
}

export function TopicRecommendationSection({ onMakeContent, loadingRank }: TopicRecommendationSectionProps) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/70">
      {/* Header Row: Left Title & Right Topic Score Info Box */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 sm:text-xl dark:text-white">
            Topic Recommendation
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
            Topik dengan skor tertinggi (0–100) dari konten di platform & sosial media kumparan
          </p>
        </div>

        {/* Right Info Box: Topic Score (0–100) */}
        <div className="flex max-w-xl items-start gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 text-[11px] leading-relaxed text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand-strong dark:bg-brand/15 dark:text-brand">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-zinc-900 dark:text-white">Topic Score (0–100)</span>
            <ul className="space-y-0.5 text-[10.5px]">
              <li>• Skor prioritas topik berdasarkan tren, performa konten, dan minat audiens. Semakin tinggi skor, semakin kuat prioritasnya</li>
              <li>• Baseline Score yang gunakan diatas 70</li>
              <li>• Skor ini digunakan sebagai referensi untuk menentukan prioritas eksplorasi topik, <strong className="font-semibold text-zinc-900 dark:text-white">bukan penilaian kualitas topik.</strong></li>
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
              className="angle-card flex flex-col justify-between gap-4 rounded-xl border border-zinc-200/80 bg-white p-4.5 shadow-sm transition-all dark:border-white/10 dark:bg-zinc-900/60"
            >
              <div className="space-y-2.5">
                {/* Rank, Title & Score Pill */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5.5 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-zinc-900">
                      {item.rank}
                    </span>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                      {item.title}
                    </h3>
                  </div>
                  <HoverTip
                    align="end"
                    tip="Skor prioritas topik (0–100) berdasarkan tren, performa konten, dan minat audiens"
                    className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 transition-transform hover:scale-105 dark:bg-emerald-950/40 dark:text-emerald-400"
                  >
                    Score: {item.score}
                  </HoverTip>
                </div>

                {/* Description */}
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {item.description}
                </p>
              </div>

              {/* Stats and Button */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                  <HoverTip tip={`Views: ${item.views}`} className="items-center gap-1.5">
                    <EyeIcon width={13} height={13} />
                    {item.views}
                  </HoverTip>
                  <HoverTip tip={`Engagement: ${item.engagement}`} className="items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    {item.engagement}
                  </HoverTip>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => onMakeContent?.(item)}
                  className="w-full rounded-lg bg-brand-strong py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <span className="size-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Menyiapkan Angle...</span>
                    </>
                  ) : (
                    <span>Buat Konten</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

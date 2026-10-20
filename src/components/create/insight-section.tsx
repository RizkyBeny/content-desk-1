"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@heroui/react";
import { cn } from "@/lib/utils";
import { ChevronRightIcon, SparkIcon } from "@/components/ui/icons";
import { INSIGHT_SECTION } from "../../../config/generation";

const TAKEAWAY_TONE: Record<string, string> = {
  brand: "bg-brand/10 text-brand-strong dark:text-brand",
  green: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
};

/**
 * Section "Insights" halaman Create Image (Figma node 828:27420).
 *
 * Terdiri dari header + Card A "Konten Tertinggi" (dua takeaway) dan Card B
 * (grid 2×2 kartu metrik). Tombol "Buat Konten Serupa" mengisi prompt
 * composer melalui `onSimilar`.
 */
export function InsightSection({ onSimilar }: { onSimilar?: (topic: string) => void }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[15px] font-semibold leading-5 tracking-tight">Insights</h2>
        <Link
          href="/insight"
          className="inline-flex items-center gap-1 text-[13px] text-zinc-500 transition-colors hover:text-brand-strong dark:text-zinc-400 dark:hover:text-brand"
        >
          Lihat semua
          <ChevronRightIcon width={14} height={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* Card A — Konten Tertinggi */}
        <div className="glass-card flex flex-col gap-4 rounded-[14px] p-4 lg:col-span-5 lg:min-h-[470px]">
          <div className="flex flex-col gap-1">
            <h3 className="text-[17px] font-bold leading-[25.5px] tracking-tight">{INSIGHT_SECTION.title}</h3>
            <p className="text-xs leading-4 text-zinc-500 dark:text-zinc-400">{INSIGHT_SECTION.subtitle}</p>
          </div>

          <div className="flex flex-col gap-4">
            {INSIGHT_SECTION.takeaways.map((item) => (
              <div
                key={item.badge}
                className="flex flex-1 flex-col gap-3 rounded-[10px] border border-zinc-200/60 p-4 dark:border-white/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-zinc-900/5 text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
                    <SparkIcon width={14} height={14} />
                  </span>
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", TAKEAWAY_TONE[item.tone])}>
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs leading-4 text-zinc-600 dark:text-zinc-300">{item.text}</p>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-zinc-900/5 pt-3 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <span
                        key={index}
                        className="flex size-5 items-center justify-center rounded-md bg-zinc-900/5 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
                      >
                        <SparkIcon width={11} height={11} />
                      </span>
                    ))}
                  </div>
                  <Button size="sm" variant="secondary" onPress={() => onSimilar?.(`Buat konten ${item.badge}`)}>
                    Buat Konten Serupa
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card B — grid 2×2 kartu metrik */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7">
          {INSIGHT_SECTION.metrics.map((metric) => (
            <div key={metric.label} className="glass-card flex flex-col gap-3 rounded-[10px] p-4">
              <div className="flex items-center justify-between gap-2 border-b border-zinc-900/5 pb-2.5 dark:border-white/10">
                <span className="text-sm font-medium">{metric.label}</span>
                <span className="rounded-full border border-zinc-400/40 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:border-white/15 dark:text-zinc-400">
                  {metric.format}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs leading-4">
                    <strong className="font-bold">Topik: {metric.topic}</strong>
                  </p>
                  <ul className="space-y-0.5">
                    {metric.points.map((point) => (
                      <li key={point} className="flex gap-1 text-xs leading-4 text-zinc-500 dark:text-zinc-400">
                        <span aria-hidden>–</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative size-[70px] shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                  <Image
                    src={metric.image}
                    alt={metric.topic}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="70px"
                  />
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-zinc-900/5 pt-2.5 dark:border-white/10">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Rekomendasi konten</span>
                <Button size="sm" variant="secondary" onPress={() => onSimilar?.(`Topik: ${metric.topic}`)}>
                  Buat Konten Serupa
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

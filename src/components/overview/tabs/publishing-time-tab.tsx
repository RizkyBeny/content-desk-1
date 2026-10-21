"use client";

import {
  PUBLISHING_TIME_INSIGHTS,
  HOURLY_PUBLISHING_DATA,
  TIME_SLOT_SECTION_CARDS,
  type PublishingTimeInsightCard,
} from "../../../../config/overview";
import { HoverTip } from "../hover-tip";

function InsightIcon({ type }: { type: PublishingTimeInsightCard["iconType"] }) {
  if (type === "trophy") {
    return (
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-strong dark:bg-brand/25 dark:text-brand">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      </div>
    );
  }
  if (type === "sun") {
    return (
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </div>
    );
  }
  if (type === "moon") {
    return (
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-strong dark:bg-brand/25 dark:text-brand">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    </div>
  );
}

function HourlyBarChart({
  title,
  yTicks,
  colorScheme,
  dataKey,
  peakHours,
}: {
  title: string;
  yTicks: string[];
  colorScheme: "brand" | "teal" | "amber";
  dataKey: "content" | "impression" | "engagement";
  peakHours: string[];
}) {
  const maxValue =
    dataKey === "content" ? 20 : dataKey === "impression" ? 4 : 120;

  return (
    <div className="angle-card flex flex-col gap-3 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all dark:border-white/10 dark:bg-zinc-900/60">
      <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{title}</h3>

      <div className="relative flex h-48 items-end gap-1.5 pt-6 pb-6">
        {/* Y Axis Ticks */}
        <div className="absolute inset-y-0 left-0 flex flex-col justify-between py-6 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
          {yTicks.map((tick, i) => (
            <span key={i}>{tick}</span>
          ))}
        </div>

        {/* Grid lines */}
        <div className="absolute inset-x-8 top-6 border-b border-dashed border-zinc-100 dark:border-white/10" />
        <div className="absolute inset-x-8 top-24 border-b border-dashed border-zinc-100 dark:border-white/10" />
        <div className="absolute inset-x-8 bottom-6 border-b border-zinc-200 dark:border-white/10" />

        {/* Bars Container */}
        <div className="ml-8 flex h-full w-full items-end justify-between px-1">
          {HOURLY_PUBLISHING_DATA.map((item) => {
            const val = item[dataKey];
            const heightPct = Math.max(4, (val / maxValue) * 100);
            const isPeak = peakHours.includes(item.hour);

            let barColor = "";
            if (colorScheme === "brand") {
              barColor = isPeak
                ? "bg-brand-strong dark:bg-brand"
                : "bg-brand/30 dark:bg-brand/25";
            } else if (colorScheme === "teal") {
              barColor = isPeak
                ? "bg-teal-600 dark:bg-teal-500"
                : "bg-teal-200 dark:bg-teal-900/60";
            } else {
              barColor = isPeak
                ? "bg-amber-600 dark:bg-amber-500"
                : "bg-amber-200 dark:bg-amber-900/60";
            }

            const valueText =
              dataKey === "content"
                ? `${val} konten`
                : dataKey === "impression"
                  ? `${val}M impression`
                  : `${val}K engagement`;

            return (
              <div
                key={item.hour}
                className="group/bar relative flex h-full flex-col items-center justify-end gap-1.5"
              >
                <div className="relative w-3.5" style={{ height: `${heightPct}%` }}>
                  {/* Tooltip saat bar di-hover */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 invisible -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-[10px] font-medium opacity-0 transition-opacity duration-150 leading-tight text-white shadow-lg group-hover/bar:visible group-hover/bar:opacity-100 dark:bg-white dark:text-zinc-900">
                    <p className="font-semibold">Jam {item.hour}.00</p>
                    <p className="text-white/70 dark:text-zinc-600">{valueText}</p>
                  </div>
                  <div
                    className={`h-full w-full rounded-t-sm transition-all group-hover/bar:brightness-110 group-hover/bar:ring-2 group-hover/bar:ring-brand/40 ${barColor}`}
                  />
                </div>
                <span className="text-[10px] text-zinc-400 transition-colors group-hover/bar:font-semibold group-hover/bar:text-brand-strong dark:text-zinc-500 dark:group-hover/bar:text-brand">
                  {item.hour}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PublishingTimeTab() {
  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/70">
      {/* 1. Header Row with Account Filter Dropdown */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 sm:text-xl dark:text-white">
            Publishing Time
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
            Analisis performa berdasarkan jam publikasi
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label className="text-xs text-zinc-500 dark:text-zinc-400">Filter Akun Media Sosial</label>
          <div className="relative">
            <select className="h-8.5 rounded-lg border border-zinc-200 bg-white pl-3 pr-8 text-xs font-semibold text-zinc-700 shadow-sm transition-colors focus:border-brand focus:outline-none dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200">
              <option>Semua akun (News)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Insight Row Header */}
      <div className="space-y-3">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Insight</h3>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Standar platform dihitung dari rata-rata performa konten 8 minggu terakhir pada platform yang sama.</span>
          </div>
        </div>

        {/* 4 Insight Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PUBLISHING_TIME_INSIGHTS.map((card, idx) => (
            <div
              key={idx}
              className="angle-card flex flex-col justify-between gap-2.5 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 dark:border-white/10 dark:bg-zinc-900/60"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <InsightIcon type={card.iconType} />
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">{card.title}</span>
                </div>
                <HoverTip
                  align="end"
                  tip={`${card.title}: ${card.description}`}
                  className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold transition-transform hover:scale-105 ${card.pillColor}`}
                >
                  {card.pillText}
                </HoverTip>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Banner: Cara Membaca Chart */}
      <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand/10 p-3.5 dark:border-brand/30 dark:bg-brand/15">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-strong dark:bg-brand/25 dark:text-brand">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Cara Membaca Chart</h4>
          <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">
            Setiap jam menunjukkan waktu publikasi konten. Impression dan engagement menunjukkan total yang dihasilkan oleh konten yang dipublikasikan pada jam tersebut, bukan aktivitas yang terjadi pada jam itu.
          </p>
        </div>
      </div>

      {/* 4. Three Hourly Bar Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <HourlyBarChart
          title="Content by post"
          yTicks={["20", "10", "0"]}
          colorScheme="brand"
          dataKey="content"
          peakHours={["10", "18", "20"]}
        />
        <HourlyBarChart
          title="Impression by post"
          yTicks={["4M", "2M", "0"]}
          colorScheme="teal"
          dataKey="impression"
          peakHours={["10", "16", "20"]}
        />
        <HourlyBarChart
          title="Engagement by post"
          yTicks={["120K", "60K", "0"]}
          colorScheme="amber"
          dataKey="engagement"
          peakHours={["10", "18", "20"]}
        />
      </div>

      {/* 5. Insight per Waktu Publikasi Section */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Insight per Waktu Publikasi</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {TIME_SLOT_SECTION_CARDS.map((slot, idx) => (
            <div
              key={idx}
              className="angle-card flex flex-col justify-between gap-3 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 dark:border-white/10 dark:bg-zinc-900/60"
            >
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  {slot.iconType === "sun-outline" && (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-strong dark:bg-brand/25 dark:text-brand">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                      </svg>
                    </div>
                  )}
                  {slot.iconType === "sun-solid" && (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="5" />
                      </svg>
                    </div>
                  )}
                  {slot.iconType === "moon" && (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    </div>
                  )}
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">{slot.title}</h4>
                </div>

                <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400 pl-1">
                  <li>• Jumlah konten: {slot.contentCountText}</li>
                  <li>• Total Impression: {slot.impressionText}</li>
                  <li>• Total engagement: {slot.engagementText}</li>
                </ul>
              </div>

              {/* Bottom pill banner */}
              <div className="rounded-lg bg-emerald-50 px-3 py-1.5 text-center text-[10.5px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                {slot.growthPillText}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

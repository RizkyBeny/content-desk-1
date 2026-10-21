"use client";

import Image from "next/image";
import {
  DATA_PLATFORM_HIGHLIGHTS,
  PLATFORM_DETAIL_CARDS,
  type DataPlatformHighlight,
} from "../../../../config/overview";

function HighlightIcon({ type }: { type: DataPlatformHighlight["iconType"] }) {
  if (type === "play") {
    return (
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>
    );
  }
  if (type === "film") {
    return (
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M7 3v18" stroke="currentColor" strokeWidth="2" />
          <path d="M17 3v18" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-strong dark:bg-brand/25 dark:text-brand">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    </div>
  );
}

function SocialIcon({ platform }: { platform: "Instagram" | "TikTok" | "YouTube" }) {
  if (platform === "Instagram") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    );
  }
  if (platform === "TikTok") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.26 6.26 0 0 0 1.86-4.47v-7a8.16 8.16 0 0 0 4.91 1.64V6.85c-.34-.04-.67-.09-1-.16z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function DataPlatformTab() {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/70">
      {/* 1. Header Row with Account Filter Dropdown */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 sm:text-xl dark:text-white">
            Overview Data Platform
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
            Executive Summary setiap platform media sosial dalam cluster News.
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

      {/* 2. Top Highlight Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {DATA_PLATFORM_HIGHLIGHTS.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-2 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60 dark:hover:border-brand/40"
          >
            <div className="flex items-center gap-2.5">
              <HighlightIcon type={item.iconType} />
              <h3 className="text-xs font-bold leading-snug text-zinc-900 dark:text-white">
                {item.title}
              </h3>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {/* 3. Three Platform Performance Cards Side by Side */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {PLATFORM_DETAIL_CARDS.map((card) => (
          <div
            key={card.platform}
            className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60 dark:hover:border-brand/40"
          >
            {/* Dark Header Banner */}
            <div className={`flex items-center gap-2 px-4 py-3 ${card.headerBg}`}>
              <SocialIcon platform={card.platform} />
              <h3 className="text-sm font-bold tracking-tight text-white">{card.platform}</h3>
            </div>

            {/* Metrics Section */}
            <div className="flex flex-col gap-3 p-4">
              {/* Big Impression Metric */}
              <div>
                <div className="flex items-center gap-2">
                  <span
                    title={`Impression ${card.impression} · ${card.impressionChange} vs periode sebelumnya`}
                    className="cursor-help text-2xl font-bold tracking-tight text-zinc-900 transition-colors hover:text-brand-strong sm:text-3xl dark:text-white dark:hover:text-brand"
                  >
                    {card.impression}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                      card.isImpressionPositive ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    <span>{card.isImpressionPositive ? "↗" : "↘"}</span>
                    <span>{card.impressionChange}</span>
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">Impression</p>
              </div>

              {/* Sub-metrics row */}
              <div className="grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3 dark:border-white/10 text-xs">
                <div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Engagement</p>
                  <p
                    title={`Engagement ${card.engagement} · ${card.engagementChange} vs periode sebelumnya`}
                    className="cursor-help font-bold text-zinc-900 transition-colors hover:text-brand-strong dark:text-white dark:hover:text-brand"
                  >
                    {card.engagement}
                  </p>
                  <span className="text-[10px] font-semibold text-emerald-500">
                    ↗ {card.engagementChange}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Engagement Rate</p>
                  <p
                    title={`Engagement rate ${card.er} · ${card.erChange} vs periode sebelumnya`}
                    className="cursor-help font-bold text-zinc-900 transition-colors hover:text-brand-strong dark:text-white dark:hover:text-brand"
                  >
                    {card.er}
                  </p>
                  <span className="text-[10px] font-semibold text-rose-500">
                    ↘ {card.erChange}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Jumlah konten</p>
                  <p
                    title={`${card.contentCount} konten · ${card.contentChange} vs periode sebelumnya`}
                    className="cursor-help font-bold text-zinc-900 transition-colors hover:text-brand-strong dark:text-white dark:hover:text-brand"
                  >
                    {card.contentCount}
                  </p>
                  <span
                    className={`text-[10px] font-semibold ${
                      card.platform === "YouTube" ? "text-rose-500" : "text-emerald-500"
                    }`}
                  >
                    {card.platform === "YouTube" ? "↘" : "↗"} {card.contentChange}
                  </span>
                </div>
              </div>

              {/* Internal Insight Cards */}
              <div className="flex flex-col gap-2.5 pt-2">
                {card.insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {insight.type === "negative" ? (
                          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17 14V2H6.5a2 2 0 0 0-1.92 2.56l2.33 8A2 2 0 0 0 8.83 14H12l-1 4 3 4 3-8z" />
                            </svg>
                          </span>
                        ) : (
                          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M7 10v12h10.5a2 2 0 0 0 1.92-2.56l-2.33-8A2 2 0 0 0 15.17 10H12l1-4-3-4-3 8z" />
                            </svg>
                          </span>
                        )}
                        <h4 className="text-[11px] font-bold text-zinc-900 dark:text-white">
                          {insight.title}
                        </h4>
                      </div>
                      <p className="text-[10.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                        {insight.description}
                      </p>
                    </div>

                    {/* Thumbnail Image */}
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-zinc-200 dark:border-white/10">
                      <Image
                        src={insight.thumbnail}
                        alt="Thumbnail"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

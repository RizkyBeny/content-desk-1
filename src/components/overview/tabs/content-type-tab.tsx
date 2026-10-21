"use client";

import Image from "next/image";
import {
  CONTENT_TYPE_HIGHLIGHTS,
  CONTENT_TYPE_EVAL_DATA,
  CONTENT_TYPE_GOOD_DATA,
  CONTENT_TYPE_EXCELLENT_DATA,
  type ContentTypeHighlightItem,
  type ContentTypeTableRow,
} from "../../../../config/overview";
import { HoverTip } from "../hover-tip";

function HighlightIcon({ type }: { type: ContentTypeHighlightItem["iconType"] }) {
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
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    );
  }
  if (platform === "TikTok") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-900 dark:text-white">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.26 6.26 0 0 0 1.86-4.47v-7a8.16 8.16 0 0 0 4.91 1.64V6.85c-.34-.04-.67-.09-1-.16z" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF0000">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function StatusBadge({ status }: { status: ContentTypeTableRow["status"] }) {
  if (status === "Perlu Dievaluasi") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
        <span>Perlu Dievaluasi</span>
      </span>
    );
  }
  if (status === "Cukup Baik") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-600 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-400">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="16" y2="12" />
          <line x1="12" x2="12.01" y1="8" y2="8" />
        </svg>
        <span>Cukup Baik</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
      <span>Sangat Baik</span>
    </span>
  );
}

function ContentTypeGroupTable({
  status,
  title,
  dotColor,
  headerBg,
  data,
}: {
  status: ContentTypeTableRow["status"];
  title: string;
  dotColor: string;
  headerBg: string;
  data: ContentTypeTableRow[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900/60">
      {/* Group Header Bar with colored dot */}
      <div className={`flex items-center gap-2 border-b border-zinc-200/80 px-4 py-2.5 ${headerBg} dark:border-white/10`}>
        <span className={`size-2.5 rounded-full ${dotColor}`} />
        <span className="text-xs font-bold text-zinc-900 dark:text-white">{title}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-[11px] font-semibold text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
              <th scope="col" className="px-4 py-2.5 font-semibold">Content Type</th>
              <th scope="col" className="px-4 py-2.5 font-semibold"><HoverTip side="bottom" tip="Jumlah konten pada format ini">Total Content</HoverTip></th>
              <th scope="col" className="px-4 py-2.5 font-semibold"><HoverTip side="bottom" tip="Total tayangan seluruh konten pada grup ini">Total Impression</HoverTip></th>
              <th scope="col" className="px-4 py-2.5 font-semibold"><HoverTip side="bottom" tip="Total impression dibagi jumlah konten">Impression/Content</HoverTip></th>
              <th scope="col" className="px-4 py-2.5 font-semibold"><HoverTip side="bottom" tip="Total interaksi seluruh konten pada grup ini">Total Engagment</HoverTip></th>
              <th scope="col" className="px-4 py-2.5 font-semibold"><HoverTip side="bottom" tip="Total engagement dibagi total impression">Engagment Rate</HoverTip></th>
              <th scope="col" className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-white/10 text-zinc-800 dark:text-zinc-200">
            {data.map((row, idx) => (
              <tr key={idx} className="transition-colors hover:bg-zinc-50/60 dark:hover:bg-white/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <SocialIcon platform={row.platform} />
                    <span className="font-semibold text-zinc-900 dark:text-white">{row.contentType}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-zinc-900 dark:text-white">{row.totalContent}</td>
                <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">{row.totalImpression}</td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">{row.impressionPerContent}</td>
                <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">{row.totalEngagement}</td>
                <td className="px-4 py-3 font-bold text-zinc-900 dark:text-white">{row.engagementRate}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ContentTypeTab() {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/70">
      {/* 1. Header Row */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 sm:text-xl dark:text-white">
            Content Type Analysis
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

      {/* 2. Top 3 Cards with Attached Post Link */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {CONTENT_TYPE_HIGHLIGHTS.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60 dark:hover:border-brand/40"
          >
            <div className="space-y-2">
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

            {/* Attached Post Card */}
            <div className="flex items-center gap-2.5 rounded-lg border border-zinc-100 bg-zinc-50/70 p-2 dark:border-white/10 dark:bg-white/5">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-zinc-200 dark:border-white/10">
                <Image src={item.postThumbnail} alt="Post" fill className="object-cover" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  {item.postAuthor}
                </span>
                <p className="line-clamp-2 text-[10.5px] font-medium leading-tight text-brand-strong dark:text-brand cursor-pointer hover:underline">
                  {item.postTitle}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Three Status-Grouped Tables */}
      <div className="space-y-5 pt-1">
        <ContentTypeGroupTable
          status="Perlu Dievaluasi"
          title="Perlu Dievaluasi"
          dotColor="bg-rose-600"
          headerBg="bg-rose-50/70 dark:bg-rose-950/20"
          data={CONTENT_TYPE_EVAL_DATA}
        />

        <ContentTypeGroupTable
          status="Cukup Baik"
          title="Cukup Baik"
          dotColor="bg-sky-500"
          headerBg="bg-sky-50/70 dark:bg-sky-950/20"
          data={CONTENT_TYPE_GOOD_DATA}
        />

        <ContentTypeGroupTable
          status="Sangat Baik"
          title="Sangat Baik"
          dotColor="bg-emerald-600"
          headerBg="bg-emerald-50/70 dark:bg-emerald-950/20"
          data={CONTENT_TYPE_EXCELLENT_DATA}
        />
      </div>

      {/* Bottom info footnote */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 pt-1">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="16" y2="12" />
          <line x1="12" x2="12.01" y1="8" y2="8" />
        </svg>
        <span>Rekomendasi didasarkan pada perbandingan rata-rata per konten dan kategori dengan sampel cukup.</span>
      </div>
    </section>
  );
}

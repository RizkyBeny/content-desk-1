"use client";

import {
  BUILDING_BLOCK_HIGHLIGHTS,
  BUILDING_BLOCK_EVAL_DATA,
  BUILDING_BLOCK_GOOD_DATA,
  BUILDING_BLOCK_EXCELLENT_DATA,
  type BuildingBlockHighlight,
  type BuildingBlockTableRow,
} from "../../../../config/overview";

function HighlightIcon({ type }: { type: BuildingBlockHighlight["iconType"] }) {
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
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    </div>
  );
}

function GeometricBlockIcon() {
  return (
    <div className="flex size-5 shrink-0 items-center justify-center text-rose-500">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <rect x="3" y="3" width="7" height="7" />
        <circle cx="17.5" cy="6.5" r="3.5" />
        <polygon points="12 21 7 14 17 14" />
      </svg>
    </div>
  );
}

function StatusBadge({ status }: { status: BuildingBlockTableRow["status"] }) {
  if (status === "Perlu Dievaluasi") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
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
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
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

function BuildingBlockGroupTable({
  status,
  title,
  dotColor,
  headerBg,
  data,
}: {
  status: BuildingBlockTableRow["status"];
  title: string;
  dotColor: string;
  headerBg: string;
  data: BuildingBlockTableRow[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-[#2E2E2E] dark:bg-[#1E1E1E]">
      {/* Group Header Bar with colored dot */}
      <div className={`flex items-center gap-2 border-b border-slate-200/80 px-4 py-2.5 ${headerBg} dark:border-[#2E2E2E]`}>
        <span className={`size-2.5 rounded-full ${dotColor}`} />
        <span className="text-xs font-bold text-slate-900 dark:text-white">{title}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/60 text-[11px] font-semibold text-slate-600 dark:border-[#2E2E2E] dark:bg-white/[0.02] dark:text-zinc-400">
              <th scope="col" className="px-4 py-2.5 font-semibold">Building Block</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">Total Konten</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">Total Impression</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">Impression/Content</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">Total Engagment</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">Engagment Rate</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#2E2E2E] text-slate-800 dark:text-zinc-200">
            {data.map((row, idx) => (
              <tr key={idx} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <GeometricBlockIcon />
                    <span className="font-semibold text-slate-900 dark:text-white">{row.blockName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{row.totalContent}</td>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{row.totalImpression}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-zinc-300 font-medium">{row.impressionPerContent}</td>
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-zinc-300">{row.totalEngagement || ""}</td>
                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{row.engagementRate}</td>
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

export function BuildingBlockTab() {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-[#2E2E2E] dark:bg-[#1A1A1A]">
      {/* 1. Header Row */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-white">
            Building Block Analysis
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm dark:text-zinc-400">
            Executive Summary setiap platform media sosial dalam cluster News.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label className="text-xs text-slate-500 dark:text-zinc-400">Filter Akun Media Sosial</label>
          <div className="relative">
            <select className="h-8.5 rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 shadow-sm focus:outline-none dark:border-[#2E2E2E] dark:bg-[#1E1E1E] dark:text-zinc-200">
              <option>Semua akun (News)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Top 3 Insight Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {BUILDING_BLOCK_HIGHLIGHTS.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-[#2E2E2E] dark:bg-[#1E1E1E]"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <HighlightIcon type={item.iconType} />
                <h3 className="text-xs font-bold leading-snug text-slate-900 dark:text-white">
                  {item.title}
                </h3>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-zinc-400">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Three Status Tables */}
      <div className="space-y-5 pt-1">
        <BuildingBlockGroupTable
          status="Perlu Dievaluasi"
          title="Perlu Dievaluasi"
          dotColor="bg-[#EF4444]"
          headerBg="bg-rose-50/70 dark:bg-rose-950/20"
          data={BUILDING_BLOCK_EVAL_DATA}
        />

        <BuildingBlockGroupTable
          status="Cukup Baik"
          title="Cukup Baik"
          dotColor="bg-[#0066FF]"
          headerBg="bg-sky-50/70 dark:bg-sky-950/20"
          data={BUILDING_BLOCK_GOOD_DATA}
        />

        <BuildingBlockGroupTable
          status="Sangat Baik"
          title="Sangat Baik"
          dotColor="bg-[#10B981]"
          headerBg="bg-emerald-50/70 dark:bg-emerald-950/20"
          data={BUILDING_BLOCK_EXCELLENT_DATA}
        />
      </div>
    </section>
  );
}

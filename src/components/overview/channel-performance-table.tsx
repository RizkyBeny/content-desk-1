"use client";

import { cn } from "@/lib/utils";
import type { ProgressTableRow } from "../../../config/overview";

interface ChannelPerformanceTableProps {
  title: string;
  metricHeader: string;
  description: string;
  data: ProgressTableRow[];
}

function SocialIcon({ platform }: { platform: ProgressTableRow["platform"] }) {
  if (platform === "Instagram") {
    return (
      <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      </div>
    );
  }
  if (platform === "TikTok") {
    return (
      <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.26 6.26 0 0 0 1.86-4.47v-7a8.16 8.16 0 0 0 4.91 1.64V6.85c-.34-.04-.67-.09-1-.16z" />
        </svg>
      </div>
    );
  }
  if (platform === "YouTube") {
    return (
      <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#FF0000] text-white">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#1877F2] text-white">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    </div>
  );
}

export function ChannelPerformanceTable({
  title,
  metricHeader,
  description,
  data,
}: ChannelPerformanceTableProps) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-[#2E2E2E] dark:bg-[#1A1A1A]">
      {/* Header, Subtitle & Info Callout on Top Right */}
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg dark:text-white">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{description}</p>
        </div>

        {/* Info callout on the right */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="16" y2="12" />
              <line x1="12" x2="12.01" y1="8" y2="8" />
            </svg>
          </div>
          <span>Standar platform dihitung dari rata-rata performa konten 8 minggu terakhir pada platform yang sama.</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-[#2E2E2E]">
        <table className="w-full text-left text-xs">
          <thead>
            {/* Top Multi-column Header */}
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-600 dark:border-[#2E2E2E] dark:bg-white/[0.02] dark:text-zinc-300">
              <th scope="col" rowSpan={2} className="px-4 py-3 font-semibold align-bottom">
                Platform
              </th>
              <th scope="col" rowSpan={2} className="px-4 py-3 font-semibold align-bottom">
                {metricHeader}
              </th>
              <th scope="col" rowSpan={2} className="px-4 py-3 font-semibold align-bottom">
                Standar Platform
              </th>
              <th scope="col" rowSpan={2} className="px-4 py-3 font-semibold align-bottom">
                Perubahan dari standar
              </th>
              <th
                scope="col"
                colSpan={3}
                className="border-l border-slate-200/80 px-4 py-2 text-center text-[11px] font-semibold text-slate-600 dark:border-[#2E2E2E] dark:text-zinc-300"
              >
                Persentase jumlah konten terhadap keseluruhan konten
              </th>
            </tr>
            {/* Sub-header for the 3 percentage columns */}
            <tr className="border-b border-slate-200/80 text-[11px] font-medium dark:border-[#2E2E2E]">
              <th
                scope="col"
                className="border-l border-slate-200/80 bg-rose-50/70 px-4 py-2 text-center text-rose-700 dark:border-[#2E2E2E] dark:bg-rose-950/20 dark:text-rose-400 font-medium"
              >
                Dibawah standar
              </th>
              <th
                scope="col"
                className="border-l border-slate-200/80 bg-slate-100/70 px-4 py-2 text-center text-slate-700 dark:border-[#2E2E2E] dark:bg-white/[0.04] dark:text-zinc-300 font-medium"
              >
                Standar rata-rata
              </th>
              <th
                scope="col"
                className="border-l border-slate-200/80 bg-emerald-50/70 px-4 py-2 text-center text-emerald-700 dark:border-[#2E2E2E] dark:bg-emerald-950/20 dark:text-emerald-400 font-medium"
              >
                Di atas standar
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#2E2E2E] text-slate-800 dark:text-zinc-200">
            {data.map((row) => (
              <tr key={row.platform} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-white/[0.02]">
                {/* Platform */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <SocialIcon platform={row.platform} />
                    <span className="font-semibold text-slate-900 dark:text-white">{row.platform}</span>
                  </div>
                </td>

                {/* Average Metric */}
                <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                  {row.average}
                </td>

                {/* Standard Platform */}
                <td className="px-4 py-3.5 text-slate-600 dark:text-zinc-400">
                  {row.standard}
                </td>

                {/* Perubahan dari Standar Badge */}
                <td className="px-4 py-3.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      row.status === "above"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
                    )}
                  >
                    <span>▲</span>
                    <span>{row.changeValue}</span>
                    <span>{row.statusText}</span>
                  </span>
                </td>

                {/* Subcolumn 1: Dibawah standar */}
                <td className="border-l border-slate-200/80 px-4 py-3.5 dark:border-[#2E2E2E]">
                  <div className="flex items-center justify-center">
                    <div
                      className="flex h-5 items-center justify-center rounded-md bg-rose-100/80 px-2 text-[11px] font-bold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                      style={{ width: `${Math.max(28, row.pctBelow * 1.5)}%` }}
                    >
                      {row.pctBelow}%
                    </div>
                  </div>
                </td>

                {/* Subcolumn 2: Standar rata-rata */}
                <td className="border-l border-slate-200/80 px-4 py-3.5 dark:border-[#2E2E2E]">
                  <div className="flex items-center justify-center">
                    <div
                      className="flex h-5 items-center justify-center rounded-md bg-slate-200/80 px-2 text-[11px] font-bold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                      style={{ width: `${Math.max(28, row.pctAverage * 1.5)}%` }}
                    >
                      {row.pctAverage}%
                    </div>
                  </div>
                </td>

                {/* Subcolumn 3: Di atas standar */}
                <td className="border-l border-slate-200/80 px-4 py-3.5 dark:border-[#2E2E2E]">
                  <div className="flex items-center justify-center">
                    <div
                      className="flex h-5 items-center justify-center rounded-md bg-emerald-100/80 px-2 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      style={{ width: `${Math.max(28, row.pctAbove * 1.5)}%` }}
                    >
                      {row.pctAbove}%
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

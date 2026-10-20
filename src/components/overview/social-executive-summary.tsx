"use client";

import { useId } from "react";
import { SOCIAL_METRICS_DATA } from "../../../config/overview";

function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

function SparklineChart({
  currentPoints,
  previousPoints,
}: {
  currentPoints: number[];
  previousPoints: number[];
}) {
  const gradientId = useId();
  const width = 240;
  const height = 50;
  const paddingY = 6;
  const paddingX = 4;

  const allVals = [...currentPoints, ...previousPoints];
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const range = maxVal - minVal || 1;

  function toX(index: number) {
    return paddingX + (index / (currentPoints.length - 1)) * (width - 2 * paddingX);
  }

  function toY(val: number) {
    const norm = (val - minVal) / range;
    return height - paddingY - norm * (height - 2 * paddingY);
  }

  function createPathD(points: number[]) {
    if (points.length < 2) return "";
    let d = `M ${toX(0)} ${toY(points[0])}`;
    for (let i = 0; i < points.length - 1; i += 1) {
      const x0 = toX(i);
      const y0 = toY(points[i]);
      const x1 = toX(i + 1);
      const y1 = toY(points[i + 1]);
      const mx = (x0 + x1) / 2;
      d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
    }
    return d;
  }

  const currentPath = createPathD(currentPoints);
  const previousPath = createPathD(previousPoints);
  const areaPath = `${currentPath} L ${toX(currentPoints.length - 1)} ${height} L ${toX(0)} ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12 overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0066FF" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0066FF" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Area under current line */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Previous period line (dashed grey) */}
      <path
        d={previousPath}
        fill="none"
        stroke="#94A3B8"
        strokeWidth="1.5"
        strokeDasharray="2.5 2.5"
        strokeLinecap="round"
        opacity={0.7}
      />

      {/* Current period line (solid blue) */}
      <path
        d={currentPath}
        fill="none"
        stroke="#0066FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SocialExecutiveSummary() {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-[#2E2E2E] dark:bg-[#1A1A1A]">
      {/* Header, Subtitle & Legend */}
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-white">
            Executive Summary Media Sosial
          </h2>
          <p className="text-xs text-slate-500 sm:text-sm dark:text-zinc-400">
            Performa gabungan seluruh akun media sosial dalam cluster News (Instagram, TikTok, YouTube, dan Facebook). Data hanya mencakup media sosial, tidak termasuk website.
          </p>
        </div>

        {/* Chart Legend */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-zinc-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded-full bg-[#0066FF]" />
            <span>Periode Sekarang</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 border-b border-dashed border-slate-400 dark:border-zinc-500" />
            <span>Periode Sebelumnya</span>
          </div>
        </div>
      </div>

      {/* 4 Metric Sparkline Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SOCIAL_METRICS_DATA.map((metric) => (
          <div
            key={metric.id}
            className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-[#2E2E2E] dark:bg-[#1E1E1E]"
          >
            {/* Top: Label & Growth Badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">{metric.label}</span>
              <div className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRightIcon className="size-3" />
                <span>{metric.changePct}</span>
              </div>
            </div>

            {/* Middle: Big Metric Value */}
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                {metric.value}
              </p>
            </div>

            {/* Sparkline Visual */}
            <div className="pt-1">
              <SparklineChart
                currentPoints={metric.currentPoints}
                previousPoints={metric.previousPoints}
              />

              {/* Day Labels */}
              <div className="flex items-center justify-between pt-1.5 text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                {metric.days.map((day, idx) => (
                  <span key={idx}>{day}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

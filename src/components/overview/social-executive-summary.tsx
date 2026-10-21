"use client";

import { useId, useState, type MouseEvent } from "react";
import { SOCIAL_METRICS_DATA } from "../../../config/overview";
import { HoverTip } from "./hover-tip";

type SocialMetric = (typeof SOCIAL_METRICS_DATA)[number];

function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

function formatPoint(metricId: string, value: number) {
  if (metricId === "engagementRate") return `${value.toFixed(1).replace(".", ",")}%`;
  return value.toLocaleString("id-ID");
}

function SparklineChart({
  metricId,
  currentPoints,
  previousPoints,
  activeIndex,
  onActiveIndexChange,
}: {
  metricId: string;
  currentPoints: number[];
  previousPoints: number[];
  activeIndex: number | null;
  onActiveIndexChange: (index: number | null) => void;
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

  function handleMove(event: MouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    const clamped = Math.min(1, Math.max(0, ratio));
    onActiveIndexChange(Math.round(clamped * (currentPoints.length - 1)));
  }

  const currentPath = createPathD(currentPoints);
  const previousPath = createPathD(previousPoints);
  const areaPath = `${currentPath} L ${toX(currentPoints.length - 1)} ${height} L ${toX(0)} ${height} Z`;

  const activeX = activeIndex === null ? 0 : toX(activeIndex);
  const activeY = activeIndex === null ? 0 : toY(currentPoints[activeIndex]);
  const previousY = activeIndex === null ? 0 : toY(previousPoints[activeIndex]);
  const activePct = activeIndex === null ? 0 : (activeX / width) * 100;

  return (
    <div className="relative" onMouseLeave={() => onActiveIndexChange(null)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-12 w-full cursor-crosshair overflow-visible text-brand"
        onMouseMove={handleMove}
        role="img"
        aria-label={`Grafik ${metricId} periode sekarang dibanding periode sebelumnya`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Area under current line */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Previous period line (dashed grey) */}
        <path
          d={previousPath}
          fill="none"
          className="stroke-zinc-400 dark:stroke-zinc-500"
          strokeWidth="1.5"
          strokeDasharray="2.5 2.5"
          strokeLinecap="round"
          opacity={0.7}
          vectorEffect="non-scaling-stroke"
        />

        {/* Current period line (solid brand) */}
        <path
          d={currentPath}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {activeIndex !== null && (
        <>
          {/* Guide line */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-px bg-zinc-300 dark:bg-white/20"
            style={{ left: `${activePct}%` }}
          />
          {/* Previous-period dot */}
          <span
            aria-hidden
            className="pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-400 dark:bg-zinc-500"
            style={{ left: `${activePct}%`, top: `${(previousY / height) * 100}%` }}
          />
          {/* Current-period dot */}
          <span
            aria-hidden
            className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand ring-2 ring-white dark:ring-zinc-900"
            style={{ left: `${activePct}%`, top: `${(activeY / height) * 100}%` }}
          />
        </>
      )}
    </div>
  );
}

function MetricCard({ metric }: { metric: SocialMetric }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="angle-card flex flex-col justify-between gap-3 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 dark:border-white/10 dark:bg-zinc-900/60">
      {/* Top: Label & Growth Badge / Hover Readout */}
      <div className="flex min-h-4 items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{metric.label}</span>
        {activeIndex !== null ? (
          <span className="whitespace-nowrap text-[10px] font-semibold text-brand-strong dark:text-brand">
            {metric.days[activeIndex]} · {formatPoint(metric.id, metric.currentPoints[activeIndex])}
            <span className="ml-1 font-normal text-zinc-400 dark:text-zinc-500">
              / {formatPoint(metric.id, metric.previousPoints[activeIndex])}
            </span>
          </span>
        ) : (
          <HoverTip
            align="end"
            tip={`${metric.changePct} dibanding periode sebelumnya`}
            className="items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
          >
            <ArrowUpRightIcon className="size-3" />
            <span>{metric.changePct}</span>
          </HoverTip>
        )}
      </div>

      {/* Middle: Big Metric Value */}
      <div>
        <p className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
          {metric.value}
        </p>
      </div>

      {/* Sparkline Visual */}
      <div className="pt-1">
        <SparklineChart
          metricId={metric.id}
          currentPoints={metric.currentPoints}
          previousPoints={metric.previousPoints}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
        />

        {/* Day Labels */}
        <div className="flex items-center justify-between pt-1.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
          {metric.days.map((day, idx) => (
            <span
              key={idx}
              className={
                idx === activeIndex
                  ? "font-semibold text-brand-strong dark:text-brand"
                  : undefined
              }
            >
              {day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SocialExecutiveSummary() {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/70">
      {/* Header, Subtitle & Legend */}
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 sm:text-xl dark:text-white">
            Executive Summary Media Sosial
          </h2>
          <p className="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
            Performa gabungan seluruh akun media sosial dalam cluster News (Instagram, TikTok, YouTube, dan Facebook). Data hanya mencakup media sosial, tidak termasuk website.
          </p>
        </div>

        {/* Chart Legend */}
        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded-full bg-brand" />
            <span>Periode Sekarang</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 border-b border-dashed border-zinc-400 dark:border-zinc-500" />
            <span>Periode Sebelumnya</span>
          </div>
        </div>
      </div>

      {/* 4 Metric Sparkline Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SOCIAL_METRICS_DATA.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** 64-point amplitude bars used in audio tiles. */
export function WaveformBars({
  points,
  progress = 0,
  className,
  bars = points.length,
  height = 40,
}: {
  points: number[];
  progress?: number;
  className?: string;
  bars?: number;
  height?: number;
}) {
  const values = normalize(points, bars);
  return (
    <div className={cn("flex items-center gap-[2px]", className)} style={{ height }} aria-hidden="true">
      {values.map((value, i) => {
        const played = i / values.length <= progress;
        return (
          <span
            key={i}
            className={cn(
              "flex-1 rounded-full",
              played ? "bg-brand dark:bg-brand" : "bg-zinc-300 dark:bg-zinc-600",
            )}
            style={{ height: `${Math.max(8, Math.round(value * 100))}%` }}
          />
        );
      })}
    </div>
  );
}

function normalize(points: number[], bars: number): number[] {
  if (!points.length) return new Array(bars).fill(0.25);
  if (points.length === bars) return points;
  const out: number[] = [];
  const bucket = points.length / bars;
  for (let i = 0; i < bars; i++) {
    const start = Math.floor(i * bucket);
    const end = Math.max(start + 1, Math.floor((i + 1) * bucket));
    let max = 0;
    for (let j = start; j < end && j < points.length; j++) max = Math.max(max, points[j]);
    out.push(max);
  }
  return out;
}

/** Wavesurfer-powered waveform for the detail popup (FR-MOD-5). */
export function WaveSurfer({ url, height = 96 }: { url: string; height?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let instance: { destroy: () => void } | null = null;

    void (async () => {
      const mod = await import("wavesurfer.js");
      if (disposed || !containerRef.current) return;
      const ws = mod.default.create({
        container,
        url,
        height,
        waveColor: "#a1a1aa",
        progressColor: "#6366f1",
        cursorColor: "#6366f1",
        barWidth: 2,
        barGap: 2,
        barRadius: 2,
      });
      instance = ws;
    })();

    return () => {
      disposed = true;
      instance?.destroy();
    };
  }, [url, height]);

  return <div ref={containerRef} className="w-full" style={{ minHeight: height }} />;
}

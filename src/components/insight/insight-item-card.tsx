"use client";

import { useState } from "react";
import { Chip } from "@heroui/react";
import { ChevronRightIcon } from "@/components/ui/icons";
import type { InsightItem } from "@/types";

function fmtNum(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("id-ID");
}

function fmtPct(n: number) {
  return `${n.toFixed(2)}%`;
}

function formatMetricValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return value.toLocaleString("id-ID");
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "number" ? v.toLocaleString("id-ID") : String(v)))
      .join(" · ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function labelFor(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function InsightItemCard({ item }: { item: InsightItem }) {
  const [open, setOpen] = useState(false);
  const metricEntries = Object.entries(item.formatMetrics ?? {});

  return (
    <div className="glass-card flex flex-col gap-3 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-col gap-3 text-left sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium">{item.title}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Chip size="sm">{item.source}</Chip>
            <Chip size="sm" variant="soft">{item.format}</Chip>
            <span>{new Date(item.publishedAt).toLocaleDateString("id-ID")}</span>
            {item.benchmark && (
              <Chip
                size="sm"
                variant="soft"
                color={
                  item.benchmark.status === "above"
                    ? "success"
                    : item.benchmark.status === "below"
                      ? "danger"
                      : "default"
                }
              >
                {item.benchmark.status === "above"
                  ? "Di atas"
                  : item.benchmark.status === "below"
                    ? "Di bawah"
                    : "Sekitar"}{" "}
                ER benchmark ({fmtPct(item.benchmark.er)})
              </Chip>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-4 gap-2 text-xs sm:w-72">
            <Metric label="Reach" value={fmtNum(item.core.reach)} />
            <Metric label="Imp" value={fmtNum(item.core.impressions)} />
            <Metric label="Eng" value={fmtNum(item.core.engagement)} />
            <Metric label="ER" value={fmtPct(item.core.engagementRate)} />
          </div>
          <ChevronRightIcon
            width={18}
            height={18}
            className={["shrink-0 text-zinc-400 transition-transform", open ? "rotate-90" : ""].join(" ")}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-200/60 pt-3 dark:border-white/10">
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Metrik spesifik {item.source} · {item.format}
          </p>
          {metricEntries.length === 0 ? (
            <p className="text-sm text-zinc-500">Tidak ada metrik tambahan untuk format ini.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {metricEntries.map(([key, val]) => (
                <div key={key} className="min-w-0">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{labelFor(key)}</p>
                  <p className="truncate text-sm font-medium" title={formatMetricValue(val)}>
                    {formatMetricValue(val)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-zinc-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

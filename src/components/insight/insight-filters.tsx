"use client";

export type InsightPeriod = "7" | "30" | "90" | "custom";

export interface InsightFilterState {
  period: InsightPeriod;
  from: string;
  to: string;
  sources: string[];
}

export const INSIGHT_SOURCES = [
  { value: "internal", label: "Internal" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
] as const;

export function computeRange(filter: InsightFilterState): { from: Date; to: Date } {
  if (filter.period === "custom" && filter.from && filter.to) {
    return { from: new Date(filter.from), to: new Date(filter.to) };
  }
  const days = filter.period === "7" ? 7 : filter.period === "90" ? 90 : 30;
  const to = new Date();
  return { from: new Date(to.getTime() - days * 86400000), to };
}

const inputClass =
  "rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-1.5 text-sm dark:border-white/10 dark:bg-zinc-900/70";

export function InsightFilters({
  value,
  onChange,
}: {
  value: InsightFilterState;
  onChange: (next: InsightFilterState) => void;
}) {
  function toggleSource(source: string) {
    const set = new Set(value.sources);
    if (set.has(source)) set.delete(source);
    else set.add(source);
    onChange({ ...value, sources: [...set] });
  }

  return (
    <div className="glass-panel flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium">Periode</label>
        <select
          value={value.period}
          onChange={(e) => onChange({ ...value, period: e.target.value as InsightPeriod })}
          className={inputClass}
        >
          <option value="7">7 hari</option>
          <option value="30">30 hari</option>
          <option value="90">90 hari</option>
          <option value="custom">Kustom</option>
        </select>
        {value.period === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={value.from}
              onChange={(e) => onChange({ ...value, from: e.target.value })}
              className={inputClass}
            />
            <span className="text-sm text-zinc-500">s/d</span>
            <input
              type="date"
              value={value.to}
              onChange={(e) => onChange({ ...value, to: e.target.value })}
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Sumber</span>
        <button
          type="button"
          onClick={() => onChange({ ...value, sources: [] })}
          className={sourceChip(value.sources.length === 0)}
        >
          Semua
        </button>
        {INSIGHT_SOURCES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => toggleSource(s.value)}
            className={sourceChip(value.sources.includes(s.value))}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function sourceChip(active: boolean) {
  return [
    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
    active
      ? "border-transparent bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
      : "border-zinc-200/70 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5",
  ].join(" ");
}

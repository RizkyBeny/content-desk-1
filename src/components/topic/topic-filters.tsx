"use client";

export const TREND_CATEGORIES = [
  "Nasional",
  "Politik",
  "Ekonomi",
  "Olahraga",
  "Hiburan",
  "Teknologi",
  "Lifestyle",
  "Internasional",
] as const;

const inputClass =
  "rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-1.5 text-sm dark:border-white/10 dark:bg-zinc-900/70";

export interface TopicFilterState {
  category: string;
}

export function TopicFilters({
  value,
  onChange,
}: {
  value: TopicFilterState;
  onChange: (next: TopicFilterState) => void;
}) {
  return (
    <div className="glass-panel flex flex-wrap items-center gap-3 p-4">
      <label className="text-sm font-medium">Kategori</label>
      <select
        value={value.category}
        onChange={(e) => onChange({ ...value, category: e.target.value })}
        className={inputClass}
      >
        <option value="">Semua kategori</option>
        {TREND_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}


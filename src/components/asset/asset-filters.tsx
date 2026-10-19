"use client";

import { ASSET_ORIGIN_OPTIONS } from "./asset-meta";
import type { AssetOrigin, AssetType } from "@/types";

export interface AssetFilterState {
  q: string;
  type: "" | AssetType;
  origin: "" | AssetOrigin;
  tag: string;
}

export const EMPTY_ASSET_FILTERS: AssetFilterState = { q: "", type: "image", origin: "", tag: "" };

const inputClass =
  "rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-1.5 text-sm dark:border-white/10 dark:bg-zinc-900/70";

export function AssetFilters({
  value,
  onChange,
  tags,
}: {
  value: AssetFilterState;
  onChange: (next: AssetFilterState) => void;
  tags: string[];
}) {
  return (
    <div className="glass-panel flex flex-col gap-3 p-4">
      <input
        type="search"
        placeholder="Cari nama aset…"
        value={value.q}
        onChange={(e) => onChange({ ...value, q: e.target.value })}
        className={`${inputClass} w-full sm:max-w-sm`}
        aria-label="Cari aset"
      />
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter tipe disembunyikan - hanya tampilkan Gambar sesuai permintaan */}
        <select
          value={value.origin}
          onChange={(e) => onChange({ ...value, origin: e.target.value as AssetFilterState["origin"] })}
          className={inputClass}
          aria-label="Filter sumber"
        >
          <option value="">Semua sumber</option>
          {ASSET_ORIGIN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {tags.length > 0 && (
          <select
            value={value.tag}
            onChange={(e) => onChange({ ...value, tag: e.target.value })}
            className={inputClass}
            aria-label="Filter tag"
          >
            <option value="">Semua tag</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
        )}

        {(value.q || value.type || value.origin || value.tag) && (
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_ASSET_FILTERS, type: "image" })}
            className="text-sm text-zinc-500 underline-offset-2 hover:underline"
          >
            Reset filter
          </button>
        )}
      </div>
    </div>
  );
}

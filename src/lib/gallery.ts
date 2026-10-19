import type { GenerationType } from "@/types";

export interface TileSpan {
  col: number;
  row: number;
}

/** Algoritma spacing bento (PRD "Algoritma Tile Bento"). */
export function tileSpan(type: GenerationType, width?: number | null, height?: number | null): TileSpan {
  if (type === "audio") return { col: 1, row: 1 };
  if (type === "brief") return { col: 2, row: 1 };
  const ratio = (width ?? 1) / (height ?? 1);
  if (ratio >= 1.6) return { col: 2, row: 1 };
  if (ratio <= 0.7) return { col: 1, row: 2 };
  return { col: 1, row: 1 };
}

/** FR-GAL-2: 4 kolom ≥1024px, 3 kolom 768–1023px, 2 kolom <768px. */
export function columnsFor(viewportWidth: number, type: GenerationType = "image"): number {
  const base = viewportWidth >= 1024 ? 4 : viewportWidth >= 768 ? 3 : 2;
  // Audio: grid 3 kolom (seragam) di desktop, 2 di tablet, 1 di mobile.
  if (type === "audio") return base === 4 ? 3 : base === 3 ? 2 : 1;
  return base;
}

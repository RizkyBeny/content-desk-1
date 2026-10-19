/**
 * Benchmark Engagement Rate (median organik) — FR-INS-5.
 * Disimpan sebagai konfigurasi agar mudah diperbarui tanpa mengubah kode modul.
 * Key: `${source}:${format}`. ER dalam persen (bukan rasio 0–1).
 */

export type ErBand = {
  /** Garis banding tunggal yang dipakai untuk indikator above/below. */
  line: number;
  /** Rentang median deskriptif (opsional), untuk konteks di UI. */
  label?: string;
};

export const BENCHMARKS: Record<string, ErBand> = {
  "instagram:reels": { line: 0.5, label: "0,5% – 1%+" },
  "instagram:image": { line: 0.5, label: "0,5%" },
  "instagram:carousel": { line: 0.55, label: "0,55%" },
  "tiktok:video": { line: 3.39, label: "3,39%" },
  "tiktok:image": { line: 1.92, label: "1,92%" },
  "tiktok:carousel": { line: 1.92, label: "1,92%" },
  "x:image": { line: 3.4, label: "3,4%" },
  "x:text": { line: 3.4, label: "3,4%" },
  "x:thread": { line: 3.4, label: "3,4%" },
  "facebook:image": { line: 5.2, label: "5,20%" },
  "facebook:video": { line: 4.84, label: "4,84%" },
  "facebook:carousel": { line: 4.84, label: "4,84%" },
};

/** Platform/format tanpa benchmark → indikator tidak ditampilkan. */
export function getBenchmark(source: string, format: string): ErBand | null {
  return BENCHMARKS[`${source}:${format}`] ?? null;
}

export type BenchmarkStatus = "above" | "below" | "around";

export function compareToBenchmark(
  engagementRate: number,
  band: ErBand,
): BenchmarkStatus {
  const ratio = engagementRate / band.line;
  if (ratio >= 1.15) return "above";
  if (ratio <= 0.85) return "below";
  return "around";
}

import { getEnv } from "@/lib/env";
import type { TrendAdapter, TrendSignalRaw } from "./types";
import { mockTrendAdapters } from "./mock";

export function getTrendAdapters(): TrendAdapter[] {
  const provider = getEnv().TREND_PROVIDER;
  // Live adapters (Google Trends via third-party, YouTube Data API, X API)
  // are registered here once credentials are available.
  void provider;
  return mockTrendAdapters;
}

export async function fetchAllTrends(region = "ID"): Promise<TrendSignalRaw[]> {
  const adapters = getTrendAdapters();
  const results = await Promise.allSettled(adapters.map((a) => a.fetchTrends(region)));
  const out: TrendSignalRaw[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") out.push(...r.value);
  }
  return out;
}

export type { TrendAdapter, TrendSignalRaw } from "./types";

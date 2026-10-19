import type { ConnectionType } from "@/types";

export interface TrendSignalRaw {
  provider: "google_trends" | "youtube" | "x";
  keyword: string;
  category: string | null;
  volumeScore: number;
  rawPayload?: Record<string, unknown>;
}

export interface TrendAdapter {
  readonly provider: "google_trends" | "youtube" | "x";
  /** Regions the adapter can serve; default ID. */
  fetchTrends(region: string): Promise<TrendSignalRaw[]>;
}

export const TREND_PROVIDER_META: Record<
  TrendSignalRaw["provider"],
  { label: string; connectionType: ConnectionType | null }
> = {
  google_trends: { label: "Google Trends", connectionType: null },
  youtube: { label: "YouTube Trending", connectionType: "youtube" },
  x: { label: "X Trending", connectionType: "x" },
};

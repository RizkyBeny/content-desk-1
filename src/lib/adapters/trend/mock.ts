import type { TrendAdapter, TrendSignalRaw } from "./types";
import { seededRandom } from "@/lib/adapters/social/metrics";

const SEEDS: Record<TrendSignalRaw["provider"], { keyword: string; category: string }[]> = {
  google_trends: [
    { keyword: "kenaikan harga pangan", category: "Ekonomi" },
    { keyword: "jadwal timnas indonesia", category: "Olahraga" },
    { keyword: "prakiraan cuaca ekstrem", category: "Nasional" },
    { keyword: "kabar terbaru pemilu", category: "Politik" },
    { keyword: "film indonesia terbaru", category: "Hiburan" },
    { keyword: "harga tiket pesawat", category: "Ekonomi" },
    { keyword: "perkembangan teknologi ai", category: "Teknologi" },
  ],
  youtube: [
    { keyword: "pidato presiden hari ini", category: "Politik" },
    { keyword: "highlight pertandingan liga", category: "Olahraga" },
    { keyword: "review hp terbaru", category: "Teknologi" },
    { keyword: "resep masakan rumahan", category: "Lifestyle" },
    { keyword: "kecelakaan lalu lintas", category: "Nasional" },
  ],
  x: [
    { keyword: "gempa hari ini", category: "Nasional" },
    { keyword: "isu kenaikan bbm", category: "Ekonomi" },
    { keyword: "drama artis viral", category: "Hiburan" },
    { keyword: "kebijakan pendidikan", category: "Politik" },
    { keyword: "startup unicorn indonesia", category: "Ekonomi" },
  ],
};

function makeAdapter(provider: TrendSignalRaw["provider"]): TrendAdapter {
  return {
    provider,
    async fetchTrends(region: string): Promise<TrendSignalRaw[]> {
      const rand = seededRandom(`${provider}:${region}:${new Date().getUTCDate()}`);
      return SEEDS[provider].map((s) => ({
        provider,
        keyword: s.keyword,
        category: s.category,
        volumeScore: Math.round(55 + rand() * 45),
        rawPayload: { region, estimatedSearches: Math.round(1000 + rand() * 90000) },
      }));
    },
  };
}

export const mockTrendAdapters: TrendAdapter[] = [
  makeAdapter("google_trends"),
  makeAdapter("youtube"),
  makeAdapter("x"),
];

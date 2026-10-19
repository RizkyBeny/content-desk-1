import type { ConnectionType } from "@/types";
import type { OAuthTokens, RawContentRecord, SocialAdapter } from "./types";
import { buildFormatMetrics, seededRandom } from "./metrics";

const TITLES: Record<string, string[]> = {
  "instagram:reels": [
    "Breaking: kabar terbaru hari ini",
    "3 fakta di balik peristiwa viral",
    "Kronologi singkat peristiwa penting",
    "Reaksi publik atas kabar terkini",
    "Kabar terkini dalam 60 detik",
  ],
  "instagram:image": [
    "Kabar hari ini",
    "Fakta menarik peristiwa terkini",
    "Data & angka kabar terbaru",
    "Ringkasan berita pagi",
  ],
  "instagram:carousel": [
    "5 fakta peristiwa viral",
    "Rangkuman kabar minggu ini",
    "Kronologi peristiwa penting",
    "Analisis kabar terkini",
  ],
  "tiktok:video": [
    "Jangan lewatkan kabar ini",
    "Peristiwa viral hari ini",
    "Kabar terbaru yang bikin heboh",
    "Reaksi warga atas kabar terkini",
  ],
  "tiktok:image": ["Fakta peristiwa", "Kabar singkat"],
  "tiktok:carousel": ["Kronologi kabar", "Rangkuman berita"],
  "x:video": ["Liputan langsung peristiwa"],
  "x:image": ["Thread kabar terkini", "Analisis peristiwa"],
  "x:thread": [
    "Thread: kronologi peristiwa viral",
    "Thread: fakta di balik kabar",
    "Thread: dampak peristiwa terkini",
  ],
  "facebook:video": ["Liputan singkat kabar terkini"],
  "facebook:image": ["Kabar hari ini", "Infografis peristiwa"],
  "facebook:carousel": ["Rangkuman berita terkini"],
  "youtube:long_form": [
    "Liputan mendalam peristiwa penting",
    "Dokumenter: kronologi kabar terkini",
    "Analisis panjang peristiwa viral",
  ],
  "youtube:shorts": ["1 menit kabar terkini", "Fakta singkat peristiwa"],
  "youtube:community_post": ["Poll: tanggapanmu soal kabar ini?", "Update redaksi minggu ini"],
};

const FORMATS: Record<ConnectionType, { format: string; weight: number }[]> = {
  instagram: [
    { format: "reels", weight: 0.45 },
    { format: "carousel", weight: 0.3 },
    { format: "image", weight: 0.25 },
  ],
  tiktok: [
    { format: "video", weight: 0.75 },
    { format: "carousel", weight: 0.15 },
    { format: "image", weight: 0.1 },
  ],
  x: [
    { format: "thread", weight: 0.4 },
    { format: "image", weight: 0.35 },
    { format: "video", weight: 0.25 },
  ],
  facebook: [
    { format: "image", weight: 0.4 },
    { format: "video", weight: 0.35 },
    { format: "carousel", weight: 0.25 },
  ],
  youtube: [
    { format: "shorts", weight: 0.5 },
    { format: "long_form", weight: 0.35 },
    { format: "community_post", weight: 0.15 },
  ],
  internal: [{ format: "artikel", weight: 1 }],
};

function pickFormat(type: ConnectionType, rand: () => number): string {
  const opts = FORMATS[type] ?? FORMATS.instagram;
  const roll = rand();
  let acc = 0;
  for (const o of opts) {
    acc += o.weight;
    if (roll <= acc) return o.format;
  }
  return opts[opts.length - 1].format;
}

function titleFor(type: ConnectionType, format: string, rand: () => number): string {
  const list = TITLES[`${type}:${format}`] ?? TITLES[`${type}:image`] ?? ["Konten baru"];
  return list[Math.floor(rand() * list.length)];
}

export function generateMockRecords(
  type: ConnectionType,
  seed: string,
  since: Date,
  count = 24,
): RawContentRecord[] {
  const rand = seededRandom(seed);
  const now = Date.now();
  const spanDays = 90;
  const records: RawContentRecord[] = [];

  for (let i = 0; i < count; i++) {
    const format = pickFormat(type, rand);
    const daysAgo = Math.floor(rand() * spanDays);
    const publishedAt = new Date(now - daysAgo * 86400000 - Math.floor(rand() * 86400000));
    if (publishedAt < since) continue;

    const impressions = Math.round(2000 + rand() * 90000);
    const hasReach = type !== "x" && type !== "youtube";
    const reach = hasReach ? Math.round(impressions * (0.75 + rand() * 0.2)) : null;
    const erTarget = 0.01 + rand() * 0.08;
    const engagement = Math.round((reach ?? impressions) * erTarget);

    records.push({
      externalId: `${type}-${seed}-${i}-${publishedAt.getTime()}`,
      format,
      title: titleFor(type, format, rand),
      thumbnailUrl: `https://picsum.photos/seed/${type}${i}/400/500`,
      url: `https://example.com/${type}/${i}`,
      publishedAt: publishedAt.toISOString(),
      reach,
      impressions,
      engagement,
      formatMetrics: buildFormatMetrics(type, format, reach, impressions, rand),
    });
  }
  return records.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
}

function makeMockAdapter(type: ConnectionType): SocialAdapter {
  return {
    type,
    getAuthUrl(state: string) {
      const params = new URLSearchParams({ state, mock: "1" });
      return `/api/connections/${type}/oauth/callback?${params.toString()}`;
    },
    async exchangeCode(code: string): Promise<OAuthTokens> {
      return {
        accessToken: `mock-access-${type}-${code}`,
        refreshToken: `mock-refresh-${type}`,
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        accountHandle: `@${type}_official`,
      };
    },
    async fetchRecords(connection, since) {
      const seed = connection.externalRef ?? connection.accountHandle ?? type;
      const count = 18 + Math.floor(seededRandom(seed)() * 14);
      return generateMockRecords(type, seed, since, count);
    },
  };
}

export const mockSocialAdapters: Record<ConnectionType, SocialAdapter> = {
  instagram: makeMockAdapter("instagram"),
  tiktok: makeMockAdapter("tiktok"),
  x: makeMockAdapter("x"),
  facebook: makeMockAdapter("facebook"),
  youtube: makeMockAdapter("youtube"),
  internal: makeMockAdapter("internal"),
};

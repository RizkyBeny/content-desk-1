import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/adapters/ai";
import { ApiError } from "@/lib/api";
import type { SessionUser } from "@/lib/auth/session";
import type { TopicInsight, TopicRecommendation } from "@/types";
import { getUserFormatPerformance, accessibleConnectionIds } from "./scope";
import type { MetricSummaryForAI } from "@/lib/adapters/ai/types";

const REFRESH_THROTTLE_MS = 5 * 60 * 1000;
const RECOMMENDATION_CACHE_MS = 60 * 60 * 1000;

export interface RecentTrendSignal {
  provider: string;
  keyword: string;
  category: string | null;
  volumeScore: number;
}

export async function getRecentTrendSignals(limit = 40): Promise<RecentTrendSignal[]> {
  const signals = await prisma.trendSignal.findMany({
    orderBy: { fetchedAt: "desc" },
    take: limit,
  });
  if (signals.length === 0) return [];
  // de-dupe by provider+keyword keeping the freshest
  const seen = new Set<string>();
  return signals
    .filter((s) => {
      const k = `${s.provider}:${s.keyword}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map((s) => ({
      provider: s.provider,
      keyword: s.keyword,
      category: s.category,
      volumeScore: s.volumeScore,
    }));
}

export interface RecommendationFilter {
  sources: string[];
  category: string | null;
  limit: number;
}

export async function getTopicRecommendations(
  user: SessionUser,
  filter: RecommendationFilter,
  force = false,
): Promise<{ items: TopicRecommendation[]; cached: boolean; lastTrendAt: string | null; hasTrendData: boolean }> {
  const key = `topics:recs:${user.id}:${filter.sources.sort().join(",")}:${filter.category ?? "all"}:${filter.limit}`;
  const cachedRow = await prisma.aiCache.findUnique({ where: { key } });
  const now = Date.now();
  const generatedAt = readGeneratedAt(cachedRow?.payload);

  if (cachedRow && !force && generatedAt && now - generatedAt < RECOMMENDATION_CACHE_MS) {
    const payload = cachedRow.payload as unknown as { items: TopicRecommendation[]; lastTrendAt: string | null };
    return { items: payload.items, cached: true, lastTrendAt: payload.lastTrendAt, hasTrendData: payload.items.length > 0 };
  }

  if (force && generatedAt && now - generatedAt < REFRESH_THROTTLE_MS) {
    const waitMin = Math.ceil((REFRESH_THROTTLE_MS - (now - generatedAt)) / 60000);
    throw new ApiError(`Rekomendasi baru bisa disegarkan lagi dalam ${waitMin} menit.`, 429);
  }

  const signalsAll = await getRecentTrendSignals(60);
  const lastTrendAt = signalsAll.length
    ? (await prisma.trendSignal.findFirst({ orderBy: { fetchedAt: "desc" }, select: { fetchedAt: true } }))?.fetchedAt.toISOString() ?? null
    : null;

  const filtered = signalsAll.filter((s) => {
    if (filter.sources.length && !filter.sources.includes(s.provider)) return false;
    if (filter.category && s.category !== filter.category) return false;
    return true;
  });

  const perf = await getUserFormatPerformance(user);
  const items = await getAIProvider().generateTopicRecommendations({
    trendSignals: filtered.length ? filtered : signalsAll,
    niche: user.niche,
    nicheCategories: user.nicheCategories,
    topFormats: perf.map((p) => ({ format: p.format, avgEr: p.avgEr })),
    lang: user.contentLang,
    limit: filter.limit,
  });

  const payload = { items, lastTrendAt, generatedAt: now };
  await prisma.aiCache.upsert({
    where: { key },
    create: {
      key,
      payload: payload as unknown as object,
      expiresAt: new Date(now + RECOMMENDATION_CACHE_MS),
    },
    update: {
      payload: payload as unknown as object,
      expiresAt: new Date(now + RECOMMENDATION_CACHE_MS),
    },
  });

  return { items, cached: false, lastTrendAt, hasTrendData: signalsAll.length > 0 };
}

function readGeneratedAt(payload: unknown): number | null {
  if (payload && typeof payload === "object" && "generatedAt" in payload) {
    const value = (payload as { generatedAt?: unknown }).generatedAt;
    if (typeof value === "number") return value;
  }
  return null;
}

export async function getTopicInsight(
  user: SessionUser,
  topic: string,
  source: "trending" | "custom",
): Promise<{ insight: TopicInsight; needClarification: boolean }> {
  const signals = await getRecentTrendSignals(60);
  const connIds = await accessibleConnectionIds(user);
  const own = await prisma.contentMetric.findMany({
    where: { ...(connIds === null ? {} : { connectionId: { in: connIds } }) },
    orderBy: { publishedAt: "desc" },
    take: 60,
  });
  const ownMetrics: MetricSummaryForAI[] = own.map((m) => ({
    source: m.source,
    format: m.format,
    title: m.title,
    engagementRate: m.engagementRate,
    reach: m.reach,
    impressions: m.impressions,
    engagement: m.engagement,
    publishedAt: m.publishedAt.toISOString(),
  }));

  // Very short / ambiguous custom topics: ask for one clarification first (edge case).
  const wordCount = topic.trim().split(/\s+/).filter(Boolean).length;
  const needClarification = source === "custom" && wordCount < 2 && topic.trim().length < 5;

  const insight = await getAIProvider().generateTopicInsight({
    topic,
    source,
    trendSignals: signals,
    niche: user.niche,
    ownMetrics,
    lang: user.contentLang,
  });
  return { insight, needClarification };
}

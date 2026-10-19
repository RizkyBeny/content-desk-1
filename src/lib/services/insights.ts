import { prisma } from "@/lib/prisma";
import type { ContentMetric } from "@prisma/client";
import { getBenchmark, compareToBenchmark } from "../../../config/benchmarks";
import { getAIProvider } from "@/lib/adapters/ai";
import type { InsightAIItem, InsightItem, InsightKpi } from "@/types";
import type { SessionUser } from "@/lib/auth/session";
import type { MetricSummaryForAI } from "@/lib/adapters/ai/types";
import { accessibleConnectionIds } from "@/lib/services/scope";

export interface InsightFilter {
  from: Date;
  to: Date;
  sources: string[];
  sortBy: "engagementRate" | "reach" | "impressions" | "engagement";
  limit: number;
  offset: number;
}

export interface InsightsResult {
  kpi: InsightKpi;
  items: InsightItem[];
  hasMore: boolean;
  hasAnyConnection: boolean;
  lastSyncedAt: string | null;
}

function parseSources(sources: string[]): string[] {
  return sources.filter((s) => s && s !== "all");
}

export async function getInsights(
  user: SessionUser,
  filter: InsightFilter,
): Promise<InsightsResult> {
  const connIds = await accessibleConnectionIds(user);
  const connectionFilter = connIds === null ? {} : { connectionId: { in: connIds } };
  const sourceFilter = parseSources(filter.sources).length
    ? { source: { in: parseSources(filter.sources) } }
    : {};

  const allConnections = await prisma.dataConnection.findMany({
    where: connIds === null ? {} : { id: { in: connIds } },
    select: { id: true, lastSyncedAt: true },
  });
  const hasAnyConnection = allConnections.length > 0;
  const lastSyncedAt =
    allConnections
      .map((c) => c.lastSyncedAt)
      .filter((d): d is Date => !!d)
      .sort((a, b) => b.getTime() - a.getTime())[0]?.toISOString() ?? null;

  const durationMs = filter.to.getTime() - filter.from.getTime();
  const prevFrom = new Date(filter.from.getTime() - durationMs);
  const prevTo = filter.from;

  const [current, previous] = await Promise.all([
    prisma.contentMetric.findMany({
      where: { ...connectionFilter, ...sourceFilter, publishedAt: { gte: filter.from, lte: filter.to } },
    }),
    prisma.contentMetric.findMany({
      where: { ...connectionFilter, ...sourceFilter, publishedAt: { gte: prevFrom, lte: prevTo } },
    }),
  ]);

  const kpi = computeKpi(current, previous);

  const sorted = [...current].sort((a, b) => {
    if (filter.sortBy === "reach") return (b.reach ?? 0) - (a.reach ?? 0);
    if (filter.sortBy === "impressions") return b.impressions - a.impressions;
    if (filter.sortBy === "engagement") return b.engagement - a.engagement;
    return b.engagementRate - a.engagementRate;
  });

  const page = sorted.slice(filter.offset, filter.offset + filter.limit);
  const items: InsightItem[] = page.map((m) => ({
    id: m.id,
    source: m.source,
    format: m.format,
    title: m.title,
    publishedAt: m.publishedAt.toISOString(),
    core: {
      reach: m.reach,
      impressions: m.impressions,
      engagement: m.engagement,
      engagementRate: m.engagementRate,
    },
    formatMetrics: (m.formatMetrics ?? {}) as Record<string, unknown>,
    benchmark: benchmarkFor(m.source, m.format, m.engagementRate),
  }));

  return {
    kpi,
    items,
    hasMore: filter.offset + filter.limit < sorted.length,
    hasAnyConnection,
    lastSyncedAt,
  };
}

function benchmarkFor(source: string, format: string, er: number) {
  const band = getBenchmark(source, format);
  if (!band) return null;
  return { er: band.line, status: compareToBenchmark(er, band) };
}

function computeKpi(current: ContentMetric[], previous: ContentMetric[]): InsightKpi {
  const sum = (rows: ContentMetric[]) => ({
    totalReach: rows.reduce((a, r) => a + (r.reach ?? 0), 0),
    totalImpressions: rows.reduce((a, r) => a + r.impressions, 0),
    totalEngagement: rows.reduce((a, r) => a + r.engagement, 0),
    avg: rows.length ? rows.reduce((a, r) => a + r.engagementRate, 0) / rows.length : 0,
  });
  const c = sum(current);
  const p = sum(previous);
  return {
    totalReach: c.totalReach,
    totalImpressions: c.totalImpressions,
    totalEngagement: c.totalEngagement,
    avgEngagementRate: Math.round(c.avg * 100) / 100,
    previousPeriod: {
      totalReach: p.totalReach,
      totalImpressions: p.totalImpressions,
      totalEngagement: p.totalEngagement,
      avgEngagementRate: Math.round(p.avg * 100) / 100,
    },
  };
}

// ── Insight AI (FR-INS-6, FR-INS-7) ─────────────────────────

export async function getInsightAI(
  user: SessionUser,
  filter: Omit<InsightFilter, "limit" | "offset" | "sortBy">,
  force = false,
): Promise<{ insights: InsightAIItem[]; cached: boolean }> {
  const connIds = await accessibleConnectionIds(user);
  const key = cacheKey("insight", user, filter, connIds);
  const cached = await prisma.aiCache.findUnique({ where: { key } });
  if (!force && cached && cached.expiresAt > new Date()) {
    return { insights: cached.payload as unknown as InsightAIItem[], cached: true };
  }

  const where = {
    ...(connIds === null ? {} : { connectionId: { in: connIds } }),
    ...(parseSources(filter.sources).length ? { source: { in: parseSources(filter.sources) } } : {}),
    publishedAt: { gte: filter.from, lte: filter.to },
  };
  const durationMs = filter.to.getTime() - filter.from.getTime();
  const [current, previous] = await Promise.all([
    prisma.contentMetric.findMany({ where }),
    prisma.contentMetric.findMany({
      where: { ...where, publishedAt: { gte: new Date(filter.from.getTime() - durationMs), lte: filter.from } },
    }),
  ]);

  const metrics: MetricSummaryForAI[] = current.map((m) => ({
    source: m.source,
    format: m.format,
    title: m.title,
    engagementRate: m.engagementRate,
    reach: m.reach,
    impressions: m.impressions,
    engagement: m.engagement,
    publishedAt: m.publishedAt.toISOString(),
  }));
  const avg = (rows: ContentMetric[]) =>
    rows.length ? rows.reduce((a, r) => a + r.engagementRate, 0) / rows.length : 0;

  const insights = await getAIProvider().generateInsights({
    metrics,
    currentAvgEr: avg(current),
    previousAvgEr: avg(previous),
    niche: user.niche,
    lang: user.contentLang,
    periodLabel: `${Math.round(durationMs / 86400000)} hari terakhir`,
  });

  await prisma.aiCache.upsert({
    where: { key },
    create: {
      key,
      payload: insights as unknown as object,
      expiresAt: new Date(Date.now() + 3600000),
    },
    update: {
      payload: insights as unknown as object,
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  return { insights, cached: false };
}

function cacheKey(
  prefix: string,
  user: SessionUser,
  filter: { from: Date; to: Date; sources: string[] },
  connIds: string[] | null,
): string {
  const src = parseSources(filter.sources).sort().join(",");
  const scope = connIds === null ? "admin" : `u:${user.id}:${connIds.sort().join(",")}`;
  return `${prefix}:${scope}:${filter.from.toISOString()}:${filter.to.toISOString()}:${src}`;
}

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { decrypt } from "@/lib/crypto";
import { getSocialAdapter } from "@/lib/adapters/social";
import { fetchAllTrends } from "@/lib/adapters/trend";
import { computeEngagementRate } from "@/lib/adapters/social/metrics";
import type { ConnectionType } from "@/types";

const SYNC_WINDOW_DAYS = 90;

export interface SyncResult {
  connectionId: string;
  upserted: number;
  skipped: number;
  status: "connected" | "error" | "expired";
  error?: string;
}

export async function syncConnection(connectionId: string): Promise<SyncResult> {
  const connection = await prisma.dataConnection.findUnique({ where: { id: connectionId } });
  if (!connection) throw new Error("Koneksi tidak ditemukan");

  await prisma.dataConnection.update({
    where: { id: connectionId },
    data: { status: "syncing" },
  });

  try {
    const adapter = getSocialAdapter(connection.type as ConnectionType);
    const since =
      connection.lastSyncedAt ??
      new Date(Date.now() - SYNC_WINDOW_DAYS * 86400000);

    const records = await adapter.fetchRecords(
      {
        id: connection.id,
        accessToken: decrypt(connection.accessToken),
        accountHandle: connection.accountHandle,
        externalRef: connection.externalRef,
      },
      since,
    );

    let upserted = 0;
    let skipped = 0;
    for (const rec of records) {
      if (!rec.externalId || !rec.publishedAt) {
        skipped++;
        continue;
      }
      const engagementRate = computeEngagementRate(
        rec.engagement,
        rec.reach ?? null,
        rec.impressions,
      );
      await prisma.contentMetric.upsert({
        where: {
          connectionId_externalId: {
            connectionId: connection.id,
            externalId: rec.externalId,
          },
        },
        create: {
          connectionId: connection.id,
          externalId: rec.externalId,
          source: connection.type,
          format: rec.format,
          title: rec.title,
          thumbnailUrl: rec.thumbnailUrl ?? null,
          url: rec.url ?? null,
          publishedAt: new Date(rec.publishedAt),
          reach: rec.reach ?? null,
          impressions: rec.impressions,
          engagement: rec.engagement,
          engagementRate,
          formatMetrics: rec.formatMetrics as unknown as Prisma.InputJsonValue,
        },
        update: {
          title: rec.title,
          reach: rec.reach ?? null,
          impressions: rec.impressions,
          engagement: rec.engagement,
          engagementRate,
          formatMetrics: rec.formatMetrics as unknown as Prisma.InputJsonValue,
          syncedAt: new Date(),
        },
      });
      upserted++;
    }

    await prisma.dataConnection.update({
      where: { id: connectionId },
      data: {
        status: "connected",
        lastSyncedAt: new Date(),
        lastError: null,
      },
    });
    await prisma.aiCache.deleteMany({ where: { key: { startsWith: "insight:" } } });
    return { connectionId, upserted, skipped, status: "connected" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kesalahan tidak dikenal";
    const expired = /expired|invalid_grant|401|revoked/i.test(message);
    await prisma.dataConnection.update({
      where: { id: connectionId },
      data: { status: expired ? "expired" : "error", lastError: message },
    });
    return { connectionId, upserted: 0, skipped: 0, status: expired ? "expired" : "error", error: message };
  }
}

export async function syncAllConnections(): Promise<SyncResult[]> {
  const connections = await prisma.dataConnection.findMany({ select: { id: true } });
  const results: SyncResult[] = [];
  for (const c of connections) {
    results.push(await syncConnection(c.id));
  }
  return results;
}

export async function refreshTrends(region = "ID"): Promise<number> {
  const signals = await fetchAllTrends(region);
  if (signals.length === 0) return 0;
  await prisma.trendSignal.createMany({
    data: signals.map((s) => ({
      provider: s.provider,
      region,
      keyword: s.keyword,
      category: s.category,
      volumeScore: s.volumeScore,
      rawPayload: s.rawPayload as unknown as Prisma.InputJsonValue,
    })),
  });
  await prisma.aiCache.deleteMany({ where: { key: { startsWith: "topics:" } } });
  return signals.length;
}

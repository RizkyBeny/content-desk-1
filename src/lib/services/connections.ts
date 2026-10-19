import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { encrypt } from "@/lib/crypto";
import { getSocialAdapter } from "@/lib/adapters/social";
import { enqueueJob } from "@/lib/queue";
import { ApiError } from "@/lib/api";
import type { SessionUser } from "@/lib/auth/session";
import type { ConnectionType } from "@/types";

const MANUAL_SYNC_THROTTLE_MS = 15 * 60 * 1000;
const PLATFORM_TYPES: ConnectionType[] = ["instagram", "tiktok", "x", "facebook", "youtube"];

export interface ConnectionView {
  id: string;
  type: string;
  displayName: string;
  accountHandle: string | null;
  status: string;
  lastSyncedAt: string | null;
  lastError: string | null;
  owners: { id: string; name: string; email: string }[];
  metricCount: number;
}

export async function listConnections(user: SessionUser): Promise<ConnectionView[]> {
  const where =
    user.role === "admin"
      ? {}
      : { owners: { some: { userId: user.id } } };

  const connections = await prisma.dataConnection.findMany({
    where,
    include: { owners: { include: { user: { select: { id: true, name: true, email: true } } } } },
    orderBy: [{ type: "asc" }, { displayName: "asc" }],
  });

  const counts = await prisma.contentMetric.groupBy({
    by: ["connectionId"],
    _count: { _all: true },
    where: { connectionId: { in: connections.map((c) => c.id) } },
  });
  const countMap = new Map(counts.map((c) => [c.connectionId, c._count._all]));

  return connections.map((c) => ({
    id: c.id,
    type: c.type,
    displayName: c.displayName,
    accountHandle: c.accountHandle,
    status: c.status,
    lastSyncedAt: c.lastSyncedAt?.toISOString() ?? null,
    lastError: c.lastError,
    owners: c.owners.map((o) => o.user),
    metricCount: countMap.get(c.id) ?? 0,
  }));
}

/** Mock/manual connect for a social platform (OAuth callback lands here). */
export async function connectSocial(
  admin: SessionUser,
  type: ConnectionType,
  displayName: string,
  handle?: string,
) {
  if (!PLATFORM_TYPES.includes(type)) throw new ApiError("Tipe koneksi tidak valid.", 400);
  const adapter = getSocialAdapter(type);
  const tokens = await adapter.exchangeCode(`mock-${Date.now()}`);
  return prisma.dataConnection.create({
    data: {
      type,
      displayName,
      accountHandle: handle ?? tokens.accountHandle ?? null,
      externalRef: `${type}-${displayName}`,
      accessToken: encrypt(tokens.accessToken),
      refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
      tokenExpiresAt: tokens.expiresAt ? new Date(tokens.expiresAt) : null,
      status: "connected",
      owners: { create: { userId: admin.id } },
    },
  });
}

export async function connectInternal(
  admin: SessionUser,
  input: { displayName: string; url: string; apiKey: string; schedule?: string },
) {
  const config = {
    url: input.url,
    apiKeyEncrypted: encrypt(input.apiKey),
    schedule: input.schedule ?? "0 */6 * * *",
  };
  return prisma.dataConnection.create({
    data: {
      type: "internal",
      displayName: input.displayName,
      externalRef: input.url,
      config: config as unknown as Prisma.InputJsonValue,
      status: "connected",
      owners: { create: { userId: admin.id } },
    },
  });
}

export async function syncConnectionNow(admin: SessionUser, connectionId: string) {
  void admin;
  const connection = await prisma.dataConnection.findUnique({ where: { id: connectionId } });
  if (!connection) throw new ApiError("Koneksi tidak ditemukan.", 404);

  const config = (connection.config as Record<string, unknown> | null) ?? {};
  const lastManual = typeof config.manualSyncAt === "string" ? Date.parse(config.manualSyncAt) : 0;
  const now = Date.now();
  if (now - lastManual < MANUAL_SYNC_THROTTLE_MS) {
    const waitMin = Math.ceil((MANUAL_SYNC_THROTTLE_MS - (now - lastManual)) / 60000);
    throw new ApiError(`Sinkronisasi manual dibatasi 1x per 15 menit. Coba lagi dalam ${waitMin} menit.`, 429);
  }

  await prisma.dataConnection.update({
    where: { id: connectionId },
    data: {
      config: { ...config, manualSyncAt: new Date(now).toISOString() } as unknown as Prisma.InputJsonValue,
      status: "syncing",
    },
  });
  await enqueueJob("sync-connection", { connectionId });
  return { queued: true };
}

export async function setConnectionOwners(admin: SessionUser, connectionId: string, userIds: string[]) {
  void admin;
  const connection = await prisma.dataConnection.findUnique({ where: { id: connectionId } });
  if (!connection) throw new ApiError("Koneksi tidak ditemukan.", 404);
  await prisma.$transaction([
    prisma.connectionOwner.deleteMany({ where: { connectionId } }),
    prisma.connectionOwner.createMany({
      data: [...new Set(userIds)].map((userId) => ({ connectionId, userId })),
    }),
  ]);
  return { ok: true };
}

export async function listMembers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}

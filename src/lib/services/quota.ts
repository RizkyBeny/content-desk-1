import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import {
  DEFAULT_DAILY_LIMITS,
  DEFAULT_MAX_CONCURRENT,
  type GenerationType,
} from "../../../config/generation";
import type { QuotaDTO } from "@/types";

const JAKARTA_TZ = "Asia/Jakarta";
const JAKARTA_OFFSET = "+07:00";

/** Tanggal kuota mengikuti zona WIB (FR-QTA-2). */
export function jakartaDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** 00.00 WIB berikutnya, sebagai ISO string. */
export function jakartaResetAt(now: Date = new Date()): string {
  const date = jakartaDate(now);
  const start = new Date(`${date}T00:00:00${JAKARTA_OFFSET}`).getTime();
  return new Date(start + 24 * 60 * 60 * 1000).toISOString();
}

export interface QuotaLimits {
  limit: number;
  maxConcurrent: number;
}

export async function getQuotaLimits(type: GenerationType): Promise<QuotaLimits> {
  const row = await prisma.quotaConfig.findUnique({ where: { type } });
  return {
    limit: row?.dailyLimit ?? DEFAULT_DAILY_LIMITS[type],
    maxConcurrent: row?.maxConcurrent ?? DEFAULT_MAX_CONCURRENT[type],
  };
}

async function ensureUsageRow(userId: string, type: GenerationType, date: string): Promise<void> {
  try {
    await prisma.quotaUsage.upsert({
      where: { userId_type_date: { userId, type, date } },
      create: { userId, type, date, used: 0 },
      update: {},
    });
  } catch {
    // Balapan create antar-request: baris sudah dibuat oleh request lain.
  }
}

export async function countRunning(userId: string, type: GenerationType): Promise<number> {
  return prisma.generation.count({
    where: { userId, type, deletedAt: null, status: { in: ["queued", "processing"] } },
  });
}

/** Pemakaian hari ini + sisa kuota + slot proses bersamaan (FR-QTA-5). */
export async function getQuota(userId: string, type: GenerationType): Promise<QuotaDTO> {
  const date = jakartaDate();
  const [usage, limits, running] = await Promise.all([
    prisma.quotaUsage.findUnique({ where: { userId_type_date: { userId, type, date } } }),
    getQuotaLimits(type),
    countRunning(userId, type),
  ]);
  const used = usage?.used ?? 0;
  return {
    type,
    used,
    limit: 999,
    remaining: 999,
    date,
    resetAt: jakartaResetAt(),
    running,
    maxConcurrent: 99,
  };
}

export async function getAllQuota(userId: string): Promise<QuotaDTO[]> {
  const types: GenerationType[] = ["image", "video", "audio", "brief"];
  return Promise.all(types.map((type) => getQuota(userId, type)));
}

/** Mockup data: tidak membatasi proses bersamaan. */
export async function assertConcurrency(_userId: string, _type: GenerationType): Promise<void> {
  // Mockup mode: no concurrency limit
}

/** Reservasi: increment usage tanpa batasan limit untuk dummy/mockup data. */
export async function reserveQuota(userId: string, type: GenerationType): Promise<QuotaDTO> {
  const date = jakartaDate();
  await ensureUsageRow(userId, type, date);
  await prisma.quotaUsage.updateMany({
    where: { userId, type, date },
    data: { used: { increment: 1 } },
  });
  return getQuota(userId, type);
}

/** Kembalikan kuota saat proses gagal (FR-QTA-4) — idempoten per pemanggilan. */
export async function refundQuota(userId: string, type: GenerationType): Promise<void> {
  const date = jakartaDate();
  await prisma.quotaUsage.updateMany({
    where: { userId, type, date, used: { gt: 0 } },
    data: { used: { decrement: 1 } },
  });
}

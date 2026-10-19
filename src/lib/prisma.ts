import { PrismaClient } from "@prisma/client";
import { isMockData } from "@/lib/data-mode";
import { createMockPrismaClient } from "./db/mock-client";
import { seedMockData } from "./db/demo-data";

/**
 * Titik tunggal akses database.
 *
 * - DATA_MODE=mock (default saat DATABASE_URL kosong) → PrismaClient palsu
 *   in-memory yang di-seed dari fixture (src/lib/db/*). Tidak ada koneksi
 *   database sama sekali; semua route API tetap jalan seperti biasa.
 * - DATA_MODE=database → PrismaClient asli (SQLite lokal / MySQL production).
 *
 * Catatan siklus import: demo-data → seed → modul ini sah karena pemakaian
 * `prisma` hanya terjadi di dalam fungsi async (bukan saat evaluasi modul).
 */
function createClient(): PrismaClient {
  if (isMockData()) {
    return createMockPrismaClient({ seed: seedMockData }) as unknown as PrismaClient;
  }

  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
  };
  const client =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

export const prisma: PrismaClient = createClient();

import { hash } from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { syncConnection, refreshTrends } from "../src/lib/services/sync";
import { getSocialAdapter } from "../src/lib/adapters/social";
import { encrypt } from "../src/lib/crypto";
import { DEFAULT_DAILY_LIMITS, DEFAULT_MAX_CONCURRENT } from "../config/generation";

const ADMIN_EMAIL = "admin@platform.local";
const ADMIN_PASS = "admin123456";
const CREATOR_EMAIL = "creator@platform.local";
const CREATOR_PASS = "creator123456";

const PLATFORMS = [
  { type: "instagram", displayName: "Instagram Utama" },
  { type: "tiktok", displayName: "TikTok Utama" },
  { type: "x", displayName: "X Utama" },
  { type: "facebook", displayName: "Facebook Utama" },
  { type: "youtube", displayName: "YouTube Utama" },
] as const;

async function upsertUser(email: string, name: string, password: string, role: string, niche?: string) {
  const passwordHash = await hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      passwordHash,
      role,
      contentLang: "id",
      theme: "system",
      niche: niche ?? null,
      nicheCategories: niche ? ["Produktivitas", "Karier", "Kesehatan"] : [],
    },
  });
}

export async function main() {
  console.info("Seeding database...");
  const admin = await upsertUser(ADMIN_EMAIL, "Admin Utama", ADMIN_PASS, "admin", "Produktivitas & karier remote");
  const creator = await upsertUser(CREATOR_EMAIL, "Creator Demo", CREATOR_PASS, "creator", "Produktivitas & karier remote");
  console.info(`Admin:   ${ADMIN_EMAIL} / ${ADMIN_PASS}`);
  console.info(`Creator: ${CREATOR_EMAIL} / ${CREATOR_PASS}`);

  const existing = await prisma.dataConnection.count();
  if (existing === 0) {
    for (const p of PLATFORMS) {
      const adapter = getSocialAdapter(p.type);
      const tokens = await adapter.exchangeCode(`seed-${p.type}`);
      await prisma.dataConnection.create({
        data: {
          type: p.type,
          displayName: p.displayName,
          accountHandle: tokens.accountHandle,
          externalRef: `${p.type}-${p.displayName}`,
          accessToken: encrypt(tokens.accessToken),
          refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
          status: "connected",
          owners: { create: [{ userId: admin.id }, { userId: creator.id }] },
        },
      });
    }
    await prisma.dataConnection.create({
      data: {
        type: "internal",
        displayName: "Internal CMS",
        externalRef: "https://internal.example.com/api/content",
        config: { url: "https://internal.example.com/api/content", schedule: "0 */6 * * *" },
        status: "connected",
        owners: { create: [{ userId: admin.id }, { userId: creator.id }] },
      },
    });
    console.info("Created demo connections.");
  }

  const trendCount = await prisma.trendSignal.count();
  if (trendCount === 0) {
    const n = await refreshTrends("ID");
    console.info(`Seeded ${n} trend signals.`);
  }

  const metricCount = await prisma.contentMetric.count();
  if (metricCount === 0) {
    const connections = await prisma.dataConnection.findMany({ select: { id: true } });
    for (const c of connections) await syncConnection(c.id);
    console.info(`Synced ${connections.length} connections.`);
  }

  await seedQuotaConfig();
  console.info("Seed completed.");
}

async function seedQuotaConfig() {
  const types = ["image", "video", "audio", "brief"] as const;
  for (const type of types) {
    await prisma.quotaConfig.upsert({
      where: { type },
      create: {
        type,
        dailyLimit: DEFAULT_DAILY_LIMITS[type],
        maxConcurrent: DEFAULT_MAX_CONCURRENT[type],
      },
      update: {},
    });
  }
  console.info("QuotaConfig siap.");
}

// Auto-jalan HANYA saat dieksekusi langsung (`tsx prisma/seed.ts`), bukan saat
// di-import — mode mock (DATA_MODE=mock) memanggil main() dari
// src/lib/db/demo-data.ts tanpa ingin menjalankan blok ini.
const invokedDirectly = Boolean(
  process.argv[1] && /[/\\]seed\.(ts|js|mts|mjs)$/.test(process.argv[1]),
);
if (invokedDirectly) {
  main()
    .catch((err) => {
      console.error("Seed error:", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

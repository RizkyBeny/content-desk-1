/**
 * Mode data aplikasi.
 *
 * - "mock"    → tanpa database sama sekali. Semua data datang dari fixture
 *               in-memory (lihat src/lib/db/), di-reset setiap proses server
 *               start. Cocok untuk fokus front-end / demo / deployment serverless.
 * - "database"→ Prisma asli (SQLite lokal atau MySQL production).
 *
 * Default: `DATA_MODE` menang; kalau kosong → mock hanya jika `DATABASE_URL`
 * tidak di-set. Jadi Vercel tanpa DATABASE_URL otomatis mock, sedangkan lokal
 * yang punya .env tetap pakai database seperti biasa.
 */
export type DataMode = "mock" | "database";

export function dataMode(): DataMode {
  const explicit = process.env.DATA_MODE;
  if (explicit === "mock" || explicit === "database") return explicit;
  return process.env.DATABASE_URL ? "database" : "mock";
}

export function isMockData(): boolean {
  return dataMode() === "mock";
}

/** Auth dilewati saat mode mock (fokus front-end, tanpa login). */
export function authDisabled(): boolean {
  return process.env.AUTH_DISABLED === "true" || isMockData();
}

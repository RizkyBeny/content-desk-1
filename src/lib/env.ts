import { z } from "zod";
import { dataMode, isMockData } from "@/lib/data-mode";

/** Fallback AUTH_SECRET — hanya dipakai di mode mock (tanpa database). */
const MOCK_AUTH_SECRET = "mock-mode-insecure-secret-0123456789abcdef";

const schema = z.object({
  /** Opsional di mode mock; wajib non-kosong di mode database. */
  DATABASE_URL: z.string().min(1).optional(),
  /** Opsional di mode mock (ada fallback); wajib minimal 16 karakter di mode database. */
  AUTH_SECRET: z.string().min(16).optional(),
  /** "true" = lewati login untuk development lokal (auto-login sebagai admin). */
  AUTH_DISABLED: z.enum(["true", "false"]).optional().default("false"),
  /** "mock" = tanpa database (data in-memory dari fixture); "database" = Prisma asli. */
  DATA_MODE: z.enum(["mock", "database"]).optional(),
  APP_URL: z.string().url().default("http://localhost:3000"),

  REDIS_URL: z.string().optional().default(""),
  QUEUE_DRIVER: z.enum(["redis", "inline"]).optional(),

  STORAGE_DRIVER: z.enum(["local", "s3"]).optional(),
  UPLOAD_DIR: z.string().default(".data/uploads"),
  FILE_SIGNING_SECRET: z.string().optional().default(""),
  FFMPEG_PATH: z.string().optional().default(""),

  S3_ENDPOINT: z.string().optional().default(""),
  S3_REGION: z.string().optional().default("us-east-1"),
  S3_BUCKET: z.string().optional().default(""),
  S3_ACCESS_KEY_ID: z.string().optional().default(""),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(""),
  S3_FORCE_PATH_STYLE: z.string().optional().default("true"),

  AI_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
  SOCIAL_PROVIDER: z.enum(["mock", "live"]).default("mock"),
  TREND_PROVIDER: z.enum(["mock", "live"]).default("mock"),
  STT_PROVIDER: z.enum(["mock", "live"]).default("mock"),
  IMAGE_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
  VIDEO_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
  AUDIO_PROVIDER: z.enum(["mock", "elevenlabs"]).default("mock"),

  MOCK_MEDIA_SOURCE: z.enum(["unsplash", "gradient"]).default("unsplash"),

  OPENAI_API_KEY: z.string().optional().default(""),
  ELEVENLABS_API_KEY: z.string().optional().default(""),
  GOOGLE_TRENDS_API_KEY: z.string().optional().default(""),
  YOUTUBE_API_KEY: z.string().optional().default(""),
  X_API_BEARER_TOKEN: z.string().optional().default(""),
});

export type Env = z.infer<typeof schema> & {
  DATA_MODE: "mock" | "database";
  /** Selalu terisi: dari env di mode database, atau fallback di mode mock. */
  AUTH_SECRET: string;
  QUEUE_DRIVER: "redis" | "inline";
  STORAGE_DRIVER: "local" | "s3";
};

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const message = Object.entries(flat)
      .map(([k, v]) => `${k}: ${v?.join(", ")}`)
      .join("\n");
    throw new Error(`Konfigurasi environment tidak valid:\n${message}`);
  }
  const mock = isMockData();

  // DATABASE_URL & AUTH_SECRET: di mode mock keduanya boleh kosong (ada
  // fallback), di mode database keduanya wajib.
  const databaseUrl = parsed.data.DATABASE_URL ?? "";
  const authSecret = parsed.data.AUTH_SECRET ?? (mock ? MOCK_AUTH_SECRET : "");
  const missing: string[] = [];
  if (!databaseUrl) missing.push("DATABASE_URL: wajib diisi");
  if (authSecret.length < 16) missing.push("AUTH_SECRET: minimal 16 karakter");
  if (missing.length && !mock) {
    throw new Error(`Konfigurasi environment tidak valid:\n${missing.join("\n")}`);
  }
  if (missing.length) {
    console.warn(
      `[env] Mode mock (tanpa database): ${missing.join(", ")} — memakai fallback bawaan.`,
    );
  }

  const queueDriver: "redis" | "inline" =
    parsed.data.QUEUE_DRIVER ?? (parsed.data.REDIS_URL ? "redis" : "inline");
  const storageDriver: "local" | "s3" = parsed.data.STORAGE_DRIVER ?? "local";
  cached = {
    ...parsed.data,
    DATABASE_URL: databaseUrl,
    AUTH_SECRET: authSecret,
    DATA_MODE: parsed.data.DATA_MODE ?? dataMode(),
    QUEUE_DRIVER: queueDriver,
    STORAGE_DRIVER: storageDriver,
  };
  return cached;
}

export const isProd = process.env.NODE_ENV === "production";

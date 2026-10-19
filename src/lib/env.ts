import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET minimal 16 karakter"),
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
  const queueDriver: "redis" | "inline" =
    parsed.data.QUEUE_DRIVER ?? (parsed.data.REDIS_URL ? "redis" : "inline");
  const storageDriver: "local" | "s3" = parsed.data.STORAGE_DRIVER ?? "local";
  cached = { ...parsed.data, QUEUE_DRIVER: queueDriver, STORAGE_DRIVER: storageDriver };
  return cached;
}

export const isProd = process.env.NODE_ENV === "production";

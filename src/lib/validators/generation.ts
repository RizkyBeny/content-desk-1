import { z } from "zod";
import { ApiError } from "@/lib/api";
import type { GenerationParams, GenerationType } from "@/types";
import {
  AUDIO_FORMATS,
  AUDIO_LANGUAGES,
  AUDIO_SPEED_MAX,
  AUDIO_SPEED_MIN,
  AUDIO_SPEED_STEP,
  AUDIO_STYLES,
  BRIEF_AUDIENCE_MAX,
  BRIEF_CONTENT_TYPES,
  BRIEF_LANGUAGES,
  BRIEF_LENGTHS,
  BRIEF_PLATFORMS,
  BRIEF_TONES,
  CUSTOM_SIZE_MAX,
  CUSTOM_SIZE_MIN,
  CUSTOM_SIZE_STEP,
  IMAGE_DIMENSION_PRESETS,
  IMAGE_QUALITIES,
  IMAGE_RATIOS,
  PROMPT_LIMITS,
  VIDEO_DURATIONS,
  VIDEO_RATIOS,
  VIDEO_RESOLUTIONS,
  isGenerationType,
} from "../../../config/generation";

function values(options: { value: string }[]): [string, ...string[]] {
  return options.map((option) => option.value) as [string, ...string[]];
}

export const generationTypeSchema = z.enum(["image", "video", "audio", "brief"]);

export const createGenerationSchema = z
  .object({
    type: generationTypeSchema,
    prompt: z.string().trim().min(3, "Prompt minimal 3 karakter."),
    params: z.unknown(),
  })
  .superRefine((value, ctx) => {
    const max = PROMPT_LIMITS[value.type];
    if (value.prompt.length > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["prompt"],
        message: `Prompt maksimal ${max} karakter.`,
      });
    }
  });

export const listGenerationsSchema = z.object({
  type: generationTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(10).optional(),
  cursor: z.string().optional(),
  scope: z.enum(["all", "mine"]).optional(),
});

const customDimension = z
  .number()
  .int()
  .min(CUSTOM_SIZE_MIN, `Ukuran minimal ${CUSTOM_SIZE_MIN} px.`)
  .max(CUSTOM_SIZE_MAX, `Ukuran maksimal ${CUSTOM_SIZE_MAX} px.`)
  .refine((value) => value % CUSTOM_SIZE_STEP === 0, `Ukuran harus kelipatan ${CUSTOM_SIZE_STEP} px.`);

const imageParamsSchema = z
  .object({
    aspectRatio: z.string(),
    quality: z.enum(values(IMAGE_QUALITIES)),
    dimensionPreset: z.enum([...values(IMAGE_DIMENSION_PRESETS), "none"]).nullish(),
    width: z.number().int().optional(),
    height: z.number().int().optional(),
    referenceAssetId: z.string().min(1).nullish(),
    referenceMode: z.enum(["edit", "reference"]).nullish(),
  })
  .superRefine((value, ctx) => {
    if (value.aspectRatio !== "custom" && !IMAGE_RATIOS.some((r) => r.value === value.aspectRatio)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["aspectRatio"], message: "Rasio tidak dikenal." });
      return;
    }
    if (value.aspectRatio === "custom") {
      for (const key of ["width", "height"] as const) {
        const raw = value[key];
        if (raw == null) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: "Dimensi kustom wajib diisi." });
        } else if (!customDimension.safeParse(raw).success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `Nilai ${CUSTOM_SIZE_MIN}–${CUSTOM_SIZE_MAX} px, kelipatan ${CUSTOM_SIZE_STEP}.`,
          });
        }
      }
    }
  });

const videoParamsSchema = z.object({
  aspectRatio: z.enum(values(VIDEO_RATIOS)),
  durationSeconds: z.number().refine((value) => VIDEO_DURATIONS.includes(value), "Durasi tidak didukung."),
  resolution: z.enum(values(VIDEO_RESOLUTIONS)),
  startFrameAssetId: z.string().min(1).nullish(),
  referenceAssetId: z.string().min(1).nullish(),
});

const audioParamsSchema = z.object({
  voiceId: z.string().min(1, "Suara wajib dipilih."),
  voiceName: z.string().optional(),
  language: z.enum(values(AUDIO_LANGUAGES)),
  speed: z
    .number()
    .min(AUDIO_SPEED_MIN, `Kecepatan minimal ${AUDIO_SPEED_MIN}×.`)
    .max(AUDIO_SPEED_MAX, `Kecepatan maksimal ${AUDIO_SPEED_MAX}×.`)
    .refine(
      (value) => Math.abs(Math.round((value - AUDIO_SPEED_MIN) / AUDIO_SPEED_STEP) * AUDIO_SPEED_STEP + AUDIO_SPEED_MIN - value) < 1e-6,
      `Kecepatan harus kelipatan ${AUDIO_SPEED_STEP}.`,
    ),
  style: z.enum(values(AUDIO_STYLES)),
  format: z.enum(values(AUDIO_FORMATS)),
});

const briefParamsSchema = z.object({
  contentType: z.enum(values(BRIEF_CONTENT_TYPES)),
  platform: z.enum(values(BRIEF_PLATFORMS)),
  tone: z.enum(values(BRIEF_TONES)),
  language: z.enum(values(BRIEF_LANGUAGES)),
  audience: z.string().trim().max(BRIEF_AUDIENCE_MAX, `Target audiens maksimal ${BRIEF_AUDIENCE_MAX} karakter.`).default(""),
  length: z.enum(values(BRIEF_LENGTHS)),
});

/** Validasi `params` per jenis; melempar ApiError 400 dengan pesan Indonesia. */
export function parseGenerationParams(type: GenerationType, params: unknown): GenerationParams {
  const schema =
    type === "image"
      ? imageParamsSchema
      : type === "video"
        ? videoParamsSchema
        : type === "audio"
          ? audioParamsSchema
          : briefParamsSchema;
  const parsed = schema.safeParse(params ?? {});
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? "Parameter tidak valid.", 400, "VALIDATION");
  }
  return parsed.data as unknown as GenerationParams;
}

export function assertGenerationType(value: string): GenerationType {
  if (!isGenerationType(value)) throw new ApiError("Jenis konten tidak dikenal.", 400, "VALIDATION");
  return value;
}

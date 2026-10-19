import { z } from "zod";

export const createProjectSchema = z.object({
  origin: z.enum(["flow", "standalone"]).default("flow"),
  topicTitle: z.string().min(3).max(200),
  topicSource: z.enum(["trending", "custom"]).default("custom"),
  topicInsight: z.unknown().optional(),
});

export const selectAngleSchema = z.object({
  angleId: z.string().min(1),
});

export const contentTypeSchema = z.object({
  contentType: z.enum(["image", "carousel", "video", "audio", "article"]),
});

export const anglePatchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  audience: z.string().optional(),
  reason: z.string().optional(),
});

export const customAngleSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1),
  audience: z.string().default(""),
  reason: z.string().default("Dibuat manual oleh creator."),
});

export const briefPatchSchema = z.object({
  summary: z.any().optional(),
  rows: z.array(z.record(z.string(), z.string())).optional(),
  captions: z.array(z.any()).optional(),
  status: z.enum(["draft", "siap"]).optional(),
});

export const reviseSchema = z.object({
  instruction: z.string().min(1, "Instruksi wajib diisi."),
  rowIndex: z.number().int().min(0).nullable().default(null),
});

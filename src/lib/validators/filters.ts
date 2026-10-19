import { z } from "zod";

const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Tanggal tidak valid");

export const insightFilterSchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  sources: z.string().optional(),
  sortBy: z.enum(["engagementRate", "reach", "impressions", "engagement"]).default("engagementRate"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export function parseDateRange(from?: string, to?: string): { from: Date; to: Date } {
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 30 * 86400000);
  return { from: fromDate, to: toDate };
}

export function parseSources(sources?: string): string[] {
  if (!sources || sources === "all") return [];
  return sources.split(",").map((s) => s.trim()).filter(Boolean);
}

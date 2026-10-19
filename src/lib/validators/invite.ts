import { z } from "zod";

export const emailInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "creator"]).default("creator"),
});

export const profileSchema = z.object({
  name: z.string().min(1).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  niche: z.string().nullable().optional(),
  nicheCategories: z.array(z.string()).optional(),
  contentLang: z.enum(["id", "en"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

export const passwordSchema = z.object({
  current: z.string().min(1),
  next: z.string().min(8),
});

export const internalConnectionSchema = z.object({
  displayName: z.string().min(1),
  url: z.string().url(),
  apiKey: z.string().min(1),
  schedule: z.string().optional(),
});

export const socialConnectionSchema = z.object({
  displayName: z.string().min(1),
  handle: z.string().optional(),
});

export const ownersSchema = z.object({
  userIds: z.array(z.string()),
});

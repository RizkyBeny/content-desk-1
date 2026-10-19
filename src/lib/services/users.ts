import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { ApiError } from "@/lib/api";
import type { SessionUser } from "@/lib/auth/session";

export interface ProfilePatch {
  name?: string;
  avatarUrl?: string | null;
  niche?: string | null;
  nicheCategories?: string[];
  contentLang?: "id" | "en";
  theme?: "light" | "dark" | "system";
}

export async function updateProfile(user: SessionUser, patch: ProfilePatch) {
  return prisma.user.update({
    where: { id: user.id },
    data: {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.avatarUrl !== undefined ? { avatarUrl: patch.avatarUrl } : {}),
      ...(patch.niche !== undefined ? { niche: patch.niche } : {}),
      ...(patch.nicheCategories !== undefined
        ? { nicheCategories: patch.nicheCategories as unknown as Prisma.InputJsonValue }
        : {}),
      ...(patch.contentLang !== undefined ? { contentLang: patch.contentLang } : {}),
      ...(patch.theme !== undefined ? { theme: patch.theme } : {}),
    },
  });
}

export async function changePassword(
  user: SessionUser,
  current: string,
  next: string,
) {
  if (next.length < 8) throw new ApiError("Password baru minimal 8 karakter.", 400);
  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record) throw new ApiError("Pengguna tidak ditemukan.", 404);
  const valid = await verifyPassword(current, record.passwordHash);
  if (!valid) throw new ApiError("Password lama salah.", 400);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });
  return { ok: true };
}

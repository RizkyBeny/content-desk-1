import { prisma } from "@/lib/prisma";
import { hashToken, randomToken } from "@/lib/crypto";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { ApiError } from "@/lib/api";
import { getEnv } from "@/lib/env";
import { isGateEnabled, verifyGateCredentials } from "@/lib/auth/gate";
import type { Role } from "@/types";

const INVITE_TTL_MS = 7 * 86400000;

export async function login(identifier: string, password: string, userAgent?: string) {
  const normalized = identifier.toLowerCase().trim();

  // 1. Cek kredensial Web Login Gate
  if (isGateEnabled() && verifyGateCredentials(normalized, password)) {
    let user =
      (await prisma.user.findFirst({ where: { role: "admin" } })) ??
      (await prisma.user.findFirst());
    if (user) {
      await createSession(user.id, userAgent);
      return { id: user.id, role: user.role as Role, name: user.name };
    }
  }

  // 2. Cek database user
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) throw new ApiError("Username atau password salah.", 401);
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new ApiError("Username atau password salah.", 401);
  await createSession(user.id, userAgent);
  return { id: user.id, role: user.role as Role, name: user.name };
}

export async function createInvite(adminId: string, email: string, role: Role) {
  const normalized = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) throw new ApiError("Email ini sudah terdaftar.", 400);

  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  await prisma.invite.create({
    data: {
      email: normalized,
      role,
      tokenHash: hashToken(token),
      invitedById: adminId,
      expiresAt,
    },
  });
  const url = `${getEnv().APP_URL}/invite/${token}`;
  return { url, expiresAt };
}

export async function getInviteInfo(token: string) {
  const invite = await prisma.invite.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!invite) throw new ApiError("Undangan tidak ditemukan.", 404);
  if (invite.acceptedAt) throw new ApiError("Undangan sudah pernah digunakan.", 410);
  if (invite.expiresAt < new Date()) throw new ApiError("Undangan sudah kedaluwarsa.", 410);
  return { email: invite.email, role: invite.role as Role };
}

export async function acceptInvite(
  token: string,
  input: { name: string; password: string },
  userAgent?: string,
) {
  const invite = await prisma.invite.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!invite) throw new ApiError("Undangan tidak ditemukan.", 404);
  if (invite.acceptedAt) throw new ApiError("Undangan sudah pernah digunakan.", 410);
  if (invite.expiresAt < new Date()) throw new ApiError("Undangan sudah kedaluwarsa.", 410);
  if (input.password.length < 8) throw new ApiError("Password minimal 8 karakter.", 400);

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: invite.email,
        name: input.name.trim() || invite.email.split("@")[0],
        passwordHash,
        role: invite.role,
      },
    });
    await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    return created;
  });
  await createSession(user.id, userAgent);
  return { id: user.id, role: user.role as Role, name: user.name };
}

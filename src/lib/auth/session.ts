import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashToken, randomToken } from "@/lib/crypto";
import type { Role } from "@/types";

export const SESSION_COOKIE = "acp_session";
const SESSION_DAYS = 30;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  theme: string;
  contentLang: string;
  niche: string | null;
  nicheCategories: string[];
  avatarUrl: string | null;
}

export async function createSession(userId: string, userAgent?: string): Promise<void> {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      userAgent: userAgent ?? null,
      expiresAt,
    },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const user = await readSessionUser();
  if (user) return user;
  if (authDisabled()) return devUser();
  return null;
}

/** Baca session asli dari cookie `acp_session`. */
async function readSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return toSessionUser(session.user);
}

function authDisabled(): boolean {
  return process.env.AUTH_DISABLED === "true";
}

/** User pengganti saat auth dilewati: admin seed, fallback ke user pertama. Di-cache per instance server. */
let devUserCache: SessionUser | null = null;
async function devUser(): Promise<SessionUser | null> {
  if (devUserCache) return devUserCache;
  const user =
    (await prisma.user.findFirst({ where: { role: "admin" }, orderBy: { createdAt: "asc" } })) ??
    (await prisma.user.findFirst({ orderBy: { createdAt: "asc" } }));
  if (!user) return null;
  devUserCache = toSessionUser(user);
  return devUserCache;
}

function toSessionUser(u: {
  id: string;
  name: string;
  email: string;
  role: string;
  theme: string;
  contentLang: string;
  niche: string | null;
  nicheCategories: unknown;
  avatarUrl: string | null;
}): SessionUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as Role,
    theme: u.theme,
    contentLang: u.contentLang,
    niche: u.niche,
    nicheCategories: Array.isArray(u.nicheCategories) ? (u.nicheCategories as string[]) : [],
    avatarUrl: u.avatarUrl,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

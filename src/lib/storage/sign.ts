import crypto from "node:crypto";
import { getEnv } from "@/lib/env";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24; // 24h — export link retention (FR-EXP-3)

function signingSecret(): string {
  const env = getEnv();
  return env.FILE_SIGNING_SECRET || env.AUTH_SECRET;
}

/** Build a signed token (`<exp>.<hmac>`) for a storage key. */
export function signKey(key: string, ttlSeconds = DEFAULT_TTL_SECONDS): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = crypto
    .createHmac("sha256", signingSecret())
    .update(`${key}.${exp}`)
    .digest("base64url");
  return `${exp}.${sig}`;
}

/** Constant-time verification of a signed token against a key. */
export function verifyKey(key: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  const expected = crypto
    .createHmac("sha256", signingSecret())
    .update(`${key}.${exp}`)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Signed download URL served by `/api/files/[...key]`. */
export function fileUrl(key: string, ttlSeconds = DEFAULT_TTL_SECONDS): string {
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `/api/files/${encoded}?token=${signKey(key, ttlSeconds)}`;
}

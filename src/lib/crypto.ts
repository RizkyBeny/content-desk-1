import crypto from "node:crypto";
import { getEnv } from "@/lib/env";

const ALGO = "aes-256-gcm";

function key(): Buffer {
  const secret = getEnv().AUTH_SECRET;
  return crypto.createHash("sha256").update(secret).digest();
}

/** Encrypt a value with AES-256-GCM. Format: iv:tag:ciphertext (base64url). */
export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    enc.toString("base64url"),
  ].join(":");
}

/** Decrypt a value produced by {@link encrypt}. Returns null on failure. */
export function decrypt(payload: string | null | undefined): string | null {
  if (!payload) return null;
  const parts = payload.split(":");
  if (parts.length !== 3) return null;
  try {
    const [iv, tag, data] = parts.map((p) => Buffer.from(p, "base64url"));
    const decipher = crypto.createDecipheriv(ALGO, key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Generate a random URL-safe token (for sessions/invites). */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/** Deterministic hash of a token for at-rest storage. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function encryptJson(value: unknown): string {
  return encrypt(JSON.stringify(value));
}

export function decryptJson<T>(payload: string | null | undefined): T | null {
  const plain = decrypt(payload);
  if (plain === null) return null;
  try {
    return JSON.parse(plain) as T;
  } catch {
    return null;
  }
}

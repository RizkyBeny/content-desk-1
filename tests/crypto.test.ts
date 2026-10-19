import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-key-at-least-16-chars";
  process.env.DATABASE_URL = "mysql://user:pass@localhost:3306/test";
});

describe("crypto", () => {
  it("round-trips encrypt/decrypt", async () => {
    const { encrypt, decrypt } = await import("@/lib/crypto");
    const plain = "rahasia-token-123";
    const cipher = encrypt(plain);
    expect(cipher).not.toContain(plain);
    expect(decrypt(cipher)).toBe(plain);
  });

  it("produces a fresh IV each time (non-deterministic ciphertext)", async () => {
    const { encrypt } = await import("@/lib/crypto");
    expect(encrypt("same")).not.toBe(encrypt("same"));
  });

  it("returns null for tampered or malformed payloads", async () => {
    const { decrypt } = await import("@/lib/crypto");
    expect(decrypt("not-a-valid-payload")).toBeNull();
    expect(decrypt(null)).toBeNull();
    expect(decrypt("")).toBeNull();
  });

  it("hashToken is deterministic and hex", async () => {
    const { hashToken } = await import("@/lib/crypto");
    const h1 = hashToken("abc");
    const h2 = hashToken("abc");
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  it("randomToken returns distinct url-safe strings", async () => {
    const { randomToken } = await import("@/lib/crypto");
    const a = randomToken();
    const b = randomToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

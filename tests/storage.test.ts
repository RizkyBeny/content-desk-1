import { describe, it, expect, beforeAll } from "vitest";
import os from "node:os";
import path from "node:path";

const TMP = path.join(os.tmpdir(), `acp-storage-test-${Date.now()}`);

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-key-at-least-16-chars";
  process.env.DATABASE_URL = "mysql://user:pass@localhost:3306/test";
  process.env.FILE_SIGNING_SECRET = "test-file-signing-secret-32-characters";
  process.env.STORAGE_DRIVER = "local";
  process.env.UPLOAD_DIR = TMP;
});

describe("storage signing", () => {
  it("round-trips a signed key", async () => {
    const { signKey, verifyKey } = await import("@/lib/storage/sign");
    const token = signKey("uploads/u1/file.png");
    expect(verifyKey("uploads/u1/file.png", token)).toBe(true);
  });

  it("rejects a token for a different key", async () => {
    const { signKey, verifyKey } = await import("@/lib/storage/sign");
    const token = signKey("uploads/u1/file.png");
    expect(verifyKey("uploads/u1/other.png", token)).toBe(false);
  });

  it("rejects a tampered token and expired tokens", async () => {
    const { signKey, verifyKey } = await import("@/lib/storage/sign");
    expect(verifyKey("k", "garbage")).toBe(false);
    expect(verifyKey("k", null)).toBe(false);
    const expired = signKey("k", -1);
    expect(verifyKey("k", expired)).toBe(false);
  });

  it("builds a signed /api/files URL", async () => {
    const { fileUrl } = await import("@/lib/storage/sign");
    const url = fileUrl("generated/u1/a b.png");
    expect(url.startsWith("/api/files/generated/u1/a%20b.png?token=")).toBe(true);
  });
});

describe("local storage adapter", () => {
  it("puts, reads, stats and deletes an object", async () => {
    const { localStorage } = await import("@/lib/storage/local");
    const key = "uploads/test/hello.txt";
    const body = Buffer.from("halo dunia");
    const put = await localStorage.put(key, body, "text/plain");
    expect(put.size).toBe(body.length);

    expect(await localStorage.exists(key)).toBe(true);
    const got = await localStorage.get(key);
    expect(got?.toString("utf8")).toBe("halo dunia");
    const stat = await localStorage.stat(key);
    expect(stat?.contentType).toBe("text/plain");

    await localStorage.delete(key);
    expect(await localStorage.exists(key)).toBe(false);
    expect(await localStorage.get(key)).toBeNull();
  });

  it("rejects path traversal keys", async () => {
    const { localStorage } = await import("@/lib/storage/local");
    await expect(localStorage.put("../escape.txt", Buffer.from("x"), "text/plain")).rejects.toThrow();
  });
});

describe("mime helpers", () => {
  it("maps extensions and mime types", async () => {
    const { extForMime, guessContentType } = await import("@/lib/storage/mime");
    expect(extForMime("image/png")).toBe("png");
    expect(extForMime("image/jpeg")).toBe("jpg");
    expect(guessContentType("a/b/c.mp4")).toBe("video/mp4");
  });
});

describe("storageKey", () => {
  it("namespaces and sanitizes the filename", async () => {
    const { storageKey } = await import("@/lib/storage");
    const key = storageKey("uploads", "user-1", "My File!!.png");
    expect(key.startsWith("uploads/user-1/")).toBe(true);
    expect(key).not.toContain(" ");
    expect(key).not.toContain("!");
    expect(key.endsWith(".png")).toBe(true);
  });
});

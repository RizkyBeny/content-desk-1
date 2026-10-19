import fs from "node:fs/promises";
import path from "node:path";
import { getEnv } from "@/lib/env";
import { isMockData } from "@/lib/data-mode";
import { fileUrl } from "./sign";
import { guessContentType } from "./mime";
import type { StorageAdapter, StorageObject, StorageStat } from "./types";

function root(): string {
  const base =
    isMockData() && !process.env.UPLOAD_DIR
      ? "/tmp/content-desk-uploads"
      : getEnv().UPLOAD_DIR;
  return path.resolve(process.cwd(), base);
}

function resolveKey(key: string): string {
  const base = root();
  const full = path.resolve(base, key);
  if (full !== base && !full.startsWith(base + path.sep)) {
    throw new Error("Key storage tidak valid.");
  }
  return full;
}

async function writeMeta(full: string, contentType: string, size: number) {
  await fs
    .writeFile(`${full}.meta`, JSON.stringify({ contentType, size }), "utf8")
    .catch(() => undefined);
}

async function readMeta(key: string): Promise<StorageStat | null> {
  try {
    const raw = await fs.readFile(`${resolveKey(key)}.meta`, "utf8");
    const parsed = JSON.parse(raw) as StorageStat;
    return parsed;
  } catch {
    return null;
  }
}

export const localStorage: StorageAdapter = {
  driver: "local",

  async put(key, data, contentType): Promise<StorageObject> {
    if (key && key.startsWith("seed/")) {
      // Jangan menulis ke public/; anggap berhasil untuk seed keys.
      return { key, size: data.length, contentType };
    }
    const full = resolveKey(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
    await writeMeta(full, contentType, data.length);
    return { key, size: data.length, contentType };
  },

  async get(key) {
    if (key && key.startsWith("seed/")) {
      const publicPath = path.resolve(process.cwd(), "public", key);
      try {
        return await fs.readFile(publicPath);
      } catch {
        return null;
      }
    }
    try {
      return await fs.readFile(resolveKey(key));
    } catch {
      return null;
    }
  },

  async delete(key) {
    if (key && key.startsWith("seed/")) return;
    const full = resolveKey(key);
    await fs.rm(full, { force: true });
    await fs.rm(`${full}.meta`, { force: true });
  },

  async exists(key) {
    if (key && key.startsWith("seed/")) {
      try {
        await fs.access(path.resolve(process.cwd(), "public", key));
        return true;
      } catch {
        return false;
      }
    }
    try {
      await fs.access(resolveKey(key));
      return true;
    } catch {
      return false;
    }
  },

  async stat(key) {
    if (key && key.startsWith("seed/")) {
      const publicPath = path.resolve(process.cwd(), "public", key);
      try {
        const buf = await fs.readFile(publicPath);
        return { size: buf.length, contentType: guessContentType(key) };
      } catch {
        return null;
      }
    }
    try {
      const meta = await readMeta(key);
      if (meta) return meta;
      const buf = await fs.readFile(resolveKey(key));
      return { size: buf.length, contentType: guessContentType(key) };
    } catch {
      return null;
    }
  },

  url(key, ttlSeconds) {
    if (key && key.startsWith("seed/")) return `/${key}`;
    return fileUrl(key, ttlSeconds);
  },
};

import fs from "node:fs/promises";
import path from "node:path";
import { getEnv } from "@/lib/env";
import { fileUrl } from "./sign";
import { guessContentType } from "./mime";
import type { StorageAdapter, StorageObject, StorageStat } from "./types";

function root(): string {
  return path.resolve(process.cwd(), getEnv().UPLOAD_DIR);
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
    const full = resolveKey(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
    await writeMeta(full, contentType, data.length);
    return { key, size: data.length, contentType };
  },

  async get(key) {
    try {
      return await fs.readFile(resolveKey(key));
    } catch {
      return null;
    }
  },

  async delete(key) {
    const full = resolveKey(key);
    await fs.rm(full, { force: true });
    await fs.rm(`${full}.meta`, { force: true });
  },

  async exists(key) {
    try {
      await fs.access(resolveKey(key));
      return true;
    } catch {
      return false;
    }
  },

  async stat(key) {
    const full = resolveKey(key);
    try {
      const info = await fs.stat(full);
      const meta = await readMeta(key);
      return { size: info.size, contentType: meta?.contentType ?? guessContentType(key) };
    } catch {
      return null;
    }
  },

  url(key, ttlSeconds) {
    return fileUrl(key, ttlSeconds);
  },
};

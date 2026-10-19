import crypto from "node:crypto";
import { getEnv } from "@/lib/env";
import { localStorage } from "./local";
import { s3Storage } from "./s3";
import type { StorageAdapter } from "./types";

export function getStorage(): StorageAdapter {
  return getEnv().STORAGE_DRIVER === "s3" ? s3Storage : localStorage;
}

/** Build a namespaced, collision-resistant storage key. */
export function storageKey(namespace: string, ownerId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const rand = crypto.randomBytes(6).toString("hex");
  return `${namespace}/${ownerId}/${Date.now()}-${rand}-${safe}`;
}

export type { StorageAdapter, StorageObject, StorageStat } from "./types";
export { fileUrl, signKey, verifyKey } from "./sign";
export { guessContentType, extensionFor, extForMime } from "./mime";

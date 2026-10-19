import { prisma } from "@/lib/prisma";
import { Prisma, type Asset } from "@prisma/client";
import { ApiError } from "@/lib/api";
import { getStorage, storageKey, extForMime } from "@/lib/storage";
import { slugify } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth/session";
import type { AssetDTO, AssetOrigin, AssetType, AssetVisibility } from "@/types";

/** Per-file size limits (FR-REF-1): documents 20 MB, other media up to 200 MB. */
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 50 * 1024 * 1024;

interface MimeRule {
  type: AssetType;
  maxBytes: number;
}

const MIME_RULES: Record<string, MimeRule> = {
  "image/jpeg": { type: "image", maxBytes: MAX_IMAGE_BYTES },
  "image/jpg": { type: "image", maxBytes: MAX_IMAGE_BYTES },
  "image/png": { type: "image", maxBytes: MAX_IMAGE_BYTES },
  "image/webp": { type: "image", maxBytes: MAX_IMAGE_BYTES },
  "image/gif": { type: "image", maxBytes: MAX_IMAGE_BYTES },
  "image/svg+xml": { type: "image", maxBytes: MAX_IMAGE_BYTES },
  "video/mp4": { type: "video", maxBytes: MAX_UPLOAD_BYTES },
  "video/quicktime": { type: "video", maxBytes: MAX_UPLOAD_BYTES },
  "video/webm": { type: "video", maxBytes: MAX_UPLOAD_BYTES },
  "audio/mpeg": { type: "audio", maxBytes: MAX_AUDIO_BYTES },
  "audio/wav": { type: "audio", maxBytes: MAX_AUDIO_BYTES },
  "audio/x-wav": { type: "audio", maxBytes: MAX_AUDIO_BYTES },
  "audio/mp4": { type: "audio", maxBytes: MAX_AUDIO_BYTES },
  "audio/m4a": { type: "audio", maxBytes: MAX_AUDIO_BYTES },
  "application/pdf": { type: "reference", maxBytes: MAX_DOCUMENT_BYTES },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    type: "reference",
    maxBytes: MAX_DOCUMENT_BYTES,
  },
  "text/plain": { type: "reference", maxBytes: MAX_DOCUMENT_BYTES },
  "text/markdown": { type: "reference", maxBytes: MAX_DOCUMENT_BYTES },
};

export function resolveUploadRule(mimeType: string): MimeRule {
  const rule = MIME_RULES[mimeType.toLowerCase()];
  if (!rule) throw new ApiError(`Tipe file tidak didukung: ${mimeType}`, 415);
  return rule;
}

function isExternalUrl(value: string): boolean {
  return /^(https?:)?\/\//.test(value) || value.startsWith("/");
}

/** Assets store storage keys in `fileUrl`; sign them on the way out. */
export function assetUrl(value: string | null): string | null {
  if (!value) return null;
  if (isExternalUrl(value)) return value;
  return getStorage().url(value);
}

export function assetStorageKey(value: string | null): string | null {
  if (!value || isExternalUrl(value)) return null;
  return value;
}

export function serializeAsset(asset: Asset, ownerName?: string | null): AssetDTO {
  return {
    id: asset.id,
    ownerId: asset.ownerId,
    ownerName: ownerName ?? null,
    type: asset.type as AssetType,
    origin: asset.origin as AssetOrigin,
    name: asset.name,
    fileUrl: assetUrl(asset.fileUrl),
    mimeType: asset.mimeType,
    textContent: asset.textContent,
    tags: Array.isArray(asset.tags) ? (asset.tags as string[]) : [],
    visibility: asset.visibility as AssetVisibility,
    sizeBytes: asset.sizeBytes != null ? Number(asset.sizeBytes) : null,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
}

export interface CreateUploadInput {
  name: string;
  mimeType: string;
  data: Buffer;
  tags?: string[];
  visibility?: AssetVisibility;
}

export async function createUploadedAsset(
  user: SessionUser,
  input: CreateUploadInput,
): Promise<AssetDTO> {
  const rule = resolveUploadRule(input.mimeType);
  if (input.data.length > rule.maxBytes) {
    throw new ApiError(
      `Ukuran file melebihi batas ${Math.round(rule.maxBytes / 1024 / 1024)} MB.`,
      413,
    );
  }
  const ext = extForMime(input.mimeType);
  const base = slugify(input.name) || "asset";
  const key = storageKey("uploads", user.id, `${base}.${ext}`);
  const stored = await getStorage().put(key, input.data, input.mimeType);
  const asset = await prisma.asset.create({
    data: {
      ownerId: user.id,
      type: rule.type,
      origin: "upload",
      name: input.name,
      fileUrl: stored.key,
      mimeType: input.mimeType,
      tags: (input.tags ?? []) as unknown as Prisma.InputJsonValue,
      visibility: input.visibility ?? "private",
      sizeBytes: BigInt(stored.size),
    },
  });
  return serializeAsset(asset, user.name);
}

export interface CreateGeneratedInput {
  name: string;
  type: AssetType;
  origin: AssetOrigin;
  data: Buffer;
  contentType: string;
  ext: string;
  tags?: string[];
  visibility?: AssetVisibility;
}

/** Persist provider bytes and register an Asset (origin: generated/export/reference). */
export async function createBinaryAsset(
  user: SessionUser,
  input: CreateGeneratedInput,
): Promise<AssetDTO> {
  const namespace = input.origin === "export" ? "exports" : input.origin === "reference" ? "references" : "generated";
  const base = slugify(input.name) || input.type;
  const key = storageKey(namespace, user.id, `${base}.${input.ext}`);
  const stored = await getStorage().put(key, input.data, input.contentType);
  const asset = await prisma.asset.create({
    data: {
      ownerId: user.id,
      type: input.type,
      origin: input.origin,
      name: input.name,
      fileUrl: stored.key,
      mimeType: input.contentType,
      tags: (input.tags ?? []) as unknown as Prisma.InputJsonValue,
      visibility: input.visibility ?? "private",
      sizeBytes: BigInt(stored.size),
    },
  });
  return serializeAsset(asset, user.name);
}

export async function createTextAsset(
  user: SessionUser,
  input: { name: string; textContent: string; origin?: AssetOrigin; tags?: string[] },
): Promise<AssetDTO> {
  const asset = await prisma.asset.create({
    data: {
      ownerId: user.id,
      type: "text",
      origin: input.origin ?? "generated",
      name: input.name,
      textContent: input.textContent,
      tags: (input.tags ?? []) as unknown as Prisma.InputJsonValue,
      visibility: "private",
      sizeBytes: BigInt(Buffer.byteLength(input.textContent, "utf8")),
    },
  });
  return serializeAsset(asset, user.name);
}

export interface ListAssetsFilter {
  type?: AssetType;
  origin?: AssetOrigin;
  q?: string;
  tag?: string;
  ownerId?: string;
  limit?: number;
  offset?: number;
}

export async function listAssets(
  user: SessionUser,
  filter: ListAssetsFilter,
): Promise<{ items: AssetDTO[]; total: number }> {
  const where: Prisma.AssetWhereInput = {};
  if (user.role !== "admin") {
    where.OR = [{ ownerId: user.id }, { visibility: "workspace" }];
  }
  if (filter.ownerId) where.ownerId = filter.ownerId;
  if (filter.type) where.type = filter.type;
  if (filter.origin) where.origin = filter.origin;
  if (filter.q) where.name = { contains: filter.q };

  const limit = Math.min(60, Math.max(1, filter.limit ?? 24));
  const offset = Math.max(0, filter.offset ?? 0);

  const [rows, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: { owner: { select: { name: true } } },
    }),
    prisma.asset.count({ where }),
  ]);

  let items = rows.map((a) => serializeAsset(a, a.owner?.name));
  if (filter.tag) items = items.filter((a) => a.tags.includes(filter.tag as string));
  return { items, total };
}

export async function getAssetForUser(user: SessionUser, id: string): Promise<Asset> {
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) throw new ApiError("Aset tidak ditemukan.", 404);
  const canAccess = asset.ownerId === user.id || asset.visibility === "workspace" || user.role === "admin";
  if (!canAccess) throw new ApiError("Tidak punya akses ke aset ini.", 403);
  return asset;
}

export async function updateAsset(
  user: SessionUser,
  id: string,
  patch: { name?: string; tags?: string[]; visibility?: AssetVisibility },
): Promise<AssetDTO> {
  const asset = await getAssetForUser(user, id);
  if (asset.ownerId !== user.id && user.role !== "admin") {
    throw new ApiError("Hanya pemilik aset yang dapat mengubah.", 403);
  }
  const updated = await prisma.asset.update({
    where: { id },
    data: {
      name: patch.name ?? undefined,
      tags: patch.tags ? (patch.tags as unknown as Prisma.InputJsonValue) : undefined,
      visibility: patch.visibility ?? undefined,
    },
  });
  return serializeAsset(updated, user.name);
}

export interface AssetUsage {
  itemId: string;
  creationId: string;
  projectId: string;
  type: string;
}

export async function getAssetUsage(assetId: string): Promise<AssetUsage[]> {
  const items = await prisma.creationItem.findMany({
    where: { assetId },
    select: { id: true, creationId: true, creation: { select: { projectId: true, type: true } } },
  });
  return items.map((i) => ({
    itemId: i.id,
    creationId: i.creationId,
    projectId: i.creation.projectId,
    type: i.creation.type,
  }));
}

/** Delete an asset (FR-AST-5). Blocks when in use unless `force` detaches it. */
export async function deleteAsset(
  user: SessionUser,
  id: string,
  opts: { force?: boolean } = {},
): Promise<{ detachedFrom: number }> {
  const asset = await getAssetForUser(user, id);
  if (asset.ownerId !== user.id && user.role !== "admin") {
    throw new ApiError("Hanya pemilik aset yang dapat menghapus.", 403);
  }

  const usage = await getAssetUsage(id);
  if (usage.length && !opts.force) {
    throw new ApiError(
      `Aset sedang dipakai oleh ${usage.length} konten. Gunakan "Hapus dan lepas dari konten".`,
      409,
      "ASSET_IN_USE",
    );
  }
  if (usage.length && opts.force) {
    await prisma.creationItem.updateMany({
      where: { assetId: id },
      data: { assetId: null, mediaSource: "ai_generated", status: "queued" },
    });
  }

  const key = assetStorageKey(asset.fileUrl);
  if (key) await getStorage().delete(key).catch(() => undefined);
  await prisma.asset.delete({ where: { id } });
  return { detachedFrom: usage.length };
}

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import { getStorage, storageKey } from "@/lib/storage";
import { getMediaProvider } from "@/lib/adapters/media";
import type { SessionUser } from "@/lib/auth/session";
import type {
  AudioParams,
  BriefParams,
  BriefResult,
  GenerationDTO,
  GenerationListDTO,
  GenerationParams,
  GenerationType,
  ImageParams,
  QuotaDTO,
  VideoParams,
} from "@/types";
import { withTimeout } from "@/lib/utils";
import {
  AUDIO_CHUNK_MAX,
  AUDIO_MAX_REQUESTS,
  JOB_TIMEOUT_MS,
  imageTargetSize,
  resolveModel,
  videoTargetSize,
} from "../../../config/generation";
import { runStandaloneBrief } from "./create-brief";
import { assertConcurrency, refundQuota, reserveQuota } from "./quota";
import {
  computeWaveform,
  concatAudio,
  extractPoster,
  probeDuration,
  processImage,
} from "./media-process";

/** Signed URL masa berlaku pendek untuk galeri (NFR-5). */
export const GENERATION_URL_TTL = 60 * 60;

type GenerationRow = Prisma.GenerationGetPayload<{
  include: { user: { select: { id: true; name: true } } };
}>;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function serializeGeneration(row: GenerationRow, viewerId: string): GenerationDTO {
  const type = row.type as GenerationType;
  return {
    id: row.id,
    type,
    status: row.status as GenerationDTO["status"],
    prompt: row.prompt,
    params: row.params as unknown as GenerationParams,
    provider: row.provider,
    modelId: resolveModel(type).id,
    modelName: row.modelName,
    fileUrl: row.fileUrl ? getStorage().url(row.fileUrl, GENERATION_URL_TTL) : null,
    thumbnailUrl: row.thumbnailUrl ? getStorage().url(row.thumbnailUrl, GENERATION_URL_TTL) : null,
    width: row.width,
    height: row.height,
    durationSeconds: row.durationSeconds,
    waveform: Array.isArray(row.waveform) ? (row.waveform as number[]) : null,
    result: (row.resultJson as unknown as BriefResult | null) ?? null,
    errorMessage: row.errorMessage,
    owner: row.user ? { id: row.user.id, name: row.user.name, initials: initials(row.user.name) } : null,
    isOwner: row.userId === viewerId,
    createdAt: row.createdAt.toISOString(),
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

function encodeCursor(phase: "own" | "done" | "mine", row: { createdAt: Date; id: string }): string {
  return Buffer.from(`${phase}|${row.createdAt.toISOString()}|${row.id}`).toString("base64url");
}

function decodeCursor(cursor?: string | null): { phase: "own" | "done" | "mine"; createdAt: string; id: string } | null {
  if (!cursor) return null;
  try {
    const [phase, createdAt, id] = Buffer.from(cursor, "base64url").toString("utf8").split("|");
    if ((phase !== "own" && phase !== "done" && phase !== "mine") || !createdAt || !id) return null;
    return { phase, createdAt, id };
  } catch {
    return null;
  }
}

function afterCursor(cursor: { createdAt: string; id: string }): Prisma.GenerationWhereInput {
  const at = new Date(cursor.createdAt);
  return { OR: [{ createdAt: { lt: at } }, { createdAt: at, id: { lt: cursor.id } }] };
}

export interface CreateGenerationInput {
  type: GenerationType;
  prompt: string;
  params: GenerationParams;
}

export async function createGeneration(
  user: SessionUser,
  input: CreateGenerationInput,
): Promise<{ generation: GenerationDTO; quota: QuotaDTO }> {
  await assertConcurrency(user.id, input.type);
  const quota = await reserveQuota(user.id, input.type);
  const model = resolveModel(input.type);

  let row: GenerationRow;
  try {
    row = await prisma.generation.create({
      data: {
        type: input.type,
        userId: user.id,
        prompt: input.prompt,
        params: input.params as unknown as Prisma.InputJsonValue,
        provider: model.provider,
        modelName: model.displayName,
        status: "queued",
      },
      include: { user: { select: { id: true, name: true } } },
    });
  } catch (err) {
    await refundQuota(user.id, input.type);
    throw err;
  }

  const { enqueueJob } = await import("@/lib/queue");
  try {
    await enqueueJob("generate-generation", { generationId: row.id }, { attempts: 1 });
  } catch (err) {
    await prisma.generation.update({
      where: { id: row.id },
      data: { status: "failed", errorMessage: humanizeError(err), completedAt: new Date() },
    });
    await refundQuota(user.id, input.type);
    throw new ApiError("Gagal menjadwalkan proses. Coba lagi.", 500);
  }

  return { generation: serializeGeneration(row, user.id), quota };
}

export interface ListGenerationsInput {
  type?: GenerationType;
  limit?: number;
  cursor?: string | null;
  scope?: "all" | "mine";
}

export async function listGenerations(
  user: SessionUser,
  input: ListGenerationsInput,
): Promise<GenerationListDTO> {
  const limit = Math.min(10, Math.max(1, input.limit ?? 10));
  const typeFilter = input.type ? { type: input.type } : {};
  const cursor = decodeCursor(input.cursor);
  const include = { user: { select: { id: true, name: true } } } as const;
  const orderBy: Prisma.GenerationOrderByWithRelationInput[] = [{ createdAt: "desc" }, { id: "desc" }];

  if (input.scope === "mine") {
    const mine = await prisma.generation.findMany({
      where: {
        ...typeFilter,
        userId: user.id,
        deletedAt: null,
        ...(cursor?.phase === "mine" ? afterCursor(cursor) : {}),
      },
      orderBy,
      take: limit,
      include,
    });
    const mineCursor = mine.length === limit ? encodeCursor("mine", mine[mine.length - 1]) : null;
    return {
      items: mine.map((row) => serializeGeneration(row, user.id)),
      nextCursor: mineCursor,
    };
  }

  const rows: GenerationRow[] = [];

  if (!cursor || cursor.phase === "own") {
    const own = await prisma.generation.findMany({
      where: {
        ...typeFilter,
        userId: user.id,
        deletedAt: null,
        status: { in: ["queued", "processing", "failed"] },
        ...(cursor?.phase === "own" ? afterCursor(cursor) : {}),
      },
      orderBy,
      take: limit,
      include,
    });
    rows.push(...own);
  }

  let nextCursor: string | null = null;
  if (rows.length >= limit) {
    nextCursor = encodeCursor("own", rows[rows.length - 1]);
  } else {
    const remaining = limit - rows.length;
    const done = await prisma.generation.findMany({
      where: {
        ...typeFilter,
        status: "completed",
        deletedAt: null,
        ...(cursor?.phase === "done" ? afterCursor(cursor) : {}),
      },
      orderBy,
      take: remaining,
      include,
    });
    rows.push(...done);
    if (done.length === remaining && done.length > 0) {
      nextCursor = encodeCursor("done", done[done.length - 1]);
    }
  }

  return {
    items: rows.map((row) => serializeGeneration(row, user.id)),
    nextCursor,
  };
}

async function findAccessible(user: SessionUser, id: string): Promise<GenerationRow> {
  const row = await prisma.generation.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!row) throw new ApiError("Hasil tidak ditemukan.", 404);
  if (row.deletedAt) throw new ApiError("Hasil tidak ditemukan.", 404);
  const isOwner = row.userId === user.id;
  if (row.status !== "completed" && !isOwner) throw new ApiError("Hasil tidak ditemukan.", 404);
  return row;
}

export async function getGeneration(user: SessionUser, id: string): Promise<GenerationDTO> {
  return serializeGeneration(await findAccessible(user, id), user.id);
}

export async function retryGeneration(
  user: SessionUser,
  id: string,
): Promise<{ generation: GenerationDTO; quota: QuotaDTO }> {
  const row = await prisma.generation.findUnique({ where: { id } });
  if (!row || row.userId !== user.id || row.deletedAt) throw new ApiError("Hasil tidak ditemukan.", 404);
  if (row.status !== "failed") throw new ApiError("Hanya proses yang gagal bisa dicoba ulang.", 400, "NOT_FAILED");

  const type = row.type as GenerationType;
  await assertConcurrency(user.id, type);
  const quota = await reserveQuota(user.id, type);
  const updated = await prisma.generation.update({
    where: { id },
    data: { status: "queued", errorMessage: null, startedAt: null, completedAt: null },
    include: { user: { select: { id: true, name: true } } },
  });

  const { enqueueJob } = await import("@/lib/queue");
  try {
    await enqueueJob("generate-generation", { generationId: id }, { attempts: 1 });
  } catch (err) {
    await prisma.generation.update({
      where: { id },
      data: { status: "failed", errorMessage: humanizeError(err), completedAt: new Date() },
    });
    await refundQuota(user.id, type);
    throw new ApiError("Gagal menjadwalkan proses. Coba lagi.", 500);
  }

  return { generation: serializeGeneration(updated, user.id), quota };
}

/** Hapus dari galeri bersama — pemilik atau admin (FR-MOD-9). */
export async function softDeleteGeneration(user: SessionUser, id: string): Promise<void> {
  const row = await prisma.generation.findUnique({ where: { id } });
  if (!row) throw new ApiError("Hasil tidak ditemukan.", 404);
  if (row.userId !== user.id && user.role !== "admin") {
    throw new ApiError("Hanya pembuat atau admin yang bisa menghapus.", 403, "FORBIDDEN");
  }
  await prisma.generation.update({ where: { id }, data: { deletedAt: new Date() } });
}

function humanizeError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/waktu/i.test(raw)) return "Waktu proses habis. Coba lagi.";
  if (/kuota|quota/i.test(raw)) return "Kuota penyedia habis. Coba lagi nanti.";
  if (/API_KEY|API key|401|403/.test(raw)) return "Kunci penyedia belum diatur dengan benar.";
  return "Prompt tidak dapat diproses. Coba ubah sedikit kalimatnya.";
}

function splitText(text: string): string[] {
  const clean = text.trim();
  if (clean.length <= AUDIO_CHUNK_MAX) return [clean];
  const sentences = clean.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length > AUDIO_CHUNK_MAX && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = `${current} ${sentence}`.trim();
    }
    if (chunks.length >= AUDIO_MAX_REQUESTS - 1) break;
  }
  if (current && chunks.length < AUDIO_MAX_REQUESTS) chunks.push(current.trim());
  return chunks.slice(0, AUDIO_MAX_REQUESTS);
}

async function storeBuffer(
  namespace: string,
  userId: string,
  filename: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  const key = storageKey(namespace, userId, filename);
  await getStorage().put(key, data, contentType);
  return key;
}

type GenerationUpdate = Prisma.GenerationUpdateInput;

async function executeImage(row: {
  id: string;
  userId: string;
  prompt: string;
  params: Prisma.JsonValue;
}): Promise<GenerationUpdate> {
  const params = row.params as unknown as ImageParams;
  const target = imageTargetSize(params);
  const provider = getMediaProvider("image");

  let baseImage: Buffer | undefined;
  if (params.referenceAssetId) {
    const asset = await prisma.asset.findUnique({ where: { id: params.referenceAssetId } });
    if (asset?.fileUrl) {
      const bytes = await getStorage().get(asset.fileUrl);
      if (bytes) baseImage = bytes;
    }
  }

  const generated = await provider.generateImage({
    prompt: row.prompt,
    ratio: params.aspectRatio,
    quality: params.quality,
    width: target.width,
    height: target.height,
    baseImage,
    referenceMode: params.referenceMode,
  });
  const processed = await processImage(generated.data, target.width, target.height);
  const fileKey = await storeBuffer("generations", row.userId, `${row.id}.png`, processed.data, processed.contentType);
  const thumbKey = await storeBuffer(
    "generations",
    row.userId,
    `${row.id}-thumb.webp`,
    processed.thumb,
    "image/webp",
  );
  return {
    fileUrl: fileKey,
    thumbnailUrl: thumbKey,
    width: processed.width,
    height: processed.height,
  };
}

async function executeVideo(row: {
  id: string;
  userId: string;
  prompt: string;
  params: Prisma.JsonValue;
}): Promise<GenerationUpdate> {
  const params = row.params as unknown as VideoParams;
  const size = videoTargetSize(params.aspectRatio, params.resolution);
  const provider = getMediaProvider("video");

  let frame: Buffer | undefined;
  let baseVideo: Buffer | undefined;
  if (params.startFrameAssetId) {
    const asset = await prisma.asset.findUnique({ where: { id: params.startFrameAssetId } });
    if (asset?.fileUrl) {
      const bytes = await getStorage().get(asset.fileUrl);
      if (bytes) frame = bytes;
    }
  }
  if (params.referenceAssetId) {
    const asset = await prisma.asset.findUnique({ where: { id: params.referenceAssetId } });
    if (asset?.fileUrl) {
      const bytes = await getStorage().get(asset.fileUrl);
      if (bytes) baseVideo = bytes;
    }
  }

  const generated = await provider.generateVideo({
    prompt: row.prompt,
    ratio: params.aspectRatio,
    resolution: params.resolution,
    width: size.width,
    height: size.height,
    scenes: [{ frame, prompt: row.prompt, durationSec: params.durationSeconds }],
    baseVideo,
  });

  const poster = await extractPoster(generated.data);
  const fileKey = await storeBuffer("generations", row.userId, `${row.id}.mp4`, generated.data, "video/mp4");
  const thumbKey = await storeBuffer("generations", row.userId, `${row.id}-poster.jpg`, poster, "image/jpeg");
  const duration = generated.durationSec ?? (await probeDuration(generated.data, "mp4"));

  return {
    fileUrl: fileKey,
    thumbnailUrl: thumbKey,
    width: generated.width ?? size.width,
    height: generated.height ?? size.height,
    durationSeconds: duration,
  };
}

async function executeAudio(row: {
  id: string;
  userId: string;
  prompt: string;
  params: Prisma.JsonValue;
}): Promise<GenerationUpdate> {
  const params = row.params as unknown as AudioParams;
  const provider = getMediaProvider("audio");
  const chunks = splitText(row.prompt);

  const generated = await Promise.all(
    chunks.map((text) =>
      provider.synthesizeSpeech({
        text,
        voice: params.voiceId,
        speed: params.speed,
        tone: params.style,
        lang: params.language,
      }),
    ),
  );

  const audio = await concatAudio(
    generated.map((item) => ({ data: item.data, ext: item.ext })),
    params.format,
  );
  const waveform = await computeWaveform(audio.data, audio.contentType);
  const duration = generated.reduce((acc, item) => acc + (item.durationSec ?? 0), 0) ||
    (await probeDuration(audio.data, audio.ext));
  const fileKey = await storeBuffer("generations", row.userId, `${row.id}.${audio.ext}`, audio.data, audio.contentType);

  return {
    fileUrl: fileKey,
    thumbnailUrl: null,
    waveform: waveform as unknown as Prisma.InputJsonValue,
    durationSeconds: duration,
  };
}

async function executeBrief(row: {
  prompt: string;
  params: Prisma.JsonValue;
}): Promise<GenerationUpdate> {
  const params = row.params as unknown as BriefParams;
  const result = await runStandaloneBrief(row.prompt, params);
  return { resultJson: result as unknown as Prisma.InputJsonValue };
}

async function executeGeneration(row: {
  id: string;
  userId: string;
  type: string;
  prompt: string;
  params: Prisma.JsonValue;
}): Promise<GenerationUpdate> {
  const type = row.type as GenerationType;
  switch (type) {
    case "image":
      return executeImage(row);
    case "video":
      return executeVideo(row);
    case "audio":
      return executeAudio(row);
    case "brief":
      return executeBrief(row);
  }
}

/** Worker entry point: queued → processing → completed/failed + refund (FR-GEN-5). */
export async function runGenerationJob(generationId: string): Promise<void> {
  const row = await prisma.generation.findUnique({ where: { id: generationId } });
  if (!row || row.status !== "queued") return;

  const type = row.type as GenerationType;
  await prisma.generation.update({
    where: { id: generationId },
    data: { status: "processing", startedAt: new Date() },
  });

  try {
    const update = await withTimeout(
      executeGeneration(row),
      JOB_TIMEOUT_MS[type],
      "Proses pembuatan",
    );
    await prisma.generation.update({
      where: { id: generationId },
      data: { ...update, status: "completed", completedAt: new Date() },
    });
  } catch (err) {
    const failed = await prisma.generation.updateMany({
      where: { id: generationId, status: "processing" },
      data: { status: "failed", errorMessage: humanizeError(err), completedAt: new Date() },
    });
    if (failed.count > 0) await refundQuota(row.userId, type);
  }
}

/**
 * Rebuild the media for an existing image/video generation in place (used by the
 * `media:regen` maintenance script). Overwrites the same storage keys and does
 * not touch quota.
 */
export async function regenerateGeneration(id: string): Promise<boolean> {
  const row = await prisma.generation.findUnique({ where: { id } });
  if (!row || row.deletedAt) return false;
  const type = row.type as GenerationType;
  if (type !== "image" && type !== "video") return false;

  await prisma.generation.update({
    where: { id },
    data: { status: "processing", errorMessage: null, startedAt: new Date() },
  });
  try {
    const update = await withTimeout(executeGeneration(row), JOB_TIMEOUT_MS[type], "Proses pembuatan");
    await prisma.generation.update({
      where: { id },
      data: { ...update, status: "completed", completedAt: new Date() },
    });
    return true;
  } catch (err) {
    await prisma.generation.update({
      where: { id },
      data: { status: "failed", errorMessage: humanizeError(err), completedAt: new Date() },
    });
    return false;
  }
}

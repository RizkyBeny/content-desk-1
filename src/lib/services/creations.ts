import { prisma } from "@/lib/prisma";
import { Prisma, type Asset } from "@prisma/client";
import { ApiError } from "@/lib/api";
import { getAIProvider } from "@/lib/adapters/ai";
import { enqueueJob } from "@/lib/queue";
import { serializeAsset } from "@/lib/services/assets";
import { finalizeCreation } from "@/lib/services/creations-generate";
import { buildInitialEditorState } from "@/lib/services/creations-editor";
import { getProjectForUser } from "@/lib/services/projects";
import type { SessionUser } from "@/lib/auth/session";
import type {
  BriefRow,
  Caption,
  ContentType,
  CreationDTO,
  CreationItemDTO,
  EditorState,
  ItemStatus,
  MediaSource,
} from "@/types";

export interface MediaSourceInput {
  briefRow: number;
  source: MediaSource;
  assetId?: string;
  prompt?: string;
}

export interface ItemDef {
  briefRowRef: number;
  mediaSource: MediaSource;
  assetId?: string;
  prompt?: string;
}

function imagePrompt(row: BriefRow): string {
  return [row.elemenVisual, row.gaya ? `Gaya: ${row.gaya}` : "", row.teks ? `Teks: ${row.teks}` : ""]
    .filter(Boolean)
    .join(". ");
}

function carouselPrompt(row: BriefRow): string {
  return [row.visual, row.judul, row.isi].filter(Boolean).join(". ");
}

function composeArticle(rows: BriefRow[]): string {
  return rows
    .map((row, i) => {
      const title = row.judul || `Bagian ${i + 1}`;
      const body = row.poin ?? "";
      const ref = row.referensi ? `\n\n> Sumber: ${row.referensi}` : "";
      return `## ${title}\n\n${body}${ref}`;
    })
    .join("\n\n");
}

export function buildItemDefs(type: ContentType, rowsIn: BriefRow[], sources: MediaSourceInput[]): ItemDef[] {
  const rows = rowsIn.length ? rowsIn : [{}];
  const byRow = new Map(sources.map((s) => [s.briefRow, s]));
  const aiPrompt = (src: MediaSourceInput | undefined, derived: string) =>
    src && src.source === "ai_generated" && src.prompt ? src.prompt : derived;

  if (type === "article") {
    const src = byRow.get(1);
    return [
      {
        briefRowRef: 1,
        mediaSource: src?.source ?? "ai_generated",
        assetId: src?.assetId,
        prompt: aiPrompt(src, composeArticle(rows)),
      },
    ];
  }

  if (type === "image") {
    const row = rows[0];
    const src = byRow.get(1);
    return [
      {
        briefRowRef: 1,
        mediaSource: src?.source ?? "ai_generated",
        assetId: src?.assetId,
        prompt: aiPrompt(src, imagePrompt(row)),
      },
    ];
  }

  return rows.map((row, i) => {
    const n = i + 1;
    const src = byRow.get(n);
    const derived =
      type === "carousel" ? carouselPrompt(row) : type === "audio" ? (row.naskah ?? "") : (row.visual ?? "");
    return {
      briefRowRef: n,
      mediaSource: src?.source ?? "ai_generated",
      assetId: src?.assetId,
      prompt: aiPrompt(src, derived),
    };
  });
}

/** Create a Creation and kick off per-item generation (FR-GEN-1/2). */
export async function createCreation(
  user: SessionUser,
  projectId: string,
  mediaSources: MediaSourceInput[],
): Promise<{ creationId: string; status: string }> {
  const project = await getProjectForUser(user, projectId);
  if (!project.contentType) throw new ApiError("Pilih jenis konten dahulu.", 400);
  const brief = await prisma.contentBrief.findUnique({ where: { projectId } });
  if (!brief) throw new ApiError("Brief belum dibuat.", 400);

  const existing = await prisma.creation.findFirst({
    where: { projectId, status: "generating" },
    select: { id: true },
  });
  if (existing) throw new ApiError("Konten sedang diproses. Tunggu hingga selesai.", 409);

  const type = project.contentType as ContentType;
  const rows = (brief.rows as unknown as BriefRow[]) ?? [];
  const defs = buildItemDefs(type, rows, mediaSources);

  // Validate provided assets belong to / are visible to the user (FR-AST-4).
  for (const def of defs) {
    if (def.mediaSource !== "ai_generated" && def.assetId) {
      const asset = await prisma.asset.findUnique({ where: { id: def.assetId }, select: { ownerId: true, visibility: true } });
      const ok = asset && (asset.ownerId === user.id || asset.visibility === "workspace" || user.role === "admin");
      if (!ok) throw new ApiError("Aset sumber tidak ditemukan atau tidak dapat diakses.", 400);
    }
  }

  const creation = await prisma.creation.create({
    data: {
      projectId,
      type,
      status: "generating",
      items: {
        create: defs.map((d) => ({
          briefRowRef: d.briefRowRef,
          mediaSource: d.mediaSource,
          assetId: d.mediaSource === "ai_generated" ? null : (d.assetId ?? null),
          prompt: d.prompt ?? null,
          status: "queued",
          versions: [] as unknown as Prisma.InputJsonValue,
        })),
      },
    },
    include: { items: true },
  });

  await prisma.project.update({ where: { id: projectId }, data: { status: "generating" } });

  for (const item of creation.items) {
    if (item.mediaSource === "ai_generated") {
      await enqueueJob("generate-item", { itemId: item.id });
    } else {
      await prisma.creationItem.update({ where: { id: item.id }, data: { status: "completed" } });
    }
  }
  await finalizeCreation(creation.id, projectId);

  return { creationId: creation.id, status: "generating" };
}

function itemDTO(item: {
  id: string;
  briefRowRef: number;
  mediaSource: string;
  assetId: string | null;
  prompt: string | null;
  provider: string | null;
  status: string;
  errorMessage: string | null;
  versions: Prisma.JsonValue;
}, assetsById: Map<string, Asset>): CreationItemDTO {
  const asset = item.assetId ? assetsById.get(item.assetId) ?? null : null;
  return {
    id: item.id,
    briefRowRef: item.briefRowRef,
    mediaSource: item.mediaSource as MediaSource,
    assetId: item.assetId,
    asset: asset ? serializeAsset(asset) : null,
    prompt: item.prompt,
    provider: item.provider,
    status: item.status as ItemStatus,
    errorMessage: item.errorMessage,
    versions: Array.isArray(item.versions) ? (item.versions as string[]) : [],
  };
}

function isValidEditorState(state: unknown, type: ContentType): boolean {
  return Boolean(state && typeof state === "object" && (state as { type?: unknown }).type === type);
}

async function getCreationOwned(user: SessionUser, id: string) {
  const creation = await prisma.creation.findUnique({
    where: { id },
    include: {
      project: { include: { brief: true } },
      items: { orderBy: { briefRowRef: "asc" } },
    },
  });
  if (!creation) throw new ApiError("Konten tidak ditemukan.", 404);
  if (creation.project.userId !== user.id && user.role !== "admin") {
    throw new ApiError("Tidak punya akses ke konten ini.", 403);
  }
  return creation;
}

export async function getCreationDetail(user: SessionUser, id: string): Promise<CreationDTO> {
  const creation = await getCreationOwned(user, id);
  const assetIds = Array.from(
    new Set(creation.items.map((i) => i.assetId).filter((v): v is string => Boolean(v))),
  );
  const assets = assetIds.length
    ? await prisma.asset.findMany({ where: { id: { in: assetIds } } })
    : [];
  const assetsById = new Map(assets.map((a) => [a.id, a]));

  const brief = creation.project.brief;
  const rows = (brief?.rows as unknown as BriefRow[]) ?? [];
  const captions = (brief?.captions as unknown as Caption[]) ?? [];

  // Seed (or repair) editorState for creations missing a valid state.
  let editorState = (creation.editorState as unknown as EditorState) ?? null;
  let updatedAt = creation.updatedAt;
  if (!isValidEditorState(editorState, creation.type as ContentType) && creation.items.length && creation.status !== "generating") {
    editorState = buildInitialEditorState(
      creation.type as ContentType,
      creation.items.map((i) => ({ briefRowRef: i.briefRowRef, assetId: i.assetId })),
      rows,
    );
    const seeded = await prisma.creation.update({
      where: { id },
      data: { editorState: editorState as unknown as Prisma.InputJsonValue },
      select: { updatedAt: true },
    });
    updatedAt = seeded.updatedAt;
  }

  return {
    id: creation.id,
    projectId: creation.projectId,
    briefId: brief?.id ?? null,
    type: creation.type as ContentType,
    editorState,
    status: creation.status as CreationDTO["status"],
    items: creation.items.map((i) => itemDTO(i, assetsById)),
    captions,
    updatedAt: updatedAt.toISOString(),
  };
}

export interface CreationSummary {
  id: string;
  projectId: string;
  projectTitle: string;
  type: ContentType;
  status: string;
  itemCount: number;
  completedCount: number;
  updatedAt: string;
}

export async function listCreations(user: SessionUser, limit = 30): Promise<CreationSummary[]> {
  const creations = await prisma.creation.findMany({
    where: user.role === "admin" ? {} : { project: { userId: user.id } },
    orderBy: { updatedAt: "desc" },
    take: Math.min(60, Math.max(1, limit)),
    include: { project: { select: { topicTitle: true } }, items: { select: { status: true } } },
  });
  return creations.map((c) => ({
    id: c.id,
    projectId: c.projectId,
    projectTitle: c.project.topicTitle ?? "Tanpa judul",
    type: c.type as ContentType,
    status: c.status,
    itemCount: c.items.length,
    completedCount: c.items.filter((i) => i.status === "completed").length,
    updatedAt: c.updatedAt.toISOString(),
  }));
}

export async function patchEditorState(
  user: SessionUser,
  id: string,
  editorState: EditorState,
  expectedUpdatedAt?: string,
): Promise<{ updatedAt: string }> {
  const creation = await getCreationOwned(user, id);
  if (expectedUpdatedAt && creation.updatedAt.toISOString() !== expectedUpdatedAt) {
    throw new ApiError("Konten diperbarui di tempat lain. Muat ulang.", 409, "stale");
  }
  const updated = await prisma.creation.update({
    where: { id },
    data: { editorState: editorState as unknown as Prisma.InputJsonValue },
    select: { updatedAt: true },
  });
  return { updatedAt: updated.updatedAt.toISOString() };
}

export async function reviseCreationText(
  user: SessionUser,
  id: string,
  input: { text: string; action: "tone" | "shorten" | "expand"; tone?: string },
): Promise<string> {
  const creation = await getCreationOwned(user, id);
  if (creation.type !== "article") throw new ApiError("Revisi AI hanya tersedia untuk artikel.", 400);
  const text = String(input.text ?? "").trim();
  if (!text) throw new ApiError("Teks yang direvisi kosong.", 400);
  const action = input.action === "shorten" || input.action === "expand" ? input.action : "tone";
  return getAIProvider().reviseText({ text, action, tone: input.tone, lang: user.contentLang });
}

export async function regenerateItem(
  user: SessionUser,
  itemId: string,
  opts: { prompt?: string } = {},
): Promise<{ status: ItemStatus }> {
  const item = await prisma.creationItem.findUnique({
    where: { id: itemId },
    include: { creation: { include: { project: true } } },
  });
  if (!item) throw new ApiError("Item tidak ditemukan.", 404);
  if (item.creation.project.userId !== user.id && user.role !== "admin") {
    throw new ApiError("Tidak punya akses ke item ini.", 403);
  }
  await prisma.creationItem.update({
    where: { id: itemId },
    data: {
      status: "queued",
      errorMessage: null,
      ...(typeof opts.prompt === "string" ? { prompt: opts.prompt } : {}),
    },
  });
  await prisma.creation.update({ where: { id: item.creationId }, data: { status: "generating" } });
  await enqueueJob("generate-item", { itemId });
  return { status: "queued" };
}

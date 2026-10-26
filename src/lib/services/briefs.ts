import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getAIProvider } from "@/lib/adapters/ai";
import { ApiError } from "@/lib/api";
import type { SessionUser } from "@/lib/auth/session";
import type {
  BriefDTO,
  BriefRow,
  BriefStatus,
  BriefSummary,
  BriefVersion,
  Caption,
  ContentType,
} from "@/types";
import { getBriefSchema } from "../../../config/brief-schemas";
import { getProjectForUser } from "./projects";

const MAX_VERSIONS = 10;

function toDTO(brief: {
  id: string;
  projectId: string;
  summary: Prisma.JsonValue;
  rows: Prisma.JsonValue;
  captions: Prisma.JsonValue;
  versions: Prisma.JsonValue;
  status: string;
  updatedAt: Date;
}): BriefDTO {
  return {
    id: brief.id,
    projectId: brief.projectId,
    summary: brief.summary as unknown as BriefSummary,
    rows: (brief.rows as unknown as BriefRow[]) ?? [],
    captions: (brief.captions as unknown as Caption[]) ?? [],
    versions: Array.isArray(brief.versions) ? (brief.versions as unknown as BriefVersion[]) : [],
    status: brief.status as BriefStatus,
    updatedAt: brief.updatedAt.toISOString(),
  };
}

export async function getBriefByProject(user: SessionUser, projectId: string): Promise<BriefDTO | null> {
  await getProjectForUser(user, projectId);
  const brief = await prisma.contentBrief.findUnique({ where: { projectId } });
  return brief ? toDTO(brief) : null;
}

export async function generateBrief(
  user: SessionUser,
  projectId: string,
  contentTypeOverride?: ContentType,
): Promise<BriefDTO> {
  const project = await getProjectForUser(user, projectId);
  const contentType = (contentTypeOverride || project.contentType) as ContentType;
  if (!contentType) throw new ApiError("Pilih jenis konten dahulu.", 400);

  const generation = await getAIProvider().generateBrief({
    topic: project.topicTitle ?? "",
    angle: {
      title: project.angleTitle ?? project.topicTitle ?? "",
      description: project.angleDesc ?? "",
      audience: "",
    },
    contentType,
    summaryContext: { niche: user.niche, tone: null, platforms: [] },
    lang: user.contentLang,
  });

  const existing = await prisma.contentBrief.findUnique({ where: { projectId } });
  const versions = pushVersion(existing);
  const ready = requiredMissing(contentType, (generation.rows ?? []) as BriefRow[]) === null;

  const brief = await prisma.contentBrief.upsert({
    where: { projectId },
    create: {
      projectId,
      summary: generation.summary as unknown as Prisma.InputJsonValue,
      rows: generation.rows as unknown as Prisma.InputJsonValue,
      captions: generation.captions as unknown as Prisma.InputJsonValue,
      status: ready ? "siap" : "draft",
      versions: versions as unknown as Prisma.InputJsonValue,
    },
    update: {
      summary: generation.summary as unknown as Prisma.InputJsonValue,
      rows: generation.rows as unknown as Prisma.InputJsonValue,
      captions: generation.captions as unknown as Prisma.InputJsonValue,
      versions: versions as unknown as Prisma.InputJsonValue,
    },
  });
  return toDTO(brief);
}

function pushVersion(
  existing: {
    summary: Prisma.JsonValue;
    rows: Prisma.JsonValue;
    captions: Prisma.JsonValue;
    versions: Prisma.JsonValue;
  } | null,
): BriefVersion[] {
  const prev = Array.isArray(existing?.versions)
    ? (existing!.versions as unknown as BriefVersion[])
    : [];
  if (!existing) return prev.slice(-MAX_VERSIONS);
  const snapshot: BriefVersion = {
    at: new Date().toISOString(),
    summary: existing.summary as unknown as BriefSummary,
    rows: (existing.rows as unknown as BriefRow[]) ?? [],
    captions: (existing.captions as unknown as Caption[]) ?? [],
  };
  return [...prev, snapshot].slice(-MAX_VERSIONS);
}

export interface BriefPatch {
  summary?: BriefSummary;
  rows?: BriefRow[];
  captions?: Caption[];
  status?: BriefStatus;
}

export async function updateBrief(
  user: SessionUser,
  briefId: string,
  patch: BriefPatch,
): Promise<BriefDTO> {
  const brief = await prisma.contentBrief.findUnique({ where: { id: briefId } });
  if (!brief) throw new ApiError("Brief tidak ditemukan.", 404);
  await getProjectForUser(user, brief.projectId);

  // Block edits only when a Creation is actively generating (edge case).
  const generating = await prisma.creation.findFirst({
    where: { projectId: brief.projectId, status: "generating" },
  });
  if (generating) {
    throw new ApiError("Konten sedang diproses. Coba lagi setelah selesai.", 409);
  }

  if (patch.status && patch.status === "siap") {
    const rows = (patch.rows ?? (brief.rows as unknown as BriefRow[])) ?? [];
    const type = await resolveContentType(brief.projectId);
    const missing = requiredMissing(type, rows);
    if (missing) {
      throw new ApiError(`Kolom wajib belum terisi: ${missing}`, 400);
    }
  }

  const versions = pushVersion(brief);

  const updated = await prisma.contentBrief.update({
    where: { id: briefId },
    data: {
      ...(patch.summary ? { summary: patch.summary as unknown as Prisma.InputJsonValue } : {}),
      ...(patch.rows ? { rows: patch.rows as unknown as Prisma.InputJsonValue } : {}),
      ...(patch.captions ? { captions: patch.captions as unknown as Prisma.InputJsonValue } : {}),
      ...(patch.status ? { status: patch.status } : {}),
      versions: versions as unknown as Prisma.InputJsonValue,
    },
  });
  return toDTO(updated);
}

async function resolveContentType(projectId: string): Promise<ContentType> {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { contentType: true } });
  return (project?.contentType ?? "image") as ContentType;
}

function requiredMissing(type: ContentType, rows: BriefRow[]): string | null {
  const schema = getBriefSchema(type);
  const required = schema.columns.filter((c) => c.required).map((c) => c.key);
  for (let i = 0; i < rows.length; i++) {
    for (const key of required) {
      if (!String(rows[i][key] ?? "").trim()) {
        const label = schema.columns.find((c) => c.key === key)?.label ?? key;
        return `baris ${i + 1} → ${label}`;
      }
    }
  }
  return null;
}

export async function reviseBrief(
  user: SessionUser,
  briefId: string,
  instruction: string,
  rowIndex: number | null,
): Promise<BriefDTO> {
  const brief = await prisma.contentBrief.findUnique({ where: { id: briefId } });
  if (!brief) throw new ApiError("Brief tidak ditemukan.", 404);
  await getProjectForUser(user, brief.projectId);

  const type = await resolveContentType(brief.projectId);
  const currentRows = (brief.rows as unknown as BriefRow[]) ?? [];
  const currentSummary = brief.summary as unknown as BriefSummary;

  const revisedRows = await getAIProvider().reviseBrief({
    contentType: type,
    instruction,
    rowIndex,
    currentSummary,
    currentRows,
    lang: user.contentLang,
  });

  const versions = pushVersion(brief);

  const updated = await prisma.contentBrief.update({
    where: { id: briefId },
    data: {
      rows: revisedRows as unknown as Prisma.InputJsonValue,
      versions: versions as unknown as Prisma.InputJsonValue,
    },
  });
  return toDTO(updated);
}

export async function restoreBriefVersion(
  user: SessionUser,
  briefId: string,
  versionIndex: number,
): Promise<BriefDTO> {
  const brief = await prisma.contentBrief.findUnique({ where: { id: briefId } });
  if (!brief) throw new ApiError("Brief tidak ditemukan.", 404);
  await getProjectForUser(user, brief.projectId);

  const versions = Array.isArray(brief.versions) ? (brief.versions as unknown as BriefVersion[]) : [];
  const target = versions[versionIndex];
  if (!target) throw new ApiError("Versi tidak ditemukan.", 404);

  const updated = await prisma.contentBrief.update({
    where: { id: briefId },
    data: {
      summary: target.summary as unknown as Prisma.InputJsonValue,
      rows: target.rows as unknown as Prisma.InputJsonValue,
      captions: target.captions as unknown as Prisma.InputJsonValue,
    },
  });
  return toDTO(updated);
}

export async function regenerateCaptions(user: SessionUser, briefId: string): Promise<BriefDTO> {
  const brief = await prisma.contentBrief.findUnique({ where: { id: briefId } });
  if (!brief) throw new ApiError("Brief tidak ditemukan.", 404);
  const project = await getProjectForUser(user, brief.projectId);
  const captions = await getAIProvider().generateCaptions({
    topic: project.topicTitle ?? "",
    angle: { title: project.angleTitle ?? "", description: project.angleDesc ?? "", audience: "" },
    contentType: (project.contentType ?? "image") as ContentType,
    summaryContext: { niche: user.niche, tone: null, platforms: [] },
    lang: user.contentLang,
  });
  const updated = await prisma.contentBrief.update({
    where: { id: briefId },
    data: { captions: captions as unknown as Prisma.InputJsonValue },
  });
  return toDTO(updated);
}

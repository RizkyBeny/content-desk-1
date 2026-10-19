import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getAIProvider } from "@/lib/adapters/ai";
import type { SessionUser } from "@/lib/auth/session";
import { ApiError } from "@/lib/api";
import type { Angle, ContentType, RecommendedType, TopicInsight } from "@/types";
import { getUserFormatPerformance } from "./scope";

const MAX_ACTIVE_ANGLES = 9;
const CONTENT_TYPES: ContentType[] = ["image", "carousel", "video", "audio", "article"];

export async function createProject(
  user: SessionUser,
  input: { origin: "flow" | "standalone"; topicTitle: string; topicSource: "trending" | "custom"; topicInsight?: TopicInsight },
) {
  return prisma.project.create({
    data: {
      userId: user.id,
      origin: input.origin,
      topicTitle: input.topicTitle,
      topicSource: input.topicSource,
      topicInsight: (input.topicInsight ?? undefined) as unknown as Prisma.InputJsonValue,
      status: "brief",
    },
  });
}

export async function getProjectForUser(user: SessionUser, projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError("Proyek tidak ditemukan.", 404);
  if (project.userId !== user.id && user.role !== "admin") {
    throw new ApiError("Tidak punya akses ke proyek ini.", 403);
  }
  return project;
}

function readAngles(value: Prisma.JsonValue | null): Angle[] {
  return Array.isArray(value) ? (value as unknown as Angle[]) : [];
}

export async function generateAngles(
  user: SessionUser,
  projectId: string,
  count = 8,
): Promise<Angle[]> {
  const project = await getProjectForUser(user, projectId);
  if (!project.topicTitle) throw new ApiError("Topik belum dipilih.", 400);
  const existing = readAngles(project.angles);
  const remaining = MAX_ACTIVE_ANGLES - existing.length;
  if (remaining <= 0) return existing;

  const perf = await getUserFormatPerformance(user);
  const fresh = await getAIProvider().generateAngles({
    topic: project.topicTitle,
    niche: user.niche,
    topFormats: perf.map((p) => ({ format: p.format, avgEr: p.avgEr })),
    count: Math.min(count, remaining),
    existingTitles: existing.map((a) => a.title),
    lang: user.contentLang,
  });
  const merged = [...existing, ...fresh].slice(0, MAX_ACTIVE_ANGLES);
  await prisma.project.update({
    where: { id: projectId },
    data: { angles: merged as unknown as Prisma.InputJsonValue },
  });
  return merged;
}

export async function updateAngle(
  user: SessionUser,
  projectId: string,
  angleId: string,
  patch: Partial<Pick<Angle, "title" | "description" | "audience" | "reason">>,
): Promise<Angle[]> {
  const project = await getProjectForUser(user, projectId);
  const angles = readAngles(project.angles).map((a) => (a.id === angleId ? { ...a, ...patch } : a));
  await prisma.project.update({
    where: { id: projectId },
    data: { angles: angles as unknown as Prisma.InputJsonValue },
  });
  return angles;
}

export async function addCustomAngle(
  user: SessionUser,
  projectId: string,
  angle: Omit<Angle, "id">,
): Promise<Angle[]> {
  const project = await getProjectForUser(user, projectId);
  const angles = readAngles(project.angles);
  if (angles.length >= MAX_ACTIVE_ANGLES) {
    throw new ApiError(`Maksimal ${MAX_ACTIVE_ANGLES} angle aktif per topik.`, 400);
  }
  const created: Angle = { id: `ag-custom-${Date.now()}`, ...angle };
  const next = [...angles, created];
  await prisma.project.update({
    where: { id: projectId },
    data: { angles: next as unknown as Prisma.InputJsonValue },
  });
  return next;
}

export async function selectAngle(
  user: SessionUser,
  projectId: string,
  angleId: string,
): Promise<{ project: Awaited<ReturnType<typeof getProjectForUser>>; recommendedTypes: RecommendedType[] }> {
  const project = await getProjectForUser(user, projectId);
  const angles = readAngles(project.angles);
  const angle = angles.find((a) => a.id === angleId);
  if (!angle) throw new ApiError("Angle tidak ditemukan.", 404);

  const perf = await getUserFormatPerformance(user);
  const recommendedTypes = await getAIProvider().recommendContentTypes({
    topic: project.topicTitle ?? "",
    angle: { title: angle.title, description: angle.description, audience: angle.audience },
    formatPerformance: perf.map((p) => ({ format: p.format, avgEr: p.avgEr })),
    lang: user.contentLang,
  });

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      selectedAngleId: angleId,
      angleTitle: angle.title,
      angleDesc: angle.description,
      recommendedTypes: recommendedTypes as unknown as Prisma.InputJsonValue,
    },
  });
  return { project: updated, recommendedTypes };
}

export async function setContentType(
  user: SessionUser,
  projectId: string,
  contentType: ContentType,
): Promise<Awaited<ReturnType<typeof getProjectForUser>>> {
  if (!CONTENT_TYPES.includes(contentType)) {
    throw new ApiError("Jenis konten tidak valid.", 400);
  }
  await getProjectForUser(user, projectId);
  return prisma.project.update({
    where: { id: projectId },
    data: { contentType },
  });
}

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getMediaProvider, type MediaKind } from "@/lib/adapters/media";
import { createBinaryAsset, createTextAsset } from "@/lib/services/assets";
import { buildInitialEditorState } from "@/lib/services/creations-editor";
import type { SessionUser } from "@/lib/auth/session";
import type { BriefRow, ContentType, Ratio } from "@/types";

const RATIOS: Ratio[] = ["1:1", "4:5", "9:16", "16:9"];
const MAX_VERSIONS = 5;

function asRatio(value: unknown, fallback: Ratio): Ratio {
  const v = String(value ?? "");
  return (RATIOS as string[]).includes(v) ? (v as Ratio) : fallback;
}

function numFrom(value: unknown, fallback: number): number {
  const n = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function kindFor(type: ContentType): MediaKind {
  if (type === "video") return "video";
  if (type === "audio") return "audio";
  return "image";
}

function humanize(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("OPENAI_API_KEY") || msg.includes("ELEVENLABS_API_KEY")) return msg;
  if (msg.includes("belum didukung")) return msg;
  return `Gagal menghasilkan media: ${msg}`;
}

async function buildOwner(userId: string): Promise<SessionUser> {
  const u = await prisma.user.findUnique({ where: { id: userId } });
  return {
    id: userId,
    name: u?.name ?? "Creator",
    email: u?.email ?? "",
    role: (u?.role ?? "creator") as SessionUser["role"],
    theme: u?.theme ?? "system",
    contentLang: u?.contentLang ?? "id",
    niche: u?.niche ?? null,
    nicheCategories: [],
    avatarUrl: u?.avatarUrl ?? null,
  };
}

export async function finalizeCreation(creationId: string, projectId: string): Promise<void> {
  const creation = await prisma.creation.findUnique({
    where: { id: creationId },
    include: { items: { orderBy: { briefRowRef: "asc" } } },
  });
  if (!creation) return;
  const pending = creation.items.some((i) => i.status === "queued" || i.status === "processing");
  if (pending) return;
  const allCompleted = creation.items.length > 0 && creation.items.every((i) => i.status === "completed");
  await prisma.creation.update({
    where: { id: creationId },
    data: { status: allCompleted ? "ready" : "failed" },
  });
  if (allCompleted) {
    await prisma.project.update({ where: { id: projectId }, data: { status: "editing" } });
    const current = creation.editorState as unknown as { type?: unknown } | null;
    if (!current || current.type !== creation.type) {
      const brief = await prisma.contentBrief.findUnique({ where: { projectId } });
      const rows = (brief?.rows as unknown as BriefRow[]) ?? [];
      const editorState = buildInitialEditorState(
        creation.type as ContentType,
        creation.items.map((i) => ({ briefRowRef: i.briefRowRef, assetId: i.assetId })),
        rows,
      );
      await prisma.creation.update({
        where: { id: creationId },
        data: { editorState: editorState as unknown as Prisma.InputJsonValue },
      });
    }
  }
}

/** Generate one CreationItem (FR-GEN-1/2/3). Idempotent; safe to retry. */
export async function generateItem(itemId: string): Promise<void> {
  const item = await prisma.creationItem.findUnique({
    where: { id: itemId },
    include: { creation: { include: { project: { include: { brief: true } } } } },
  });
  if (!item) return;

  const creation = item.creation;
  const project = creation.project;
  const type = creation.type as ContentType;
  const rows = (project?.brief?.rows as unknown as BriefRow[]) ?? [];
  const row = rows[item.briefRowRef - 1] ?? {};

  await prisma.creationItem.update({
    where: { id: itemId },
    data: { status: "processing", errorMessage: null },
  });

  const user = await buildOwner(project.userId);
  const prev = Array.isArray(item.versions) ? (item.versions as string[]) : [];
  const variant = prev.length;
  let providerName = "mock";

  try {
    let assetId: string;
    if (type === "article") {
      const asset = await createTextAsset(user, {
        name: `Artikel – ${project.topicTitle ?? "Konten"}`,
        textContent: item.prompt ?? "",
        tags: ["generate", "artikel"],
      });
      assetId = asset.id;
      providerName = "local";
    } else {
      const provider = getMediaProvider(kindFor(type));
      providerName = provider.name;
      if (type === "audio") {
        const durationSec = numFrom(row.durasi, 6);
        const out = await provider.synthesizeSpeech({
          text: item.prompt ?? "",
          voice: "mock-voice",
          speed: 1,
          variant: variant + durationSec,
        });
        const asset = await createBinaryAsset(user, {
          name: `Audio segmen ${item.briefRowRef}`,
          type: "audio",
          origin: "generated",
          data: out.data,
          contentType: out.contentType,
          ext: out.ext,
          tags: ["generate", "audio"],
        });
        assetId = asset.id;
      } else if (type === "video") {
        const ratio = asRatio(row.rasio, "9:16");
        const durationSec = numFrom(row.durasi, 4);
        const out = await provider.generateVideo({
          prompt: item.prompt ?? "",
          ratio,
          scenes: [{ prompt: item.prompt ?? "", durationSec }],
          variant,
        });
        const asset = await createBinaryAsset(user, {
          name: `Scene ${item.briefRowRef}`,
          type: "video",
          origin: "generated",
          data: out.data,
          contentType: out.contentType,
          ext: out.ext,
          tags: ["generate", "video"],
        });
        assetId = asset.id;
      } else {
        const ratio = asRatio(row.rasio, type === "carousel" ? "4:5" : "1:1");
        const out = await provider.generateImage({ prompt: item.prompt ?? "", ratio, variant });
        const asset = await createBinaryAsset(user, {
          name: type === "carousel" ? `Slide ${item.briefRowRef}` : `Gambar ${item.briefRowRef}`,
          type: "image",
          origin: "generated",
          data: out.data,
          contentType: out.contentType,
          ext: out.ext,
          tags: ["generate", type],
        });
        assetId = asset.id;
      }
    }

    const versions = [assetId, ...prev].slice(0, MAX_VERSIONS);
    await prisma.creationItem.update({
      where: { id: itemId },
      data: { status: "completed", assetId, provider: providerName, versions },
    });
  } catch (err) {
    console.error(`[generate-item] ${itemId} gagal:`, err);
    await prisma.creationItem.update({
      where: { id: itemId },
      data: { status: "failed", errorMessage: humanize(err) },
    });
  }

  await finalizeCreation(creation.id, project.id);
}

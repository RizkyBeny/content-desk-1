import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api";
import type { SessionUser } from "@/lib/auth/session";

/** Hidden personal project that owns all standalone designs. */
const DESIGN_PROJECT_TITLE = "Desain Bebas";
const DESIGN_KINDS = ["image", "carousel"];
const DESIGN_RATIOS = ["1:1", "4:5", "9:16", "16:9"];
const MAX_STATE_CHARS = 400_000;
const MAX_SLIDES = 30;

interface DesignStateShape {
  type?: unknown;
  ratio?: unknown;
  slide?: { layers?: unknown } | null;
  slides?: unknown;
}

/**
 * Validate a direct-design creation payload (pure, no DB).
 * Throws ApiError(400) when the shape is not a valid image/carousel editor state.
 */
export function validateDesignInput(type: unknown, state: unknown): void {
  if (typeof type !== "string" || !DESIGN_KINDS.includes(type)) {
    throw new ApiError("Jenis desain harus image atau carousel.", 400);
  }
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new ApiError("editorState wajib diisi.", 400);
  }
  if (JSON.stringify(state).length > MAX_STATE_CHARS) {
    throw new ApiError("Ukuran desain terlalu besar.", 400);
  }
  const s = state as DesignStateShape;
  if (s.type !== type) {
    throw new ApiError("Tipe editorState tidak cocok dengan jenis desain.", 400);
  }
  if (typeof s.ratio !== "string" || !DESIGN_RATIOS.includes(s.ratio)) {
    throw new ApiError("Rasio desain tidak valid.", 400);
  }
  if (type === "image") {
    if (!s.slide || typeof s.slide !== "object" || !Array.isArray(s.slide.layers)) {
      throw new ApiError("Data slide tidak valid.", 400);
    }
    return;
  }
  const slides = s.slides;
  if (!Array.isArray(slides) || slides.length < 1 || slides.length > MAX_SLIDES) {
    throw new ApiError("Data slide carousel tidak valid.", 400);
  }
  const valid = slides.every(
    (sl) => sl && typeof sl === "object" && Array.isArray((sl as { layers?: unknown }).layers),
  );
  if (!valid) {
    throw new ApiError("Data slide carousel tidak valid.", 400);
  }
}

/**
 * Create a ready-to-edit Creation directly from the Desain page —
 * no brief, no async generation. The creation lives in the user's
 * personal "Desain Bebas" project.
 */
export async function createDesign(
  user: SessionUser,
  input: { type?: unknown; editorState?: unknown },
): Promise<{ creationId: string }> {
  validateDesignInput(input.type, input.editorState);
  const type = input.type as string;

  const existing = await prisma.project.findFirst({
    where: { userId: user.id, origin: "standalone", topicTitle: DESIGN_PROJECT_TITLE },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const project =
    existing ??
    (await prisma.project.create({
      data: {
        userId: user.id,
        origin: "standalone",
        topicTitle: DESIGN_PROJECT_TITLE,
        topicSource: "custom",
        status: "editing",
      },
      select: { id: true },
    }));

  const creation = await prisma.creation.create({
    data: {
      projectId: project.id,
      type,
      status: "ready",
      editorState: input.editorState as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  return { creationId: creation.id };
}

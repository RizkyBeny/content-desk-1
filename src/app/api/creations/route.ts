import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { createCreation, listCreations, type MediaSourceInput } from "@/lib/services/creations";
import type { MediaSource } from "@/types";

const SOURCES = new Set(["creator_asset", "asset_management", "ai_generated"]);

export async function GET(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    const limit = new URL(req.url).searchParams.get("limit");
    const items = await listCreations(user, limit ? Number(limit) : 30);
    return ok({ items });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    const body = (await req.json().catch(() => ({}))) as {
      projectId?: string;
      mediaSources?: { briefRow?: unknown; source?: unknown; assetId?: unknown; prompt?: unknown }[];
    };
    if (!body.projectId) throw new ApiError("projectId wajib diisi.", 400);
    const rawSources = Array.isArray(body.mediaSources) ? body.mediaSources : [];
    const mediaSources: MediaSourceInput[] = rawSources
      .filter((s) => SOURCES.has(String(s.source)))
      .map((s) => ({
        briefRow: Number(s.briefRow) || 1,
        source: s.source as MediaSource,
        assetId: typeof s.assetId === "string" ? s.assetId : undefined,
        prompt: typeof s.prompt === "string" && s.prompt.trim() ? s.prompt.trim() : undefined,
      }));

    const result = await createCreation(user, body.projectId, mediaSources);
    return ok(result, 202);
  });
}

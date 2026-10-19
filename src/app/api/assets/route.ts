import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { createUploadedAsset, listAssets } from "@/lib/services/assets";
import type { AssetOrigin, AssetType, AssetVisibility } from "@/types";

const ASSET_TYPES = new Set(["image", "video", "audio", "text", "reference"]);
const ASSET_ORIGINS = new Set(["upload", "generated", "reference", "export"]);

export async function GET(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    const url = new URL(req.url);
    const rawType = url.searchParams.get("type");
    const rawOrigin = url.searchParams.get("origin");
    const { items, total } = await listAssets(user, {
      type: rawType && ASSET_TYPES.has(rawType) ? (rawType as AssetType) : undefined,
      origin: rawOrigin && ASSET_ORIGINS.has(rawOrigin) ? (rawOrigin as AssetOrigin) : undefined,
      q: url.searchParams.get("q") ?? undefined,
      tag: url.searchParams.get("tag") ?? undefined,
      ownerId: url.searchParams.get("ownerId") ?? undefined,
      limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
      offset: url.searchParams.get("offset") ? Number(url.searchParams.get("offset")) : undefined,
    });
    return ok({ items, total });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new ApiError("File wajib diunggah.", 400);
    }
    const visibility = (form.get("visibility") as string) || "private";
    const tagsRaw = form.get("tags");
    const tags =
      typeof tagsRaw === "string" && tagsRaw.trim()
        ? tagsRaw
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 20)
        : [];
    const data = Buffer.from(await file.arrayBuffer());
    const asset = await createUploadedAsset(user, {
      name: ((form.get("name") as string) || file.name || "Aset").slice(0, 160),
      mimeType: file.type || "application/octet-stream",
      data,
      tags,
      visibility: visibility === "workspace" ? "workspace" : ("private" as AssetVisibility),
    });
    return ok({ asset }, 201);
  });
}

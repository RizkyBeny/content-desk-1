import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { deleteAsset, getAssetForUser, getAssetUsage, serializeAsset, updateAsset } from "@/lib/services/assets";
import type { AssetVisibility } from "@/types";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const asset = await getAssetForUser(user, id);
    const usage = await getAssetUsage(id);
    return ok({ asset: serializeAsset(asset), usage });
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      tags?: unknown;
      visibility?: string;
    };
    const tags = Array.isArray(body.tags)
      ? body.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 20)
      : undefined;
    const visibility: AssetVisibility | undefined =
      body.visibility === "workspace" ? "workspace" : body.visibility === "private" ? "private" : undefined;
    const asset = await updateAsset(user, id, {
      name: body.name ? String(body.name).slice(0, 160) : undefined,
      tags,
      visibility,
    });
    return ok({ asset });
  });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const force = new URL(req.url).searchParams.get("force") === "true";
    if (!id) throw new ApiError("ID aset tidak valid.", 400);
    const result = await deleteAsset(user, id, { force });
    return ok({ deleted: true, ...result });
  });
}

import { handle, ok, currentUser } from "@/lib/api";
import { getCreationDetail, syncCanvasDraft } from "@/lib/services/creations";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const creation = await getCreationDetail(user, id);
    return ok({ creation });
  });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const creation = await syncCanvasDraft(user, id, body);
    return ok({ creation });
  });
}

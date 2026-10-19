import { handle, ok, currentUser } from "@/lib/api";
import { regenerateItem } from "@/lib/services/creations";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as { prompt?: string };
    const result = await regenerateItem(user, id, { prompt: body.prompt });
    return ok(result, 202);
  });
}

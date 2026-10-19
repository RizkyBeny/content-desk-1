import { handle, ok, currentUser } from "@/lib/api";
import { regenerateCaptions } from "@/lib/services/briefs";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const brief = await regenerateCaptions(user, id);
    return ok({ brief });
  });
}

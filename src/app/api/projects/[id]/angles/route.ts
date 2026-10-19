import { handle, ok, currentUser } from "@/lib/api";
import { generateAngles } from "@/lib/services/projects";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as { count?: number };
    const angles = await generateAngles(user, id, body?.count ?? 8);
    return ok({ angles });
  });
}

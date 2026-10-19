import { handle, ok, currentUser } from "@/lib/api";
import { generateBrief, getBriefByProject } from "@/lib/services/briefs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const brief = await getBriefByProject(user, id);
    return ok({ brief });
  });
}

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const brief = await generateBrief(user, id);
    return ok({ brief }, 201);
  });
}

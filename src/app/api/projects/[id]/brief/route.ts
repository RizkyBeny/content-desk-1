import { handle, ok, currentUser } from "@/lib/api";
import { generateBrief, getBriefByProject } from "@/lib/services/briefs";
import type { ContentType } from "@/types";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const brief = await getBriefByProject(user, id);
    return ok({ brief });
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    let contentType: ContentType | undefined;
    try {
      const body = await req.json();
      if (body?.contentType) contentType = body.contentType as ContentType;
    } catch {}
    const brief = await generateBrief(user, id, contentType);
    return ok({ brief }, 201);
  });
}

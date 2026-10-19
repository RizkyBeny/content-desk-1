import { z } from "zod";
import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { restoreBriefVersion } from "@/lib/services/briefs";

const schema = z.object({ versionIndex: z.number().int().min(0) });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ApiError("Versi tidak valid.", 400);
    const brief = await restoreBriefVersion(user, id, parsed.data.versionIndex);
    return ok({ brief });
  });
}

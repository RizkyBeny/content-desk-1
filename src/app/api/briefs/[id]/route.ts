import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { briefPatchSchema } from "@/lib/validators/project";
import { updateBrief } from "@/lib/services/briefs";
import type { BriefRow, BriefSummary, Caption } from "@/types";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = briefPatchSchema.safeParse(body);
    if (!parsed.success) throw new ApiError("Perubahan brief tidak valid.", 400);
    const brief = await updateBrief(user, id, {
      summary: parsed.data.summary as BriefSummary | undefined,
      rows: parsed.data.rows as BriefRow[] | undefined,
      captions: parsed.data.captions as Caption[] | undefined,
      status: parsed.data.status,
    });
    return ok({ brief });
  });
}

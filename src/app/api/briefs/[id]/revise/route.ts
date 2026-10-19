import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { reviseSchema } from "@/lib/validators/project";
import { reviseBrief } from "@/lib/services/briefs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = reviseSchema.safeParse(body);
    if (!parsed.success) throw new ApiError("Instruksi revisi wajib diisi.", 400);
    const brief = await reviseBrief(user, id, parsed.data.instruction, parsed.data.rowIndex);
    return ok({ brief });
  });
}

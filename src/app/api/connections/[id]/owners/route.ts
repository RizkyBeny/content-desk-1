import { handle, ok, currentAdmin, ApiError } from "@/lib/api";
import { ownersSchema } from "@/lib/validators/invite";
import { setConnectionOwners } from "@/lib/services/connections";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const admin = await currentAdmin();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = ownersSchema.safeParse(body);
    if (!parsed.success) throw new ApiError("Daftar pemilik tidak valid.", 400);
    await setConnectionOwners(admin, id, parsed.data.userIds);
    return ok({ ok: true });
  });
}

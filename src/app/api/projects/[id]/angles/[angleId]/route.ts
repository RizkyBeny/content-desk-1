import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { anglePatchSchema } from "@/lib/validators/project";
import { updateAngle } from "@/lib/services/projects";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string; angleId: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id, angleId } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = anglePatchSchema.safeParse(body);
    if (!parsed.success) throw new ApiError("Perubahan angle tidak valid.", 400);
    const angles = await updateAngle(user, id, angleId, parsed.data);
    return ok({ angles });
  });
}

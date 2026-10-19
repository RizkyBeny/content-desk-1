import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { selectAngleSchema } from "@/lib/validators/project";
import { selectAngle } from "@/lib/services/projects";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = selectAngleSchema.safeParse(body);
    if (!parsed.success) throw new ApiError("Angle tidak valid.", 400);
    const { recommendedTypes } = await selectAngle(user, id, parsed.data.angleId);
    return ok({ recommendedTypes });
  });
}

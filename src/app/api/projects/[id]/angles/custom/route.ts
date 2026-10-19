import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { customAngleSchema } from "@/lib/validators/project";
import { addCustomAngle } from "@/lib/services/projects";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = customAngleSchema.safeParse(body);
    if (!parsed.success) throw new ApiError("Angle tidak valid.", 400);
    const { title, ...rest } = parsed.data;
    const angle = { ...rest, title: title ?? rest.description.trim().slice(0, 60) };
    const angles = await addCustomAngle(user, id, angle);
    return ok({ angles }, 201);
  });
}

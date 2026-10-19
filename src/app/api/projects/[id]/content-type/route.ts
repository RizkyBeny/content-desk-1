import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { contentTypeSchema } from "@/lib/validators/project";
import { setContentType } from "@/lib/services/projects";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = contentTypeSchema.safeParse(body);
    if (!parsed.success) throw new ApiError("Pilih tepat satu jenis konten.", 400);
    const project = await setContentType(user, id, parsed.data.contentType);
    return ok({ contentType: project.contentType });
  });
}

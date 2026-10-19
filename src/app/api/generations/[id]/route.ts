import { handle, ok, currentUser } from "@/lib/api";
import { getGeneration, softDeleteGeneration } from "@/lib/services/generations";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    return ok({ generation: await getGeneration(user, id) });
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    await softDeleteGeneration(user, id);
    return ok({ deleted: true });
  });
}

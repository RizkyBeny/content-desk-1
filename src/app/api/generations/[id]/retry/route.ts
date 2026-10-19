import { handle, ok, currentUser } from "@/lib/api";
import { retryGeneration } from "@/lib/services/generations";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    return ok(await retryGeneration(user, id), 202);
  });
}

import { handle, ok, currentAdmin } from "@/lib/api";
import { syncConnectionNow } from "@/lib/services/connections";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const admin = await currentAdmin();
    const { id } = await ctx.params;
    const result = await syncConnectionNow(admin, id);
    return ok(result, 202);
  });
}

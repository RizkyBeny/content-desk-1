import { handle, ok, currentAdmin, ApiError } from "@/lib/api";
import type { ConnectionType } from "@/types";

const TYPES: ConnectionType[] = ["instagram", "tiktok", "x", "facebook", "youtube"];

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await currentAdmin();
    const { id: type } = await ctx.params;
    if (!TYPES.includes(type as ConnectionType)) throw new ApiError("Tipe tidak valid.", 400);
    const displayName = new URL(req.url).searchParams.get("displayName") ?? `${type} utama`;
    const state = Math.random().toString(36).slice(2);
    const params = new URLSearchParams({
      state,
      code: `mock-${Date.now()}`,
      displayName,
    });
    return ok({ url: `/api/connections/${type}/oauth/callback?${params.toString()}`, state });
  });
}

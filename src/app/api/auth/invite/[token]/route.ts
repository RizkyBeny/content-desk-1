import { z } from "zod";
import { handle, ok, ApiError } from "@/lib/api";
import { acceptInvite, getInviteInfo } from "@/lib/services/auth";

const schema = z.object({
  name: z.string().min(1),
  password: z.string().min(8),
});

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  return handle(async () => {
    const { token } = await ctx.params;
    const info = await getInviteInfo(token);
    return ok(info);
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  return handle(async () => {
    const { token } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ApiError("Nama dan password (min 8 karakter) wajib diisi.", 400);
    const user = await acceptInvite(token, parsed.data, req.headers.get("user-agent") ?? undefined);
    return ok({ user });
  });
}

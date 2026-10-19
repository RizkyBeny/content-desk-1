import { z } from "zod";
import { handle, ok, ApiError } from "@/lib/api";
import { login } from "@/lib/services/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ApiError("Email dan password wajib diisi.", 400);
    const user = await login(parsed.data.email, parsed.data.password, req.headers.get("user-agent") ?? undefined);
    return ok({ user });
  });
}

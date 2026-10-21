import { z } from "zod";
import { handle, ok, ApiError } from "@/lib/api";
import { login } from "@/lib/services/auth";

const schema = z.object({
  email: z.string().optional(),
  username: z.string().optional(),
  password: z.string().min(1, "Password wajib diisi."),
});

export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    const identifier = (parsed.success ? parsed.data.username || parsed.data.email : "")?.trim();
    if (!parsed.success || !identifier) {
      throw new ApiError("Username dan password wajib diisi.", 400);
    }
    const user = await login(identifier, parsed.data.password, req.headers.get("user-agent") ?? undefined);
    return ok({ user });
  });
}

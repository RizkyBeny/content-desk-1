import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { passwordSchema } from "@/lib/validators/invite";
import { changePassword } from "@/lib/services/users";

export async function POST(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    const body = await req.json().catch(() => null);
    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) throw new ApiError("Password baru minimal 8 karakter.", 400);
    await changePassword(user, parsed.data.current, parsed.data.next);
    return ok({ ok: true });
  });
}

import { handle, ok, currentAdmin, ApiError } from "@/lib/api";
import { emailInviteSchema } from "@/lib/validators/invite";
import { createInvite } from "@/lib/services/auth";

export async function POST(req: Request) {
  return handle(async () => {
    const admin = await currentAdmin();
    const body = await req.json().catch(() => null);
    const parsed = emailInviteSchema.safeParse(body);
    if (!parsed.success) throw new ApiError("Email tidak valid.", 400);
    const result = await createInvite(admin.id, parsed.data.email, parsed.data.role);
    return ok(result, 201);
  });
}

import { handle, ok, currentAdmin, ApiError } from "@/lib/api";
import { internalConnectionSchema } from "@/lib/validators/invite";
import { connectInternal } from "@/lib/services/connections";

export async function POST(req: Request) {
  return handle(async () => {
    const admin = await currentAdmin();
    const body = await req.json().catch(() => null);
    const parsed = internalConnectionSchema.safeParse(body);
    if (!parsed.success) throw new ApiError("Data koneksi internal tidak valid.", 400);
    const connection = await connectInternal(admin, parsed.data);
    return ok({ id: connection.id }, 201);
  });
}

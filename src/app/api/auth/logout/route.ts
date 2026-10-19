import { handle, ok } from "@/lib/api";
import { destroyCurrentSession } from "@/lib/auth/session";

export async function POST() {
  return handle(async () => {
    await destroyCurrentSession();
    return ok({ ok: true });
  });
}

import { handle, ok, currentUser } from "@/lib/api";
import { getAllQuota, getQuota } from "@/lib/services/quota";
import { assertGenerationType } from "@/lib/validators/generation";

export async function GET(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    const type = new URL(req.url).searchParams.get("type");
    if (type) return ok({ quota: await getQuota(user.id, assertGenerationType(type)) });
    return ok({ quotas: await getAllQuota(user.id) });
  });
}

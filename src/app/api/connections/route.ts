import { handle, ok, currentUser } from "@/lib/api";
import { listConnections } from "@/lib/services/connections";

export async function GET() {
  return handle(async () => {
    const user = await currentUser();
    const items = await listConnections(user);
    return ok({ items });
  });
}

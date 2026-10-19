import { handle, ok, currentAdmin } from "@/lib/api";
import { listMembers } from "@/lib/services/connections";

export async function GET() {
  return handle(async () => {
    await currentAdmin();
    const items = await listMembers();
    return ok({ items });
  });
}

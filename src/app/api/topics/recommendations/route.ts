import { handle, ok, currentUser } from "@/lib/api";
import { getTopicRecommendations } from "@/lib/services/topics";
import { parseSources } from "@/lib/validators/filters";

export async function GET(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    const url = new URL(req.url);
    const sources = parseSources(url.searchParams.get("sources") ?? undefined);
    const category = url.searchParams.get("category");
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 10) || 10, 20);
    const force = url.searchParams.get("refresh") === "1";

    const result = await getTopicRecommendations(
      user,
      { sources, category: category && category !== "all" ? category : null, limit },
      force,
    );
    return ok(result);
  });
}

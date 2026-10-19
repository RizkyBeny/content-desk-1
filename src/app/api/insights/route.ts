import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { getInsights } from "@/lib/services/insights";
import { insightFilterSchema, parseDateRange, parseSources } from "@/lib/validators/filters";

export async function GET(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    const url = new URL(req.url);
    const parsed = insightFilterSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) throw new ApiError("Filter tidak valid.", 400);

    const { from, to } = parseDateRange(parsed.data.from, parsed.data.to);
    const result = await getInsights(user, {
      from,
      to,
      sources: parseSources(parsed.data.sources),
      sortBy: parsed.data.sortBy,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });
    return ok({
      kpi: result.kpi,
      items: result.items,
      hasMore: result.hasMore,
      hasAnyConnection: result.hasAnyConnection,
      lastSyncedAt: result.lastSyncedAt,
    });
  });
}

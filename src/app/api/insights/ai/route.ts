import { z } from "zod";
import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { getInsightAI } from "@/lib/services/insights";
import { parseDateRange, parseSources } from "@/lib/validators/filters";

const schema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  sources: z.array(z.string()).default([]),
  refresh: z.boolean().optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body ?? {});
    if (!parsed.success) throw new ApiError("Filter tidak valid.", 400);

    const { from, to } = parseDateRange(parsed.data.from, parsed.data.to);
    const result = await getInsightAI(
      user,
      {
        from,
        to,
        sources: parseSources(parsed.data.sources.join(",")),
      },
      parsed.data.refresh ?? false,
    );
    return ok(result);
  });
}

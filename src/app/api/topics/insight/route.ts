import { z } from "zod";
import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { getTopicInsight } from "@/lib/services/topics";

const schema = z.object({
  topic: z.string().min(3, "Topik minimal 3 karakter.").max(200, "Topik maksimal 200 karakter."),
  source: z.enum(["trending", "custom"]).default("custom"),
});

export async function POST(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Topik tidak valid.", 400);
    }
    const result = await getTopicInsight(user, parsed.data.topic.trim(), parsed.data.source);
    return ok(result);
  });
}

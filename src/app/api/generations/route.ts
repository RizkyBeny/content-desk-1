import { handle, ok, currentUser } from "@/lib/api";
import {
  createGeneration,
  listGenerations,
  type ListGenerationsInput,
} from "@/lib/services/generations";
import {
  createGenerationSchema,
  listGenerationsSchema,
  parseGenerationParams,
} from "@/lib/validators/generation";
import type { GenerationType } from "@/types";

export async function GET(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    const url = new URL(req.url);
    const parsed = listGenerationsSchema.parse({
      type: url.searchParams.get("type") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      scope: url.searchParams.get("scope") ?? undefined,
    });
    const input: ListGenerationsInput = {
      type: parsed.type as GenerationType | undefined,
      limit: parsed.limit,
      cursor: parsed.cursor ?? null,
      scope: parsed.scope,
    };
    return ok(await listGenerations(user, input));
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    const body = createGenerationSchema.parse(await req.json().catch(() => ({})));
    const params = parseGenerationParams(body.type, body.params);
    const result = await createGeneration(user, {
      type: body.type,
      prompt: body.prompt,
      params,
    });
    return ok(result, 202);
  });
}

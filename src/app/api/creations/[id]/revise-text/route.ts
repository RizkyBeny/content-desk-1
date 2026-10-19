import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { reviseCreationText } from "@/lib/services/creations";

const ACTIONS = ["tone", "shorten", "expand"] as const;
type Action = (typeof ACTIONS)[number];

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as { text?: string; action?: string; tone?: string };
    if (!body.text || typeof body.text !== "string") throw new ApiError("Teks wajib diisi.", 400);
    const action: Action = (ACTIONS as readonly string[]).includes(body.action ?? "") ? (body.action as Action) : "tone";
    const text = await reviseCreationText(user, id, { text: body.text, action, tone: body.tone });
    return ok({ text });
  });
}

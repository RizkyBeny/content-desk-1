import { handle, ok, currentUser } from "@/lib/api";
import { createDesign } from "@/lib/services/designs";

/** Create a ready-to-edit design (image/carousel) directly — no brief, no generation. */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    const body = (await req.json().catch(() => ({}))) as {
      type?: unknown;
      editorState?: unknown;
    };
    const result = await createDesign(user, { type: body.type, editorState: body.editorState });
    return ok(result, 201);
  });
}

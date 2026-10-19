import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { patchEditorState } from "@/lib/services/creations";
import type { EditorState } from "@/types";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as {
      editorState?: EditorState;
      expectedUpdatedAt?: string;
    };
    if (!body.editorState || typeof body.editorState !== "object") {
      throw new ApiError("editorState wajib diisi.", 400);
    }
    const result = await patchEditorState(user, id, body.editorState, body.expectedUpdatedAt);
    return ok(result);
  });
}

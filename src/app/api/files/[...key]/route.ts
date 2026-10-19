import { fail } from "@/lib/api";
import { getStorage, verifyKey } from "@/lib/storage";

/** Serve stored bytes for signed URLs (FR-AST-4). Token is HMAC-verified. */
export async function GET(req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  try {
    const { key: parts } = await ctx.params;
    const key = (parts ?? []).map((p) => decodeURIComponent(p)).join("/");
    const token = new URL(req.url).searchParams.get("token");
    if (!key || !verifyKey(key, token)) {
      return fail("Tautan file tidak valid atau sudah kedaluwarsa.", 403);
    }
    const storage = getStorage();
    const data = await storage.get(key);
    if (!data) return fail("File tidak ditemukan.", 404);
    const stat = await storage.stat(key);
    return new Response(new Uint8Array(data), {
      headers: {
        "content-type": stat?.contentType ?? "application/octet-stream",
        "content-length": String(data.length),
        "cache-control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[files] error:", err);
    return fail("Gagal mengambil file.", 500);
  }
}

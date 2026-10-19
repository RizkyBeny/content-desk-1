import { fail } from "@/lib/api";
import { getStorage, verifyKey } from "@/lib/storage";

/** Serve stored bytes for signed URLs (FR-AST-4). Token is HMAC-verified. */
export async function GET(req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  try {
    const { key: parts } = await ctx.params;
    const key = (parts ?? []).map((p) => decodeURIComponent(p)).join("/");
    if (!key) return fail("File tidak ditemukan.", 404);

    // Seed fixtures: URL publik langsung — tidak perlu token. Lapisan ini tidak
    // akan di-hit kalau storage.url() sudah mengembalikan /seed/*, tapi aman.
    if (key.startsWith("seed/")) {
      const storage = getStorage();
      const data = await storage.get(key);
      if (!data) return fail("File tidak ditemukan.", 404);
      const stat = await storage.stat(key);
      return new Response(new Uint8Array(data), {
        headers: {
          "content-type": stat?.contentType ?? "image/jpeg",
          "content-length": String(data.length),
          "cache-control": "public, max-age=86400",
        },
      });
    }

    const token = new URL(req.url).searchParams.get("token");
    if (!verifyKey(key, token)) {
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

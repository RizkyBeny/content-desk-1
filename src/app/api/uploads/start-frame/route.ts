import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { createUploadedAsset } from "@/lib/services/assets";
import { START_FRAME_ACCEPT, START_FRAME_MAX_BYTES } from "../../../../../config/generation";

async function assetResponse(asset: { id: string; fileUrl: string | null }) {
  return { assetId: asset.id, thumbnailUrl: asset.fileUrl ?? null };
}

/**
 * Start-frame video (FR-VID-3/4): unggah berkas (multipart) atau pilih dari
 * galeri Image (JSON `{ generationId }`). Respons `{ assetId, thumbnailUrl }`.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as { generationId?: string };
      if (!body.generationId) throw new ApiError("generationId wajib diisi.", 400);
      const generation = await prisma.generation.findFirst({
        where: { id: body.generationId, type: "image", status: "completed", deletedAt: null },
      });
      if (!generation?.fileUrl) throw new ApiError("Gambar tidak ditemukan.", 404);
      const data = await getStorage().get(generation.fileUrl);
      if (!data) throw new ApiError("Berkas gambar tidak tersedia.", 404);
      const asset = await createUploadedAsset(user, {
        name: `start-frame-${generation.id.slice(0, 8)}.png`,
        mimeType: "image/png",
        data,
        tags: ["start-frame"],
      });
      return ok(await assetResponse(asset), 201);
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new ApiError("File start-frame wajib diunggah.", 400);
    }
    if (!START_FRAME_ACCEPT.includes(file.type)) {
      throw new ApiError("Format start-frame harus JPG, PNG, atau WEBP.", 415);
    }
    if (file.size > START_FRAME_MAX_BYTES) {
      throw new ApiError("Ukuran start-frame maksimal 10 MB.", 413);
    }
    const data = Buffer.from(await file.arrayBuffer());
    const asset = await createUploadedAsset(user, {
      name: (file.name || "start-frame").slice(0, 160),
      mimeType: file.type,
      data,
      tags: ["start-frame"],
    });
    return ok(await assetResponse(asset), 201);
  });
}

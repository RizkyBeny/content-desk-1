import { NextResponse } from "next/server";
import { handle, currentUser, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { getGeneration } from "@/lib/services/generations";
import type { BriefResult } from "@/types";

function stamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function briefMarkdown(result: BriefResult): string {
  const lines: string[] = [`# ${result.summary.title}`, ""];
  lines.push(`**Tujuan:** ${result.summary.goal}`);
  lines.push(`**Audiens:** ${result.summary.audience}`);
  lines.push(`**Nada:** ${result.summary.tone}`);
  lines.push(`**Ukuran:** ${result.summary.size}`);
  lines.push(`**Platform:** ${result.summary.platforms.join(", ")}`, "");
  lines.push("## Baris Brief", "");
  result.rows.forEach((row, i) => {
    lines.push(`### ${i + 1}`);
    for (const [key, value] of Object.entries(row)) {
      if (key.startsWith("__") || !value) continue;
      lines.push(`- **${key}:** ${value}`);
    }
    lines.push("");
  });
  lines.push("## Caption", "");
  result.captions.forEach((caption) => {
    lines.push(`- ${caption.text}`);
    if (caption.hashtags?.length) lines.push(`  ${caption.hashtags.join(" ")}`);
  });
  return lines.join("\n");
}

/** Unduh hasil dengan nama file seragam (FR-MOD-8). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const dto = await getGeneration(user, id);

    if (dto.type === "brief") {
      if (!dto.result) throw new ApiError("Brief belum selesai diproses.", 400);
      const markdown = briefMarkdown(dto.result);
      return new NextResponse(markdown, {
        headers: {
          "content-type": "text/markdown; charset=utf-8",
          "content-disposition": `attachment; filename="brief_${stamp()}_${id.slice(0, 8)}.md"`,
        },
      });
    }

    const row = await prisma.generation.findUnique({ where: { id } });
    if (!row?.fileUrl) throw new ApiError("File hasil tidak tersedia.", 404);
    const data = await getStorage().get(row.fileUrl);
    if (!data) throw new ApiError("File hasil tidak ditemukan.", 404);
    const ext = row.fileUrl.split(".").pop() ?? "bin";
    const kind = dto.type === "image" ? "image" : dto.type === "video" ? "video" : "audio";
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "content-type": dto.type === "image" ? "image/png" : dto.type === "video" ? "video/mp4" : "audio/mpeg",
        "content-disposition": `attachment; filename="${kind}_${stamp()}_${id.slice(0, 8)}.${ext}"`,
      },
    });
  });
}

export const dynamic = "force-dynamic";

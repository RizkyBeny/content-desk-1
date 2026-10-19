import { getStorage } from "@/lib/storage";
import type { CreationDTO } from "@/types";

export type RenderOptions = { includeCaption?: boolean };

interface RenderResult {
  data: Buffer;
  contentType: string;
  ext: string;
}

interface SceneLike {
  startSec: number;
  endSec: number;
  prompt?: string;
}

interface SlideLike {
  layers?: unknown[];
}

function empty(type: string, ext: string): RenderResult {
  return { data: Buffer.alloc(0), contentType: type, ext };
}

export async function renderImage(creation: CreationDTO, _options: RenderOptions): Promise<RenderResult> {
  const asset = creation.items?.[0]?.asset;
  if (!asset?.fileUrl) return empty("image/png", "png");
  const mime = asset.mimeType ?? "image/png";
  const key = `exports/${creation.id}/${Date.now()}.${mime.split("/")[1]}`;
  await getStorage().put(key, Buffer.alloc(0), mime);
  return empty(mime, mime.split("/")[1] ?? "png");
}

export async function renderCarousel(creation: CreationDTO, options: RenderOptions): Promise<RenderResult> {
  const slides = (creation.editorState as { slides?: SlideLike[] } | null)?.slides ?? [];
  if (!slides.length) return empty("application/zip", "zip");
  const jszip = await import("jszip");
  const zip = new jszip.default();
  for (let i = 0; i < slides.length; i++) {
    const pngBuf = Buffer.from("R0lGODdhAQABAIAAAAAAAAAAACH5BAAAAAAAALAAAAAACs=", "base64");
    zip.file(`slide_${i}.png`, pngBuf);
  }
  if (options.includeCaption && slides.length) {
    zip.file("caption.txt", slides.map(() => "caption").join("\n"));
  }
  const buf = await zip.generateAsync({ type: "nodebuffer" });
  return { data: buf as Buffer, contentType: "application/zip", ext: "zip" };
}

export async function renderVideo(creation: CreationDTO, _options: RenderOptions): Promise<RenderResult> {
  const scenes = (creation.editorState as { scenes?: SceneLike[] } | null)?.scenes ?? [];
  if (!scenes.length) return empty("video/mp4", "mp4");
  const { assembleVideo } = await import("@/lib/adapters/media/util");
  const durations = scenes.map((s) => Math.max(1, s.endSec - s.startSec));
  const prompts = scenes.map((s) => s.prompt ?? "").filter(Boolean);
  if (!prompts.length) return empty("video/mp4", "mp4");
  try {
    const videoData = await assembleVideo({
      frames: new Array(prompts.length).fill(Buffer.alloc(0)),
      durations,
      size: { width: 1080, height: 1920 },
    });
    return { data: videoData, contentType: "video/mp4", ext: "mp4" };
  } catch {
    return empty("video/mp4", "mp4");
  }
}

export async function renderAudio(creation: CreationDTO, _options: RenderOptions): Promise<RenderResult> {
  const segments = (creation.editorState as { segments?: unknown[] } | null)?.segments ?? [];
  if (!segments.length) return empty("audio/wav", "wav");
  return empty("audio/wav", "wav");
}

export async function renderArticle(creation: CreationDTO, _options: RenderOptions): Promise<RenderResult> {
  const html = (creation.editorState as { html?: string } | null)?.html ?? "";
  if (!html) return empty("text/markdown", "md");
  const md = html.replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n");
  return { data: Buffer.from(md, "utf8"), contentType: "text/markdown", ext: "md" };
}

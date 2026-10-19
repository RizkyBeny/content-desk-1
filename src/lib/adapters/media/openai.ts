import { getEnv } from "@/lib/env";
import { imageDims } from "./util";
import type { MediaProvider } from "./types";

/** gpt-image-1 only accepts 1024x1024, 1536x1024 or 1024x1536 — pick nearest. */
function openAiImageSize(width: number, height: number): string {
  const ratio = width / height;
  if (ratio > 1.15) return "1536x1024";
  if (ratio < 0.87) return "1024x1536";
  return "1024x1024";
}

/**
 * OpenAI-backed image generation. Video is not supported by OpenAI's public API
 * in v1 (see PRD assumptions) — use a dedicated video adapter instead.
 */
export const openAiMediaProvider: MediaProvider = {
  name: "openai",

  async generateImage(input) {
    const env = getEnv();
    if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY belum diisi.");
    const target = input.width && input.height ? { width: input.width, height: input.height } : imageDims(input.ratio);
    if (input.baseImage) {
      const form = new FormData();
      form.append("model", "gpt-image-1");
      form.append("prompt", input.prompt);
      form.append("image", new Blob([input.baseImage as unknown as ArrayBuffer], { type: "image/png" }), "base.png");
      form.append("size", openAiImageSize(target.width, target.height));
      if (input.quality) form.append("quality", input.quality);
      form.append("n", "1");
      const res = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: form,
      });
      if (!res.ok) throw new Error(`OpenAI image edit error: ${res.status}`);
      const json = (await res.json()) as { data?: { b64_json?: string }[] };
      const b64 = json.data?.[0]?.b64_json;
      if (!b64) throw new Error("Respons OpenAI tidak memuat gambar.");
      return {
        data: Buffer.from(b64, "base64"),
        contentType: "image/png",
        ext: "png",
        width: target.width,
        height: target.height,
      };
    }
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: input.prompt,
        size: openAiImageSize(target.width, target.height),
        ...(input.quality ? { quality: input.quality } : {}),
        n: 1,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI image error: ${res.status}`);
    const json = (await res.json()) as { data?: { b64_json?: string }[] };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("Respons OpenAI tidak memuat gambar.");
    return {
      data: Buffer.from(b64, "base64"),
      contentType: "image/png",
      ext: "png",
      width: target.width,
      height: target.height,
    };
  },

  async generateVideo(input) {
    if (input.baseVideo) {
      throw new Error("Provider video OpenAI belum mendukung video-to-video dengan base video.");
    }
    throw new Error("Provider video OpenAI belum didukung di v1.");
  },

  async synthesizeSpeech() {
    throw new Error("Gunakan AUDIO_PROVIDER=elevenlabs untuk menghasilkan suara.");
  },
};

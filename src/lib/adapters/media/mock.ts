import sharp from "sharp";
import {
  assembleVideo,
  buildSvg,
  hashString,
  imageDims,
  loadAbstractPhoto,
  renderToneWav,
  videoOutputSize,
  runFfmpeg,
  palette,
} from "./util";
import type { MediaProvider } from "./types";

function mediaSource(): "unsplash" | "gradient" {
  return process.env.MOCK_MEDIA_SOURCE === "gradient" ? "gradient" : "unsplash";
}

async function rasterize(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function cover(buffer: Buffer, width: number, height: number): Promise<Buffer> {
  return sharp(buffer).resize(width, height, { fit: "cover", position: "centre" }).png().toBuffer();
}

async function abstractFrame(seed: number, width: number, height: number): Promise<Buffer | null> {
  if (mediaSource() !== "unsplash") return null;
  const photo = await loadAbstractPhoto(seed);
  if (!photo) return null;
  return cover(photo, width, height);
}

/**
 * Deterministic mock provider. Produces real, valid media files (PNG/MP4/WAV)
 * from the prompt so the whole GEN → ED → EXP flow works without any API key.
 * Images and video frames use bundled Unsplash "abstract background" photos
 * (with a gradient-poster fallback when the bundle is unavailable).
 */
export const mockMediaProvider: MediaProvider = {
  name: "mock",

  async generateImage(input) {
    const size =
      input.width && input.height ? { width: input.width, height: input.height } : imageDims(input.ratio);
    let data: Buffer;
    if (input.baseImage) {
      // Mock "edit/reference": transform base image with palette derived from prompt
      const seed = hashString(input.prompt) + (input.variant ?? 0) * 977;
      const pal = palette(seed);
      const isEdit = input.referenceMode !== "reference";
      data = await sharp(input.baseImage)
        .resize(size.width, size.height, { fit: "cover", position: "centre" })
        .modulate({
          saturation: isEdit ? 1.25 : 1.1,
          brightness: isEdit ? 1.05 : 1.02,
        })
        .linear(pal.from === pal.to ? 1.0 : isEdit ? 1.15 : 1.05, 0)
        .composite([
          {
            input: Buffer.from(
              `<svg width="${size.width}" height="${size.height}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="g" cx="50%" cy="40%"><stop stop-color="${pal.accent}" stop-opacity="${isEdit ? 0.18 : 0.12}"/><stop stop-color="transparent" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
            ),
            blend: "soft-light",
          },
        ])
        .png()
        .toBuffer();
      return { data, contentType: "image/png", ext: "png", width: size.width, height: size.height };
    }
    const seed = hashString(input.prompt) + (input.variant ?? 0) * 977;
    const photo = await abstractFrame(seed, size.width, size.height);
    data =
      photo ??
      (await rasterize(
        buildSvg({ prompt: input.prompt, size, variant: input.variant, label: "AI GENERATED" }),
      ));
    return { data, contentType: "image/png", ext: "png", width: size.width, height: size.height };
  },

  async generateVideo(input) {
    const size =
      input.width && input.height
        ? { width: input.width, height: input.height }
        : videoOutputSize(input.ratio, input.resolution);
    if (input.baseVideo) {
      // Mock: edit video by applying prompt palette effect (color hue shift) + re-encode to MP4
      const dir = await (await import("node:fs/promises")).mkdtemp(
        (await import("node:path")).join((await import("node:os")).tmpdir(), "gen-video-edit-"),
      );
      try {
        const inFile = (await import("node:path")).join(dir, "base.mp4");
        const outFile = (await import("node:path")).join(dir, "out.mp4");
        await (await import("node:fs/promises")).writeFile(inFile, input.baseVideo);
        const seed = hashString(input.prompt) + (input.variant ?? 0) * 977;
        const hue = seed % 360;
        await runFfmpeg([
          "-y",
          "-i",
          inFile,
          "-vf",
          `hue=h=${hue}:s=1.1:b=1.05,eq=brightness=0.01,scale=${size.width}:${size.height}:force_original_aspect_ratio=increase,crop=${size.width}:${size.height}`,
          "-c:a",
          "copy",
          "-pix_fmt",
          "yuv420p",
          "-movflags",
          "+faststart",
          outFile,
        ]);
        const data = await (await import("node:fs/promises")).readFile(outFile);
        return { data, contentType: "video/mp4", ext: "mp4", width: size.width, height: size.height };
      } finally {
        await (await import("node:fs/promises")).rm(dir, { recursive: true, force: true }).catch(() => undefined);
      }
    }
    const scenes = input.scenes?.length
      ? input.scenes
      : [
          { prompt: input.prompt, durationSec: 4 },
          { prompt: input.prompt, durationSec: 4 },
        ];
    const frames: Buffer[] = [];
    const durations: number[] = [];
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      durations.push(scene.durationSec && scene.durationSec > 0 ? scene.durationSec : 4);
      if (scene.frame) {
        frames.push(await cover(scene.frame, size.width, size.height));
        continue;
      }
      const seed = hashString(scene.prompt || input.prompt) + ((input.variant ?? 0) + i) * 977;
      const photo = await abstractFrame(seed, size.width, size.height);
      if (photo) {
        frames.push(photo);
        continue;
      }
      const svg = buildSvg({
        prompt: scene.prompt || input.prompt,
        size,
        variant: (input.variant ?? 0) + i,
        label: `SCENE ${i + 1}`,
      });
      frames.push(await rasterize(svg));
    }
    const data = await assembleVideo({ frames, durations, size });
    const durationSec = durations.reduce((a, b) => a + b, 0);
    return {
      data,
      contentType: "video/mp4",
      ext: "mp4",
      width: size.width,
      height: size.height,
      durationSec,
    };
  },

  async synthesizeSpeech(input) {
    const { data, durationSec } = renderToneWav({
      text: input.text,
      voice: input.voice,
      speed: input.speed,
      variant: input.variant,
    });
    return { data, contentType: "audio/wav", ext: "wav", durationSec };
  },
};

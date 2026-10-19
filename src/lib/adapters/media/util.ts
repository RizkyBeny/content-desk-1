import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import ffmpegStatic from "ffmpeg-static";
import { getEnv } from "@/lib/env";

export interface Size {
  width: number;
  height: number;
}

const IMAGE_DIMS: Record<string, Size> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
  "3:2": { width: 1536, height: 1024 },
  "2:3": { width: 1024, height: 1536 },
};

const VIDEO_DIMS: Record<string, Size> = {
  "1:1": { width: 720, height: 720 },
  "4:5": { width: 720, height: 900 },
  "9:16": { width: 720, height: 1280 },
  "16:9": { width: 1280, height: 720 },
};

export function imageDims(ratio?: string): Size {
  return IMAGE_DIMS[ratio ?? "1:1"] ?? IMAGE_DIMS["1:1"];
}

/** Folder holding the bundled Unsplash "abstract background" mock material. */
export function abstractPhotoDir(): string {
  return path.join(process.cwd(), "public", "seed", "unsplash");
}

let photoListCache: string[] | null = null;

/** Absolute paths of the bundled photos (sorted); empty when none/missing. */
export async function listAbstractPhotos(): Promise<string[]> {
  if (photoListCache) return photoListCache;
  try {
    const entries = await fs.readdir(abstractPhotoDir());
    photoListCache = entries
      .filter((name) => /\.(jpe?g|png|webp)$/i.test(name))
      .sort()
      .map((name) => path.join(abstractPhotoDir(), name));
  } catch {
    photoListCache = [];
  }
  return photoListCache;
}

const photoBufferCache = new Map<string, Buffer>();

/** Load one bundled photo (deterministic by index) or null when unavailable. */
export async function loadAbstractPhoto(index: number): Promise<Buffer | null> {
  const photos = await listAbstractPhotos();
  if (!photos.length) return null;
  const file = photos[((Math.floor(index) % photos.length) + photos.length) % photos.length];
  const cached = photoBufferCache.get(file);
  if (cached) return cached;
  try {
    const buf = await fs.readFile(file);
    photoBufferCache.set(file, buf);
    return buf;
  } catch {
    return null;
  }
}

export function videoDims(ratio?: string): Size {
  return VIDEO_DIMS[ratio ?? "9:16"] ?? VIDEO_DIMS["9:16"];
}

/** Long side → 1080 px when resolution is 1080p; 720p keeps native dims. */
export function videoOutputSize(ratio?: string, resolution?: string): Size {
  const base = videoDims(ratio);
  if (resolution !== "1080p") return base;
  const scale = 1080 / Math.max(base.width, base.height);
  return { width: Math.round(base.width * scale), height: Math.round(base.height * scale) };
}

/** Deterministic 32-bit hash — seeds palettes/layouts from prompts. */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export interface Palette {
  from: string;
  to: string;
  accent: string;
  text: string;
}

export function palette(seed: number): Palette {
  const hue = seed % 360;
  const hue2 = (hue + 40) % 360;
  return {
    from: `hsl(${hue}, 62%, 32%)`,
    to: `hsl(${hue2}, 58%, 18%)`,
    accent: `hsl(${(hue + 180) % 360}, 70%, 62%)`,
    text: "#ffffff",
  };
}

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function wrapText(text: string, maxChars: number, maxLines = 6): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
    if (lines.length >= maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current.trim());
  return lines;
}

/** Build an SVG poster (prompt text baked into a gradient composition). */
export function buildSvg(opts: {
  prompt: string;
  size: Size;
  variant?: number;
  label?: string;
}): string {
  const { width, height } = opts.size;
  const seed = hashString(opts.prompt) + (opts.variant ?? 0) * 977;
  const pal = palette(seed);
  const lines = wrapText(opts.prompt, 22, 6);
  const fontSize = Math.round(width / 15);
  const lineHeight = fontSize * 1.25;
  const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
  const circleX = (seed % width) | 0;
  const circleY = ((seed >> 3) % height) | 0;
  const circleR = Math.round(width / 3);

  const textEls = lines
    .map(
      (line, i) =>
        `<text x="${Math.round(width / 2)}" y="${Math.round(startY + i * lineHeight)}" ` +
        `font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="700" ` +
        `fill="${pal.text}" text-anchor="middle">${escapeXml(line)}</text>`,
    )
    .join("");

  const label = opts.label
    ? `<text x="${Math.round(width / 2)}" y="${height - Math.round(fontSize * 0.8)}" ` +
      `font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(fontSize * 0.45)}" ` +
      `fill="${pal.accent}" text-anchor="middle" letter-spacing="2">${escapeXml(opts.label)}</text>`
    : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="${pal.from}"/><stop offset="100%" stop-color="${pal.to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="${width}" height="${height}" fill="url(#bg)"/>` +
    `<circle cx="${circleX}" cy="${circleY}" r="${circleR}" fill="${pal.accent}" opacity="0.18"/>` +
    textEls +
    label +
    `</svg>`
  );
}

/** Write a 16-bit mono PCM WAV buffer from float samples (-1..1). */
export function encodeWav(samples: Float32Array, sampleRate: number): Buffer {
  const dataLength = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buffer;
}

/** Synthetic speech placeholder: tonal waveform sized to the script length. */
export function renderToneWav(opts: {
  text: string;
  voice?: string;
  speed?: number;
  variant?: number;
}): { data: Buffer; durationSec: number } {
  const sampleRate = 22050;
  const words = Math.max(1, opts.text.trim().split(/\s+/).filter(Boolean).length);
  const wordsPerSec = 2.6 * Math.max(0.5, opts.speed ?? 1);
  const durationSec = Math.min(90, Math.max(1.5, words / wordsPerSec));
  const total = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(total);
  const seed = hashString(`${opts.text}|${opts.voice ?? ""}|${opts.variant ?? 0}`);
  const base = 130 + (seed % 90);
  for (let i = 0; i < total; i++) {
    const t = i / sampleRate;
    const syllable = Math.sin(2 * Math.PI * 2.2 * t);
    const env = Math.max(0, Math.sin(Math.PI * ((t * 2.2) % 1)));
    const carrier = Math.sin(2 * Math.PI * base * t) + 0.4 * Math.sin(2 * Math.PI * base * 2 * t);
    samples[i] = 0.22 * env * (1 + 0.3 * syllable) * carrier;
  }
  return { data: encodeWav(samples, sampleRate), durationSec };
}

export function ffmpegPath(): string | null {
  return getEnv().FFMPEG_PATH || ffmpegStatic || null;
}

export function runFfmpeg(args: string[]): Promise<void> {
  const bin = ffmpegPath();
  if (!bin) return Promise.reject(new Error("FFmpeg tidak tersedia."));
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg gagal (${code}): ${stderr.slice(-400)}`));
    });
  });
}

/**
 * Assemble a slideshow MP4 from scene frames using the bundled FFmpeg.
 * Frames are normalized to the target size with cover-crop.
 */
export async function assembleVideo(opts: {
  frames: Buffer[];
  durations: number[];
  size: Size;
  fps?: number;
}): Promise<Buffer> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "gen-video-"));
  try {
    const frames = opts.frames.length ? opts.frames : [];
    if (!frames.length) throw new Error("Tidak ada frame untuk video.");
    const listLines: string[] = [];
    for (let i = 0; i < frames.length; i++) {
      const file = path.join(dir, `frame_${String(i).padStart(3, "0")}.png`);
      await fs.writeFile(file, frames[i]);
      const dur = Math.max(0.5, opts.durations[i] ?? 3);
      listLines.push(`file '${file.replace(/'/g, "'\\''")}'`);
      listLines.push(`duration ${dur}`);
    }
    // concat demuxer needs the last entry repeated without duration
    listLines.push(`file '${path.join(dir, `frame_${String(frames.length - 1).padStart(3, "0")}.png`)}'`);
    const listFile = path.join(dir, "list.txt");
    await fs.writeFile(listFile, listLines.join("\n"), "utf8");

    const out = path.join(dir, "out.mp4");
    const { width, height } = opts.size;
    await runFfmpeg([
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", listFile,
      "-vf", `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`,
      "-r", String(opts.fps ?? 30),
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      out,
    ]);
    return await fs.readFile(out);
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export function randomHex(bytes = 6): string {
  return crypto.randomBytes(bytes).toString("hex");
}

import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";
import { ffmpegPath, runFfmpeg } from "@/lib/adapters/media/util";

export const THUMB_MAX = 640;
export const WAVEFORM_POINTS = 64;

export interface ProcessedImage {
  data: Buffer;
  contentType: string;
  ext: string;
  width: number;
  height: number;
  thumb: Buffer;
}

async function withTmpDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = path.join(os.tmpdir(), `gen-${crypto.randomUUID()}`);
  await fs.mkdir(dir, { recursive: true });
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

function ffmpegStderr(args: string[]): Promise<string> {
  const bin = ffmpegPath();
  if (!bin) return Promise.reject(new Error("FFmpeg tidak tersedia."));
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", () => resolve(stderr));
  });
}

/** Center-crop + resize to the requested ratio; build a WebP thumbnail (FR-IMG-6). */
export async function processImage(data: Buffer, width: number, height: number): Promise<ProcessedImage> {
  const normalized = await sharp(data)
    .resize(width, height, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  const thumb = await sharp(normalized)
    .resize({ width: THUMB_MAX, height: THUMB_MAX, fit: "inside" })
    .webp({ quality: 80 })
    .toBuffer();
  return { data: normalized, contentType: "image/png", ext: "png", width, height, thumb };
}

/** Grab a JPEG poster frame from a video, trying `atSec` then falling back to 0. */
export async function extractPoster(video: Buffer, atSec = 1): Promise<Buffer> {
  return withTmpDir(async (dir) => {
    const input = path.join(dir, "in.mp4");
    const output = path.join(dir, "poster.jpg");
    await fs.writeFile(input, video);
    for (const seek of [atSec, 0]) {
      try {
        await runFfmpeg([
          "-y",
          "-ss",
          String(seek),
          "-i",
          input,
          "-frames:v",
          "1",
          "-vf",
          `scale=${THUMB_MAX}:-2`,
          output,
        ]);
        const buf = await fs.readFile(output);
        if (buf.length > 0) return buf;
      } catch {
        continue;
      }
    }
    throw new Error("Gagal membuat poster video.");
  });
}

function parseWavPcm(data: Buffer): Float32Array | null {
  if (data.length < 44 || data.toString("ascii", 0, 4) !== "RIFF") return null;
  let offset = 12;
  let channels = 1;
  let bits = 16;
  while (offset + 8 <= data.length) {
    const id = data.toString("ascii", offset, offset + 4);
    const size = data.readUInt32LE(offset + 4);
    if (id === "fmt ") {
      channels = data.readUInt16LE(offset + 10);
      bits = data.readUInt16LE(offset + 22);
    } else if (id === "data") {
      const bytesPerSample = bits / 8;
      const frames = Math.floor(Math.min(size, data.length - offset - 8) / (bytesPerSample * channels));
      const samples = new Float32Array(frames);
      for (let i = 0; i < frames; i++) {
        const pos = offset + 8 + i * bytesPerSample * channels;
        if (bits === 16) samples[i] = data.readInt16LE(pos) / 32768;
        else if (bits === 8) samples[i] = (data.readUInt8(pos) - 128) / 128;
        else if (bits === 32) samples[i] = data.readInt32LE(pos) / 2147483648;
      }
      return samples;
    }
    offset += 8 + size + (size % 2);
  }
  return null;
}

async function decodePcm(data: Buffer, ext: string): Promise<Float32Array | null> {
  return withTmpDir(async (dir) => {
    const input = path.join(dir, `in.${ext}`);
    const output = path.join(dir, "out.pcm");
    await fs.writeFile(input, data);
    try {
      await runFfmpeg(["-y", "-i", input, "-f", "s16le", "-ac", "1", "-ar", "8000", output]);
    } catch {
      return null;
    }
    const raw = await fs.readFile(output);
    const frames = Math.floor(raw.length / 2);
    const samples = new Float32Array(frames);
    for (let i = 0; i < frames; i++) samples[i] = raw.readInt16LE(i * 2) / 32768;
    return samples;
  });
}

function downsample(samples: Float32Array, points: number): number[] {
  if (samples.length === 0) return new Array(points).fill(0);
  const bucket = samples.length / points;
  const out: number[] = [];
  let peak = 0;
  for (let i = 0; i < points; i++) {
    const start = Math.floor(i * bucket);
    const end = Math.max(start + 1, Math.floor((i + 1) * bucket));
    let max = 0;
    for (let j = start; j < end && j < samples.length; j++) {
      const value = Math.abs(samples[j]);
      if (value > max) max = value;
    }
    peak = Math.max(peak, max);
    out.push(max);
  }
  return peak > 0 ? out.map((v) => Number((v / peak).toFixed(4))) : out;
}

/** 64 normalized amplitude points for tile + popup waveforms (FR-AUD-5). */
export async function computeWaveform(data: Buffer, contentType: string): Promise<number[]> {
  const pcm = contentType.includes("wav") ? parseWavPcm(data) : await decodePcm(data, "mp3");
  return pcm ? downsample(pcm, WAVEFORM_POINTS) : new Array(WAVEFORM_POINTS).fill(0);
}

/** Read duration by parsing ffmpeg's stderr probe output. */
export async function probeDuration(data: Buffer, ext: string): Promise<number | null> {
  return withTmpDir(async (dir) => {
    const input = path.join(dir, `in.${ext}`);
    await fs.writeFile(input, data);
    const stderr = await ffmpegStderr(["-i", input]).catch(() => "");
    const match = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);
    if (!match) return null;
    return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  });
}

const AUDIO_CODECS: Record<string, string[]> = {
  mp3: ["-codec:a", "libmp3lame", "-b:a", "128k", "-f", "mp3"],
  wav: ["-codec:a", "pcm_s16le", "-ar", "44100", "-f", "wav"],
};

/** Concatenate chunks (FR-AUD-4) and transcode into the requested format. */
export async function concatAudio(
  chunks: { data: Buffer; ext: string }[],
  target: "mp3" | "wav",
): Promise<{ data: Buffer; contentType: string; ext: string }> {
  if (chunks.length === 1) {
    return transcodeAudio(chunks[0].data, chunks[0].ext, target);
  }
  return withTmpDir(async (dir) => {
    const inputs: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const file = path.join(dir, `chunk-${i}.${chunks[i].ext}`);
      await fs.writeFile(file, chunks[i].data);
      inputs.push(file);
    }
    const output = path.join(dir, `out.${target}`);
    const filter = `${inputs.map((_, i) => `[${i}:a]`).join("")}concat=n=${inputs.length}:v=0:a=1[out]`;
    const args = ["-y"];
    for (const file of inputs) args.push("-i", file);
    args.push("-filter_complex", filter, "-map", "[out]", ...AUDIO_CODECS[target], output);
    await runFfmpeg(args);
    const data = await fs.readFile(output);
    return { data, contentType: target === "mp3" ? "audio/mpeg" : "audio/wav", ext: target };
  });
}

export async function transcodeAudio(
  data: Buffer,
  from: string,
  target: "mp3" | "wav",
): Promise<{ data: Buffer; contentType: string; ext: string }> {
  if (from === target) {
    return { data, contentType: target === "mp3" ? "audio/mpeg" : "audio/wav", ext: target };
  }
  return withTmpDir(async (dir) => {
    const input = path.join(dir, `in.${from}`);
    const output = path.join(dir, `out.${target}`);
    await fs.writeFile(input, data);
    await runFfmpeg(["-y", "-i", input, ...AUDIO_CODECS[target], output]);
    const out = await fs.readFile(output);
    return { data: out, contentType: target === "mp3" ? "audio/mpeg" : "audio/wav", ext: target };
  });
}

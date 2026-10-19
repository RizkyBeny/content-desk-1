/**
 * Media generation adapter contract (FR-GEN-4). Providers return raw bytes;
 * persistence to storage + Asset rows is the caller's responsibility.
 */
export interface GeneratedBinary {
  data: Buffer;
  contentType: string;
  ext: string;
  width?: number;
  height?: number;
  durationSec?: number;
}

export interface ImageGenInput {
  prompt: string;
  ratio?: string;
  /** Provider quality hint: "low" | "medium" | "high". */
  quality?: string;
  /** Target native size; provider may approximate then caller crops (FR-IMG-5). */
  width?: number;
  height?: number;
  /** Deterministic variation seed for regenerate (FR-GEN-7). */
  variant?: number;
  /** Base image bytes (reference/edit mode) */
  baseImage?: Buffer;
  /** "edit" = transform with prompt, "reference" = preserve resemblance */
  referenceMode?: "edit" | "reference";
}

export interface VideoSceneInput {
  /** Resolved image bytes for the scene (from a chosen media source). */
  frame?: Buffer;
  prompt?: string;
  durationSec?: number;
}

export interface VideoGenInput {
  prompt: string;
  ratio?: string;
  /** Output resolution ("720p" | "1080p"). */
  resolution?: string;
  width?: number;
  height?: number;
  scenes?: VideoSceneInput[];
  variant?: number;
  /** Base video bytes (edit video with prompt) */
  baseVideo?: Buffer;
}

export interface SpeechGenInput {
  text: string;
  voice?: string;
  speed?: number;
  /** Provider style/stability preset, e.g. "natural" | "expressive" | "stable". */
  tone?: string;
  /** Bahasa naskah: "id" | "en". */
  lang?: string;
  variant?: number;
}

export type MediaKind = "image" | "video" | "audio";

export interface MediaProvider {
  readonly name: string;
  generateImage(input: ImageGenInput): Promise<GeneratedBinary>;
  generateVideo(input: VideoGenInput): Promise<GeneratedBinary>;
  synthesizeSpeech(input: SpeechGenInput): Promise<GeneratedBinary>;
}

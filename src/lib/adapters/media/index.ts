import { getEnv } from "@/lib/env";
import { mockMediaProvider } from "./mock";
import { openAiMediaProvider } from "./openai";
import { elevenLabsMediaProvider } from "./elevenlabs";
import type { MediaKind, MediaProvider } from "./types";

/**
 * Resolve the active media provider per kind (FR-GEN-4). Selection is driven
 * purely by environment configuration — no code change needed to switch.
 */
export function getMediaProvider(kind: MediaKind): MediaProvider {
  const env = getEnv();
  if (kind === "audio") {
    return env.AUDIO_PROVIDER === "elevenlabs" ? elevenLabsMediaProvider : mockMediaProvider;
  }
  const selected = kind === "image" ? env.IMAGE_PROVIDER : env.VIDEO_PROVIDER;
  return selected === "openai" ? openAiMediaProvider : mockMediaProvider;
}

export type {
  MediaProvider,
  MediaKind,
  GeneratedBinary,
  ImageGenInput,
  VideoGenInput,
  VideoSceneInput,
  SpeechGenInput,
} from "./types";

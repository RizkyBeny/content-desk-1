import { getEnv } from "@/lib/env";
import type { MediaProvider } from "./types";

const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM";

const STYLE_PRESETS: Record<string, { stability: number; style: number }> = {
  natural: { stability: 0.5, style: 0 },
  expressive: { stability: 0.35, style: 0.6 },
  stable: { stability: 0.75, style: 0 },
};

/** ElevenLabs text-to-speech provider (audio only). */
export const elevenLabsMediaProvider: MediaProvider = {
  name: "elevenlabs",

  async generateImage() {
    throw new Error("Gunakan IMAGE_PROVIDER untuk menghasilkan gambar.");
  },

  async generateVideo() {
    throw new Error("Gunakan VIDEO_PROVIDER untuk menghasilkan video.");
  },

  async synthesizeSpeech(input) {
    const env = getEnv();
    if (!env.ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY belum diisi.");
    const voiceId = input.voice || DEFAULT_VOICE;
    const preset = STYLE_PRESETS[input.tone ?? "natural"] ?? STYLE_PRESETS.natural;
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": env.ELEVENLABS_API_KEY,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: input.text,
        model_id: "eleven_multilingual_v2",
        ...(input.lang ? { language_code: input.lang === "en" ? "en" : "id" } : {}),
        voice_settings: {
          stability: preset.stability,
          similarity_boost: 0.75,
          style: preset.style,
          ...(input.speed ? { speed: input.speed } : {}),
        },
      }),
    });
    if (!res.ok) throw new Error(`ElevenLabs error: ${res.status}`);
    const data = Buffer.from(await res.arrayBuffer());
    return { data, contentType: "audio/mpeg", ext: "mp3" };
  },
};

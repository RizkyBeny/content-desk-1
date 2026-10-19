import { handle, ok } from "@/lib/api";
import { getEnv } from "@/lib/env";
import type { VoiceDTO } from "@/types";

const MOCK_VOICES: VoiceDTO[] = [
  { id: "mock-id-ramah", name: "Rama", label: "Rama — Bahasa Indonesia, ramah", previewUrl: null },
  { id: "mock-id-formal", name: "Sari", label: "Sari — Bahasa Indonesia, formal", previewUrl: null },
  { id: "mock-id-energik", name: "Bima", label: "Bima — Bahasa Indonesia, energik", previewUrl: null },
  { id: "mock-id-tenang", name: "Nadia", label: "Nadia — Bahasa Indonesia, tenang", previewUrl: null },
  { id: "mock-en-news", name: "Alex", label: "Alex — English, news anchor", previewUrl: null },
];

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  labels?: Record<string, string>;
  preview_url?: string;
}

/** Daftar suara yang tersedia untuk Create Audio (FR-AUD-2). */
export async function GET() {
  return handle(async () => {
    const env = getEnv();
    if (env.AUDIO_PROVIDER !== "elevenlabs" || !env.ELEVENLABS_API_KEY) {
      return ok({ voices: MOCK_VOICES, provider: "mock" });
    }
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": env.ELEVENLABS_API_KEY },
    });
    if (!res.ok) return ok({ voices: MOCK_VOICES, provider: "mock" });
    const json = (await res.json()) as { voices?: ElevenLabsVoice[] };
    const voices: VoiceDTO[] = (json.voices ?? []).slice(0, 30).map((voice) => {
      const accent = voice.labels?.accent ?? voice.labels?.language ?? "";
      return {
        id: voice.voice_id,
        name: voice.name,
        label: accent ? `${voice.name} — ${accent}` : voice.name,
        previewUrl: voice.preview_url ?? null,
      };
    });
    return ok({ voices: voices.length ? voices : MOCK_VOICES, provider: "elevenlabs" });
  });
}

"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/client";
import type { VoiceDTO } from "@/types";
import { CheckIcon, LoaderIcon, PauseIcon, PlayIcon } from "@/components/ui/icons";

function voiceLanguage(voice: VoiceDTO): "id" | "en" | "other" {
  const id = voice.id.toLowerCase();
  if (id.includes("-en-") || id.endsWith("-en")) return "en";
  if (/-id-/.test(id) || id.endsWith("-id")) return "id";
  const label = voice.label.toLowerCase();
  if (label.includes("english") || label.includes("inggris")) return "en";
  if (label.includes("indonesia")) return "id";
  return "other";
}

/** Daftar suara dengan pratinjau 5 detik, satu pemutar aktif (FR-AUD-2). */
export function VoicePicker({
  value,
  language,
  onChange,
}: {
  value: string;
  language?: "id" | "en";
  onChange: (voice: VoiceDTO) => void;
}) {
  const [voices, setVoices] = useState<VoiceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let disposed = false;
    void (async () => {
      try {
        const data = await apiFetch<{ voices: VoiceDTO[] }>("/api/audio/voices");
        if (!disposed) setVoices(data.voices);
      } catch (err) {
        if (!disposed) setError((err as Error).message ?? "Gagal memuat daftar suara.");
      } finally {
        if (!disposed) setLoading(false);
      }
    })();
    return () => {
      disposed = true;
      audioRef.current?.pause();
    };
  }, []);

  function togglePreview(voice: VoiceDTO) {
    if (!voice.previewUrl) return;
    if (playingId === voice.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("ended", () => setPlayingId(null));
    }
    const audio = audioRef.current;
    audio.src = voice.previewUrl;
    audio.currentTime = 0;
    void audio.play().catch(() => setPlayingId(null));
    setPlayingId(voice.id);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-xs text-zinc-500 dark:text-zinc-400">
        <LoaderIcon className="animate-spin" width={14} height={14} /> Memuat suara…
      </div>
    );
  }

  if (error) {
    return <p className="py-4 text-center text-xs text-red-500">{error}</p>;
  }

  const filtered = language
    ? voices.filter((voice) => {
        const lang = voiceLanguage(voice);
        return lang === "other" || lang === language;
      })
    : voices;

  return (
    <div className="space-y-1">
      {filtered.map((voice) => {
        const active = voice.id === value;
        return (
          <div
            key={voice.id}
            className={cn(
              "flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition-colors",
              active ? "bg-brand/10" : "hover:bg-zinc-900/5 dark:hover:bg-white/10",
            )}
          >
            <button
              type="button"
              onClick={() => onChange(voice)}
              className="flex flex-1 items-center gap-2 text-left"
              aria-pressed={active}
            >
              <span className="flex-1">
                <span className="block font-medium">{voice.name}</span>
                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">{voice.label}</span>
              </span>
              {active ? <CheckIcon width={16} height={16} className="text-brand" /> : null}
            </button>
            {voice.previewUrl ? (
              <button
                type="button"
                onClick={() => togglePreview(voice)}
                aria-label={playingId === voice.id ? "Jeda pratinjau" : "Putar pratinjau"}
                className="flex size-8 items-center justify-center rounded-full bg-zinc-900/5 text-zinc-600 hover:bg-zinc-900/10 dark:bg-white/10 dark:text-zinc-200"
              >
                {playingId === voice.id ? <PauseIcon width={14} height={14} /> : <PlayIcon width={14} height={14} />}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

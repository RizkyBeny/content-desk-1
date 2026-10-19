"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Button, toast } from "@heroui/react";
import { GlassCard, SectionHeader } from "@/components/ui/primitives";
import { AudioIcon, PlayIcon, SparkIcon, VolumeIcon } from "@/components/ui/icons";
import { apiFetch, post } from "@/lib/client";
import { MediaSourcePicker, type MediaSelection } from "@/components/media/media-source-picker";
import type { EditorController } from "./use-editor-state";
import type { AudioEditorState, AudioSegment, CreationDTO } from "@/types";

function WaveformPlayer({ url }: { url: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ws = WaveSurfer.create({
      container: ref.current,
      height: 64,
      waveColor: "#a1a1aa",
      progressColor: "#18181b",
      cursorColor: "#18181b",
    });
    wsRef.current = ws;
    return () => {
      ws.destroy();
      wsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (wsRef.current && url) void wsRef.current.load(url);
  }, [url]);

  return (
    <div className="rounded-xl border border-zinc-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-zinc-900/50">
      <div ref={ref} />
      {!url && <p className="py-4 text-center text-xs text-zinc-500">Audio belum tersedia.</p>}
      {url && (
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300"
          onClick={() => wsRef.current?.playPause()}
        >
          <PlayIcon width={14} height={14} /> Putar / jeda
        </button>
      )}
    </div>
  );
}

export function AudioEditor({
  controller,
  creation,
  assetUrls,
}: {
  controller: EditorController;
  creation: CreationDTO;
  assetUrls: Record<string, string>;
}) {
  const state = controller.state as AudioEditorState;
  const [selected, setSelected] = useState(0);
  const [busyRef, setBusyRef] = useState<number | null>(null);
  const [musicPicker, setMusicPicker] = useState(false);

  const seg: AudioSegment | undefined = state.segments[selected];
  const itemFor = (segRef: number) => creation.items.find((i) => i.briefRowRef === segRef);

  function patchSegment(index: number, patch: Partial<AudioSegment>, record = true) {
    controller.setState(
      (s) => {
        if (s.type !== "audio") return s;
        const segments = s.segments.map((x, i) => (i === index ? { ...x, ...patch } : x));
        return { ...s, segments };
      },
      { record },
    );
  }

  async function regenerate(index: number) {
    const segment = state.segments[index];
    const item = itemFor(segment.segRef);
    if (!item) {
      toast.warning("Item segmen tidak ditemukan.");
      return;
    }
    setBusyRef(index);
    try {
      await post(`/api/creation-items/${item.id}/regenerate`, { prompt: segment.text });
      await pollForAsset(item.id, segment.segRef);
      toast.success("Segmen dibuat ulang.");
    } catch (e) {
      toast.danger((e as Error).message ?? "Gagal membuat ulang segmen.");
    } finally {
      setBusyRef(null);
    }
  }

  async function pollForAsset(itemId: string, segRef: number) {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const res = await apiFetch<{ creation: CreationDTO }>(`/api/creations/${creation.id}`);
      const fresh = res.creation.items.find((x) => x.id === itemId);
      if (fresh?.status === "completed" && fresh.asset) {
        const newAssetId = fresh.asset.id;
        const idx = state.segments.findIndex((s) => s.segRef === segRef);
        if (idx >= 0) {
          controller.setState(
            (s) =>
              s.type === "audio"
                ? { ...s, segments: s.segments.map((x, i) => (i === idx ? { ...x, assetId: newAssetId } : x)) }
                : s,
            { record: false },
          );
        }
        return;
      }
      if (fresh?.status === "failed") throw new Error(fresh.errorMessage ?? "Generate segmen gagal.");
    }
  }

  function onPickMusic(sel: MediaSelection) {
    setMusicPicker(false);
    const asset = sel.asset;
    if (!asset || !asset.fileUrl) return;
    controller.setState((s) =>
      s.type === "audio" ? { ...s, music: { assetId: asset.id, src: asset.fileUrl, volume: 0.3 } } : s,
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <GlassCard className="space-y-2">
        <SectionHeader title="Segmen" description={`${state.segments.length} segmen narasi`} />
        <div className="space-y-1">
          {state.segments.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(i)}
              className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                i === selected
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              <span className="font-medium">Segmen {s.segRef}</span>
              <span className="ml-1 opacity-70">· {s.durationSec}s</span>
              <span className="mt-1 line-clamp-2 block opacity-80">{s.text || "—"}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="space-y-4">
        {seg ? (
          <>
            <SectionHeader
              title={`Segmen ${seg.segRef}`}
              description="Edit narasi lalu buat ulang audio segmen ini."
            />
            <WaveformPlayer url={seg.assetId ? assetUrls[seg.assetId] ?? null : null} />

            <textarea
              value={seg.text}
              onChange={(e) => patchSegment(selected, { text: e.target.value })}
              rows={4}
              className="w-full rounded-xl border border-zinc-200 bg-white/70 p-3 text-sm outline-none dark:border-white/10 dark:bg-zinc-900/50"
              placeholder="Narasi segmen…"
            />

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <label className="flex items-center gap-2">
                Nada
                <input
                  value={seg.tone}
                  onChange={(e) => patchSegment(selected, { tone: e.target.value })}
                  className="w-28 rounded-lg border border-zinc-200 bg-white/70 px-2 py-1 dark:border-white/10 dark:bg-zinc-900/50"
                />
              </label>
              <label className="flex items-center gap-2">
                Kecepatan
                <input
                  type="range"
                  min={0.75}
                  max={1.5}
                  step={0.05}
                  value={seg.speed}
                  onChange={(e) => patchSegment(selected, { speed: Number(e.target.value) })}
                />
                <span className="tabular-nums">{seg.speed.toFixed(2)}x</span>
              </label>
              <Button
                size="sm"
                variant="secondary"
                isDisabled={busyRef !== null}
                onPress={() => regenerate(selected)}
              >
                <SparkIcon width={14} height={14} />
                {busyRef === selected ? "Membuat…" : "Buat ulang"}
              </Button>
            </div>

            <div className="space-y-2 border-t border-zinc-200/70 pt-4 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <AudioIcon width={15} height={15} /> Musik latar
                </span>
                <Button size="sm" variant="secondary" onPress={() => setMusicPicker(true)}>
                  Pilih musik
                </Button>
              </div>
              {state.music?.assetId ? (
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <VolumeIcon width={13} height={13} />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={state.music.volume}
                      onChange={(e) =>
                        controller.setState((s) =>
                          s.type === "audio" && s.music
                            ? { ...s, music: { ...s.music, volume: Number(e.target.value) } }
                            : s,
                        )
                      }
                    />
                  </span>
                  <button
                    type="button"
                    className="text-red-500"
                    onClick={() => controller.setState((s) => (s.type === "audio" ? { ...s, music: null } : s))}
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">Belum ada musik latar.</p>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-500">Tidak ada segmen.</p>
        )}
      </GlassCard>

      <MediaSourcePicker open={musicPicker} onClose={() => setMusicPicker(false)} type="audio" onSelect={onPickMusic} />
    </div>
  );
}

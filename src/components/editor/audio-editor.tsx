"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Button, toast } from "@heroui/react";
import { AudioIcon, PlayIcon, SparkIcon, VolumeIcon } from "@/components/ui/icons";
import { apiFetch, post } from "@/lib/client";
import { MediaSourcePicker, type MediaSelection } from "@/components/media/media-source-picker";
import { EditorFrame } from "./frame/editor-frame";
import { AssetRail } from "./frame/asset-rail";
import { Playbar, StageBar } from "./frame/stage";
import { TimelineBar, TimelineItem } from "./frame/timeline-bar";
import { AudioLatarSection } from "./frame/sections";
import { SectionBlock, inputCls, labelCls } from "./frame/ui";
import type { TypeEditorProps } from "./frame/types";
import type { AudioEditorState, AudioSegment, CreationDTO } from "@/types";

function WaveformPlayer({ url, fallbackTotal }: { url: string | null; fallbackTotal: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [time, setTime] = useState(0);
  const [total, setTotal] = useState(fallbackTotal);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const ws = WaveSurfer.create({
      container: ref.current,
      height: 96,
      waveColor: "#a1a1aa",
      progressColor: "#6366f1",
      cursorColor: "#6366f1",
    });
    wsRef.current = ws;
    ws.on("timeupdate", (t) => setTime(t));
    ws.on("play", () => setPlaying(true));
    ws.on("pause", () => setPlaying(false));
    ws.on("finish", () => {
      setPlaying(false);
      setTime(0);
    });
    ws.on("ready", () => {
      const d = ws.getDuration();
      if (d && Number.isFinite(d) && d > 0) setTotal(d);
    });
    return () => {
      ws.destroy();
      wsRef.current = null;
    };
  }, []);

  useEffect(() => {
    setTime(0);
    setTotal(fallbackTotal);
    if (wsRef.current && url) void wsRef.current.load(url);
  }, [url, fallbackTotal]);

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-200/70 bg-white/60 p-4 dark:border-white/10 dark:bg-zinc-900/50">
        <div ref={ref} />
        {!url && <p className="py-6 text-center text-xs text-zinc-500">Audio belum tersedia — pilih aset untuk segmen ini.</p>}
        {url && (
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300"
            onClick={() => wsRef.current?.playPause()}
          >
            <PlayIcon width={14} height={14} /> Putar / jeda waveform
          </button>
        )}
      </div>
      <Playbar
        current={time}
        total={total}
        playing={playing}
        onToggle={() => wsRef.current?.playPause()}
      />
    </div>
  );
}

export function AudioEditor({ creation, controller, assetUrls, chrome, ui, patchUi }: TypeEditorProps) {
  const state = controller.state as AudioEditorState;
  const [selected, setSelected] = useState(0);
  const [busyRef, setBusyRef] = useState<number | null>(null);
  const [picker, setPicker] = useState<null | { kind: "segment" | "music" }>(null);

  const index = Math.min(selected, Math.max(0, state.segments.length - 1));
  const seg: AudioSegment | undefined = state.segments[index];
  const itemFor = (segRef: number) => creation.items.find((i) => i.briefRowRef === segRef);

  function patchSegment(i: number, patch: Partial<AudioSegment>, record = true) {
    controller.setState(
      (s) => {
        if (s.type !== "audio") return s;
        const segments = s.segments.map((x, xi) => (xi === i ? { ...x, ...patch } : x));
        return { ...s, segments };
      },
      { record },
    );
  }

  async function regenerate(i: number) {
    const segment = state.segments[i];
    const item = itemFor(segment.segRef);
    if (!item) {
      toast.warning("Item segmen tidak ditemukan.");
      return;
    }
    setBusyRef(i);
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

  function onPick(sel: MediaSelection) {
    const kind = picker?.kind;
    setPicker(null);
    const asset = sel.asset;
    if (!asset) return;
    if (kind === "music") {
      if (!asset.fileUrl) return;
      controller.setState((s) =>
        s.type === "audio" ? { ...s, music: { assetId: asset.id, src: asset.fileUrl, volume: 0.3 } } : s,
      );
    } else {
      patchSegment(index, { assetId: asset.id });
      toast.success("Audio segmen diperbarui.");
    }
  }

  // Klik aset di rail → audio segmen terpilih.
  function pickFromRail(asset: { id: string }) {
    patchSegment(index, { assetId: asset.id });
    toast.success(`Aset diterapkan ke segmen ${seg?.segRef ?? ""}.`);
  }

  // ── Stage ───────────────────────────────────────────────────────────────
  const stage = (
    <div className="flex h-full min-h-0 flex-col">
      <StageBar
        controller={controller}
        onSwapAsset={() => setPicker({ kind: "segment" })}
        swapLabel="Ganti Aset"
        right={
          <span className="mr-1 hidden rounded-md bg-zinc-100 px-2 py-1 text-xs tabular-nums text-zinc-500 sm:inline dark:bg-zinc-800 dark:text-zinc-400">
            {state.segments.length} segmen · {seg ? `${seg.durationSec}s` : "—"}
          </span>
        }
      />
      <div className="min-h-0 flex-1 pt-2">
        <WaveformPlayer
          key={seg?.id ?? "empty"}
          url={seg?.assetId ? assetUrls[seg.assetId] ?? null : null}
          fallbackTotal={seg?.durationSec ?? 30}
        />
      </div>
    </div>
  );

  // ── Timeline (strip segmen) ─────────────────────────────────────────────
  const timeline = (
    <TimelineBar
      zoom={ui.zoom}
      onZoom={(v) => patchUi({ zoom: v })}
      pageLabel={`Segmen ${index + 1}/${state.segments.length}`}
      onVoiceOver={() => patchUi({ panelTab: "voiceover" })}
      onAddBacksound={() => setPicker({ kind: "music" })}
    >
      {state.segments.map((s, i) => (
        <TimelineItem
          key={s.id}
          active={i === index}
          onClick={() => setSelected(i)}
          label={`Segmen ${s.segRef}`}
          sublabel={`${s.durationSec}s`}
        >
          <AudioIcon width={18} height={18} className="text-zinc-400" />
        </TimelineItem>
      ))}
    </TimelineBar>
  );

  // ── Panel Properties ────────────────────────────────────────────────────
  const panel = (
    <>
      <SectionBlock
        title="Segmen"
        description={`${state.segments.length} segmen narasi — pilih untuk mengedit.`}
      >
        <div className="space-y-1">
          {state.segments.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(i)}
              className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                i === index
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
      </SectionBlock>

      {seg ? (
        <SectionBlock
          title={`Segmen ${seg.segRef}`}
          description="Edit narasi lalu buat ulang audio segmen ini."
          action={
            <Button size="sm" variant="secondary" isDisabled={busyRef !== null} onPress={() => regenerate(index)}>
              <SparkIcon width={14} height={14} />
              {busyRef === index ? "Membuat…" : "Buat ulang"}
            </Button>
          }
        >
          <label className={labelCls}>
            <span>Narasi segmen</span>
            <textarea
              value={seg.text}
              onChange={(e) => patchSegment(index, { text: e.target.value })}
              rows={4}
              placeholder="Narasi segmen…"
              className={`${inputCls} mt-1 resize-none`}
            />
          </label>

          <label className={labelCls}>
            <span>Nada</span>
            <input
              value={seg.tone}
              onChange={(e) => patchSegment(index, { tone: e.target.value })}
              className={`${inputCls} mt-1`}
            />
          </label>

          <div className="flex items-center gap-3 text-sm">
            <span className="shrink-0 text-zinc-600 dark:text-zinc-300">Kecepatan</span>
            <input
              type="range"
              min={0.75}
              max={1.5}
              step={0.05}
              value={seg.speed}
              aria-label="Kecepatan bicara"
              onChange={(e) => patchSegment(index, { speed: Number(e.target.value) })}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-indigo-600 dark:bg-zinc-700"
            />
            <span className="w-10 text-right tabular-nums text-xs text-zinc-500 dark:text-zinc-400">
              {seg.speed.toFixed(2)}x
            </span>
          </div>
        </SectionBlock>
      ) : (
        <SectionBlock title="Segmen">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Tidak ada segmen.</p>
        </SectionBlock>
      )}

      {/* Musik latar — kontrol picker manual (Audio Latar di bawah) */}
      <SectionBlock
        title="Musik Latar"
        description="Pilih musik latar untuk seluruh audio."
        action={
          <Button size="sm" variant="secondary" onPress={() => setPicker({ kind: "music" })}>
            <VolumeIcon width={14} height={14} /> Pilih
          </Button>
        }
      >
        {state.music?.assetId ? (
          <p className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <AudioIcon width={13} height={13} /> Musik latar aktif.
          </p>
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Belum ada musik latar.</p>
        )}
      </SectionBlock>

      <AudioLatarSection
        music={state.music}
        onVolume={(v) =>
          controller.setState((s) => (s.type === "audio" && s.music ? { ...s, music: { ...s.music, volume: v } } : s))
        }
        onClear={() => controller.setState((s) => (s.type === "audio" ? { ...s, music: null } : s))}
      />
    </>
  );

  return (
    <>
      <EditorFrame
        chrome={chrome}
        rail={<AssetRail creation={creation} backHref={chrome.backHref} onPickAsset={pickFromRail} />}
        stage={stage}
        panel={panel}
        timeline={timeline}
      />
      <MediaSourcePicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        type={picker?.kind === "music" ? "audio" : "audio"}
        onSelect={onPick}
      />
    </>
  );
}

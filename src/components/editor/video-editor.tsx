"use client";

import { useEffect, useState } from "react";
import { Button, toast } from "@heroui/react";
import {
  CopyIcon,
  PlusIcon,
  SparkIcon,
  TextIcon,
  VideoIcon,
  XIcon,
} from "@/components/ui/icons";
import { MediaSourcePicker, type MediaSelection } from "@/components/media/media-source-picker";
import { EditorFrame } from "./frame/editor-frame";
import { AssetRail } from "./frame/asset-rail";
import { Playbar, StageBar, fitFrame, formatTime } from "./frame/stage";
import { TimelineBar, TimelineItem } from "./frame/timeline-bar";
import {
  AudioLatarSection,
  CanvasEditorSection,
  MediaConfigSection,
  SubtitleSection,
  TypographySection,
  VideoPromoSection,
} from "./frame/sections";
import { SectionBlock, inputCls, labelCls, selectCls } from "./frame/ui";
import type { TypeEditorProps } from "./frame/types";
import type { Ratio, SceneObject, SubtitleCue, VideoEditorState } from "@/types";

const RATIOS: Ratio[] = ["9:16", "16:9", "1:1"];
const RES: VideoEditorState["resolution"][] = ["720p", "1080p"];

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function VideoEditor({ creation, controller, assetUrls, chrome, ui, patchUi }: TypeEditorProps) {
  const state = controller.state as VideoEditorState;
  const [current, setCurrent] = useState(0);
  const [picker, setPicker] = useState<{ kind: "clip" | "narration" | "music" } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);

  const scenes = state.scenes;
  const scene = scenes[Math.min(current, scenes.length - 1)];
  const index = Math.min(current, scenes.length - 1);
  const url = scene?.clipAssetId ? assetUrls[scene.clipAssetId] ?? null : scene?.clipSrc ?? null;
  const totalSec = scenes.reduce((sum, s) => sum + Math.max(0, s.endSec - s.startSec), 0);

  // Playhead sederhana — maju realtime saat diputar, berhenti di akhir.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setTime((t) => {
        if (t + 0.1 >= totalSec) {
          setPlaying(false);
          return 0;
        }
        return t + 0.1;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [playing, totalSec]);

  function patchScene(i: number, patch: Partial<SceneObject>) {
    controller.setState((s) =>
      s.type === "video" ? { ...s, scenes: s.scenes.map((x, xi) => (xi === i ? { ...x, ...patch } : x)) } : s,
    );
  }

  function addScene() {
    const newScene: SceneObject = {
      id: uid("scene"),
      clipAssetId: null,
      clipSrc: null,
      startSec: 0,
      endSec: 4,
      texts: [],
    };
    controller.setState((s) => (s.type === "video" ? { ...s, scenes: [...s.scenes, newScene] } : s));
    setCurrent(scenes.length);
  }

  function duplicateScene(i: number) {
    controller.setState((s) => {
      if (s.type !== "video") return s;
      const src = s.scenes[i];
      const copy: SceneObject = { ...src, id: uid("scene"), texts: src.texts.map((t) => ({ ...t, id: uid("ov") })) };
      const next = [...s.scenes];
      next.splice(i + 1, 0, copy);
      return { ...s, scenes: next };
    });
  }

  function removeScene(i: number) {
    controller.setState((s) => (s.type === "video" ? { ...s, scenes: s.scenes.filter((_, xi) => xi !== i) } : s));
    setCurrent((c) => Math.max(0, c > i ? c - 1 : Math.min(c, scenes.length - 2)));
  }

  function splitScene(i: number) {
    controller.setState((s) => {
      if (s.type !== "video") return s;
      const src = s.scenes[i];
      const mid = src.startSec + (src.endSec - src.startSec) / 2;
      const first = { ...src, texts: src.texts.map((t) => ({ ...t, id: uid("ov") })), endSec: mid };
      const second: SceneObject = {
        ...src,
        id: uid("scene"),
        startSec: mid,
        texts: src.texts.map((t) => ({ ...t, id: uid("ov"), fromSec: 0, toSec: src.endSec - mid })),
      };
      const next = [...s.scenes];
      next.splice(i, 1, first, second);
      return { ...s, scenes: next };
    });
  }

  function moveScene(i: number, dir: -1 | 1) {
    const target = i + dir;
    if (target < 0 || target >= scenes.length) return;
    controller.setState((s) => {
      if (s.type !== "video") return s;
      const next = [...s.scenes];
      [next[i], next[target]] = [next[target], next[i]];
      return { ...s, scenes: next };
    });
    setCurrent(target);
  }

  function setText(i: number, text: string) {
    const dur = scenes[i] ? scenes[i].endSec - scenes[i].startSec : 4;
    patchScene(i, {
      texts: [{ id: scenes[i]?.texts[0]?.id ?? uid("ov"), text, fromSec: 0, toSec: dur }],
    });
  }

  function autoSubtitles() {
    const cues: SubtitleCue[] = [];
    let cursor = 0;
    for (const s of scenes) {
      const dur = Math.max(0, s.endSec - s.startSec);
      const text = s.texts[0]?.text ?? "";
      if (text) cues.push({ fromSec: Number(cursor.toFixed(2)), toSec: Number((cursor + dur).toFixed(2)), text });
      cursor += dur;
    }
    controller.setState((s) => (s.type === "video" ? { ...s, subtitles: cues } : s));
    toast.success(`${cues.length} subtitle dibuat dari teks on-screen.`);
  }

  function onPick(sel: MediaSelection) {
    const target = picker;
    setPicker(null);
    const asset = sel.asset;
    if (!target || !asset) return;
    if (target.kind === "clip") {
      patchScene(index, { clipAssetId: asset.id, clipSrc: null });
    } else if (target.kind === "narration") {
      controller.setState((s) =>
        s.type === "video" ? { ...s, narration: { assetId: asset.id, src: null, volume: 1 } } : s,
      );
    } else {
      controller.setState((s) =>
        s.type === "video" ? { ...s, music: { assetId: asset.id, src: null, volume: 0.3 } } : s,
      );
    }
  }

  // ── Klik aset di rail langsung jadi klip scene aktif ────────────────────
  function pickFromRail(assetId: string) {
    patchScene(index, { clipAssetId: assetId, clipSrc: null });
    toast.success("Klip scene diperbarui.");
  }

  // ── Stage ───────────────────────────────────────────────────────────────
  const stage = (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <StageBar
        controller={controller}
        onSwapAsset={() => setPicker({ kind: "clip" })}
        swapLabel="Ganti Aset"
        right={
          <span className="mr-1 hidden rounded-md bg-zinc-100 px-2 py-1 text-xs tabular-nums text-zinc-500 sm:inline dark:bg-zinc-800 dark:text-zinc-400">
            {state.resolution} · {scenes.length} scene · {formatTime(totalSec)}
          </span>
        }
      />

      <div className="flex min-h-0 flex-1 items-center justify-center" style={{ containerType: "size" }}>
        <div
          className="relative overflow-hidden rounded-2xl bg-black shadow-lg"
          style={fitFrame(state.ratio)}
        >
          {url ? (
            <video src={url} className="h-full w-full object-cover" muted loop autoPlay playsInline controls />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-600">
              <VideoIcon width={40} height={40} />
            </div>
          )}
          {scene?.texts[0]?.text ? (
            <p
              className="pointer-events-none absolute inset-x-3 bottom-4 text-center text-lg font-semibold text-white drop-shadow-lg"
              style={{ textAlign: ui.alignment === "left" ? "left" : ui.alignment === "right" ? "right" : "center" }}
            >
              {scene.texts[0].text}
            </p>
          ) : null}
        </div>
      </div>

      <Playbar
        current={time}
        total={totalSec}
        playing={playing}
        onToggle={() => setPlaying((p) => !p)}
        className="pb-1"
      />
    </div>
  );

  // ── Timeline ────────────────────────────────────────────────────────────
  const timeline = (
    <TimelineBar
      zoom={ui.zoom}
      onZoom={(v) => patchUi({ zoom: v })}
      pageLabel={`Scene ${index + 1}/${scenes.length}`}
      onVoiceOver={() => patchUi({ panelTab: "voiceover" })}
      onAddBacksound={() => setPicker({ kind: "music" })}
    >
      {scenes.map((s, i) => {
        const src = s.clipAssetId ? assetUrls[s.clipAssetId] : s.clipSrc;
        return (
          <TimelineItem
            key={s.id}
            active={i === index}
            onClick={() => setCurrent(i)}
            label={`Scene ${i + 1}`}
            sublabel={`${(s.endSec - s.startSec).toFixed(1)}s`}
          >
            {src ? (
              <video src={src} className="h-full w-full object-cover" muted />
            ) : (
              <VideoIcon width={18} height={18} className="text-zinc-400" />
            )}
          </TimelineItem>
        );
      })}
      <button
        type="button"
        onClick={addScene}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-zinc-500 transition-colors hover:border-indigo-400 hover:text-indigo-500 dark:border-zinc-600 dark:text-zinc-400"
        aria-label="Tambah scene"
      >
        <PlusIcon width={18} height={18} />
      </button>
    </TimelineBar>
  );

  // ── Panel Properties ────────────────────────────────────────────────────
  const panel = (
    <>
      <CanvasEditorSection
        ratio={state.ratio}
        onRatio={(r) => controller.setState((s) => (s.type === "video" ? { ...s, ratio: r } : s))}
        ui={ui}
        patchUi={patchUi}
        durationSec={scene ? Math.round(scene.endSec - scene.startSec) : undefined}
        onDuration={(v) => scene && patchScene(index, { endSec: scene.startSec + v })}
      />

      {/* Kontrol scene aktif */}
      <SectionBlock title={`Scene ${index + 1}`} description="Klip, durasi, dan teks on-screen scene ini.">
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="secondary" onPress={() => setPicker({ kind: "clip" })}>
            <VideoIcon width={14} height={14} /> Ganti klip
          </Button>
          <Button size="sm" variant="secondary" onPress={() => splitScene(index)} isDisabled={scenes.length >= 20}>
            Split
          </Button>
          <Button size="sm" variant="secondary" onPress={() => duplicateScene(index)} aria-label="Duplikat scene">
            <CopyIcon width={14} height={14} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            isIconOnly
            aria-label="Naikkan scene"
            isDisabled={index === 0}
            onPress={() => moveScene(index, -1)}
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="secondary"
            isIconOnly
            aria-label="Turunkan scene"
            isDisabled={index === scenes.length - 1}
            onPress={() => moveScene(index, 1)}
          >
            ↓
          </Button>
          <Button
            size="sm"
            variant="danger-soft"
            isIconOnly
            aria-label="Hapus scene"
            isDisabled={scenes.length <= 1}
            onPress={() => removeScene(index)}
          >
            <XIcon width={14} height={14} />
          </Button>
        </div>

        <label className="block">
          <span className={`${labelCls} mb-1 flex items-center gap-1`}>
            <TextIcon width={13} height={13} /> Teks on-screen
          </span>
          <textarea
            value={scene?.texts[0]?.text ?? ""}
            onChange={(e) => setText(index, e.target.value)}
            rows={2}
            placeholder="Teks yang muncul di video…"
            className={`${inputCls} resize-none`}
          />
        </label>
      </SectionBlock>

      <TypographySection ui={ui} patchUi={patchUi} />
      <MediaConfigSection ui={ui} patchUi={patchUi} />

      {/* Narasi */}
      <SectionBlock
        title="Narasi"
        description="Voice-over utama yang menimpa audio scene."
        action={
          <Button size="sm" variant="secondary" onPress={() => setPicker({ kind: "narration" })}>
            Pilih
          </Button>
        }
      >
        {state.narration?.assetId ? (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Narasi aktif.</p>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={state.narration.volume}
              aria-label="Volume narasi"
              onChange={(e) =>
                controller.setState((s) =>
                  s.type === "video" && s.narration
                    ? { ...s, narration: { ...s.narration, volume: Number(e.target.value) } }
                    : s,
                )
              }
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-indigo-600 dark:bg-zinc-700"
            />
            <button
              type="button"
              className="text-xs font-medium text-red-500 hover:text-red-600"
              onClick={() => controller.setState((s) => (s.type === "video" ? { ...s, narration: null } : s))}
            >
              Hapus narasi
            </button>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Belum ada narasi.</p>
        )}
      </SectionBlock>

      <AudioLatarSection
        music={state.music}
        onVolume={(v) =>
          controller.setState((s) => (s.type === "video" && s.music ? { ...s, music: { ...s.music, volume: v } } : s))
        }
        onClear={() => controller.setState((s) => (s.type === "video" ? { ...s, music: null } : s))}
      />

      <VideoPromoSection ui={ui} patchUi={patchUi} />

      <SubtitleSection state={state} controller={controller} onGenerate={autoSubtitles} />
    </>
  );

  return (
    <>
      <EditorFrame
        chrome={chrome}
        rail={
          <AssetRail
            creation={creation}
            backHref={chrome.backHref}
            onPickAsset={(a) => pickFromRail(a.id)}
          />
        }
        stage={stage}
        panel={panel}
        timeline={timeline}
      />
      <MediaSourcePicker open={picker?.kind === "clip"} onClose={() => setPicker(null)} type="video" onSelect={onPick} />
      <MediaSourcePicker
        open={picker?.kind === "narration" || picker?.kind === "music"}
        onClose={() => setPicker(null)}
        type="audio"
        onSelect={onPick}
      />
    </>
  );
}

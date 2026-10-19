"use client";

import { useState } from "react";
import { Button, toast } from "@heroui/react";
import { GlassCard, SectionHeader } from "@/components/ui/primitives";
import { AudioIcon, CopyIcon, LayersIcon, PlusIcon, SparkIcon, TextIcon, VideoIcon, XIcon } from "@/components/ui/icons";
import { MediaSourcePicker, type MediaSelection } from "@/components/media/media-source-picker";
import type { EditorController } from "./use-editor-state";
import type { Ratio, SceneObject, SubtitleCue, VideoEditorState } from "@/types";

const RATIOS: Ratio[] = ["9:16", "16:9", "1:1"];
const ASPECT: Record<Ratio, string> = { "9:16": "9/16", "16:9": "16/9", "1:1": "1/1", "4:5": "4/5" };
const RES: VideoEditorState["resolution"][] = ["720p", "1080p"];

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function VideoEditor({
  controller,
  assetUrls,
}: {
  controller: EditorController;
  assetUrls: Record<string, string>;
}) {
  const state = controller.state as VideoEditorState;
  const [current, setCurrent] = useState(0);
  const [picker, setPicker] = useState<{ kind: "clip" | "narration" | "music"; index: number } | null>(null);

  const scenes = state.scenes;
  const scene = scenes[current];
  const url = scene?.clipAssetId ? assetUrls[scene.clipAssetId] ?? null : scene?.clipSrc ?? null;
  const totalSec = scenes.reduce((sum, s) => sum + Math.max(0, s.endSec - s.startSec), 0);

  function patchScene(index: number, patch: Partial<SceneObject>) {
    controller.setState((s) =>
      s.type === "video" ? { ...s, scenes: s.scenes.map((x, i) => (i === index ? { ...x, ...patch } : x)) } : s,
    );
  }

  function addScene() {
    const dur = 4;
    const newScene: SceneObject = {
      id: uid("scene"),
      clipAssetId: null,
      clipSrc: null,
      startSec: 0,
      endSec: dur,
      texts: [],
    };
    controller.setState((s) => (s.type === "video" ? { ...s, scenes: [...s.scenes, newScene] } : s));
    setCurrent(scenes.length);
  }

  function duplicateScene(index: number) {
    controller.setState((s) => {
      if (s.type !== "video") return s;
      const src = s.scenes[index];
      const copy: SceneObject = { ...src, id: uid("scene"), texts: src.texts.map((t) => ({ ...t, id: uid("ov") })) };
      const next = [...s.scenes];
      next.splice(index + 1, 0, copy);
      return { ...s, scenes: next };
    });
  }

  function removeScene(index: number) {
    controller.setState((s) => (s.type === "video" ? { ...s, scenes: s.scenes.filter((_, i) => i !== index) } : s));
    setCurrent((c) => Math.max(0, c > index ? c - 1 : Math.min(c, scenes.length - 2)));
  }

  function splitScene(index: number) {
    controller.setState((s) => {
      if (s.type !== "video") return s;
      const src = s.scenes[index];
      const mid = src.startSec + (src.endSec - src.startSec) / 2;
      const first = { ...src, texts: src.texts.map((t) => ({ ...t, id: uid("ov") })), endSec: mid };
      const second: SceneObject = {
        ...src,
        id: uid("scene"),
        startSec: mid,
        texts: src.texts.map((t) => ({ ...t, id: uid("ov"), fromSec: 0, toSec: src.endSec - mid })),
      };
      const next = [...s.scenes];
      next.splice(index, 1, first, second);
      return { ...s, scenes: next };
    });
  }

  function moveScene(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= scenes.length) return;
    controller.setState((s) => {
      if (s.type !== "video") return s;
      const next = [...s.scenes];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...s, scenes: next };
    });
    setCurrent(target);
  }

  function setText(index: number, text: string) {
    const dur = scenes[index] ? scenes[index].endSec - scenes[index].startSec : 4;
    patchScene(index, {
      texts: [{ id: scenes[index]?.texts[0]?.id ?? uid("ov"), text, fromSec: 0, toSec: dur }],
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
      patchScene(target.index, { clipAssetId: asset.id, clipSrc: null });
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

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <GlassCard className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionHeader title="Preview" description={`${scenes.length} scene · total ${totalSec.toFixed(1)}s`} />
            <span className="text-xs text-zinc-500">{state.resolution}</span>
          </div>
          <div className="mx-auto w-full max-w-sm rounded-2xl bg-black" style={{ aspectRatio: ASPECT[state.ratio] }}>
            {url ? (
              <video src={url} className="h-full w-full object-cover" muted loop autoPlay playsInline controls />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-500">
                <VideoIcon width={32} height={32} />
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="space-y-2">
          <div className="flex items-center justify-between">
            <SectionHeader title="Timeline" description="Gulir horizontal" />
            <div className="flex gap-1">
              <Button size="sm" variant="secondary" onPress={addScene}>
                <PlusIcon width={14} height={14} /> Scene
              </Button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {scenes.map((s, i) => {
              const src = s.clipAssetId ? assetUrls[s.clipAssetId] : s.clipSrc;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={`w-32 shrink-0 overflow-hidden rounded-lg border text-left ${
                    i === current ? "border-zinc-900 dark:border-white" : "border-zinc-200 dark:border-white/10"
                  }`}
                >
                  <div className="flex h-16 items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                    {src ? (
                      <video src={src} className="h-full w-full object-cover" muted />
                    ) : (
                      <VideoIcon width={18} height={18} className="text-zinc-400" />
                    )}
                  </div>
                  <div className="px-2 py-1 text-[10px]">
                    Scene {i + 1} · {(s.endSec - s.startSec).toFixed(1)}s
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>
      </div>

      <div className="space-y-4">
        {scene && (
          <GlassCard className="space-y-3">
            <SectionHeader title={`Scene ${current + 1}`} />
            <div className="flex flex-wrap gap-1">
              <Button size="sm" variant="secondary" onPress={() => setPicker({ kind: "clip", index: current })}>
                <VideoIcon width={14} height={14} /> Ganti klip
              </Button>
              <Button size="sm" variant="secondary" onPress={() => splitScene(current)} isDisabled={scenes.length >= 20}>
                Split
              </Button>
              <Button size="sm" variant="secondary" onPress={() => duplicateScene(current)}>
                <CopyIcon width={14} height={14} />
              </Button>
              <Button size="sm" variant="secondary" onPress={() => moveScene(current, -1)} isDisabled={current === 0}>
                ↑
              </Button>
              <Button size="sm" variant="secondary" isDisabled={current === scenes.length - 1} onPress={() => moveScene(current, 1)}>
                ↓
              </Button>
              <Button size="sm" variant="danger-soft" isDisabled={scenes.length <= 1} onPress={() => removeScene(current)}>
                <XIcon width={14} height={14} />
              </Button>
            </div>
            <label className="flex items-center justify-between text-sm">
              Durasi (detik)
              <input
                type="number"
                min={1}
                max={60}
                value={Math.round(scene.endSec - scene.startSec)}
                onChange={(e) => {
                  const v = Math.max(1, Number(e.target.value) || 1);
                  patchScene(current, { endSec: scene.startSec + v });
                }}
                className="w-20 rounded-lg border border-zinc-200 bg-white/70 px-2 py-1 text-sm dark:border-white/10 dark:bg-zinc-900/50"
              />
            </label>
            <label className="block text-xs">
              <span className="mb-1 flex items-center gap-1 text-zinc-500">
                <TextIcon width={13} height={13} /> Teks on-screen
              </span>
              <textarea
                value={scene.texts[0]?.text ?? ""}
                onChange={(e) => setText(current, e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-zinc-200 bg-white/70 p-2 text-sm dark:border-white/10 dark:bg-zinc-900/50"
                placeholder="Teks yang muncul di video…"
              />
            </label>
          </GlassCard>
        )}

        <GlassCard className="space-y-3">
          <SectionHeader title="Pengaturan" />
          <label className="flex items-center justify-between text-sm">
            Rasio
            <select
              value={state.ratio}
              onChange={(e) => controller.setState((s) => (s.type === "video" ? { ...s, ratio: e.target.value as Ratio } : s))}
              className="rounded-lg border border-zinc-200 bg-white/70 px-2 py-1 text-sm dark:border-white/10 dark:bg-zinc-900/50"
            >
              {RATIOS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between text-sm">
            Resolusi
            <select
              value={state.resolution}
              onChange={(e) =>
                controller.setState((s) =>
                  s.type === "video" ? { ...s, resolution: e.target.value as VideoEditorState["resolution"] } : s,
                )
              }
              className="rounded-lg border border-zinc-200 bg-white/70 px-2 py-1 text-sm dark:border-white/10 dark:bg-zinc-900/50"
            >
              {RES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </GlassCard>

        <GlassCard className="space-y-3">
          <SectionHeader title="Audio" />
          <label className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <LayersIcon width={14} height={14} /> Narasi
            </span>
            <Button size="sm" variant="secondary" onPress={() => setPicker({ kind: "narration", index: 0 })}>
              Pilih
            </Button>
          </label>
          {state.narration?.assetId && (
            <div className="flex items-center gap-3 text-xs">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={state.narration.volume}
                onChange={(e) =>
                  controller.setState((s) =>
                    s.type === "video" && s.narration
                      ? { ...s, narration: { ...s.narration, volume: Number(e.target.value) } }
                      : s,
                  )
                }
              />
              <button
                type="button"
                className="text-red-500"
                onClick={() => controller.setState((s) => (s.type === "video" ? { ...s, narration: null } : s))}
              >
                Hapus
              </button>
            </div>
          )}
          <label className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <AudioIcon width={14} height={14} /> Musik
            </span>
            <Button size="sm" variant="secondary" onPress={() => setPicker({ kind: "music", index: current })}>
              Pilih
            </Button>
          </label>
          {state.music?.assetId && (
            <div className="flex items-center gap-3 text-xs">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={state.music.volume}
                onChange={(e) =>
                  controller.setState((s) =>
                    s.type === "video" && s.music ? { ...s, music: { ...s.music, volume: Number(e.target.value) } } : s,
                  )
                }
              />
              <button
                type="button"
                className="text-red-500"
                onClick={() => controller.setState((s) => (s.type === "video" ? { ...s, music: null } : s))}
              >
                Hapus
              </button>
            </div>
          )}
        </GlassCard>

        <GlassCard className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionHeader title="Subtitle" description={`${state.subtitles.length} cue`} />
            <Button size="sm" variant="secondary" onPress={autoSubtitles}>
              <SparkIcon width={14} height={14} /> Otomatis
            </Button>
          </div>
          {state.subtitles.map((cue, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <input
                type="number"
                step={0.1}
                value={cue.fromSec}
                onChange={(e) =>
                  controller.setState((s) =>
                    s.type === "video"
                      ? { ...s, subtitles: s.subtitles.map((c, j) => (j === i ? { ...c, fromSec: Number(e.target.value) } : c)) }
                      : s,
                  )
                }
                className="w-16 rounded border border-zinc-200 bg-white/70 px-1 py-0.5 dark:border-white/10 dark:bg-zinc-900/50"
              />
              <input
                type="number"
                step={0.1}
                value={cue.toSec}
                onChange={(e) =>
                  controller.setState((s) =>
                    s.type === "video"
                      ? { ...s, subtitles: s.subtitles.map((c, j) => (j === i ? { ...c, toSec: Number(e.target.value) } : c)) }
                      : s,
                  )
                }
                className="w-16 rounded border border-zinc-200 bg-white/70 px-1 py-0.5 dark:border-white/10 dark:bg-zinc-900/50"
              />
              <input
                value={cue.text}
                onChange={(e) =>
                  controller.setState((s) =>
                    s.type === "video"
                      ? { ...s, subtitles: s.subtitles.map((c, j) => (j === i ? { ...c, text: e.target.value } : c)) }
                      : s,
                  )
                }
                className="flex-1 rounded border border-zinc-200 bg-white/70 px-2 py-0.5 dark:border-white/10 dark:bg-zinc-900/50"
              />
            </div>
          ))}
          {!state.subtitles.length && <p className="text-xs text-zinc-500">Belum ada subtitle.</p>}
        </GlassCard>
      </div>

      <MediaSourcePicker
        open={picker?.kind === "clip"}
        onClose={() => setPicker(null)}
        type="video"
        onSelect={onPick}
      />
      <MediaSourcePicker
        open={picker?.kind === "narration" || picker?.kind === "music"}
        onClose={() => setPicker(null)}
        type="audio"
        onSelect={onPick}
      />
    </div>
  );
}

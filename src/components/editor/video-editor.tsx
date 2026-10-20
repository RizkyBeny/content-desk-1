"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@heroui/react";
import { apiFetch } from "@/lib/client";
import { cn } from "@/lib/utils";
import { PlusIcon, VideoIcon } from "@/components/ui/icons";
import { MediaSourcePicker, type MediaSelection } from "@/components/media/media-source-picker";
import { EditorFrame } from "./frame/editor-frame";
import { AssetRail } from "./frame/asset-rail";
import { Playbar, StageBar, fitFrame } from "./frame/stage";
import { TimelineBar, TimelineItem } from "./frame/timeline-bar";
import {
  AudioLatarSection,
  CanvasEditorSection,
  MediaConfigSection,
  TypographySection,
  VideoPromoSection,
} from "./frame/sections";
import { WatermarkOverlay } from "./frame/watermark-overlay";
import type { TypeEditorProps } from "./frame/types";
import type { AssetDTO, Ratio, SceneObject, VideoEditorState } from "@/types";

const RATIOS: Ratio[] = ["16:9", "1:1", "9:16"];

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function sceneDuration(s: SceneObject) {
  return Math.max(0, s.endSec - s.startSec);
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function isLightColor(hex: string) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

function placedClass(placement: "top" | "middle" | "bottom") {
  if (placement === "top") return "justify-start pt-[5cqw]";
  if (placement === "middle") return "justify-center";
  return "justify-end pb-[5cqw]";
}

function alignClass(alignment: "left" | "center" | "right") {
  if (alignment === "center") return "text-center";
  if (alignment === "right") return "text-right";
  return "text-left";
}

function transitionClass(mode: string) {
  if (mode === "slide") return "motion-safe:animate-[ed-slide-in_.35s_ease-out]";
  if (mode === "zoom") return "motion-safe:animate-[ed-zoom-in_.35s_ease-out]";
  if (mode === "none") return "";
  return "motion-safe:animate-[ed-fade-in_.35s_ease-out]";
}

export function VideoEditor({ creation, controller, assetUrls, chrome, ui, patchUi, channelLogoUrl }: TypeEditorProps) {
  const state = controller.state as VideoEditorState;
  const [current, setCurrent] = useState(0);
  const [picker, setPicker] = useState<"clip" | "music" | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [promoAssets, setPromoAssets] = useState<AssetDTO[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const voiceRef = useRef<HTMLAudioElement>(null);

  const scenes = state.scenes;
  const durations = useMemo(() => scenes.map(sceneDuration), [scenes]);
  const starts = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < durations.length; i += 1) {
      out.push(i === 0 ? 0 : out[i - 1] + durations[i - 1]);
    }
    return out;
  }, [durations]);
  const mainTotal = durations.reduce((sum, d) => sum + d, 0);
  const promoUrl = ui.promoSource ? assetUrls[ui.promoSource] ?? null : null;
  const promoDuration = promoUrl ? ui.promoDurationSec : 0;
  const totalSec = mainTotal + promoDuration;
  const promoActive = Boolean(promoUrl && time >= mainTotal);
  const timeIndex = useMemo(() => {
    if (!durations.length) return 0;
    for (let i = 0; i < durations.length; i += 1) {
      if (time >= starts[i] && time < starts[i] + durations[i]) return i;
    }
    return durations.length - 1;
  }, [time, starts, durations]);
  const index = !promoActive && playing ? timeIndex : clamp(current, 0, Math.max(0, scenes.length - 1));
  const scene = scenes[index];
  const url = scene?.clipAssetId ? assetUrls[scene.clipAssetId] ?? null : scene?.clipSrc ?? null;
  const activeSrc = promoActive ? promoUrl : url;
  const localTime = promoActive ? Math.max(0, time - mainTotal) : Math.max(0, time - (starts[index] ?? 0));
  const musicSrc = state.music ? assetUrls[state.music.assetId ?? ""] ?? state.music.src : null;
  const voiceSrc = state.narration ? assetUrls[state.narration.assetId ?? ""] ?? state.narration.src : null;
  const voiceOn = Boolean(ui.voiceOverOn && state.narration && voiceSrc);
  const titleText = scene?.texts[0]?.text ?? "";
  const highlightText = ui.highlightOn ? ui.highlightText.trim() : "";
  const highlightIndex = highlightText
    ? titleText.toLowerCase().indexOf(highlightText.toLowerCase())
    : -1;
  const canHighlight = Boolean(highlightText && highlightIndex >= 0);
  const extraHighlight = Boolean(highlightText && highlightIndex < 0);
  const titleNode = canHighlight && highlightText ? (
    <>
      {titleText.slice(0, highlightIndex)}
      <mark
        className="rounded-[3px] px-[0.12em]"
        style={{
          backgroundColor: ui.highlightColor,
          color: isLightColor(ui.highlightColor) ? "#111111" : "#ffffff",
        }}
      >
        {titleText.slice(highlightIndex, highlightIndex + highlightText.length)}
      </mark>
      {titleText.slice(highlightIndex + highlightText.length)}
    </>
  ) : (
    titleText
  );

  // Fetch video assets for the promo dropdown.
  useEffect(() => {
    let aborted = false;
    apiFetch<{ items: AssetDTO[] }>("/api/assets?type=video&limit=50")
      .then((res) => {
        if (!aborted) setPromoAssets(res.items ?? []);
      })
      .catch(() => {
        /* dropdown tetap berisi aset dari brief */
      });
    return () => {
      aborted = true;
    };
  }, []);

  const promoSources = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const item of creation.items) {
      if (item.asset?.type === "video") map.set(item.asset.id, { id: item.asset.id, name: item.asset.name });
    }
    for (const asset of promoAssets) map.set(asset.id, { id: asset.id, name: asset.name });
    return Array.from(map.values());
  }, [creation.items, promoAssets]);

  // Playhead — maju realtime saat diputar, berhenti di akhir.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setTime((t) => {
        const next = t + 0.1;
        if (next >= totalSec) {
          setPlaying(false);
          setCurrent(0);
          return 0;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [playing, totalSec]);

  // Sinkronkan video dengan scene/promo aktif.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      const target = promoActive ? Math.max(0, time - mainTotal) : localTime;
      if (Number.isFinite(target) && Math.abs(v.currentTime - target) > 0.35) {
        try {
          v.currentTime = target;
        } catch {
          /* metadata belum siap */
        }
      }
      void v.play().catch(() => {
        /* autoplay browser policy */
      });
    } else {
      v.pause();
    }
    // localTime sengaja tidak masuk deps agar tidak seek tiap 100ms; `index`
    // memastikan klip yang sama tetap di-seek saat berpindah scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, activeSrc, promoActive, mainTotal, index]);

  // Play/pause audio latar & voice over.
  useEffect(() => {
    const music = musicRef.current;
    const voice = voiceRef.current;
    if (playing) {
      if (music && musicSrc) void music.play().catch(() => {});
      if (voice && voiceOn) void voice.play().catch(() => {});
    } else {
      music?.pause();
      voice?.pause();
    }
  }, [playing, musicSrc, voiceOn, voiceSrc]);

  useEffect(() => {
    if (musicRef.current) musicRef.current.volume = state.music?.volume ?? 0.3;
  }, [state.music?.volume, musicSrc]);

  useEffect(() => {
    if (voiceRef.current) voiceRef.current.volume = ui.voiceOverVolume;
  }, [ui.voiceOverVolume, voiceSrc]);

  useEffect(() => {
    const video = videoRef.current;
    const music = musicRef.current;
    const voice = voiceRef.current;
    return () => {
      video?.pause();
      music?.pause();
      voice?.pause();
    };
  }, []);

  function syncMedia(target: number, sceneIndex = index) {
    if (musicRef.current) {
      const d = musicRef.current.duration;
      musicRef.current.currentTime = Number.isFinite(d) && d > 0 ? target % d : 0;
    }
    if (voiceRef.current) {
      voiceRef.current.currentTime = target;
    }
    if (videoRef.current) {
      const local =
        target >= mainTotal && promoUrl
          ? Math.max(0, target - mainTotal)
          : Math.max(0, target - (starts[sceneIndex] ?? 0));
      try {
        videoRef.current.currentTime = local;
      } catch {
        /* metadata belum siap */
      }
    }
  }

  function seekTo(target: number, sceneIndex = index) {
    const t = clamp(target, 0, Math.max(0, totalSec - 0.01));
    setTime(t);
    syncMedia(t, sceneIndex);
  }

  function selectScene(i: number) {
    setCurrent(i);
    seekTo(starts[i] ?? 0, i);
  }

  function togglePlay() {
    if (playing) {
      setCurrent(timeIndex);
      setPlaying(false);
      return;
    }
    if (time >= totalSec - 0.05) {
      setCurrent(0);
      seekTo(0);
    }
    setPlaying(true);
  }

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
    setTime(mainTotal);
  }

  function moveSceneTo(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= scenes.length || to >= scenes.length) return;
    controller.setState((s) => {
      if (s.type !== "video") return s;
      const next = [...s.scenes];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...s, scenes: next };
    });
    setCurrent(to);
    setTime(starts[to] ?? 0);
  }

  function setText(i: number, text: string) {
    const dur = scenes[i] ? scenes[i].endSec - scenes[i].startSec : 4;
    patchScene(i, {
      texts: [{ id: scenes[i]?.texts[0]?.id ?? uid("ov"), text, fromSec: 0, toSec: dur }],
    });
  }

  function onPick(sel: MediaSelection) {
    const target = picker;
    setPicker(null);
    const asset = sel.asset;
    if (!target || !asset) return;
    if (target === "clip") {
      patchScene(index, { clipAssetId: asset.id, clipSrc: null });
    } else {
      controller.setState((s) =>
        s.type === "video" ? { ...s, music: { assetId: asset.id, src: null, volume: 0.3, name: asset.name } } : s,
      );
    }
  }

  function pickFromRail(asset: AssetDTO) {
    if (asset.type !== "video") {
      toast.info("Pilih aset video untuk klip scene.");
      return;
    }
    patchScene(index, { clipAssetId: asset.id, clipSrc: null });
    toast.success("Klip scene diperbarui.");
  }

  const itemWidth = clamp(Math.round(100 * (ui.zoom / 50)), 40, 400);
  const ratios: Ratio[] = state.ratio === "4:5" ? [...RATIOS, "4:5"] : RATIOS;
  const pageLabel = promoActive ? "Page Promo" : `Page ${index + 1}/${Math.max(1, scenes.length)}`;

  // ── Stage ───────────────────────────────────────────────────────────────
  const stage = (
    <div className="flex h-full min-h-0 flex-col gap-6 px-4 py-4 sm:px-8 xl:px-[129px] xl:pt-16 xl:pb-8">
      <StageBar
        controller={controller}
        onSwapAsset={() => setPicker("clip")}
        swapLabel="Ganti Aset"
        className="px-0"
      />

      <div className="flex min-h-0 flex-1 items-center justify-center" style={{ containerType: "size" }}>
        <div
          className="relative overflow-hidden rounded-lg bg-black"
          style={{ ...fitFrame(state.ratio), containerType: "inline-size" }}
        >
          {activeSrc ? (
            <video
              key={`${activeSrc}:${promoActive ? "promo" : "main"}`}
              ref={videoRef}
              src={activeSrc}
              className={cn("h-full w-full", transitionClass(ui.promoTransition))}
              style={{ objectFit: ui.fitMode === "fit" ? "contain" : "cover" }}
              muted
              loop={!promoActive}
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ed-dim">
              <VideoIcon width={40} height={40} />
            </div>
          )}

          {ui.overlay === "gradient" ? (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          ) : null}
          {ui.overlay === "vignette" ? (
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(circle, transparent 42%, rgba(0,0,0,0.75) 100%)" }}
            />
          ) : null}
          {ui.overlay === "blur" ? (
            <div className="pointer-events-none absolute inset-0 bg-black/10 backdrop-blur-[3px]" />
          ) : null}

          {!promoActive && (titleText || extraHighlight || (ui.descOn && ui.descText)) ? (
            <div className={cn("pointer-events-none absolute inset-0 flex flex-col", placedClass(ui.textPlacement))}>
              <div className={cn("w-full px-[7cqw] pb-[4cqw]", alignClass(ui.alignment))}>
                {titleText ? (
                  <p className="text-[clamp(14px,6.4cqw,34px)] font-bold leading-[1.08] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
                    {titleNode}
                  </p>
                ) : null}
                {extraHighlight && highlightText ? (
                  <p className="mt-[1.5cqw] text-[clamp(13px,5.6cqw,30px)] font-bold leading-[1.1] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
                    <span
                      className="rounded-[3px] px-[0.12em]"
                      style={{
                        backgroundColor: ui.highlightColor,
                        color: isLightColor(ui.highlightColor) ? "#111111" : "#ffffff",
                      }}
                    >
                      {highlightText}
                    </span>
                  </p>
                ) : null}
                {ui.descOn && ui.descText ? (
                  <p className="mt-[2cqw] whitespace-pre-wrap text-[clamp(10px,3.5cqw,17px)] font-medium leading-[1.35] text-white/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
                    {ui.descText}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <WatermarkOverlay ui={ui} channelLogoUrl={channelLogoUrl} />
        </div>
      </div>

      <Playbar
        current={time}
        total={totalSec}
        playing={playing}
        onToggle={togglePlay}
        className="px-0 pb-0"
      />
    </div>
  );

  // ── Timeline ────────────────────────────────────────────────────────────
  const timeline = (
    <TimelineBar
      zoom={ui.zoom}
      onZoom={(v) => patchUi({ zoom: v })}
      pageLabel={pageLabel}
      onVoiceOver={() => patchUi({ panelTab: "voiceover" })}
      onAddBacksound={() => setPicker("music")}
    >
      {scenes.map((s, i) => {
        const src = s.clipAssetId ? assetUrls[s.clipAssetId] : s.clipSrc;
        return (
          <TimelineItem
            key={s.id}
            active={!promoActive && i === index}
            onClick={() => selectScene(i)}
            label={`Scene ${i + 1}`}
            durationSec={s.endSec - s.startSec}
            showLabel={false}
            width={itemWidth}
            draggable={scenes.length > 1}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", String(i));
              setDragIndex(i);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) moveSceneTo(dragIndex, i);
              setDragIndex(null);
            }}
          >
            {src ? (
              <video src={src} className="h-full w-full object-cover" muted playsInline preload="metadata" />
            ) : (
              <VideoIcon width={18} height={18} className="text-zinc-400" />
            )}
          </TimelineItem>
        );
      })}

      {promoUrl ? (
        <TimelineItem
          active={promoActive}
          onClick={() => {
            setTime(mainTotal);
            syncMedia(mainTotal);
          }}
          label="Video Promo"
          durationSec={promoDuration}
          showLabel={false}
          width={itemWidth}
        >
          <video src={promoUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
        </TimelineItem>
      ) : null}

      <button
        type="button"
        onClick={addScene}
        className="flex h-[52px] shrink-0 items-center justify-center rounded-md border border-dashed border-ed-line-strong text-ed-dim transition-colors hover:border-ed-sel-b hover:text-ed-text"
        style={{ width: itemWidth }}
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
        ratios={ratios}
        onRatio={(r) => controller.setState((s) => (s.type === "video" ? { ...s, ratio: r } : s))}
      />

      <TypographySection
        ui={ui}
        patchUi={patchUi}
        titleText={scene?.texts[0]?.text ?? ""}
        onTitleText={(v) => setText(index, v)}
      />

      <MediaConfigSection
        ui={ui}
        patchUi={patchUi}
        durationSec={scene ? Math.max(1, Math.round(scene.endSec - scene.startSec)) : undefined}
        onDuration={(v) => scene && patchScene(index, { endSec: scene.startSec + v })}
      />

      <AudioLatarSection
        music={state.music}
        onVolume={(v) =>
          controller.setState((s) => (s.type === "video" && s.music ? { ...s, music: { ...s.music, volume: v } } : s))
        }
        onClear={() => controller.setState((s) => (s.type === "video" ? { ...s, music: null } : s))}
        onPick={() => setPicker("music")}
      />

      <VideoPromoSection ui={ui} patchUi={patchUi} sources={promoSources} />
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

      {musicSrc ? <audio ref={musicRef} src={musicSrc} loop preload="metadata" /> : null}
      {voiceSrc ? <audio ref={voiceRef} src={voiceSrc} preload="metadata" /> : null}

      <MediaSourcePicker open={picker === "clip"} onClose={() => setPicker(null)} type="video" onSelect={onPick} />
      <MediaSourcePicker open={picker === "music"} onClose={() => setPicker(null)} type="audio" onSelect={onPick} />
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";
import { PauseIcon, PlayIcon } from "@/components/ui/icons";
import { WaveformBars } from "./waveform";

const SPEEDS = [0.75, 1, 1.25, 1.5];

interface WsPlayer {
  playPause: () => void;
  setPlaybackRate: (rate: number) => void;
  setTime: (time: number) => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  isPlaying: () => boolean;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  destroy: () => void;
}

/** FR-MOD-2: waveform besar dengan seek dan kontrol kecepatan 0.75–1.5×. */
export function AudioPlayer({ url, fallbackPoints }: { url: string; fallbackPoints?: number[] | null }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<WsPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let instance: WsPlayer | null = null;

    void (async () => {
      try {
        const mod = await import("wavesurfer.js");
        if (disposed || !containerRef.current) return;
        const ws = mod.default.create({
          container,
          url,
          height: 88,
          waveColor: "#a1a1aa",
          progressColor: "#6366f1",
          cursorColor: "#6366f1",
          barWidth: 2,
          barGap: 2,
          barRadius: 2,
        }) as unknown as WsPlayer;
        instance = ws;
        playerRef.current = ws;
        ws.on("ready", () => {
          if (disposed) return;
          setReady(true);
          setDuration(ws.getDuration());
        });
        ws.on("audioprocess", () => setTime(ws.getCurrentTime()));
        ws.on("seek", () => setTime(ws.getCurrentTime()));
        ws.on("play", () => setPlaying(true));
        ws.on("pause", () => setPlaying(false));
        ws.on("finish", () => {
          setPlaying(false);
          setTime(0);
        });
        ws.on("error", () => setFailed(true));
      } catch {
        if (!disposed) setFailed(true);
      }
    })();

    return () => {
      disposed = true;
      instance?.destroy();
      playerRef.current = null;
    };
  }, [url]);

  function toggle() {
    playerRef.current?.playPause();
  }

  function changeSpeed(rate: number) {
    setSpeed(rate);
    playerRef.current?.setPlaybackRate(rate);
  }

  if (failed) {
    return (
      <div className="space-y-3">
        <WaveformBars points={fallbackPoints ?? []} height={88} progress={duration ? time / duration : 0} />
        <audio controls src={url} className="w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="w-full" style={{ minHeight: 88 }} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          disabled={!ready}
          aria-label={playing ? "Jeda" : "Putar"}
          className="flex size-11 items-center justify-center rounded-full bg-zinc-900 text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900"
        >
          {playing ? <PauseIcon width={18} height={18} /> : <PlayIcon width={18} height={18} />}
        </button>
        <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
          {formatDuration(time)} / {formatDuration(duration)}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {SPEEDS.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => changeSpeed(rate)}
              className={cn(
                "rounded-full px-2 py-1 text-[11px] font-medium transition-colors",
                speed === rate
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-white/10",
              )}
            >
              {rate}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type {
  AudioParams,
  BriefParams,
  ImageParams,
  VideoParams,
} from "@/types";
import {
  AUDIO_FORMATS,
  AUDIO_LANGUAGES,
  AUDIO_SPEED_MAX,
  AUDIO_SPEED_MIN,
  AUDIO_SPEED_STEP,
  AUDIO_STYLES,
  BRIEF_AUDIENCE_MAX,
  BRIEF_CONTENT_TYPES,
  BRIEF_LANGUAGES,
  BRIEF_LENGTHS,
  BRIEF_PLATFORMS,
  BRIEF_TONES,
  CUSTOM_SIZE_MAX,
  CUSTOM_SIZE_MIN,
  CUSTOM_SIZE_STEP,
  IMAGE_DIMENSION_PRESETS,
  IMAGE_QUALITIES,
  IMAGE_RATIOS,
  VIDEO_DURATIONS,
  VIDEO_RATIOS,
  VIDEO_RESOLUTIONS,
  approximateRatio,
  imageTargetSize,
  labelFor,
  videoTargetSize,
} from "../../../config/generation";
import { ConfigChip, FieldRow, OptionList } from "./config-chip";
import { StartFramePicker, type StartFrame } from "./start-frame-picker";
import { VoicePicker } from "./voice-picker";

function snap(value: number): number {
  const clamped = Math.min(CUSTOM_SIZE_MAX, Math.max(CUSTOM_SIZE_MIN, Math.round(value) || CUSTOM_SIZE_MIN));
  return Math.round(clamped / CUSTOM_SIZE_STEP) * CUSTOM_SIZE_STEP;
}

export function ImageConfig({
  params,
  onChange,
}: {
  params: ImageParams;
  onChange: (patch: Partial<ImageParams>) => void;
}) {
  const custom = params.aspectRatio === "custom";
  const size = imageTargetSize(params);
  return (
    <>
      <ConfigChip label="Rasio" value={params.aspectRatio === "custom" ? "Kustom" : params.aspectRatio}>
        <OptionList
          options={IMAGE_RATIOS}
          value={params.aspectRatio}
          onChange={(aspectRatio) => {
            if (aspectRatio === "custom") {
              onChange({ aspectRatio, dimensionPreset: null, width: params.width, height: params.height });
            } else {
              const next = imageTargetSize({ ...params, aspectRatio, dimensionPreset: params.dimensionPreset ?? "medium" });
              onChange({ aspectRatio, width: next.width, height: next.height });
            }
          }}
        />
      </ConfigChip>

      <ConfigChip label="Kualitas" value={labelFor(IMAGE_QUALITIES, params.quality)}>
        <OptionList
          options={IMAGE_QUALITIES}
          value={params.quality}
          onChange={(quality) => onChange({ quality: quality as ImageParams["quality"] })}
        />
      </ConfigChip>

      {custom ? (
        <ConfigChip label="Dimensi" value={`${params.width}×${params.height}`}>
          <div className="space-y-2">
            <FieldRow label="Lebar (px)">
              <input
                type="number"
                min={CUSTOM_SIZE_MIN}
                max={CUSTOM_SIZE_MAX}
                step={CUSTOM_SIZE_STEP}
                value={params.width}
                onChange={(event) => onChange({ width: snap(Number(event.target.value)) })}
                className="w-full rounded-xl border border-zinc-900/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
              />
            </FieldRow>
            <FieldRow label="Tinggi (px)">
              <input
                type="number"
                min={CUSTOM_SIZE_MIN}
                max={CUSTOM_SIZE_MAX}
                step={CUSTOM_SIZE_STEP}
                value={params.height}
                onChange={(event) => onChange({ height: snap(Number(event.target.value)) })}
                className="w-full rounded-xl border border-zinc-900/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
              />
            </FieldRow>
            <p className="px-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              {approximateRatio(params.width, params.height)} · {CUSTOM_SIZE_MIN}–{CUSTOM_SIZE_MAX} px, kelipatan {CUSTOM_SIZE_STEP}
            </p>
          </div>
        </ConfigChip>
      ) : (
        <ConfigChip label="Dimensi" value={labelFor(IMAGE_DIMENSION_PRESETS, params.dimensionPreset ?? "medium")}>
          <div className="space-y-2">
            <OptionList
              options={IMAGE_DIMENSION_PRESETS}
              value={params.dimensionPreset ?? "medium"}
              onChange={(preset) => {
                const next = imageTargetSize({ ...params, dimensionPreset: preset as ImageParams["dimensionPreset"] });
                onChange({ dimensionPreset: preset as ImageParams["dimensionPreset"], width: next.width, height: next.height });
              }}
            />
            <p className="px-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              {size.width}×{size.height} px
            </p>
          </div>
        </ConfigChip>
      )}
    </>
  );
}

export function VideoConfig({
  params,
  onChange,
}: {
  params: VideoParams;
  onChange: (patch: Partial<VideoParams>) => void;
}) {
  const [frame, setFrame] = useState<StartFrame | null>(null);
  const dims = `${videoTargetSize(params.aspectRatio, params.resolution).width}×${
    videoTargetSize(params.aspectRatio, params.resolution).height
  }`;
  return (
    <>
      <ConfigChip label="Rasio" value={params.aspectRatio}>
        <OptionList options={VIDEO_RATIOS} value={params.aspectRatio} onChange={(aspectRatio) => onChange({ aspectRatio })} />
      </ConfigChip>
      <ConfigChip label="Durasi" value={`${params.durationSeconds} detik`}>
        <OptionList
          options={VIDEO_DURATIONS.map((value) => ({ value, label: `${value} detik` }))}
          value={params.durationSeconds}
          onChange={(value) => onChange({ durationSeconds: Number(value) })}
        />
      </ConfigChip>
      <ConfigChip label="Resolusi" value={`${params.resolution} · ${dims}`}>
        <OptionList
          options={VIDEO_RESOLUTIONS}
          value={params.resolution}
          onChange={(resolution) => onChange({ resolution: resolution as VideoParams["resolution"] })}
        />
      </ConfigChip>
      <ConfigChip label="Start frame" value={frame ? "Ada" : "Tidak ada"}>
        <StartFramePicker
          value={frame}
          onChange={(next) => {
            setFrame(next);
            onChange({ startFrameAssetId: next?.assetId ?? null });
          }}
        />
      </ConfigChip>
    </>
  );
}

export function AudioConfig({
  params,
  onChange,
}: {
  params: AudioParams;
  onChange: (patch: Partial<AudioParams>) => void;
}) {
  return (
    <>
      <ConfigChip label="Suara" value={params.voiceName || params.voiceId}>
        <VoicePicker
          value={params.voiceId}
          language={params.language}
          onChange={(voice) => onChange({ voiceId: voice.id, voiceName: voice.name })}
        />
      </ConfigChip>
      <ConfigChip label="Bahasa" value={labelFor(AUDIO_LANGUAGES, params.language)}>
        <OptionList
          options={AUDIO_LANGUAGES}
          value={params.language}
          onChange={(language) => onChange({ language: language as AudioParams["language"] })}
        />
      </ConfigChip>
      <ConfigChip label="Kecepatan" value={`${params.speed}×`}>
        <FieldRow label="Kecepatan bicara" hint={`${AUDIO_SPEED_MIN}–${AUDIO_SPEED_MAX}×`}>
          <input
            type="range"
            min={AUDIO_SPEED_MIN}
            max={AUDIO_SPEED_MAX}
            step={AUDIO_SPEED_STEP}
            value={params.speed}
            onChange={(event) => onChange({ speed: Number(event.target.value) })}
            className="w-full accent-brand"
          />
        </FieldRow>
      </ConfigChip>
      <ConfigChip label="Gaya" value={labelFor(AUDIO_STYLES, params.style)}>
        <OptionList
          options={AUDIO_STYLES}
          value={params.style}
          onChange={(style) => onChange({ style: style as AudioParams["style"] })}
        />
      </ConfigChip>
      <ConfigChip label="Format" value={labelFor(AUDIO_FORMATS, params.format)}>
        <OptionList
          options={AUDIO_FORMATS}
          value={params.format}
          onChange={(format) => onChange({ format: format as AudioParams["format"] })}
        />
      </ConfigChip>
    </>
  );
}

export function BriefConfig({
  params,
  onChange,
}: {
  params: BriefParams;
  onChange: (patch: Partial<BriefParams>) => void;
}) {
  return (
    <>
      <ConfigChip label="Jenis" value={labelFor(BRIEF_CONTENT_TYPES, params.contentType)}>
        <OptionList
          options={BRIEF_CONTENT_TYPES}
          value={params.contentType}
          onChange={(contentType) => onChange({ contentType: contentType as BriefParams["contentType"] })}
        />
      </ConfigChip>
      <ConfigChip label="Platform" value={labelFor(BRIEF_PLATFORMS, params.platform)}>
        <OptionList options={BRIEF_PLATFORMS} value={params.platform} onChange={(platform) => onChange({ platform })} />
      </ConfigChip>
      <ConfigChip label="Tone" value={labelFor(BRIEF_TONES, params.tone)}>
        <OptionList options={BRIEF_TONES} value={params.tone} onChange={(tone) => onChange({ tone })} />
      </ConfigChip>
      <ConfigChip label="Bahasa" value={labelFor(BRIEF_LANGUAGES, params.language)}>
        <OptionList
          options={BRIEF_LANGUAGES}
          value={params.language}
          onChange={(language) => onChange({ language: language as BriefParams["language"] })}
        />
      </ConfigChip>
      <ConfigChip label="Panjang" value={labelFor(BRIEF_LENGTHS, params.length)}>
        <OptionList
          options={BRIEF_LENGTHS}
          value={params.length}
          onChange={(length) => onChange({ length: length as BriefParams["length"] })}
        />
      </ConfigChip>
      <ConfigChip label="Audiens" value={params.audience || "Umum"}>
        <FieldRow label="Target audiens" hint={`maks ${BRIEF_AUDIENCE_MAX}`}>
          <input
            type="text"
            maxLength={BRIEF_AUDIENCE_MAX}
            value={params.audience}
            placeholder="mis. karyawan muda 22–30 th"
            onChange={(event) => onChange({ audience: event.target.value })}
            className="w-full rounded-xl border border-zinc-900/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
          />
        </FieldRow>
      </ConfigChip>
    </>
  );
}

export const CONFIG_PANEL = {
  image: ImageConfig,
  video: VideoConfig,
  audio: AudioConfig,
  brief: BriefConfig,
} as const;

export function ConfigRow({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}

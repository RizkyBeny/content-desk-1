"use client";

import { Button } from "@heroui/react";
import {
  AlignBottomIcon,
  AlignCenterIcon,
  AlignLeftIcon,
  AlignMiddleIcon,
  AlignRightIcon,
  AlignTopIcon,
  AudioIcon,
  CropLandscapeIcon,
  CropPortraitIcon,
  ImageIcon,
  SparkIcon,
  SquareDashedIcon,
  TextIcon,
  VolumeIcon,
} from "@/components/ui/icons";
import type { Ratio, SubtitleCue } from "@/types";
import {
  FieldRow,
  HIGHLIGHT_SELECT,
  HIGHLIGHT_SWATCHES,
  OverlaySelect,
  SectionBlock,
  Segmented,
  SliderField,
  ToggleField,
  hintCls,
  inputCls,
  labelCls,
  selectCls,
} from "./ui";
import type { EditorUi } from "./use-editor-ui";

const ASPECT: Record<Ratio, string> = { "9:16": "9/16", "16:9": "16/9", "1:1": "1/1", "4:5": "4/5" };
const RATIOS: Ratio[] = ["9:16", "16:9", "1:1", "4:5"];

const RATIO_OPTIONS: { value: Ratio; label: React.ReactNode; title: string }[] = [
  { value: "9:16", label: <CropPortraitIcon width={16} height={16} />, title: "Potret 9:16" },
  { value: "16:9", label: <CropLandscapeIcon width={16} height={16} />, title: "Lanskap 16:9" },
  { value: "1:1", label: <SquareDashedIcon width={16} height={16} />, title: "Persegi 1:1" },
  { value: "4:5", label: <ImageIcon width={16} height={16} />, title: "Potret 4:5" },
];

const ALIGN_OPTIONS = [
  { value: "left" as const, label: <AlignLeftIcon width={15} height={15} />, title: "Rata kiri" },
  { value: "center" as const, label: <AlignCenterIcon width={15} height={15} />, title: "Rata tengah" },
  { value: "right" as const, label: <AlignRightIcon width={15} height={15} />, title: "Rata kanan" },
];

const PLACEMENT_OPTIONS = [
  { value: "top" as const, label: <AlignTopIcon width={15} height={15} />, title: "Atas" },
  { value: "middle" as const, label: <AlignMiddleIcon width={15} height={15} />, title: "Tengah" },
  { value: "bottom" as const, label: <AlignBottomIcon width={15} height={15} />, title: "Bawah" },
];

const PROMO_TRANSITIONS = [
  { value: "fade", label: "Fade" },
  { value: "slide", label: "Slide" },
  { value: "zoom", label: "Zoom" },
  { value: "none", label: "Tanpa transisi" },
];

export function CanvasEditorSection({
  ratio,
  onRatio,
  ui,
  patchUi,
  durationSec,
  onDuration,
}: {
  ratio: Ratio;
  onRatio: (ratio: Ratio) => void;
  ui: EditorUi["ui"];
  patchUi: EditorUi["patchUi"];
  durationSec?: number;
  onDuration?: (sec: number) => void;
}) {
  return (
    <SectionBlock
      title="Canvas Editor"
      description="Atur rasio, durasi, dan tampilan klip di canvas editor dengan preview realtime."
    >
      <Segmented label="Orientasi Canvas" value={ratio} options={RATIO_OPTIONS} onChange={onRatio} />
      <FieldRow label="Durasi (detik)">
        <input
          type="number"
          min={1}
          max={600}
          value={durationSec ?? ui.mediaDurationSec}
          onChange={(e) => {
            const v = Math.max(1, Number(e.target.value) || 1);
            if (onDuration) onDuration(v);
            else patchUi({ mediaDurationSec: v });
          }}
          className={`${inputCls} w-24 text-right`}
        />
      </FieldRow>
    </SectionBlock>
  );
}

export function TypographySection({ ui, patchUi }: { ui: EditorUi["ui"]; patchUi: EditorUi["patchUi"] }) {
  return (
    <SectionBlock title="Typography" description="Atur teks judul, penempatan, dan warna highlight.">
      <Segmented label="Alignment" value={ui.alignment} options={ALIGN_OPTIONS} onChange={(v) => patchUi({ alignment: v })} />
      <Segmented
        label="Text Placement"
        value={ui.textPlacement}
        options={PLACEMENT_OPTIONS}
        onChange={(v) => patchUi({ textPlacement: v })}
      />

      <label className={labelCls}>
        <span>Teks Judul</span>
        <textarea
          value={ui.titleText}
          onChange={(e) => patchUi({ titleText: e.target.value })}
          rows={2}
          placeholder="Masukkan judul…"
          className={`${inputCls} mt-1 resize-none`}
        />
      </label>

      <div>
        <ToggleField label="Highlight" checked={ui.highlightOn} onChange={(v) => patchUi({ highlightOn: v })} />
        {ui.highlightOn ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {HIGHLIGHT_SWATCHES.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                aria-pressed={ui.highlightColor === c.value}
                onClick={() => patchUi({ highlightColor: c.value })}
                className={`size-6 rounded-full border transition-transform ${
                  ui.highlightColor === c.value
                    ? "scale-110 border-zinc-900 ring-2 ring-zinc-900/30 dark:border-white dark:ring-white/30"
                    : "border-zinc-300 dark:border-zinc-600"
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
            <select
              value={ui.highlightColor}
              onChange={(e) => patchUi({ highlightColor: e.target.value })}
              className={`${selectCls} ml-1 w-32`}
            >
              {HIGHLIGHT_SELECT.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div>
        <ToggleField label="Deskripsi" checked={ui.descOn} onChange={(v) => patchUi({ descOn: v })} />
        {ui.descOn ? (
          <textarea
            value={ui.descText}
            onChange={(e) => patchUi({ descText: e.target.value })}
            rows={2}
            placeholder="Deskripsi singkat…"
            className={`${inputCls} mt-2 resize-none`}
          />
        ) : null}
      </div>
    </SectionBlock>
  );
}

export function MediaConfigSection({ ui, patchUi }: { ui: EditorUi["ui"]; patchUi: EditorUi["patchUi"] }) {
  return (
    <SectionBlock title="Media Konfigurasi" description="Atur penempatan media, overlay, dan durasi tampil.">
      <div>
        <span className={labelCls}>Penempatan Media</span>
        <Segmented
          className="mt-1.5"
          value={ui.fitMode}
          options={[
            { value: "fill" as const, label: "Fill", title: "Penuhi canvas" },
            { value: "fit" as const, label: "Fit", title: "Sesuaikan rasio" },
          ]}
          onChange={(v) => patchUi({ fitMode: v })}
        />
        <p className={hintCls}>Fill memotong tepi media; Fit menampilkan seluruh area dengan sisa ruang.</p>
      </div>

      <OverlaySelect value={ui.overlay} onChange={(v) => patchUi({ overlay: v })} />

      <FieldRow label="Durasi tampil (detik)">
        <input
          type="number"
          min={1}
          max={60}
          value={ui.mediaDurationSec}
          onChange={(e) => patchUi({ mediaDurationSec: Math.max(1, Number(e.target.value) || 1) })}
          className={`${inputCls} w-24 text-right`}
        />
      </FieldRow>
    </SectionBlock>
  );
}

export function AudioLatarSection({
  music,
  onVolume,
  onClear,
}: {
  music: { assetId: string | null; volume: number } | null | undefined;
  onVolume: (v: number) => void;
  onClear: () => void;
}) {
  return (
    <SectionBlock title="Audio Latar" description="Pilih musik latar dan atur volumenya untuk seluruh konten.">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm">
          <AudioIcon width={15} height={15} /> Backsound
        </span>
        {music?.assetId ? (
          <button type="button" onClick={onClear} className="text-xs font-medium text-red-500 hover:text-red-600">
            Clear
          </button>
        ) : null}
      </div>

      {music?.assetId ? (
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200/70 bg-zinc-100/70 px-2 py-1.5 text-sm dark:border-white/10 dark:bg-zinc-800/60">
          <VolumeIcon width={14} height={14} className="shrink-0 text-zinc-500" />
          <span className="min-w-0 flex-1 truncate text-xs text-zinc-600 dark:text-zinc-300">Backsound aktif</span>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-zinc-200/70 px-3 py-2 text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400">
          Belum ada backsound. Klik “Tambah Backsound” di timeline.
        </p>
      )}

      <SliderField
        label="Pengaturan Volume"
        value={music ? music.volume : 0}
        min={0}
        max={1}
        step={0.05}
        onChange={onVolume}
        format={(v) => `${Math.round(v * 100)}%`}
      />
    </SectionBlock>
  );
}

export function VideoPromoSection({ ui, patchUi }: { ui: EditorUi["ui"]; patchUi: EditorUi["patchUi"] }) {
  return (
    <SectionBlock title="Video Promo" description="Sisipkan video promo transisi di akhir konten.">
      <ToggleField label="Aktifkan video promo" checked={ui.promoOn} onChange={(v) => patchUi({ promoOn: v })} />
      {ui.promoOn ? (
        <>
          <label className={labelCls}>
            <span>Sumber video</span>
            <select
              value={ui.promoTransition}
              onChange={(e) => patchUi({ promoTransition: e.target.value })}
              className={`${selectCls} mt-1`}
            >
              {PROMO_TRANSITIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <FieldRow label="Durasi promo (detik)">
            <input
              type="number"
              min={1}
              max={20}
              value={ui.promoDurationSec}
              onChange={(e) => patchUi({ promoDurationSec: Math.max(1, Number(e.target.value) || 1) })}
              className={`${inputCls} w-24 text-right`}
            />
          </FieldRow>
        </>
      ) : null}
    </SectionBlock>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab Watermark
// ─────────────────────────────────────────────────────────────

export function WatermarkPanel({ ui, patchUi }: { ui: EditorUi["ui"]; patchUi: EditorUi["patchUi"] }) {
  return (
    <div className="divide-y divide-zinc-200/60 dark:divide-white/10">
      <SectionBlock title="Watermark" description="Tambahkan identitas merek pada hasil konten.">
        <ToggleField label="Tampilkan watermark" checked={ui.watermarkOn} onChange={(v) => patchUi({ watermarkOn: v })} />
        {ui.watermarkOn ? (
          <>
            <label className={labelCls}>
              <span>Teks watermark</span>
              <input
                value={ui.watermarkText}
                onChange={(e) => patchUi({ watermarkText: e.target.value })}
                placeholder="Nama brand / handle…"
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className={labelCls}>
              <span>Posisi</span>
              <select
                value={ui.watermarkPos}
                onChange={(e) => patchUi({ watermarkPos: e.target.value as EditorUi["ui"]["watermarkPos"] })}
                className={`${selectCls} mt-1`}
              >
                <option value="top-left">Kiri atas</option>
                <option value="top-right">Kanan atas</option>
                <option value="center">Tengah</option>
                <option value="bottom-left">Kiri bawah</option>
                <option value="bottom-right">Kanan bawah</option>
              </select>
            </label>
            <SliderField
              label="Opasitas"
              value={ui.watermarkOpacity}
              min={0.1}
              max={1}
              step={0.05}
              onChange={(v) => patchUi({ watermarkOpacity: v })}
              format={(v) => `${Math.round(v * 100)}%`}
            />
          </>
        ) : null}
      </SectionBlock>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab Voice Over
// ─────────────────────────────────────────────────────────────

const VOICES = [
  { value: "wanita-natural", label: "Wanita Natural" },
  { value: "pria-natural", label: "Pria Natural" },
  { value: "wanita-energik", label: "Wanita Energik" },
  { value: "pria-berwibawa", label: "Pria Berwibawa" },
];

export function VoiceOverPanel({
  ui,
  patchUi,
  onGenerate,
  busy,
}: {
  ui: EditorUi["ui"];
  patchUi: EditorUi["patchUi"];
  onGenerate: () => void;
  busy?: boolean;
}) {
  return (
    <div className="divide-y divide-zinc-200/60 dark:divide-white/10">
      <SectionBlock
        title="Voice Over"
        description="Buat narasi suara dari teks untuk seluruh konten."
        action={
          <Button size="sm" variant="secondary" onPress={onGenerate} isDisabled={busy || !ui.voiceText.trim()}>
            <TextIcon width={14} height={14} /> {busy ? "Membuat…" : "Buat VO"}
          </Button>
        }
      >
        <label className={labelCls}>
          <span>Teks narasi</span>
          <textarea
            value={ui.voiceText}
            onChange={(e) => patchUi({ voiceText: e.target.value })}
            rows={5}
            placeholder="Tulis atau tempel naskah narasi…"
            className={`${inputCls} mt-1 resize-none`}
          />
        </label>

        <label className={labelCls}>
          <span>Pilih suara</span>
          <select
            value={ui.voiceVoice}
            onChange={(e) => patchUi({ voiceVoice: e.target.value })}
            className={`${selectCls} mt-1`}
          >
            <option value="">Pilih suara…</option>
            {VOICES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </label>

        <SliderField
          label="Kecepatan bicara"
          value={ui.voiceSpeed}
          min={0.75}
          max={1.5}
          step={0.05}
          onChange={(v) => patchUi({ voiceSpeed: v })}
          format={(v) => `${v.toFixed(2)}x`}
        />
      </SectionBlock>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Subtitle (khusus video)
// ─────────────────────────────────────────────────────────────

export function SubtitleSection({
  state,
  controller,
  onGenerate,
}: {
  state: { subtitles: SubtitleCue[] };
  controller: { setState: (fn: (s: import("@/types").EditorState) => import("@/types").EditorState) => void };
  onGenerate: () => void;
}) {
  return (
    <SectionBlock
      title="Subtitle"
      description={`${state.subtitles.length} cue — buat otomatis dari teks on-screen.`}
      action={
        <Button size="sm" variant="secondary" onPress={onGenerate}>
          <SparkIcon width={14} height={14} /> Otomatis
        </Button>
      }
    >
      {state.subtitles.length === 0 ? (
        <p className={hintCls}>Belum ada subtitle.</p>
      ) : (
        <div className="space-y-2">
          {state.subtitles.map((cue, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <input
                type="number"
                step={0.1}
                value={cue.fromSec}
                aria-label={`Cue ${i + 1} mulai`}
                onChange={(e) =>
                  controller.setState((s) =>
                    s.type === "video"
                      ? { ...s, subtitles: s.subtitles.map((c, j) => (j === i ? { ...c, fromSec: Number(e.target.value) } : c)) }
                      : s,
                  )
                }
                className={`${inputCls} w-16 px-1 py-0.5 text-xs`}
              />
              <input
                type="number"
                step={0.1}
                value={cue.toSec}
                aria-label={`Cue ${i + 1} selesai`}
                onChange={(e) =>
                  controller.setState((s) =>
                    s.type === "video"
                      ? { ...s, subtitles: s.subtitles.map((c, j) => (j === i ? { ...c, toSec: Number(e.target.value) } : c)) }
                      : s,
                  )
                }
                className={`${inputCls} w-16 px-1 py-0.5 text-xs`}
              />
              <input
                value={cue.text}
                aria-label={`Cue ${i + 1} teks`}
                onChange={(e) =>
                  controller.setState((s) =>
                    s.type === "video"
                      ? { ...s, subtitles: s.subtitles.map((c, j) => (j === i ? { ...c, text: e.target.value } : c)) }
                      : s,
                  )
                }
                className={`${inputCls} min-w-0 flex-1 px-2 py-0.5 text-xs`}
              />
            </div>
          ))}
        </div>
      )}
    </SectionBlock>
  );
}

export { ASPECT, RATIOS };

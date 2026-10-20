"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  AlignBottomIcon,
  AlignCenterHorizontalIcon,
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  ChevronDownIcon,
  CropLandscapeIcon,
  CropPortraitIcon,
  ExpandUpDownIcon,
  ImageIcon,
  SquareDashedIcon,
  TextIcon,
  Upload05Icon,
} from "@/components/ui/icons";
import type { Ratio } from "@/types";
import {
  EdSlider,
  EditorButton,
  FieldLabel,
  HIGHLIGHT_SWATCHES,
  InputAddonButton,
  InputGroup,
  SectionBlock,
  Segmented,
  SwatchRow,
  SwitchRow,
  TextareaField,
  hintCls,
  type SegmentOption,
} from "./ui";
import type { EditorUi } from "./use-editor-ui";

/* ─────────────────────────────────────────────────────────────────────────
   Seksi panel Properties — mengikuti Figma "Video Editor" (node 660-13750):
   Canvas Editor, Typography, Media Konfigurasi, Audio Latar, Video Promo.
   ───────────────────────────────────────────────────────────────────────── */

/** Rasio kanvas per tipe — urutan 16:9 / 1:1 / 9:16 sesuai desain video. */
const RATIO_META: Record<Ratio, { icon: ReactNode; label: string }> = {
  "16:9": { icon: <CropLandscapeIcon width={16} height={16} />, label: "16:9" },
  "1:1": { icon: <SquareDashedIcon width={16} height={16} />, label: "1:1" },
  "9:16": { icon: <CropPortraitIcon width={16} height={16} />, label: "9:16" },
  "4:5": { icon: <ImageIcon width={16} height={16} />, label: "4:5" },
};

const DEFAULT_RATIOS: Ratio[] = ["16:9", "1:1", "9:16"];

const ALIGN_OPTIONS: SegmentOption<EditorUi["ui"]["alignment"]>[] = [
  { value: "left", label: (<><AlignLeftIcon width={16} height={16} /> Left</>), title: "Rata kiri" },
  { value: "center", label: (<><AlignCenterIcon width={16} height={16} /> Center</>), title: "Rata tengah" },
  { value: "right", label: (<><AlignRightIcon width={16} height={16} /> Right</>), title: "Rata kanan" },
];

const PLACEMENT_OPTIONS: SegmentOption<EditorUi["ui"]["textPlacement"]>[] = [
  { value: "top", label: (<><AlignTopIcon width={16} height={16} /> Top</>), title: "Atas" },
  { value: "middle", label: (<><AlignCenterHorizontalIcon width={16} height={16} /> Center</>), title: "Tengah" },
  { value: "bottom", label: (<><AlignBottomIcon width={16} height={16} /> Bottom</>), title: "Bawah" },
];

const FIT_OPTIONS: { value: EditorUi["ui"]["fitMode"]; label: string }[] = [
  { value: "fill", label: "Fill - isi frame" },
  { value: "fit", label: "Fit - sesuai format asli" },
];

const OVERLAY_OPTIONS: { value: EditorUi["ui"]["overlay"]; label: string }[] = [
  { value: "none", label: "Tanpa overlay" },
  { value: "gradient", label: "Overlay-bawah" },
  { value: "blur", label: "Blur" },
  { value: "vignette", label: "Vignette" },
];

const PROMO_TRANSITIONS = [
  { value: "fade", label: "Fade out/ fade in" },
  { value: "slide", label: "Geser" },
  { value: "zoom", label: "Zoom" },
  { value: "none", label: "Tanpa transisi" },
];

const FIT_HINT =
  "Pengaturan untuk menampilkan media/aset dengan format fullscreen (fill) atau sesuai format asli";

/** Select bergaya InputGroup (h32, elev, chevron kanan) — dipakai beberapa seksi. */
function SelectGroup<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-8 items-center rounded-[var(--ed-ctl-r)] border border-ed-input-b bg-ed-elev",
        className,
      )}
    >
      <select
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-full w-full appearance-none bg-transparent pr-8 pl-2 font-[family-name:var(--font-ed)] text-sm leading-5 text-ed-text outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        width={16}
        height={16}
        className="pointer-events-none absolute right-2 text-ed-dim"
      />
    </div>
  );
}

/** Tautan "Clear" merah (Geist Medium 12, #A8383E). */
function ClearButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 font-[family-name:var(--font-ed-alt)] text-xs leading-4 font-medium text-ed-danger transition-opacity hover:opacity-80"
    >
      {label}
    </button>
  );
}

/* ── Canvas Editor (video) ─────────────────────────────────────────────── */

export function CanvasEditorSection({
  ratio,
  onRatio,
  ratios = DEFAULT_RATIOS,
}: {
  ratio: Ratio;
  onRatio: (ratio: Ratio) => void;
  ratios?: Ratio[];
}) {
  return (
    <SectionBlock
      title="Canvas Editor"
      description="Atur durasi, tampilan, dan teks dari clip di canvas editor dengan preview realtime"
    >
      <Segmented
        label="Orientasi Canvas"
        value={ratio}
        options={ratios.map((r) => ({ value: r, label: (<>{RATIO_META[r].icon} {RATIO_META[r].label}</>), title: r }))}
        onChange={onRatio}
      />
    </SectionBlock>
  );
}

/* ── Orientasi (image & carousel — node 344-10326) ─────────────────────── */

/**
 * Blok pertama panel Single Image/Carousel: hanya label "Pilih Orientasi"
 * dan segmented 16:9 / 1:1 / 9:16, tanpa judul/deskripsi seksi.
 */
export function OrientationSection({
  ratio,
  onRatio,
  ratios = DEFAULT_RATIOS,
}: {
  ratio: Ratio;
  onRatio: (ratio: Ratio) => void;
  ratios?: Ratio[];
}) {
  return (
    <section className="px-4 py-4">
      <Segmented
        label="Pilih Orientasi"
        value={ratio}
        options={ratios.map((r) => ({ value: r, label: (<>{RATIO_META[r].icon} {RATIO_META[r].label}</>), title: r }))}
        onChange={onRatio}
      />
    </section>
  );
}

/* ── Typography ────────────────────────────────────────────────────────── */

export function TypographySection({
  ui,
  patchUi,
  titleText,
  onTitleText,
  showHighlightColor = true,
}: {
  ui: EditorUi["ui"];
  patchUi: EditorUi["patchUi"];
  /** Judul on-screen (video) — menggantikan `ui.titleText` bila diberikan. */
  titleText?: string;
  onTitleText?: (v: string) => void;
  /** Node 344-10326 (image/carousel) tidak menampilkan baris pilihan warna. */
  showHighlightColor?: boolean;
}) {
  const title = titleText ?? ui.titleText;
  const setTitle = onTitleText ?? ((v: string) => patchUi({ titleText: v }));

  return (
    <SectionBlock title="Typography">
      <Segmented
        label="Alignment"
        value={ui.alignment}
        options={ALIGN_OPTIONS}
        onChange={(v) => patchUi({ alignment: v })}
      />
      <Segmented
        label="Text Placement"
        value={ui.textPlacement}
        options={PLACEMENT_OPTIONS}
        onChange={(v) => patchUi({ textPlacement: v })}
      />

      <div className="flex flex-col gap-2">
        <FieldLabel>Teks Judul</FieldLabel>
        <TextareaField
          value={title}
          onChange={setTitle}
          placeholder="Tulis teks di sini..."
          ariaLabel="Teks Judul"
        />
      </div>

      <div className="flex flex-col gap-2">
        <SwitchRow
          title="Sorotan Teks Judul"
          description="Pengaturan highlight menggunakan latar belakang pada teks yang ingin dipertegas"
          checked={ui.highlightOn}
          onChange={(v) => patchUi({ highlightOn: v })}
        />
        {ui.highlightOn ? (
          <>
            <TextareaField
              value={ui.highlightText}
              onChange={(v) => patchUi({ highlightText: v })}
              placeholder="Tulis teks yang di-highlight..."
              ariaLabel="Teks highlight"
            />
            {showHighlightColor ? (
              <div className="flex flex-col gap-2">
                <FieldLabel>Pilih Warna Highlight</FieldLabel>
                <SwatchRow
                  value={ui.highlightColor}
                  onChange={(c) => patchUi({ highlightColor: c })}
                  swatches={HIGHLIGHT_SWATCHES}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <SwitchRow
          title="Teks Deskripsi"
          checked={ui.descOn}
          onChange={(v) => patchUi({ descOn: v })}
        />
        {ui.descOn ? (
          <TextareaField
            value={ui.descText}
            onChange={(v) => patchUi({ descText: v })}
            placeholder="Tulis deskripsi..."
            ariaLabel="Teks Deskripsi"
          />
        ) : null}
      </div>
    </SectionBlock>
  );
}

/* ── Media Konfigurasi ─────────────────────────────────────────────────── */

export function MediaConfigSection({
  ui,
  patchUi,
  durationSec,
  onDuration,
}: {
  ui: EditorUi["ui"];
  patchUi: EditorUi["patchUi"];
  /** Durasi klip/scene terpilih (video) — jatuh ke `ui.mediaDurationSec`. */
  durationSec?: number;
  onDuration?: (sec: number) => void;
}) {
  const duration = durationSec ?? ui.mediaDurationSec;
  const setDuration = (v: number) => {
    if (onDuration) onDuration(v);
    else patchUi({ mediaDurationSec: v });
  };

  return (
    <SectionBlock title="Media Konfigurasi">
      <div className="flex flex-col gap-2">
        <FieldLabel alt>Durasi</FieldLabel>
        <div className="flex items-center gap-1">
          <InputGroup
            type="number"
            min={1}
            max={600}
            value={duration}
            ariaLabel="Durasi"
            className="min-w-0 flex-1"
            onChange={(v) => setDuration(Math.max(1, Number(v) || 1))}
            addon={<ExpandUpDownIcon width={16} height={16} />}
          />
          <InputGroup value="Detik" readOnly disabled ariaLabel="Satuan detik" className="w-[59px] shrink-0" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel alt>Penempatan Media</FieldLabel>
        <SelectGroup
          value={ui.fitMode}
          options={FIT_OPTIONS}
          onChange={(v) => patchUi({ fitMode: v })}
          ariaLabel="Penempatan Media"
        />
        <p className={cn(hintCls, "font-[family-name:var(--font-ed-alt)]")}>{FIT_HINT}</p>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel>Tambah Overlay</FieldLabel>
        <div className="flex items-center gap-1">
          <SelectGroup
            value={ui.overlay}
            options={OVERLAY_OPTIONS}
            onChange={(v) => patchUi({ overlay: v })}
            ariaLabel="Tambah Overlay"
            className="min-w-0 flex-1"
          />
          <span
            aria-hidden="true"
            className="size-8 shrink-0 rounded-[10px] border opacity-50"
            style={{ backgroundColor: "rgba(0, 177, 176, 0.1)", borderColor: "rgba(0, 161, 161, 0.19)" }}
          />
        </div>
        <p className={cn(hintCls, "font-[family-name:var(--font-ed-alt)]")}>{FIT_HINT}</p>
      </div>
    </SectionBlock>
  );
}

/* ── Audio Latar ───────────────────────────────────────────────────────── */

export function AudioLatarSection({
  music,
  onVolume,
  onClear,
  onPick,
  label = "Backsound",
}: {
  music: { assetId: string | null; volume: number } | null | undefined;
  onVolume: (v: number) => void;
  onClear: () => void;
  /** Membuka pemilih audio (addon upload) bila disediakan. */
  onPick?: () => void;
  label?: string;
}) {
  const active = Boolean(music?.assetId);
  return (
    <SectionBlock
      title="Audio Latar"
      description="Audio mulai dari awal dan mengikuti durasi video, termasuk promo."
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <FieldLabel alt>{label}</FieldLabel>
          {active ? <ClearButton onClick={onClear} label="Clear" /> : null}
        </div>
        <div className="flex items-center gap-1">
          <InputGroup
            value={active ? "Backsound aktif" : ""}
            readOnly
            placeholder="Belum ada backsound"
            ariaLabel={label}
            className="min-w-0 flex-1"
          />
          {onPick ? (
            <InputAddonButton onClick={onPick} ariaLabel="Pilih audio" icon={<Upload05Icon width={16} height={16} />} />
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel alt>Pengaturan Volume</FieldLabel>
        <div className="flex items-center gap-1.5">
          <EdSlider
            value={music ? music.volume : 0}
            min={0}
            max={1}
            step={0.05}
            onChange={onVolume}
            ariaLabel="Pengaturan Volume"
            variant="volume"
            className="min-w-0 flex-1"
          />
          <span className="w-9 shrink-0 text-right font-[family-name:var(--font-ed-alt)] text-xs leading-4 text-ed-dim tabular-nums">
            {Math.round((music ? music.volume : 0) * 100)}%
          </span>
        </div>
      </div>
    </SectionBlock>
  );
}

/* ── Video Promo ───────────────────────────────────────────────────────── */

export function VideoPromoSection({
  ui,
  patchUi,
  sources = [],
}: {
  ui: EditorUi["ui"];
  patchUi: EditorUi["patchUi"];
  /** Aset video yang bisa dipakai sebagai promo (id + nama). */
  sources?: { id: string; name: string }[];
}) {
  return (
    <SectionBlock title="Video Promo" description="Video promo selalu ditambahkan di akhir">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <FieldLabel alt>Source video</FieldLabel>
          {ui.promoSource ? <ClearButton onClick={() => patchUi({ promoSource: "" })} label="Clear" /> : null}
        </div>
        <SelectGroup
          value={ui.promoSource}
          options={[{ value: "", label: "Pilih video promo..." }, ...sources.map((s) => ({ value: s.id, label: s.name }))]}
          onChange={(v) => patchUi({ promoSource: v })}
          ariaLabel="Source video"
        />
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel alt>Transisi Video</FieldLabel>
        <SelectGroup
          value={ui.promoTransition}
          options={PROMO_TRANSITIONS}
          onChange={(v) => patchUi({ promoTransition: v })}
          ariaLabel="Transisi Video"
        />
        <p className="font-[family-name:var(--font-ed-alt)] text-[length:var(--ed-promo-hint)] leading-4 text-ed-dim">
          {FIT_HINT}
        </p>
      </div>
    </SectionBlock>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Tab Watermark / Voice Over — tetap fungsional, memakai primitives baru.
   ───────────────────────────────────────────────────────────────────────── */

export function WatermarkPanel({ ui, patchUi }: { ui: EditorUi["ui"]; patchUi: EditorUi["patchUi"] }) {
  return (
    <SectionBlock title="Watermark" description="Tempel identitas merek pada hasil konten.">
      <SwitchRow
        title="Tampilkan watermark"
        description="Watermark muncul di sudut pilihan pada seluruh konten."
        checked={ui.watermarkOn}
        onChange={(v) => patchUi({ watermarkOn: v })}
      />
      {ui.watermarkOn ? (
        <>
          <div className="flex flex-col gap-2">
            <FieldLabel>Teks watermark</FieldLabel>
            <InputGroup
              value={ui.watermarkText}
              onChange={(v) => patchUi({ watermarkText: v })}
              placeholder="Nama brand / handle..."
              ariaLabel="Teks watermark"
            />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Posisi</FieldLabel>
            <SelectGroup
              value={ui.watermarkPos}
              options={[
                { value: "top-left", label: "Kiri atas" },
                { value: "top-right", label: "Kanan atas" },
                { value: "center", label: "Tengah" },
                { value: "bottom-left", label: "Kiri bawah" },
                { value: "bottom-right", label: "Kanan bawah" },
              ]}
              onChange={(v) => patchUi({ watermarkPos: v })}
              ariaLabel="Posisi watermark"
            />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Opasitas</FieldLabel>
            <div className="flex items-center gap-1.5">
              <EdSlider
                value={ui.watermarkOpacity}
                min={0.1}
                max={1}
                step={0.05}
                onChange={(v) => patchUi({ watermarkOpacity: v })}
                ariaLabel="Opasitas watermark"
                variant="volume"
                className="min-w-0 flex-1"
              />
              <span className="w-9 shrink-0 text-right font-[family-name:var(--font-ed-alt)] text-xs leading-4 text-ed-dim tabular-nums">
                {Math.round(ui.watermarkOpacity * 100)}%
              </span>
            </div>
          </div>
        </>
      ) : null}
    </SectionBlock>
  );
}

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
    <SectionBlock
      title="Voice Over"
      description="Buat narasi suara dari teks untuk seluruh konten."
      action={
        <EditorButton
          variant="default"
          onClick={onGenerate}
          disabled={busy || !ui.voiceText.trim()}
          icon={<TextIcon width={15} height={15} />}
        >
          {busy ? "Membuat..." : "Buat VO"}
        </EditorButton>
      }
    >
      <div className="flex flex-col gap-2">
        <FieldLabel>Teks narasi</FieldLabel>
        <TextareaField
          value={ui.voiceText}
          onChange={(v) => patchUi({ voiceText: v })}
          placeholder="Tulis atau tempel naskah narasi..."
          ariaLabel="Teks narasi"
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel>Pilih suara</FieldLabel>
        <SelectGroup
          value={ui.voiceVoice}
          options={[{ value: "", label: "Pilih suara..." }, ...VOICES]}
          onChange={(v) => patchUi({ voiceVoice: v })}
          ariaLabel="Pilih suara"
        />
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel>Kecepatan bicara</FieldLabel>
        <div className="flex items-center gap-1.5">
          <EdSlider
            value={ui.voiceSpeed}
            min={0.75}
            max={1.5}
            step={0.05}
            onChange={(v) => patchUi({ voiceSpeed: v })}
            ariaLabel="Kecepatan bicara"
            variant="volume"
            className="min-w-0 flex-1"
          />
          <span className="w-9 shrink-0 text-right font-[family-name:var(--font-ed-alt)] text-xs leading-4 text-ed-dim tabular-nums">
            {ui.voiceSpeed.toFixed(2)}x
          </span>
        </div>
      </div>
    </SectionBlock>
  );
}

import type {
  AudioEditorState,
  AudioSegment,
  BriefRow,
  CanvasFilters,
  CarouselEditorState,
  ContentType,
  EditorState,
  ImageEditorState,
  Ratio,
  SceneObject,
  SceneText,
  SlideObject,
  TextLayer,
  VideoEditorState,
} from "@/types";

const RATIOS: Ratio[] = ["1:1", "4:5", "9:16", "16:9"];

const DIMS: Record<Ratio, { w: number; h: number }> = {
  "1:1": { w: 1080, h: 1080 },
  "4:5": { w: 1080, h: 1350 },
  "9:16": { w: 1080, h: 1920 },
  "16:9": { w: 1920, h: 1080 },
};

const DEFAULT_FILTERS: CanvasFilters = { brightness: 0, contrast: 0, saturation: 0 };

export interface EditorItemSeed {
  briefRowRef: number;
  assetId: string | null;
}

function asRatio(value: unknown, fallback: Ratio): Ratio {
  const v = String(value ?? "");
  return (RATIOS as string[]).includes(v) ? (v as Ratio) : fallback;
}

function num(value: unknown, fallback: number): number {
  const n = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function clampText(text: string, max: number): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function textLayer(id: string, text: string, dims: { w: number; h: number }): TextLayer {
  return {
    id,
    type: "text",
    text: clampText(text, 160),
    x: Math.round(dims.w * 0.06),
    y: Math.round(dims.h * 0.68),
    fontSize: Math.round(dims.w * 0.066),
    fontFamily: "Inter",
    color: "#FFFFFF",
    align: "left",
    shadow: true,
    rotation: 0,
  };
}

function slideFor(ref: number, assetId: string | null, row: BriefRow, text: string): SlideObject {
  const ratio = asRatio(row.rasio, "4:5");
  const dims = DIMS[ratio];
  const layers: TextLayer[] = text ? [textLayer(`text-${ref}`, text, dims)] : [];
  return {
    id: `slide-${ref}`,
    background: assetId ? { assetId, fit: "cover" } : null,
    background_color: "#111318",
    layers,
    filters: { ...DEFAULT_FILTERS },
    rotation: 0,
    scale: 1,
  };
}

function imageState(items: EditorItemSeed[], rows: BriefRow[]): ImageEditorState {
  const row = rows[0] ?? {};
  const ratio = asRatio(row.rasio, "1:1");
  return {
    type: "image",
    ratio,
    slide: slideFor(1, items[0]?.assetId ?? null, { ...row, rasio: ratio }, row.teks ?? ""),
  };
}

function carouselState(items: EditorItemSeed[], rows: BriefRow[]): CarouselEditorState {
  const ratio = asRatio(rows[0]?.rasio, "4:5");
  const slides = items.map((it) => {
    const row = rows[it.briefRowRef - 1] ?? {};
    return slideFor(it.briefRowRef, it.assetId, { ...row, rasio: ratio }, row.judul ?? "");
  });
  return { type: "carousel", ratio, slides: slides.length ? slides : [slideFor(1, null, { rasio: ratio }, "")] };
}

function videoState(items: EditorItemSeed[], rows: BriefRow[]): VideoEditorState {
  const ratio = asRatio(rows[0]?.rasio, "9:16");
  const scenes: SceneObject[] = items.map((it) => {
    const row = rows[it.briefRowRef - 1] ?? {};
    const dur = num(row.durasi, 4);
    const texts: SceneText[] = row.teks_onscreen
      ? [{ id: `ov-${it.briefRowRef}`, text: clampText(row.teks_onscreen, 140), fromSec: 0, toSec: dur }]
      : [];
    return {
      id: `scene-${it.briefRowRef}`,
      clipAssetId: it.assetId,
      clipSrc: null,
      startSec: 0,
      endSec: dur,
      texts,
    };
  });
  return { type: "video", ratio, resolution: "1080p", scenes, narration: null, music: null, subtitles: [] };
}

function audioState(items: EditorItemSeed[], rows: BriefRow[]): AudioEditorState {
  const segments: AudioSegment[] = items.map((it) => {
    const row = rows[it.briefRowRef - 1] ?? {};
    return {
      id: `seg-${it.briefRowRef}`,
      segRef: it.briefRowRef,
      text: row.naskah ?? "",
      voice: "mock-voice",
      speed: 1,
      tone: row.nada ?? "netral",
      assetId: it.assetId,
      src: null,
      durationSec: num(row.durasi, 6),
    };
  });
  return { type: "audio", voice: "mock-voice", segments, music: null, trimStartSec: 0, trimEndSec: null };
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function articleState(rows: BriefRow[]): EditorState {
  const html = rows
    .map((row, i) => {
      const title = row.judul || `Bagian ${i + 1}`;
      const body = row.poin ?? "";
      const ref = row.referensi ? `<p><em>Sumber: ${escapeHtml(row.referensi)}</em></p>` : "";
      return `<h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p>${ref}`;
    })
    .join("");
  return { type: "article", html: html || "<p></p>" };
}

/**
 * Build the initial editorState for a Creation from its generated items and
 * brief rows. Pure (no DB) so it can be unit-tested.
 */
export function buildInitialEditorState(
  type: ContentType,
  items: EditorItemSeed[],
  rows: BriefRow[],
): EditorState {
  const safeItems = items.length ? items : [{ briefRowRef: 1, assetId: null }];
  switch (type) {
    case "carousel":
      return carouselState(safeItems, rows);
    case "video":
      return videoState(safeItems, rows);
    case "audio":
      return audioState(safeItems, rows);
    case "article":
      return articleState(rows);
    default:
      return imageState(safeItems, rows);
  }
}

import { CANVAS_DIMS } from "@/components/editor/canvas/dims";
import type { CarouselEditorState, ImageEditorState, MediaRef, Ratio, SlideObject, TextLayer } from "@/types";

export type DesignKind = "image" | "carousel";

export interface DesignTemplate {
  id: string;
  title: string;
  category: string;
  kind: DesignKind;
  ratio: Ratio;
  thumbnail: string;
  build: () => ImageEditorState | CarouselEditorState;
}

export const DESIGN_RATIOS: Ratio[] = ["1:1", "4:5", "9:16", "16:9"];

const DEFAULT_BG = "#111318";

function bgRef(path: string): MediaRef {
  return { assetId: path, src: path, fit: "cover" };
}

function emptySlide(id: string): SlideObject {
  return {
    id,
    background: null,
    background_color: DEFAULT_BG,
    layers: [],
    filters: { brightness: 0, contrast: 0, saturation: 0 },
    rotation: 0,
    scale: 1,
  };
}

interface TextSpec {
  text: string;
  /** Top of the text block, as a fraction of canvas height. */
  y: number;
  /** Font size as a fraction of canvas width. */
  fontSize: number;
  align?: TextLayer["align"];
  color?: string;
  fontStyle?: string;
  shadow?: boolean;
}

function textLayer(ratio: Ratio, id: string, spec: TextSpec): TextLayer {
  const { w, h } = CANVAS_DIMS[ratio];
  return {
    id,
    type: "text",
    text: spec.text,
    x: Math.round(w * 0.07),
    y: Math.round(h * spec.y),
    fontSize: Math.round(w * spec.fontSize),
    fontFamily: "Inter",
    color: spec.color ?? "#FFFFFF",
    align: spec.align ?? "center",
    shadow: spec.shadow ?? true,
    rotation: 0,
    ...(spec.fontStyle ? { fontStyle: spec.fontStyle } : {}),
  };
}

function imageSlide(tplId: string, ratio: Ratio, thumb: string, specs: TextSpec[]): SlideObject {
  return {
    ...emptySlide(`${tplId}-s1`),
    background: bgRef(thumb),
    layers: specs.map((spec, i) => textLayer(ratio, `${tplId}-s1-t${i + 1}`, spec)),
  };
}

function carouselSlides(tplId: string, ratio: Ratio, thumb: string, slides: TextSpec[][]): SlideObject[] {
  return slides.map((specs, s) => ({
    ...emptySlide(`${tplId}-s${s + 1}`),
    background: bgRef(thumb),
    layers: specs.map((spec, i) => textLayer(ratio, `${tplId}-s${s + 1}-t${i + 1}`, spec)),
  }));
}

/** Blank canvas states for "start from scratch". */
export function blankEditorState(kind: DesignKind, ratio: Ratio): ImageEditorState | CarouselEditorState {
  if (kind === "image") {
    return { type: "image", ratio, slide: emptySlide("slide-1") };
  }
  return {
    type: "carousel",
    ratio,
    slides: [emptySlide("slide-1"), emptySlide("slide-2"), emptySlide("slide-3")],
  };
}

function imageTemplate(
  t: Omit<DesignTemplate, "build" | "thumbnail"> & { thumb: string; specs: TextSpec[] },
): DesignTemplate {
  const { thumb, specs, ...meta } = t;
  return {
    ...meta,
    thumbnail: thumb,
    build: () => ({ type: "image", ratio: meta.ratio, slide: imageSlide(meta.id, meta.ratio, thumb, specs) }),
  };
}

function carouselTemplate(
  t: Omit<DesignTemplate, "build" | "thumbnail"> & { thumb: string; slides: TextSpec[][] },
): DesignTemplate {
  const { thumb, slides, ...meta } = t;
  return {
    ...meta,
    thumbnail: thumb,
    build: () => ({ type: "carousel", ratio: meta.ratio, slides: carouselSlides(meta.id, meta.ratio, thumb, slides) }),
  };
}

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  imageTemplate({
    id: "dpromo-flash",
    title: "Flash Sale",
    category: "Promo",
    kind: "image",
    ratio: "1:1",
    thumb: "/seed/unsplash/abstract-01.jpg",
    specs: [
      { text: "FLASH SALE", y: 0.58, fontSize: 0.13, fontStyle: "bold" },
      { text: "Diskon hingga 50% — khusus hari ini", y: 0.74, fontSize: 0.045 },
    ],
  }),
  imageTemplate({
    id: "dquote-senja",
    title: "Kutipan Senja",
    category: "Kutipan",
    kind: "image",
    ratio: "4:5",
    thumb: "/seed/unsplash/abstract-06.jpg",
    specs: [
      { text: "“Setiap hari adalah kesempatan baru untuk memulai.”", y: 0.38, fontSize: 0.06, fontStyle: "italic" },
      { text: "— Redaksi", y: 0.56, fontSize: 0.04, color: "#F5D0A9", shadow: false },
    ],
  }),
  imageTemplate({
    id: "devent-webinar",
    title: "Webinar Gratis",
    category: "Pengumuman",
    kind: "image",
    ratio: "16:9",
    thumb: "/seed/unsplash/abstract-04.jpg",
    specs: [
      { text: "WEBINAR GRATIS", y: 0.3, fontSize: 0.05, fontStyle: "bold", color: "#A5B4FC" },
      { text: "Strategi Konten AI 2026", y: 0.44, fontSize: 0.08, fontStyle: "bold" },
      { text: "Sabtu, 25 Oktober • 19.00 WIB", y: 0.64, fontSize: 0.035 },
    ],
  }),
  imageTemplate({
    id: "dpromo-story",
    title: "Promo Story",
    category: "Promo",
    kind: "image",
    ratio: "9:16",
    thumb: "/seed/unsplash/abstract-08.jpg",
    specs: [
      { text: "PRODUK BARU", y: 0.62, fontSize: 0.1, fontStyle: "bold" },
      { text: "Beli 2 gratis 1 minggu ini", y: 0.73, fontSize: 0.042 },
    ],
  }),
  imageTemplate({
    id: "dquote-hening",
    title: "Kutipan Hening",
    category: "Kutipan",
    kind: "image",
    ratio: "1:1",
    thumb: "/seed/unsplash/abstract-05.jpg",
    specs: [{ text: "Hidup tidak menunggu. Mulai hari ini.", y: 0.42, fontSize: 0.06, fontStyle: "italic" }],
  }),
  imageTemplate({
    id: "dtips-konten",
    title: "5 Tips Konten",
    category: "Pemasaran",
    kind: "image",
    ratio: "4:5",
    thumb: "/seed/unsplash/abstract-07.jpg",
    specs: [
      { text: "5 TIPS KONTEN YANG DIBACA", y: 0.3, fontSize: 0.07, fontStyle: "bold" },
      { text: "Konsisten • Singkat • Visual kuat", y: 0.48, fontSize: 0.04, color: "#A7F3D0" },
    ],
  }),
  imageTemplate({
    id: "dpromo-launch",
    title: "Peluncuran Produk",
    category: "Promo",
    kind: "image",
    ratio: "1:1",
    thumb: "/seed/unsplash/abstract-03.jpg",
    specs: [
      { text: "SEGERA HADIR", y: 0.64, fontSize: 0.1, fontStyle: "bold" },
      { text: "Produk baru untuk kamu", y: 0.77, fontSize: 0.042 },
    ],
  }),
  imageTemplate({
    id: "dstat-konten",
    title: "Statistik Konten",
    category: "Pemasaran",
    kind: "image",
    ratio: "16:9",
    thumb: "/seed/unsplash/abstract-02.jpg",
    specs: [
      { text: "+120%", y: 0.32, fontSize: 0.12, fontStyle: "bold", color: "#7DD3FC" },
      { text: "Peningkatan engagement setelah konsisten posting", y: 0.55, fontSize: 0.038 },
    ],
  }),
  imageTemplate({
    id: "dthanks",
    title: "Terima Kasih",
    category: "Pengumuman",
    kind: "image",
    ratio: "4:5",
    thumb: "/seed/unsplash/abstract-09.jpg",
    specs: [
      { text: "TERIMA KASIH", y: 0.4, fontSize: 0.085, fontStyle: "bold" },
      { text: "Sudah menjadi bagian dari perjalanan kami", y: 0.55, fontSize: 0.04 },
    ],
  }),
  imageTemplate({
    id: "dmotivasi-langkah",
    title: "Langkah Kecil",
    category: "Motivasi",
    kind: "image",
    ratio: "9:16",
    thumb: "/seed/unsplash/abstract-10.jpg",
    specs: [
      { text: "Satu langkah kecil hari ini lebih berharga daripada rencana besar besok.", y: 0.4, fontSize: 0.06, fontStyle: "italic" },
    ],
  }),
  carouselTemplate({
    id: "dc-panduan",
    title: "Panduan Cepat",
    category: "Panduan",
    kind: "carousel",
    ratio: "4:5",
    thumb: "/seed/unsplash/abstract-07.jpg",
    slides: [
      [
        { text: "PANDUAN CEPAT", y: 0.36, fontSize: 0.08, fontStyle: "bold" },
        { text: "2 langkah memulai", y: 0.5, fontSize: 0.045 },
      ],
      [
        { text: "1. Siapkan ide", y: 0.34, fontSize: 0.07, fontStyle: "bold" },
        { text: "Tentukan tujuan dan audiens kontenmu.", y: 0.48, fontSize: 0.042 },
      ],
      [
        { text: "2. Buat dan bagikan", y: 0.34, fontSize: 0.07, fontStyle: "bold" },
        { text: "Publikasikan, lalu ukur hasilnya.", y: 0.48, fontSize: 0.042 },
      ],
    ],
  }),
  carouselTemplate({
    id: "dc-promo",
    title: "Promo Paket",
    category: "Promo",
    kind: "carousel",
    ratio: "1:1",
    thumb: "/seed/unsplash/abstract-01.jpg",
    slides: [
      [
        { text: "PROMO PAKET", y: 0.4, fontSize: 0.11, fontStyle: "bold" },
        { text: "Khusus 7 hari", y: 0.56, fontSize: 0.045 },
      ],
      [
        { text: "Paket Starter", y: 0.4, fontSize: 0.08, fontStyle: "bold" },
        { text: "Mulai Rp99rb — 10 desain", y: 0.54, fontSize: 0.042 },
      ],
      [
        { text: "Pesan sekarang!", y: 0.4, fontSize: 0.085, fontStyle: "bold" },
        { text: "Stok terbatas", y: 0.55, fontSize: 0.045 },
      ],
    ],
  }),
  carouselTemplate({
    id: "dc-cerita",
    title: "Cerita Brand",
    category: "Cerita",
    kind: "carousel",
    ratio: "9:16",
    thumb: "/seed/unsplash/abstract-06.jpg",
    slides: [
      [
        { text: "CERITA KAMI", y: 0.4, fontSize: 0.09, fontStyle: "bold" },
        { text: "Berawal dari satu ide kecil", y: 0.53, fontSize: 0.042 },
      ],
      [
        { text: "Tahun 2023", y: 0.4, fontSize: 0.08, fontStyle: "bold" },
        { text: "Dimulai dari garasi kecil dengan 3 orang.", y: 0.53, fontSize: 0.042 },
      ],
      [
        { text: "Hari ini", y: 0.4, fontSize: 0.08, fontStyle: "bold" },
        { text: "Melayani 10.000+ kreator di seluruh Indonesia.", y: 0.53, fontSize: 0.042 },
      ],
    ],
  }),
  carouselTemplate({
    id: "dc-tips",
    title: "3 Tips Konten",
    category: "Panduan",
    kind: "carousel",
    ratio: "4:5",
    thumb: "/seed/unsplash/abstract-02.jpg",
    slides: [
      [
        { text: "3 TIPS KONTEN", y: 0.36, fontSize: 0.075, fontStyle: "bold" },
        { text: "Agar dilihat lebih banyak orang", y: 0.5, fontSize: 0.042 },
      ],
      [
        { text: "Judul yang jelas", y: 0.36, fontSize: 0.07, fontStyle: "bold" },
        { text: "Orang membaca judul sebelum isinya.", y: 0.5, fontSize: 0.042 },
      ],
      [
        { text: "Visual konsisten", y: 0.36, fontSize: 0.07, fontStyle: "bold" },
        { text: "Pakai warna dan font yang sama di semua slide.", y: 0.5, fontSize: 0.042 },
      ],
    ],
  }),
  carouselTemplate({
    id: "dc-sorotan",
    title: "Sorotan Minggu Ini",
    category: "Sorotan",
    kind: "carousel",
    ratio: "16:9",
    thumb: "/seed/unsplash/abstract-08.jpg",
    slides: [
      [
        { text: "SOROTAN MINGGU INI", y: 0.34, fontSize: 0.05, fontStyle: "bold" },
        { text: "Topik yang sedang naik daun", y: 0.5, fontSize: 0.032 },
      ],
      [
        { text: "Pemasaran AI", y: 0.36, fontSize: 0.05, fontStyle: "bold", color: "#A5B4FC" },
        { text: "Diskusi konten otomatis naik 45%.", y: 0.52, fontSize: 0.032 },
      ],
      [
        { text: "Apa langkahmu?", y: 0.36, fontSize: 0.05, fontStyle: "bold" },
        { text: "Ikuti trennya minggu ini.", y: 0.52, fontSize: 0.032 },
      ],
    ],
  }),
];

export function getDesignTemplate(id: string): DesignTemplate | undefined {
  return DESIGN_TEMPLATES.find((t) => t.id === id);
}

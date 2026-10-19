import type { ContentType } from "@/types";

export interface BriefColumn {
  key: string;
  label: string;
  /** short = narrow numeric/index; text = single line; long = textarea */
  input: "short" | "text" | "long";
  required: boolean;
  width?: string;
}

export interface BriefSchema {
  columns: BriefColumn[];
  /** Default number of rows when AI generates. */
  defaultRows: [number, number];
  /** Media row uses "sumber media" — only visual types. */
  mediaPerRow: boolean;
}

export const BRIEF_SCHEMAS: Record<ContentType, BriefSchema> = {
  image: {
    defaultRows: [1, 1],
    mediaPerRow: true,
    columns: [
      { key: "elemenVisual", label: "Elemen Visual", input: "long", required: true },
      { key: "teks", label: "Teks pada Gambar", input: "long", required: true },
      { key: "rasio", label: "Rasio", input: "short", required: true, width: "110px" },
      { key: "gaya", label: "Gaya Visual", input: "text", required: true },
      { key: "catatan", label: "Catatan", input: "long", required: false },
    ],
  },
  carousel: {
    defaultRows: [5, 7],
    mediaPerRow: true,
    columns: [
      { key: "slide", label: "Slide", input: "short", required: true, width: "70px" },
      { key: "judul", label: "Judul Slide", input: "text", required: true },
      { key: "isi", label: "Isi Teks", input: "long", required: true },
      { key: "visual", label: "Deskripsi Visual", input: "long", required: true },
      { key: "catatan", label: "Catatan", input: "long", required: false },
    ],
  },
  video: {
    defaultRows: [4, 6],
    mediaPerRow: true,
    columns: [
      { key: "scene", label: "Scene", input: "short", required: true, width: "70px" },
      { key: "durasi", label: "Durasi (dtk)", input: "short", required: true, width: "100px" },
      { key: "visual", label: "Visual", input: "long", required: true },
      { key: "narasi", label: "Narasi / Dialog", input: "long", required: false },
      { key: "teks_onscreen", label: "Teks On-screen", input: "long", required: false },
      { key: "audio", label: "Audio / Musik", input: "text", required: false },
    ],
  },
  audio: {
    defaultRows: [3, 5],
    mediaPerRow: false,
    columns: [
      { key: "segmen", label: "Segmen", input: "short", required: true, width: "70px" },
      { key: "durasi", label: "Durasi (dtk)", input: "short", required: true, width: "100px" },
      { key: "naskah", label: "Naskah", input: "long", required: true },
      { key: "nada", label: "Nada / Gaya Bicara", input: "text", required: false },
      { key: "efek", label: "Efek / Musik", input: "text", required: false },
    ],
  },
  article: {
    defaultRows: [4, 6],
    mediaPerRow: false,
    columns: [
      { key: "section", label: "Section", input: "short", required: true, width: "70px" },
      { key: "judul", label: "Judul Section", input: "text", required: true },
      { key: "poin", label: "Poin Utama", input: "long", required: true },
      { key: "kata", label: "Perkiraan Kata", input: "short", required: false, width: "110px" },
      { key: "referensi", label: "Referensi", input: "text", required: false },
    ],
  },
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  image: "Single Image",
  carousel: "Carousel",
  video: "Video",
  audio: "Audio",
  article: "Artikel",
};

export const CONTENT_TYPE_DESCRIPTIONS: Record<ContentType, string> = {
  image:
    "Satu visual kuat yang langsung menyampaikan pesan utama. Cocok untuk kutipan, tips singkat, atau pengumuman yang mudah dibagikan dan disimpan.",
  carousel:
    "Serangkaian slide bertema untuk panduan langkah demi langkah atau daftar poin. Ideal untuk konten edukatif yang di-scroll pelan-pelan.",
  video:
    "Video pendek dengan audio dan gerakan. Paling efektif untuk cerita, demo produk, dan konten yang butuh koneksi personal dengan penonton.",
  audio:
    "Format suara seperti podcast atau tanya-jawab. Pas untuk percakapan mendalam tanpa perlu tampil di depan kamera.",
  article:
    "Teks mendalam yang bisa dibaca panjang dan diindeks pencarian. Cocok untuk studi kasus, opini, atau panduan lengkap yang butuh penjelasan rinci.",
};

export function getBriefSchema(type: ContentType): BriefSchema {
  return BRIEF_SCHEMAS[type];
}

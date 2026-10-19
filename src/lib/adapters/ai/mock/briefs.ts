import type { BriefRow, BriefSummary, ContentType } from "@/types";
import type { BriefGeneration, BriefInput, BriefLength, BriefRevisionInput } from "@/lib/adapters/ai/types";
import { getBriefSchema } from "../../../../../config/brief-schemas";
import {
  BRIEF_ARTICLE_WORDS,
  BRIEF_AUDIO_TOTAL_SECONDS,
  BRIEF_ROW_COUNTS,
  BRIEF_VIDEO_TOTAL_SECONDS,
} from "../../../../../config/generation";
import { firstWords, hash, keywords, pick, titleCase } from "./util";

const TONES = ["Informatif & faktual", "Berita singkat", "Naratif redaksional", "To the point"];

function makeId(type: ContentType, i: number): string {
  return `${type}-r${i + 1}`;
}

function summaryFor(input: BriefInput): BriefSummary {
  const { topic, angle, contentType, summaryContext } = input;
  const platforms =
    summaryContext.platforms.length > 0
      ? summaryContext.platforms
      : contentType === "article"
        ? ["Website", "X (repost)"]
        : ["Instagram", "TikTok", "X"];
  return {
    title: titleCase(firstWords(topic, 8)),
    goal: pick(
      [
        `Menyampaikan kabar terkini soal ${topic} secara faktual dan ringkas.`,
        `Merangkum fakta ${angle.title.toLowerCase()} untuk pembaca kumparan.`,
        `Mengabarkan ${topic} dengan angle jurnalistik yang mudah dipahami.`,
      ],
      hash(topic),
    ),
    audience: angle.audience,
    tone: summaryContext.tone ?? pick(TONES, hash(topic)),
    size: sizeFor(contentType, input.length ?? "standard"),
    platforms,
  };
}

function sizeFor(contentType: ContentType, length: BriefLength): string {
  if (contentType === "carousel") return `${BRIEF_ROW_COUNTS[length]} slide, rasio 4:5`;
  if (contentType === "video") return `±${BRIEF_VIDEO_TOTAL_SECONDS[length]} detik, rasio 9:16`;
  if (contentType === "audio") return `±${BRIEF_AUDIO_TOTAL_SECONDS[length]} detik`;
  if (contentType === "article") {
    const total = BRIEF_ARTICLE_WORDS[length];
    return `±${Math.round((total * 0.85) / 50) * 50}–${total} kata`;
  }
  return "1 gambar, rasio 4:5";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Scale per-row numeric fields so their total matches the requested length. */
function scaleTotal(rows: BriefRow[], field: string, total: number): void {
  const sum = rows.reduce((acc, row) => acc + Number(row[field] || 0), 0) || 1;
  const factor = total / sum;
  for (const row of rows) {
    row[field] = String(Math.max(1, Math.round(Number(row[field] || 0) * factor)));
  }
}

function rowsForImage(topic: string, angle: string): BriefRow[] {
  const k = keywords(topic, 3).join(", ") || topic;
  return [
    {
      __id: makeId("image", 0),
      elemenVisual: `Kartu berita bertema ${k} dengan foto/hero image tegas, headline besar, dan logo kumparan di sudut.`,
      teks: `${titleCase(firstWords(angle, 8))}\n${pick(["Kabar terkini di kumparan →", "Baca selengkapnya ⬇️", "Fakta lengkap di caption"], hash(angle))}`,
      rasio: "4:5",
      gaya: pick(["Gaya editorial, tipografi headline", "Foto berita + overlay gelap", "Flat modern biru-merah khas media"], hash(topic)),
      catatan: "Pastikan headline terbaca jelas di mobile.",
    },
  ];
}

function rowsForCarousel(topic: string, angle: string, count: number): BriefRow[] {
  const k = keywords(topic, 4);
  const structure = [
    { judul: "Headline", isi: `Buka dengan kabar menohok soal ${topic}.`, visual: "Foto berita + headline besar" },
  ];
  for (let i = 1; i <= count - 2; i++) {
    structure.push({
      judul: `Fakta ${i}: ${titleCase(k[i - 1] ?? k[0] ?? "Kabar")}`,
      isi: `Rangkuman fakta dan konteks terkait ${k[i - 1] ?? topic}.`,
      visual: `Ilustrasi/foto pendukung fakta ${i}`,
    });
  }
  structure.push({ judul: "Rangkuman & Sumber", isi: `Kesimpulan berita & ajak baca lengkap. ${angle}`, visual: "Logo kumparan + CTA" });
  return structure.map((s, i) => ({
    __id: makeId("carousel", i),
    slide: `${i + 1}`,
    judul: s.judul,
    isi: s.isi,
    visual: s.visual,
    catatan: i === 0 ? "Headline wajib < 8 kata" : "",
  }));
}

function rowsForVideo(topic: string, angle: string, count: number): BriefRow[] {
  const rows: BriefRow[] = [];
  const scenes = [
    { d: "3", visual: "Breaking news opener / tease", narasi: `Kabar terbaru soal ${topic}.`, teks: "Breaking" },
    { d: "5", visual: "B-roll peristiwa/lokasi", narasi: `Ini ${firstWords(angle, 6)}.`, teks: "Kronologi" },
    { d: "6", visual: "Data & fakta di layar", narasi: "Begini faktanya...", teks: "Fakta" },
    { d: "6", visual: "Kutipan narasumber", narasi: "Kata narasumber, begini penjelasannya.", teks: "Kutipan" },
    { d: "5", visual: "Reporter stand-up / closing", narasi: "Ikuti kumparan untuk kabar terkini.", teks: "CTA" },
  ];
  for (let i = 0; i < Math.min(count, scenes.length); i++) {
    rows.push({
      __id: makeId("video", i),
      scene: `${i + 1}`,
      durasi: scenes[i].d,
      visual: scenes[i].visual,
      narasi: scenes[i].narasi,
      teks_onscreen: scenes[i].teks,
      audio: i === 0 ? "Musik dramatis pembuka" : "Nada serius, ducked saat narasi",
    });
  }
  return rows;
}

function rowsForAudio(topic: string, angle: string, count: number): BriefRow[] {
  const rows: BriefRow[] = [];
  const segs = [
    { durasi: "15", naskah: `Halo, ini kabar terkini dari kumparan. Hari ini kita bahas ${topic}.`, nada: "Serius & jelas", efek: "Jingle pembuka berita" },
    { durasi: "45", naskah: `Pertama, ${firstWords(angle, 8)}. Ini penting karena...`, nada: "Informatif", efek: "Musik latar halus" },
    { durasi: "40", naskah: "Kedua, fakta dan data pendukung yang perlu diketahui.", nada: "Objektif", efek: "Transisi antar segmen" },
    { durasi: "20", naskah: "Terima kasih sudah mendengarkan. Nantikan kabar berikutnya.", nada: "Ramah", efek: "Jingle penutup" },
  ];
  for (let i = 0; i < Math.min(count, segs.length); i++) {
    rows.push({ __id: makeId("audio", i), segmen: `${i + 1}`, ...segs[i] });
  }
  return rows;
}

function rowsForArticle(topic: string, angle: string, count: number): BriefRow[] {
  const rows: BriefRow[] = [];
  const base = [
    { judul: "Lead / Pembuka", poin: `Konteks berita mengapa ${topic} penting diberitakan.`, kata: "150" },
    { judul: "Kronologi & Fakta", poin: `Rangkuman fakta dan data pendukung seputar ${topic}.`, kata: "200" },
    { judul: "Kutipan Narasumber", poin: firstWords(angle, 12), kata: "150" },
    { judul: "Analisis & Konteks", poin: "Dampak lebih luas dan pandangan ahli.", kata: "150" },
    { judul: "Penutup & Sumber", poin: "Rangkuman dan kredit sumber informasi.", kata: "100" },
  ];
  for (let i = 0; i < Math.min(count, base.length); i++) {
    rows.push({ __id: makeId("article", i), section: `${i + 1}`, referensi: i === 1 ? "Data resmi + wawancara" : "", ...base[i] });
  }
  return rows;
}

export function mockBrief(input: BriefInput): BriefGeneration {
  const { topic, angle, contentType } = input;
  const length: BriefLength = input.length ?? "standard";
  const schema = getBriefSchema(contentType);
  const [min, max] = schema.defaultRows;
  const count = input.length
    ? BRIEF_ROW_COUNTS[length]
    : min + (hash(topic + contentType) % (max - min + 1));

  let rows: BriefRow[];
  switch (contentType) {
    case "image":
      rows = rowsForImage(topic, angle.title);
      break;
    case "carousel":
      rows = rowsForCarousel(topic, angle.title, count);
      break;
    case "video":
      rows = rowsForVideo(topic, angle.title, count);
      if (input.length) scaleTotal(rows, "durasi", BRIEF_VIDEO_TOTAL_SECONDS[length]);
      break;
    case "audio":
      rows = rowsForAudio(topic, angle.title, count);
      if (input.length) scaleTotal(rows, "durasi", BRIEF_AUDIO_TOTAL_SECONDS[length]);
      break;
    case "article":
      rows = rowsForArticle(topic, angle.title, count);
      if (input.length) scaleTotal(rows, "kata", BRIEF_ARTICLE_WORDS[length]);
      break;
  }
  return { summary: summaryFor(input), rows, captions: buildCaptions(input) };
}

export function buildCaptions(input: BriefInput): BriefGeneration["captions"] {
  const { topic, angle } = input;
  const k = keywords(topic, 4);
  const tags = ["#beritaterkini", "#kumparan", "#kabar", ...k.map((w) => `#${w}`), "#news"].slice(0, 6);
  return [
    {
      text: `${titleCase(firstWords(angle.title, 10))}.\n\nKabar terkini soal ${topic} yang perlu kamu tahu. Redaksi kumparan merangkum fakta dan kronologinya. Simak selengkapnya.`,
      hashtags: tags,
    },
  ];
}

export function mockReviseBrief(input: BriefRevisionInput): BriefRow[] {
  const { instruction, rowIndex, currentRows, contentType } = input;
  const inst = instruction.toLowerCase();
  const schema = getBriefSchema(contentType);
  const longKeys = schema.columns.filter((c) => c.input === "long").map((c) => c.key);
  const textKeys = schema.columns
    .filter((c) => c.input === "long" || c.input === "text")
    .map((c) => c.key);

  const transform = (value: string): string => {
    if (!value) return value;
    if (/ringkas|singkat|pendek|padat/.test(inst)) {
      const sentences = value.split(/(?<=[.!?])\s+/);
      return sentences.slice(0, Math.max(1, Math.ceil(sentences.length / 2))).join(" ");
    }
    if (/panjang|perpanjang|detail/.test(inst)) {
      return `${value} Tambahkan konteks dan satu data pendukung agar lebih meyakinkan.`;
    }
    if (/santai|casual|akrab|fun/.test(inst)) {
      return `${value} (Nada dibuat lebih santai.)`;
    }
    if (/formal|profesional|redaksi|berita/.test(inst)) {
      return `${value} (Nada disesuaikan menjadi gaya redaksional berita.)`;
    }
    return `${value} (${instruction.trim()})`;
  };

  return currentRows.map((row, i) => {
    if (rowIndex !== null && i !== rowIndex) return row;
    const next = { ...row };
    for (const key of textKeys) {
      if (typeof next[key] === "string") next[key] = transform(next[key]);
    }
    // ensure long fields get at least the update if none matched
    if (!longKeys.some((k) => row[k]) && typeof next[textKeys[0]] === "string") {
      next[textKeys[0]] = transform(next[textKeys[0]]);
    }
    return next;
  });
}

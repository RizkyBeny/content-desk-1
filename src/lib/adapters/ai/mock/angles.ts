import type { Angle, ContentType, RecommendedType } from "@/types";
import type { AngleInput, ContentTypeInput } from "@/lib/adapters/ai/types";
import { clamp, firstWords, formatToContentType, hash, inferCategory, pick } from "./util";

const ANGLE_TEMPLATES: {
  title: (k: string) => string;
  desc: (k: string) => string;
  audience: string;
  bias?: ContentType;
}[] = [
  {
    title: (k) => `Kronologi lengkap: ${k}`,
    desc: (k) => `Menyusun urutan peristiwa ${k} secara runut agar pembaca memahami duduk perkaranya.`,
    audience: "Pembaca berita yang ingin fakta lengkap",
    bias: "carousel",
  },
  {
    title: (k) => `Suara narasumber & saksi soal ${k}`,
    desc: (k) => `Mengangkat kutipan langsung dari narasumber agar berita soal ${k} terasa dekat.`,
    audience: "Audiens yang suka liputan langsung",
    bias: "video",
  },
  {
    title: (k) => `Mitos vs fakta: ${k}`,
    desc: (k) => `Meluruskan informasi keliru yang beredar seputar ${k} dengan data dan sumber.`,
    audience: "Pembaca yang ingin klarifikasi",
    bias: "image",
  },
  {
    title: (k) => `Jelaskan ${k} dalam 60 detik`,
    desc: () => `Ringkasan cepat agar audiens paham inti kabar tanpa membaca panjang.`,
    audience: "Audiens mobile yang sibuk",
    bias: "video",
  },
  {
    title: (k) => `Dampak & reaksi publik atas ${k}`,
    desc: () => `Menunjukkan reaksi dan konsekuensi nyata, memancing diskusi warganet.`,
    audience: "Audiens yang mengikuti isu terkini",
    bias: "carousel",
  },
  {
    title: (k) => `Analisis: kenapa ${k} penting`,
    desc: () => `Mengupas konteks dan sebab-akibat peristiwa dengan sudut pandang redaksi.`,
    audience: "Pembaca yang haus analisis",
    bias: "article",
  },
  {
    title: (k) => `Data & angka di balik ${k}`,
    desc: () => `Menyajikan statistik dan bukti pendukung agar berita kredibel.`,
    audience: "Pembaca yang menyukai data",
    bias: "article",
  },
  {
    title: (k) => `Kutipan & poin penting seputar ${k}`,
    desc: () => `Kumpulan pernyataan kunci yang cepat dikonsumsi dan dibagikan ulang.`,
    audience: "Audiens cepat dengan fokus singkat",
    bias: "image",
  },
  {
    title: (k) => `Tanya-jawab seputar ${k}`,
    desc: (k) => `Menjawab pertanyaan yang paling sering muncul soal ${k}.`,
    audience: "Pembaca yang mencari jawaban cepat",
    bias: "audio",
  },
];

export function mockAngles(input: AngleInput): Angle[] {
  const { topic, count, existingTitles } = input;
  const key = firstWords(topic, 5);
  const cat = inferCategory(topic);
  const start = hash(topic) % ANGLE_TEMPLATES.length;
  const out: Angle[] = [];

  for (let i = 0; i < ANGLE_TEMPLATES.length && out.length < count; i++) {
    const t = pick(ANGLE_TEMPLATES, start + i);
    const title = t.title(key);
    if (existingTitles.some((e) => e.toLowerCase() === title.toLowerCase())) continue;
    out.push({
      id: `ag-${out.length + 1}`,
      title,
      description: t.desc(key),
      audience: t.audience,
      reason: pick(
        [
          `Kategori ${cat} biasanya direspons baik saat dikemas ${t.bias === "video" ? "video" : "visual"}.`,
          `Sudut ini memancing interaksi (simpan/komentar) yang menaikkan Engagement Rate.`,
          `Selaras gaya redaksi media berita dan mudah diproduksi dalam batch.`,
        ],
        hash(topic + i),
      ),
    });
  }
  return out;
}

const CONTENT_TYPES: ContentType[] = ["image", "carousel", "video", "audio", "article"];

export function mockRecommendContentTypes(input: ContentTypeInput): RecommendedType[] {
  const { angle, formatPerformance } = input;
  const scores = new Map<ContentType, number>();
  for (const ct of CONTENT_TYPES) scores.set(ct, 40);

  // boost by real performance of matching formats
  formatPerformance.forEach((fp, i) => {
    const ct = formatToContentType(fp.format);
    if (!ct) return;
    const boost = clamp(fp.avgEr * 6, 0, 40) - i * 3;
    scores.set(ct, (scores.get(ct) ?? 40) + boost);
  });

  // heuristic from angle description
  const text = `${angle.title} ${angle.description}`.toLowerCase();
  if (/kronologi|dampak|rangkuman|fakta/.test(text)) scores.set("carousel", (scores.get("carousel") ?? 0) + 25);
  if (/narasumber|saksi|jelaskan|liputan/.test(text)) scores.set("video", (scores.get("video") ?? 0) + 22);
  if (/mitos|kutipan|poin penting/.test(text)) scores.set("image", (scores.get("image") ?? 0) + 20);
  if (/analisis|data|angka|konteks/.test(text)) scores.set("article", (scores.get("article") ?? 0) + 22);
  if (/tanya-jawab|q&a|podcast/.test(text)) scores.set("audio", (scores.get("audio") ?? 0) + 20);

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, score]) => ({
      type,
      reason: pick(
        [
          `Paling selaras dengan sudut angle dan ${score > 55 ? "performa tinggi" : "cocok"} di data Anda.`,
          `Format ini konsisten menghasilkan interaksi baik untuk topik serupa.`,
          `Cocok dengan audiens target dan mudah diproduksi.`,
        ],
        hash(type + angle.title),
      ),
    }));
}

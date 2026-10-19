import type { ContentType } from "@/types";
import type { MetricSummaryForAI } from "@/lib/adapters/ai/types";

export function pick<T>(arr: T[], index: number): T {
  return arr[((index % arr.length) + arr.length) % arr.length];
}

export function titleCase(input: string): string {
  return input
    .split(" ")
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function firstWords(input: string, n: number): string {
  return input.split(/\s+/).slice(0, n).join(" ");
}

/** Simple deterministic hash → non-negative integer. */
export function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const STOPWORDS = new Set([
  "yang","dan","di","ke","dari","untuk","dengan","pada","adalah","ini","itu",
  "atau","agar","biar","saja","juga","akan","bisa","tidak","tak","para","oleh",
  "tips","cara","the","a","an","of","to","in","on","for","with","and","vs",
]);

export function keywords(input: string, limit = 6): string[] {
  const seen = new Set<string>();
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !seen.has(w) && seen.add(w))
    .slice(0, limit);
}

export function avgErByFormat(metrics: MetricSummaryForAI[]): { format: string; avgEr: number }[] {
  const bucket = new Map<string, { sum: number; n: number }>();
  for (const m of metrics) {
    const b = bucket.get(m.format) ?? { sum: 0, n: 0 };
    b.sum += m.engagementRate;
    b.n += 1;
    bucket.set(m.format, b);
  }
  return [...bucket.entries()]
    .map(([format, { sum, n }]) => ({ format, avgEr: sum / n }))
    .sort((a, b) => b.avgEr - a.avgEr);
}

/** Map a platform-specific format to a candidate content type. */
export function formatToContentType(format: string): ContentType | null {
  switch (format) {
    case "artikel":
    case "long_form":
      return "article";
    case "reels":
    case "video":
    case "shorts":
      return "video";
    case "carousel":
      return "carousel";
    case "image":
      return "image";
    default:
      return null;
  }
}

export function inferCategory(topic: string): string {
  const t = topic.toLowerCase();
  const rules: [RegExp, string][] = [
    [/politik|pemilu|presiden|pemerintah|dpr|kebijakan|menteri|partai/, "Politik"],
    [/ekonomi|harga|bbm|inflasi|pasar|investasi|keuangan|uang|rupiah|pajak/, "Ekonomi"],
    [/olahraga|liga|timnas|bola|sepak|juara|pertandingan|atlet/, "Olahraga"],
    [/hiburan|film|artis|musik|drama|viral|seleb|konser/, "Hiburan"],
    [/gempa|banjir|cuaca|kecelakaan|lalu lintas|bencana|nasional|pemda/, "Nasional"],
    [/internasional|luar negeri|global|dunia|asing/, "Internasional"],
    [/lifestyle|resep|masakan|kuliner|gaya hidup|travel|wisata/, "Lifestyle"],
    [/wfh|remote|kantor|kerja|produktiv/, "Produktivitas"],
    [/sehat|olahraga|diet|tidur|mental|burnout|stres/, "Kesehatan"],
    [/bisnis|startup|umkm|jualan|market/, "Bisnis"],
    [/teknologi|ai|gadget|aplikasi|digital|hp/, "Teknologi"],
    [/karier|interview|cv|gaji|rekrut/, "Karier"],
  ];
  for (const [re, cat] of rules) if (re.test(t)) return cat;
  return "Umum";
}

export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

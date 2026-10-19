import type { InsightAIItem } from "@/types";
import type { InsightInput } from "@/lib/adapters/ai/types";
import { avgErByFormat, formatToContentType, hash, pick } from "./util";

const FORMAT_LABEL: Record<string, string> = {
  reels: "Reels",
  carousel: "Carousel",
  image: "Gambar",
  video: "Video",
  artikel: "Artikel",
  long_form: "Video panjang",
  shorts: "Shorts",
  thread: "Thread",
  text: "Teks",
  community_post: "Community post",
};

function fmt(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

export function mockInsights(input: InsightInput): InsightAIItem[] {
  const { metrics, currentAvgEr, previousAvgEr, niche, periodLabel } = input;
  const out: InsightAIItem[] = [];
  if (metrics.length === 0) return out;

  const byFormat = avgErByFormat(metrics);
  const best = byFormat[0];
  const worst = byFormat[byFormat.length - 1];

  if (best) {
    const conv = best.avgEr >= worst.avgEr ? hash(best.format + "x") : 0;
    const label = FORMAT_LABEL[best.format] ?? best.format;
    out.push({
      id: "ins-format",
      text: `Format ${label} konsisten unggul di ${periodLabel}. Rata-rata Engagement Rate ${fmt(
        best.avgEr,
      )}%, tertinggi dibanding format lain.`,
      evidence: `${label} rata-rata ER ${fmt(best.avgEr)}%${
        worst && worst.format !== best.format
          ? ` vs ${FORMAT_LABEL[worst.format] ?? worst.format} ${fmt(worst.avgEr)}%`
          : ""
      }`,
      suggestedTopic: niche
        ? `Perbanyak ${label.toLowerCase()} untuk liputan isu ${niche}`
        : `Ide ${label.toLowerCase()} berkinerja tinggi`,
    });
    void conv;
  }

  const delta = previousAvgEr > 0 ? ((currentAvgEr - previousAvgEr) / previousAvgEr) * 100 : 0;
  out.push({
    id: "ins-trend",
    text:
      delta >= 0
        ? `Engagement Rate periode ini naik ${fmt(Math.abs(delta), 1)}% dibanding periode sebelumnya. Pertahankan format & jam posting yang bekerja.`
        : `Engagement Rate periode ini turun ${fmt(Math.abs(delta), 1)}% dibanding periode sebelumnya. Perlu evaluasi jenis konten dan waktu posting.`,
    evidence: `ER sekarang ${fmt(currentAvgEr)}% vs sebelumnya ${fmt(previousAvgEr)}%`,
    suggestedTopic:
      delta < 0 ? "Uji ulang format yang dulu paling tinggi ER-nya" : undefined,
  });

  const topEngagement = [...metrics].sort((a, b) => b.engagement - a.engagement)[0];
  if (topEngagement) {
    out.push({
      id: "ins-top",
      text: `Konten "${topEngagement.title}" menyumbang engagement tertinggi. Tema ini layak dibuat lanjutan/seri.`,
      evidence: `Engagement ${topEngagement.engagement} · ER ${fmt(
        topEngagement.engagementRate,
      )}%`,
      suggestedTopic: `Lanjutan dari: ${topEngagement.title}`,
    });
  }

  const hours = new Map<number, { sum: number; n: number }>();
  for (const m of metrics) {
    const h = new Date(m.publishedAt).getHours();
    const b = hours.get(h) ?? { sum: 0, n: 0 };
    b.sum += m.engagementRate;
    b.n += 1;
    hours.set(h, b);
  }
  const hourRank = [...hours.entries()]
    .map(([hour, { sum, n }]) => ({ hour, er: sum / n }))
    .sort((a, b) => b.er - a.er);
  if (hourRank.length >= 2) {
    const bestHour = hourRank[0];
    out.push({
      id: "ins-hour",
      text: `Jam posting terbaik berada di sekitar pukul ${String(bestHour.hour).padStart(
        2,
        "0",
      )}:00. Coba jadwalkan konten utama pada rentang ini.`,
      evidence: `Rata-rata ER ${fmt(bestHour.er)}% pada pukul ${String(bestHour.hour).padStart(2, "0")}:00`,
    });
  }

  if (niche) {
    const ct = formatToContentType(best.format);
    out.push({
      id: "ins-niche",
      text: pick(
        [
          `Isu seputar "${niche}" masih relevan. Kombinasikan dengan format yang unggul untuk menaikkan jangkauan.`,
          `Audiens niche "${niche}" merespons baik. Perbanyak sudut pandang jurnalistik dan data pendukung.`,
        ],
        hash(niche),
      ),
      evidence: best ? `${FORMAT_LABEL[best.format] ?? best.format} ER ${fmt(best.avgEr)}%` : "",
      suggestedTopic: niche ? `Kabar terkini seputar ${niche}` : undefined,
    });
    void ct;
  }

  return out.slice(0, 5);
}

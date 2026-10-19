import type { TopicInsight, TopicRecommendation } from "@/types";
import type { TopicInput, TopicInsightInput } from "@/lib/adapters/ai/types";
import { clamp, firstWords, inferCategory, keywords, pick, titleCase } from "./util";

const TEMPLATES = [
  (k: string) => `Kabar terkini soal ${k} yang perlu diketahui`,
  (k: string) => `Kronologi dan fakta di balik ${k}`,
  (k: string) => `5 hal yang belum banyak dibahas soal ${k}`,
  (k: string) => `Mitos vs fakta seputar ${k}`,
  (k: string) => `Analisis: mengapa ${k} jadi sorotan`,
  (k: string) => `Rangkuman peristiwa penting soal ${k}`,
  (k: string) => `Yang perlu kamu tahu tentang ${k}`,
];

export function mockTopicRecommendations(input: TopicInput): TopicRecommendation[] {
  const { trendSignals, niche, nicheCategories, limit } = input;
  const nicheWords = new Set([
    ...keywords(niche ?? "", 8),
    ...nicheCategories.map((c) => c.toLowerCase()),
  ]);

  const items = trendSignals.map((sig, i) => {
    const kw = keywords(sig.keyword, 3).join(" ") || sig.keyword;
    const kwSet = keywords(sig.keyword, 4);
    const overlap = kwSet.filter((w) => [...nicheWords].some((n) => n.includes(w) || w.includes(n)));
    const nicheFit = clamp(
      45 + overlap.length * 12 + (nicheWords.size === 0 ? 10 : 0) + (i % 3) * 4,
    );
    const title = pick(TEMPLATES, i)(kw);
    return {
      id: `tp-${i + 1}`,
      title: titleCase(firstWords(title, 12)),
      summary: `Topik ini mencuat dari ${sig.provider.replace("_", " ")}${
        sig.category ? ` kategori ${sig.category}` : ""
      }. Volume pencarian naik; layak diberitakan ${
        input.lang === "en" ? "for" : "untuk"
      } audiens utama.`,
      sources: [sig.provider],
      trendScore: clamp(sig.volumeScore),
      nicheFit,
      category: sig.category ?? inferCategory(sig.keyword),
    } satisfies TopicRecommendation;
  });

  // de-dupe by title, sort by combined score, take `limit`
  const seen = new Set<string>();
  return items
    .filter((it) => (seen.has(it.title) ? false : seen.add(it.title)))
    .sort((a, b) => b.trendScore * 0.6 + b.nicheFit * 0.4 - (a.trendScore * 0.6 + a.nicheFit * 0.4))
    .slice(0, limit);
}

export function mockTopicInsight(input: TopicInsightInput): TopicInsight {
  const { topic, trendSignals, ownMetrics, niche } = input;
  const matchingSignals = trendSignals.filter((s) => {
    const sWords = keywords(s.keyword, 4);
    const tWords = keywords(topic, 6);
    return tWords.some((w) => sWords.some((sw) => sw.includes(w) || w.includes(sw)));
  });
  const hasTrendSignal = matchingSignals.length > 0;

  const relatedOwn = ownMetrics
    .filter((m) => {
      const mWords = keywords(m.title, 5);
      const tWords = keywords(topic, 6);
      return tWords.some((w) => mWords.some((mw) => mw.includes(w) || w.includes(mw)));
    })
    .slice(0, 3);

  const supporting: { label: string; value: string }[] = [];
  for (const s of matchingSignals.slice(0, 2)) {
    supporting.push({
      label: `Sinyal ${s.provider.replace("_", " ")}`,
      value: `${s.keyword} · skor ${clamp(s.volumeScore)}/100`,
    });
  }
  for (const m of relatedOwn) {
    supporting.push({
      label: `Konten Anda: ${firstWords(m.title, 6)}`,
      value: `${m.source} · ER ${m.engagementRate.toFixed(2).replace(".", ",")}%`,
    });
  }
  if (supporting.length === 0 && niche) {
    supporting.push({ label: "Niche creator", value: niche });
  }

  const category = inferCategory(
    topic + " " + matchingSignals.map((s) => s.keyword).join(" "),
  );
  const audiences =
    category === "Politik"
      ? ["Pemilih muda 18–34 tahun", "Masyarakat umum", "Pengamat kebijakan"]
      : category === "Ekonomi"
        ? ["Pelaku usaha & UMKM", "Karyawan & pekerja", "Investor pemula"]
        : category === "Olahraga"
          ? ["Penggemar olahraga", "Anak muda 18–30 tahun", "Komunitas suporter"]
          : category === "Hiburan"
            ? ["Penggemar film & musik", "Gen Z 18–27 tahun", "Pengguna media sosial"]
            : category === "Nasional"
              ? ["Masyarakat umum", "Pembaca berita harian", "Warga daerah terkait"]
              : category === "Internasional"
                ? ["Pembaca berita global", "Mahasiswa & akademisi", "Profesional muda"]
                : category === "Teknologi"
                  ? ["Pekerja tech & startup", "Penggemar gadget", "Gen Z digital"]
                  : ["Audiens umum 18–34 tahun", `Peminat ${niche ?? category}`];

  const platforms =
    category === "Ekonomi" || category === "Politik"
      ? ["Instagram", "X", "Website (Artikel)"]
      : ["Instagram", "TikTok", "X"];

  return {
    summary: hasTrendSignal
      ? `Topik "${firstWords(topic, 10)}" sedang naik. Kombinasi tren eksternal dan performa konten Anda menunjukkan potensi jangkauan tinggi di kategori ${category}.`
      : `Topik "${firstWords(topic, 10)}" belum punya sinyal tren eksternal yang kuat, tetapi relevan dengan niche Anda. Perkiraan rekomendasi dibuat dari performa konten Anda dan pengetahuan umum.`,
    supporting:
      supporting.length > 0
        ? supporting
        : [{ label: "Dasar", value: "Niche + performa konten creator" }],
    audiences,
    platforms,
    hasTrendSignal,
    note: hasTrendSignal
      ? undefined
      : "Belum ada sinyal tren eksternal untuk topik ini",
  };
}

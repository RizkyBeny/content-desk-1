import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getAIProvider } from "@/lib/adapters/ai";
import { buildItemDefs } from "@/lib/services/creations";
import { jakartaDate } from "@/lib/services/quota";
import type { Angle, BriefRow, ContentType, MediaSource, RecommendedType } from "@/types";
import type { MediaSourceInput } from "@/lib/services/creations";

/**
 * Isi data mock untuk DATA_MODE=mock (tanpa database).
 *
 * Dipecah dua lapis:
 *  1. Data dasar (user, koneksi sosial, sinyal tren, metrik konten, konfigurasi
 *     kuota) — dipinjam dari `prisma/seed.ts` supaya bentuknya 100% identik
 *     dengan mode database (semua adapter di sana sudah mock, tanpa jaringan).
 *  2. Konten demo (aset, proyek, brief, creation, generation, pemakaian kuota)
 *     — fixture khusus mode mock supaya setiap halaman terisi penuh. Proyek
 *     memakai ID tetap (`demo-*`) supaya link preview stabil antar cold start
 *     dan antar function serverless (lihat `ProjectSpec.id`).
 *
 * Semua data hidup di memori proses: hilang saat proses restart (wajar untuk
 * demo front-end / deployment serverless).
 */

const HOUR_MS = 3_600_000;

/** Gambar statis di public/ — selalu tersedia, termasuk di Vercel. */
const SEED_IMAGES = Array.from(
  { length: 12 },
  (_, i) => `seed/unsplash/abstract-${String(i + 1).padStart(2, "0")}.jpg`,
);

const IMAGE_PROMPTS = [
  "Poster produktivitas dengan tipografi tebal, latar gradien ungu-oranye, gaya editorial",
  "Foto flat-lay meja kerja minimalis dengan cahaya alami hangat",
  "Ilustrasi vector otak manusia dengan siluet pohon, nuansa biru tenang",
  "Carousel pembuka: kutipan karier dengan latar hitam-putih kontras tinggi",
  "Visual podcast setup: mikrofon condenser, headphone, lampu bokeh",
  "Infografis statistik gaji remote worker, palet hijau mint dan navy",
];

export async function seedMockData(): Promise<void> {
  // ── 1. Data dasar (user, koneksi, tren, metrik, konfigurasi kuota) ─────────
  // Di-import dinamis: menghindari cycle import dan blok auto-run seed.
  const seedModule = await import("../../../prisma/seed");
  await seedModule.main();

  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    orderBy: { createdAt: "asc" },
  });
  if (!admin) return;

  // ── 2. Konten demo ────────────────────────────────────────────────────────
  // Idempoten di level record (per ID), bukan "berhenti kalau ada project":
  // proyek demo ber-ID tetap harus ada apa pun yang terjadi di store ini.
  const assetIds = await seedAssets(admin.id);
  await seedProjects(admin.id, assetIds);
  await seedGenerations(admin.id);
  await seedQuotaUsage(admin.id);
}

// ─── Aset ────────────────────────────────────────────────────────────────────

async function seedAssets(ownerId: string): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < 12; i++) {
    const asset = await prisma.asset.create({
      data: {
        ownerId,
        type: "image",
        origin: i % 3 === 0 ? "generated" : "upload",
        name: `Latar abstrak ${String(i + 1).padStart(2, "0")}.jpg`,
        fileUrl: SEED_IMAGES[i],
        mimeType: "image/jpeg",
        tags: i < 4 ? ["latar", "brand"] : ["latar"],
        visibility: i < 6 ? "workspace" : "private",
        sizeBytes: BigInt(380_000 + i * 21_777),
      },
    });
    ids.push(asset.id);
  }
  return ids;
}

// ─── Proyek + Brief + Creation ───────────────────────────────────────────────

interface ProjectSpec {
  /**
   * ID tetap (bukan UUID acak).
   *
   * Mode mock menyimpan data in-memory per proses serverless — di Vercel,
   * halaman `/proyek/[id]` dan route API adalah function terpisah dengan seed
   * masing-masing. Dengan ID tetap, kedua function sepakat pada record yang
   * sama dan link preview selalu bisa dibuka, berapa pun kali cold start.
   */
  id: string;
  topicTitle: string;
  origin: "flow" | "standalone";
  topicSource: "trending" | "custom";
  /** angle terpilih — juga jadi angleTitle/angleDesc project */
  angleTitle: string;
  angleDesc: string;
  audience: string;
  /**
   * true → daftar angle ikut ditulis (JSON) sehingga langkah Angle langsung
   * menampilkan kartu. false → biarkan kosong, halaman akan meng-generate
   * angle lewat API (menguji alur asli dari nol).
   */
  seedAngles: boolean;
  /** true → satu angle ditandai terpilih + ada rekomendasi jenis konten */
  selected: boolean;
  platforms: string[];
  contentType: ContentType | null;
  status: string;
  /** status brief saat dibuat; default "siap" */
  briefStatus?: "draft" | "siap";
  /** jenis creation yang menyertainya (kalau ada) */
  creationType?: ContentType;
  /** sumber media per baris brief (index 0 = baris 1) */
  sources?: { source: MediaSource; assetIndex?: number }[];
  itemCount?: number;
}

const ANGLE_REASONS = [
  "Selaras gaya redaksi dan mudah diproduksi dalam batch.",
  "Kategori ini biasanya direspons baik saat dikemas visual.",
  "Sudut ini memancing interaksi (simpan/komentar) yang menaikkan Engagement Rate.",
  "Format yang konsisten menghasilkan jangkauan organik tinggi.",
  "Cocok untuk audiens yang mencari jawaban cepat dan praktis.",
  "Membangun kredibilitas lewat data dan konteks yang mendalam.",
  "Hook kuat di detik pertama untuk format video pendek.",
  "Mudah dijadikan seri konten lanjutan.",
];

const ANGLE_TEMPLATES = [
  "Data & angka di balik {topic}",
  "Kutipan & poin penting seputar {topic}",
  "Tanya-jawab seputar {topic}",
  "Kronologi lengkap: {topic}",
  "Mitos vs fakta: {topic}",
  "Studi kasus nyata: {topic}",
  "Prediksi & langkah praktis: {topic}",
];

/** Maksimal 3 jenis konten direkomendasikan (FR-ANG-5). */
const DEMO_RECOMMENDATIONS: RecommendedType[] = [
  { type: "video", reason: "Hook visual cepat cocok dengan sudut angle ini." },
  { type: "carousel", reason: "Struktur poin-per-poin mudah disimpan dan dibagikan." },
  { type: "image", reason: "Ringkasan satu layar untuk audiens yang berselancar cepat." },
];

/** 8 angle deterministik dengan id `ag-1` s.d. `ag-8` (sama dengan format AI mock). */
function demoAngles(spec: ProjectSpec): Angle[] {
  const list: Angle[] = [
    {
      id: "ag-1",
      title: spec.angleTitle,
      description: spec.angleDesc,
      audience: spec.audience,
      reason: ANGLE_REASONS[0],
    },
  ];
  ANGLE_TEMPLATES.forEach((template, i) => {
    const title = template.replace("{topic}", spec.topicTitle);
    list.push({
      id: `ag-${i + 2}`,
      title,
      description: `${title} — dijelaskan ringkas dengan contoh yang relevan untuk ${spec.audience}.`,
      audience: spec.audience,
      reason: ANGLE_REASONS[(i + 1) % ANGLE_REASONS.length],
    });
  });
  return list;
}

const PROJECT_SPECS: ProjectSpec[] = [
  // ── Tahap 1: belum ada angle → langkah Angle meng-generate lewat API ──────
  {
    id: "demo-angle",
    topicTitle: "Pidato Presiden soal ekonomi digital",
    origin: "flow",
    topicSource: "trending",
    angleTitle: "5 hal yang belum banyak dibahas",
    angleDesc: "Sudut analisis mendalam untuk pembaca profesional muda",
    audience: "Profesional muda 20-35 tahun",
    seedAngles: false,
    selected: false,
    platforms: ["Instagram", "TikTok", "X"],
    contentType: null,
    status: "brief",
  },
  // ── Tahap 2: angle dipilih → langkah Jenis Konten ─────────────────────────
  {
    id: "demo-type",
    topicTitle: "Tren kerja hybrid 2026",
    origin: "flow",
    topicSource: "trending",
    angleTitle: "Kenapa kantor tetap dibutuhkan",
    angleDesc: "Studi kasus perusahaan Indonesia yang kembali WFO",
    audience: "HR dan manajer tim",
    seedAngles: true,
    selected: true,
    platforms: ["Instagram", "LinkedIn"],
    contentType: null,
    status: "brief",
  },
  // ── Tahap 3: brief masih draft → langkah Brief ────────────────────────────
  {
    id: "demo-brief",
    topicTitle: "Regulasi PPN jasa digital",
    origin: "flow",
    topicSource: "custom",
    angleTitle: "Yang perlu diketahui freelancer",
    angleDesc: "Rangkuman faktual dengan contoh kasus",
    audience: "Freelancer dan agensi kecil",
    seedAngles: true,
    selected: true,
    platforms: ["Instagram", "X"],
    contentType: "carousel",
    status: "brief",
    briefStatus: "draft",
  },
  // ── Tahap 4: brief siap, belum ada creation → tombol Generate aktif ───────
  {
    id: "demo-generate",
    topicTitle: "AI untuk kreator konten pemula",
    origin: "flow",
    topicSource: "custom",
    angleTitle: "Mulai dari nol dalam 7 hari",
    angleDesc: "Panduan praktis langkah demi langkah",
    audience: "Kreator konten pemula",
    seedAngles: true,
    selected: true,
    platforms: ["Instagram", "TikTok"],
    contentType: "carousel",
    status: "brief",
    briefStatus: "siap",
  },
  // ── Tahap 5: creation siap → stepper Generate membuka progress & editor ───
  {
    id: "demo-editor",
    topicTitle: "Data center baru di Indonesia",
    origin: "flow",
    topicSource: "trending",
    angleTitle: "Dampaknya untuk startup lokal",
    angleDesc: "Analisis biaya cloud dan latency regional",
    audience: "Founder dan CTO startup",
    seedAngles: true,
    selected: true,
    platforms: ["YouTube", "X"],
    contentType: "image",
    status: "editing",
    briefStatus: "siap",
    creationType: "image",
    sources: [{ source: "ai_generated", assetIndex: 3 }],
    itemCount: 1,
  },
  // ── Proyek lanjutan: mengisi halaman Studio, Desain, dan Proyek ───────────
  {
    id: "demo-carousel",
    topicTitle: "Strategi konten Ramadan untuk brand lokal",
    origin: "standalone",
    topicSource: "custom",
    angleTitle: "Kampanye yang tidak terasa jualan",
    angleDesc: "Sudut cerita manusiawi untuk audiens yang lelah iklan",
    audience: "Tim brand dan agensi kreatif",
    seedAngles: true,
    selected: true,
    platforms: ["Instagram", "TikTok"],
    contentType: "carousel",
    status: "editing",
    briefStatus: "siap",
    creationType: "carousel",
    sources: [
      { source: "asset_management", assetIndex: 0 },
      { source: "asset_management", assetIndex: 1 },
      { source: "asset_management", assetIndex: 2 },
    ],
    itemCount: 3,
  },
  {
    id: "demo-video",
    topicTitle: "Cara memulai newsletter mingguan",
    origin: "standalone",
    topicSource: "custom",
    angleTitle: "Konsisten 30 hari tanpa kehabisan ide",
    angleDesc: "Sistem produksi sederhana untuk penulis solo",
    audience: "Penulis dan blogger",
    seedAngles: true,
    selected: true,
    platforms: ["YouTube", "X"],
    contentType: "video",
    status: "generating",
    briefStatus: "siap",
    creationType: "video",
    sources: [
      { source: "ai_generated", assetIndex: 4 },
      { source: "ai_generated", assetIndex: 5 },
      { source: "ai_generated", assetIndex: 6 },
    ],
    itemCount: 3,
  },
  {
    id: "demo-audio",
    topicTitle: "Refleksi mingguan tim redaksi",
    origin: "standalone",
    topicSource: "custom",
    angleTitle: "Cerita di balik berita utama",
    angleDesc: "Narasi santai untuk format audio pendek",
    audience: "Pendengar podcast produktivitas",
    seedAngles: true,
    selected: true,
    platforms: ["Spotify", "YouTube"],
    contentType: "audio",
    status: "editing",
    briefStatus: "siap",
    creationType: "audio",
    itemCount: 3,
  },
  {
    id: "demo-article",
    topicTitle: "Panduan SEO untuk situs berita",
    origin: "standalone",
    topicSource: "custom",
    angleTitle: "Yang perlu diketahui editor pemula",
    angleDesc: "Rangkuman faktual dengan contoh kasus",
    audience: "Redaktur dan content writer",
    seedAngles: true,
    selected: true,
    platforms: ["Website", "X (repost)"],
    contentType: "article",
    status: "exported",
    briefStatus: "siap",
    creationType: "article",
    itemCount: 1,
  },
];

async function seedProjects(adminId: string, assetIds: string[]): Promise<void> {
  const provider = getAIProvider();

  for (const spec of PROJECT_SPECS) {
    // Idempoten per ID: aman dipanggil ulang tanpa menumpuk fixture.
    if (await prisma.project.findUnique({ where: { id: spec.id } })) continue;

    const angles = spec.seedAngles ? demoAngles(spec) : null;

    const project = await prisma.project.create({
      data: {
        id: spec.id,
        userId: adminId,
        origin: spec.origin,
        topicTitle: spec.topicTitle,
        topicSource: spec.topicSource,
        angleTitle: spec.angleTitle,
        angleDesc: spec.angleDesc,
        contentType: spec.contentType,
        status: spec.status,
        ...(angles ? { angles: angles as unknown as Prisma.InputJsonValue } : {}),
        ...(angles && spec.selected
          ? {
              selectedAngleId: angles[0].id,
              recommendedTypes: DEMO_RECOMMENDATIONS as unknown as Prisma.InputJsonValue,
            }
          : {}),
      },
    });

    if (!spec.contentType) continue;

    // Brief lewat provider AI mock → baris & caption dijamin valid per jenis.
    const brief = await provider.generateBrief({
      topic: spec.topicTitle,
      angle: { title: spec.angleTitle, description: spec.angleDesc, audience: spec.audience },
      contentType: spec.creationType ?? spec.contentType,
      summaryContext: {
        niche: "Produktivitas & karier remote",
        tone: "Informatif & faktual",
        platforms: spec.platforms,
      },
      lang: "id",
      length: "standard",
    });

    await prisma.contentBrief.create({
      data: {
        projectId: project.id,
        summary: brief.summary as unknown as Prisma.InputJsonValue,
        rows: brief.rows as unknown as Prisma.InputJsonValue,
        captions: brief.captions as unknown as Prisma.InputJsonValue,
        versions: [],
        status: spec.briefStatus ?? "siap",
      },
    });

    if (!spec.creationType) continue;

    const sources: MediaSourceInput[] = (spec.sources ?? []).map((s, i) => ({
      briefRow: i + 1,
      source: s.source,
      assetId: s.assetIndex !== undefined ? assetIds[s.assetIndex % assetIds.length] : undefined,
    }));

    const defs = buildItemDefs(spec.creationType, brief.rows as BriefRow[], sources);
    const picked = spec.itemCount ? defs.slice(0, spec.itemCount) : defs;

    await prisma.creation.create({
      data: {
        projectId: project.id,
        type: spec.creationType,
        status: "ready",
        items: {
          create: picked.map((def, i) => ({
            briefRowRef: def.briefRowRef,
            mediaSource: def.mediaSource,
            assetId: def.assetId ?? null,
            prompt: def.prompt ?? null,
            provider: def.mediaSource === "ai_generated" ? "mock" : null,
            status: "completed",
            versions: i === 0 && spec.creationType === "video" ? [SEED_IMAGES[7]] : [],
          })),
        },
      },
    });
  }
}

// ─── Generations (galeri AI Studio) ─────────────────────────────────────────

async function seedGenerations(adminId: string): Promise<void> {
  const now = Date.now();
  const creator = await prisma.user.findFirst({
    where: { role: "creator" },
    orderBy: { createdAt: "asc" },
  });

  const ratios: { ratio: string; width: number; height: number }[] = [
    { ratio: "1:1", width: 1024, height: 1024 },
    { ratio: "9:16", width: 768, height: 1344 },
    { ratio: "16:9", width: 1344, height: 768 },
  ];

  // 10 gambar milik admin
  for (let i = 0; i < 10; i++) {
    const r = ratios[i % ratios.length];
    const at = new Date(now - (i + 1) * 5 * HOUR_MS);
    await prisma.generation.create({
      data: {
        userId: adminId,
        type: "image",
        prompt: IMAGE_PROMPTS[i % IMAGE_PROMPTS.length],
        params: {
          aspectRatio: r.ratio,
          quality: "high",
          dimensionPreset: null,
          width: r.width,
          height: r.height,
        },
        provider: "mock",
        modelName: "mock-image-v1",
        status: "completed",
        fileUrl: SEED_IMAGES[i % SEED_IMAGES.length],
        thumbnailUrl: SEED_IMAGES[i % SEED_IMAGES.length],
        width: r.width,
        height: r.height,
        createdAt: at,
        completedAt: new Date(at.getTime() + 42_000),
      },
    });
  }

  // 4 video
  for (let i = 0; i < 4; i++) {
    const at = new Date(now - (i + 1) * 9 * HOUR_MS);
    await prisma.generation.create({
      data: {
        userId: adminId,
        type: "video",
        prompt: `${IMAGE_PROMPTS[i]} — versi video gerak pelan`,
        params: { aspectRatio: "16:9", durationSeconds: 6, resolution: "720p" },
        provider: "mock",
        modelName: "mock-video-v1",
        status: "completed",
        fileUrl: null, // storage tidak tersedia di mode mock; poster tetap tampil
        thumbnailUrl: SEED_IMAGES[(i + 2) % SEED_IMAGES.length],
        width: 1280,
        height: 720,
        durationSeconds: 6,
        createdAt: at,
        completedAt: new Date(at.getTime() + 96_000),
      },
    });
  }

  // 3 audio (waveform deterministik supaya player punya bentuk)
  for (let i = 0; i < 3; i++) {
    const at = new Date(now - (i + 1) * 13 * HOUR_MS);
    await prisma.generation.create({
      data: {
        userId: adminId,
        type: "audio",
        prompt: "Narasi refleksi mingguan, suara wanita natural",
        params: {
          voiceId: "aria-id",
          voiceName: "Aria (ID)",
          language: "id",
          speed: 1,
          style: "natural",
          format: "mp3",
        },
        provider: "mock",
        modelName: "mock-tts-v1",
        status: "completed",
        fileUrl: null,
        thumbnailUrl: null,
        waveform: Array.from({ length: 48 }, (_, n) => 0.25 + 0.7 * Math.abs(Math.sin(n * 0.6 + i))),
        durationSeconds: 38 + i * 9,
        createdAt: at,
        completedAt: new Date(at.getTime() + 21_000),
      },
    });
  }

  // 3 brief tersimpan (hasil generate brief dari galeri)
  const provider = getAIProvider();
  for (let i = 0; i < 3; i++) {
    const generated = await provider.generateBrief({
      topic: IMAGE_PROMPTS[i],
      angle: { title: "Sudut santai", description: "Gaya naratif ringan", audience: "Umum" },
      contentType: "carousel",
      summaryContext: { niche: "Produktivitas & karier remote", tone: "Berita singkat", platforms: ["Instagram"] },
      lang: "id",
      length: "short",
    });
    const at = new Date(now - (i + 1) * 26 * HOUR_MS);
    await prisma.generation.create({
      data: {
        userId: adminId,
        type: "brief",
        prompt: IMAGE_PROMPTS[i],
        params: { length: "short" },
        provider: "mock",
        modelName: "mock-brief-v1",
        status: "completed",
        resultJson: generated as unknown as Prisma.InputJsonValue,
        createdAt: at,
        completedAt: new Date(at.getTime() + 12_000),
      },
    });
  }

  // 5 hasil milik creator → bagian "selesai" (hasil orang lain) ikut terisi
  if (creator) {
    for (let i = 0; i < 5; i++) {
      const r = ratios[(i + 1) % ratios.length];
      const at = new Date(now - (i + 1) * 7 * HOUR_MS);
      await prisma.generation.create({
        data: {
          userId: creator.id,
          type: "image",
          prompt: `Konten creator: ${IMAGE_PROMPTS[(i + 2) % IMAGE_PROMPTS.length]}`,
          params: {
            aspectRatio: r.ratio,
            quality: "medium",
            dimensionPreset: null,
            width: r.width,
            height: r.height,
          },
          provider: "mock",
          modelName: "mock-image-v1",
          status: "completed",
          fileUrl: SEED_IMAGES[(i + 5) % SEED_IMAGES.length],
          thumbnailUrl: SEED_IMAGES[(i + 5) % SEED_IMAGES.length],
          width: r.width,
          height: r.height,
          createdAt: at,
          completedAt: new Date(at.getTime() + 38_000),
        },
      });
    }
  }
}

// ─── Pemakaian kuota hari ini ────────────────────────────────────────────────

async function seedQuotaUsage(userId: string): Promise<void> {
  const date = jakartaDate(new Date());
  const usage: { type: string; used: number }[] = [
    { type: "image", used: 3 },
    { type: "video", used: 1 },
    { type: "audio", used: 0 },
    { type: "brief", used: 2 },
  ];
  for (const row of usage) {
    await prisma.quotaUsage.create({ data: { userId, type: row.type, date, used: row.used } });
  }
}

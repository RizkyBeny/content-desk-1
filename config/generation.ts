import { getEnv } from "@/lib/env";
import type {
  AudioParams,
  BriefParams,
  ContentType,
  GenerationParams,
  GenerationType,
  ImageParams,
  VideoParams,
} from "@/types";

export interface Option {
  value: string;
  label: string;
}

// ─────────────────────────────────────────────────────────────
// Image (FR-IMG-1..6)
// ─────────────────────────────────────────────────────────────

export const IMAGE_RATIOS: Option[] = [
  { value: "1:1", label: "1:1" },
  { value: "4:5", label: "4:5" },
  { value: "3:4", label: "3:4" },
  { value: "9:16", label: "9:16" },
  { value: "16:9", label: "16:9" },
  { value: "4:3", label: "4:3" },
  { value: "custom", label: "Kustom" },
];

export type ImageDimensionPreset = "small" | "medium" | "large";

export const IMAGE_DIMENSION_PRESETS: Option[] = [
  { value: "small", label: "Kecil" },
  { value: "medium", label: "Sedang" },
  { value: "large", label: "Besar" },
];

export const IMAGE_QUALITIES: Option[] = [
  { value: "low", label: "Standar" },
  { value: "medium", label: "Tinggi" },
  { value: "high", label: "Maksimal" },
];

const IMAGE_SIZE_TABLE: Record<string, Record<ImageDimensionPreset, { width: number; height: number }>> = {
  "1:1": { small: { width: 768, height: 768 }, medium: { width: 1024, height: 1024 }, large: { width: 1536, height: 1536 } },
  "4:5": { small: { width: 768, height: 960 }, medium: { width: 1024, height: 1280 }, large: { width: 1536, height: 1920 } },
  "3:4": { small: { width: 768, height: 1024 }, medium: { width: 960, height: 1280 }, large: { width: 1152, height: 1536 } },
  "9:16": { small: { width: 576, height: 1024 }, medium: { width: 720, height: 1280 }, large: { width: 1080, height: 1920 } },
  "16:9": { small: { width: 1024, height: 576 }, medium: { width: 1280, height: 720 }, large: { width: 1920, height: 1080 } },
  "4:3": { small: { width: 1024, height: 768 }, medium: { width: 1280, height: 960 }, large: { width: 1536, height: 1152 } },
};

export const CUSTOM_SIZE_MIN = 512;
export const CUSTOM_SIZE_MAX = 2048;
export const CUSTOM_SIZE_STEP = 8;

export interface Size {
  width: number;
  height: number;
}

export function imageTargetSize(params: Partial<ImageParams>): Size {
  if (params.aspectRatio === "custom") {
    return { width: params.width ?? 1024, height: params.height ?? 1024 };
  }
  const table = IMAGE_SIZE_TABLE[params.aspectRatio ?? "1:1"] ?? IMAGE_SIZE_TABLE["1:1"];
  const preset = (params.dimensionPreset ?? "medium") as ImageDimensionPreset;
  return table[preset] ?? table.medium;
}

/** Rasio hasil hitung untuk chip dimensi kustom, mis. "≈ 3:2". */
export function approximateRatio(width: number, height: number): string {
  if (!width || !height) return "≈ —";
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(Math.round(width), Math.round(height)) || 1;
  return `≈ ${Math.round(width / divisor)}:${Math.round(height / divisor)}`;
}

export type ImageGuidedFormat = "square" | "landscape" | "portrait" | "instagram";
export type ImageGuidedContentKind = "single" | "carousel";

export const IMAGE_GUIDED_FORMATS: {
  value: ImageGuidedFormat;
  label: string;
  aspectRatio: string;
}[] = [
  { value: "square", label: "Square (1:1)", aspectRatio: "1:1" },
  { value: "landscape", label: "Landscape (16:9)", aspectRatio: "16:9" },
  { value: "portrait", label: "Portrait (9:16)", aspectRatio: "9:16" },
  { value: "instagram", label: "Instagram Post (4:5)", aspectRatio: "4:5" },
];

export const IMAGE_GUIDED_CONTENT_KINDS: {
  value: ImageGuidedContentKind;
  label: string;
  hint?: string;
  disabled?: boolean;
}[] = [
  { value: "single", label: "Single Image" },
  { value: "carousel", label: "Carousel 3 Image", hint: "Segera hadir", disabled: true },
];

export function guidedImageFormatFromRatio(ratio: string | null | undefined): ImageGuidedFormat {
  if (ratio === "16:9") return "landscape";
  if (ratio === "9:16" || ratio === "3:4") return "portrait";
  if (ratio === "4:5") return "instagram";
  return "square";
}

export function guidedImageParams(
  format: ImageGuidedFormat,
  quality: ImageParams["quality"] = "medium",
): Pick<ImageParams, "aspectRatio" | "quality" | "dimensionPreset" | "width" | "height"> {
  const option = IMAGE_GUIDED_FORMATS.find((item) => item.value === format) ?? IMAGE_GUIDED_FORMATS[0];
  const size = imageTargetSize({ aspectRatio: option.aspectRatio, dimensionPreset: "medium" });
  return {
    aspectRatio: option.aspectRatio,
    quality,
    dimensionPreset: "medium",
    width: size.width,
    height: size.height,
  };
}

/** Skill chips statis untuk halaman Create Image (mengikuti Figma "Generate Image"). */
export const TOPIC_CHIPS: { label: string; badge?: "Panas" | "Baru" | "Hot" }[] = [
  { label: "/ Nasional & Politik Terkini", badge: "Panas" },
  { label: "/ Jadwal Timnas & Liga 1", badge: "Baru" },
  { label: "/ Berita Viral Hari Ini", badge: "Hot" },
  { label: "/ Kesehatan Keluarga" },
  { label: "/ Update Gaya Hidup" },
];

/** Placeholder section "Insights" pada halaman Create Image (Figma node 828:27420). */
export const INSIGHT_SECTION: {
  title: string;
  subtitle: string;
  takeaways: { badge: string; tone: "brand" | "green"; text: string }[];
  metrics: {
    label: string;
    format: string;
    topic: string;
    points: string[];
    image: string;
  }[];
} = {
  title: "Konten Tertinggi",
  subtitle: "Ringkasan insight utama dari keseluruhan analisis pada periode ini",
  takeaways: [
    {
      badge: "Quotes",
      tone: "brand",
      text: "Konten Quotes masih menjadi format konten yang banyak diminati karena dinilai sangat relate dengan kebanyakan user",
    },
    {
      badge: "Infografis",
      tone: "green",
      text: "Konten Infografis masih menjadi format konten yang banyak menarik perhatian terutama di Instagram dan Tiktok",
    },
  ],
  metrics: [
    {
      label: "Impression Tertinggi",
      format: "Instagram Post",
      topic: "Biaya sekolah swasta di Jakarta",
      points: ["Kumparanmom menarik sekitar 150.000+ impresi", "Sebanyak 32 komentar setuju pada topik ini"],
      image: "/seed/unsplash/abstract-05.jpg",
    },
    {
      label: "Most Loved",
      format: "Instagram Carousel",
      topic: "Mengenal lebih jauh mengenai BYD Atto 2",
      points: ["Topik yang disajikan dinilai sedang hangat", "Memperoleh likes 2000+"],
      image: "/seed/unsplash/abstract-06.jpg",
    },
    {
      label: "Paling Banyak di Share",
      format: "X Thread",
      topic: "IHSG kembali ke titik terendah",
      points: ["Topik yang memiliki impressi lebih dari 200.000+", "Memperoleh share 2000+ karena sentimen negatif"],
      image: "/seed/unsplash/abstract-07.jpg",
    },
    {
      label: "Paling Banyak di Repost",
      format: "Instagram Reels",
      topic: "Kenaikan harga bahan pokok",
      points: ["Topik yang banyak dibahas di berbagai kanal", "Memperoleh repost 1500+ dalam 24 jam"],
      image: "/seed/unsplash/abstract-08.jpg",
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// Video (FR-VID-1..5)
// ─────────────────────────────────────────────────────────────

export const VIDEO_RATIOS: Option[] = [
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "1:1", label: "1:1" },
];

export const VIDEO_DURATIONS = [5, 10, 15];

export const VIDEO_RESOLUTIONS: Option[] = [
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
];

const VIDEO_SIZE_TABLE: Record<string, Record<string, Size>> = {
  "16:9": { "720p": { width: 1280, height: 720 }, "1080p": { width: 1920, height: 1080 } },
  "9:16": { "720p": { width: 720, height: 1280 }, "1080p": { width: 1080, height: 1920 } },
  "1:1": { "720p": { width: 720, height: 720 }, "1080p": { width: 1080, height: 1080 } },
};

export function videoTargetSize(aspectRatio: string, resolution: string): Size {
  const table = VIDEO_SIZE_TABLE[aspectRatio] ?? VIDEO_SIZE_TABLE["16:9"];
  return table[resolution] ?? table["720p"];
}

export const START_FRAME_MAX_BYTES = 10 * 1024 * 1024;
export const START_FRAME_ACCEPT = ["image/jpeg", "image/png", "image/webp"];
export const ATTACHMENT_MAX_IMAGE_MB = 25;
export const ATTACHMENT_MAX_VIDEO_MB = 200;
export const ATTACHMENT_ACCEPT_IMAGE = "image/jpeg,image/png,image/webp,image/gif";
export const ATTACHMENT_ACCEPT_VIDEO = "video/mp4,video/quicktime,video/webm";
export const ATTACHMENT_ACCEPT_VIDEO_ONLY = "video/mp4,video/quicktime,video/webm";
export const ATTACHMENT_ACCEPT_IMAGE_ONLY = "image/jpeg,image/png,image/webp,image/gif";

// ─────────────────────────────────────────────────────────────
// Audio (FR-AUD-1..5)
// ─────────────────────────────────────────────────────────────

export const AUDIO_LANGUAGES: Option[] = [
  { value: "id", label: "Indonesia" },
  { value: "en", label: "Inggris" },
];

export const AUDIO_SPEED_MIN = 0.7;
export const AUDIO_SPEED_MAX = 1.2;
export const AUDIO_SPEED_STEP = 0.1;

export const AUDIO_STYLES: Option[] = [
  { value: "natural", label: "Natural" },
  { value: "expressive", label: "Ekspresif" },
  { value: "stable", label: "Stabil" },
];

export const AUDIO_FORMATS: Option[] = [
  { value: "mp3", label: "MP3" },
  { value: "wav", label: "WAV" },
];

export const AUDIO_TEXT_MAX = 5000;
export const AUDIO_CHUNK_MAX = 1500;
export const AUDIO_MAX_REQUESTS = 3;

// ─────────────────────────────────────────────────────────────
// Brief (FR-BRF-1..6)
// ─────────────────────────────────────────────────────────────

export const BRIEF_CONTENT_TYPES: Option[] = [
  { value: "image", label: "Single Image" },
  { value: "carousel", label: "Carousel" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "article", label: "Artikel" },
];

export const BRIEF_PLATFORMS: Option[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "website", label: "Website/Artikel" },
  { value: "general", label: "Umum" },
];

export const BRIEF_TONES: Option[] = [
  { value: "casual", label: "Santai" },
  { value: "informative", label: "Informatif" },
  { value: "formal", label: "Formal" },
  { value: "persuasive", label: "Persuasif" },
  { value: "inspirational", label: "Inspiratif" },
];

export const BRIEF_LANGUAGES: Option[] = [
  { value: "id", label: "Indonesia" },
  { value: "en", label: "Inggris" },
];

export const BRIEF_LENGTHS: Option[] = [
  { value: "short", label: "Singkat" },
  { value: "standard", label: "Standar" },
  { value: "detailed", label: "Detail" },
];

export const BRIEF_AUDIENCE_MAX = 150;

export const BRIEF_ROW_COUNTS: Record<BriefParams["length"], number> = {
  short: 5,
  standard: 7,
  detailed: 10,
};

export const BRIEF_ARTICLE_WORDS: Record<BriefParams["length"], number> = {
  short: 400,
  standard: 800,
  detailed: 1500,
};

export const BRIEF_VIDEO_TOTAL_SECONDS: Record<BriefParams["length"], number> = {
  short: 15,
  standard: 30,
  detailed: 60,
};

export const BRIEF_AUDIO_TOTAL_SECONDS: Record<BriefParams["length"], number> = {
  short: 20,
  standard: 40,
  detailed: 60,
};

// ─────────────────────────────────────────────────────────────
// Composer, kuota, dan proses (CMP/QTA/GEN)
// ─────────────────────────────────────────────────────────────

export const PROMPT_LIMITS: Record<GenerationType, number> = {
  image: 1000,
  video: 1000,
  audio: 5000,
  brief: 2000,
};

export const PLACEHOLDER: Record<GenerationType, string> = {
  image: "Bikinkan gambar tentang suasana gedung DPR",
  video: "Deskripsikan video yang ingin dibuat…",
  audio: "Tulis naskah yang akan diucapkan…",
  brief: "Tulis topik atau instruksi untuk content brief…",
};

export const PAGE_TITLE: Record<GenerationType, string> = {
  image: "Create Image",
  video: "Create Video",
  audio: "Create Audio",
  brief: "Create Brief",
};

export const PAGE_DESCRIPTION: Record<GenerationType, string> = {
  image: "Buat gambar dari deskripsi teks, atur rasio dan kualitasnya.",
  video: "Buat video pendek dari deskripsi, lengkap dengan start frame opsional.",
  audio: "Ubah naskah menjadi suara dengan pilihan suara, gaya, dan format.",
  brief: "Susun brief konten lengkap dengan tabel dan rekomendasi caption.",
};

export const DEFAULT_DAILY_LIMITS: Record<GenerationType, number> = {
  image: 20,
  video: 5,
  audio: 30,
  brief: 30,
};

export const DEFAULT_MAX_CONCURRENT: Record<GenerationType, number> = {
  image: 3,
  video: 2,
  audio: 3,
  brief: 3,
};

export const JOB_TIMEOUT_MS: Record<GenerationType, number> = {
  image: 120_000,
  audio: 120_000,
  brief: 90_000,
  video: 600_000,
};

export const PROCESSING_HINT: Record<GenerationType, string> = {
  image: "Biasanya selesai kurang dari 1 menit.",
  video: "Biasanya 1–3 menit.",
  audio: "Biasanya selesai kurang dari 1 menit.",
  brief: "Biasanya selesai kurang dari 1 menit.",
};

export interface ModelInfo {
  provider: string;
  id: string;
  displayName: string;
}

export function resolveModel(type: GenerationType): ModelInfo {
  const env = getEnv();
  if (type === "image") {
    const provider = env.IMAGE_PROVIDER === "openai" ? "openai" : "mock";
    return provider === "openai"
      ? { provider, id: "gpt-image-1", displayName: "OpenAI gpt-image-1" }
      : { provider, id: "mock-image-v1", displayName: "Mock Image v1" };
  }
  if (type === "video") {
    const provider = env.VIDEO_PROVIDER === "openai" ? "openai" : "mock";
    return provider === "openai"
      ? { provider, id: "video-v1", displayName: "OpenAI Video v1" }
      : { provider, id: "mock-video-v1", displayName: "Mock Video v1" };
  }
  if (type === "audio") {
    const provider = env.AUDIO_PROVIDER === "elevenlabs" ? "elevenlabs" : "mock";
    return provider === "elevenlabs"
      ? { provider, id: "eleven_multilingual_v2", displayName: "ElevenLabs Multilingual v2" }
      : { provider, id: "mock-tts-v1", displayName: "Mock TTS v1" };
  }
  const provider = env.AI_PROVIDER === "openai" ? "openai" : "mock";
  return provider === "openai"
    ? { provider, id: "gpt-4o-mini", displayName: "OpenAI gpt-4o-mini" }
    : { provider, id: "mock-brief-v1", displayName: "Mock Brief v1" };
}

export function isGenerationType(value: string): value is GenerationType {
  return value === "image" || value === "video" || value === "audio" || value === "brief";
}

export function labelFor(options: Option[], value: string | null | undefined): string {
  if (!value) return "—";
  return options.find((option) => option.value === value)?.label ?? value;
}

export function defaultParams(type: GenerationType): GenerationParams {
  return {
    image: {
      aspectRatio: "1:1",
      quality: "medium",
      dimensionPreset: "medium",
      width: 1024,
      height: 1024,
    } satisfies ImageParams,
    video: {
      aspectRatio: "16:9",
      durationSeconds: 5,
      resolution: "720p",
      startFrameAssetId: null,
    } satisfies VideoParams,
    audio: {
      voiceId: "mock-id-ramah",
      voiceName: "Rama",
      language: "id",
      speed: 1,
      style: "natural",
      format: "mp3",
    } satisfies AudioParams,
    brief: {
      contentType: "image",
      platform: "instagram",
      tone: "casual",
      language: "id",
      audience: "",
      length: "standard",
    } satisfies BriefParams,
  }[type];
}

export type {
  AudioParams,
  BriefParams,
  ContentType,
  GenerationParams,
  GenerationType,
  ImageParams,
  VideoParams,
};

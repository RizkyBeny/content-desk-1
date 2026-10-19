import type { GenerationDTO } from "@/types";

export interface ImageTemplate {
  id: string;
  title: string;
  prompt: string;
  imageUrl: string;
  author: string;
  publishedAt: string;
}

export const IMAGE_TEMPLATES: ImageTemplate[] = [
  {
    id: "tpl-gradien-ungu-senja",
    title: "Gradien Ungu Senja",
    prompt:
      "Latar abstrak gradien ungu ke biru senja untuk feed Instagram yang menenangkan, cahaya lembut, komposisi minimalis",
    imageUrl: "/seed/unsplash/abstract-01.jpg",
    author: "Dimas Pratama",
    publishedAt: "2026-10-02T09:00:00.000Z",
  },
  {
    id: "tpl-geometri-minimalis",
    title: "Geometri Minimalis",
    prompt:
      "Latar geometris minimalis dengan sudut tajam dan bayangan halus untuk slide presentasi profesional",
    imageUrl: "/seed/unsplash/abstract-02.jpg",
    author: "Sari Wijaya",
    publishedAt: "2026-09-25T10:30:00.000Z",
  },
  {
    id: "tpl-marmer-cair-emas",
    title: "Marmer Cair Emas",
    prompt:
      "Tekstur marmer cair warna emas dan hitam untuk banner premium, kilau lembut, nuansa mewah",
    imageUrl: "/seed/unsplash/abstract-03.jpg",
    author: "Budi Santoso",
    publishedAt: "2026-09-18T14:00:00.000Z",
  },
  {
    id: "tpl-cahaya-neon-malam",
    title: "Cahaya Neon Malam",
    prompt:
      "Abstraksi cahaya neon futuristik nuansa malam untuk konten teknologi, glow ungu dan biru elektrik",
    imageUrl: "/seed/unsplash/abstract-04.jpg",
    author: "Ayu Lestari",
    publishedAt: "2026-09-10T08:15:00.000Z",
  },
  {
    id: "tpl-gelombang-pastel",
    title: "Gelombang Pastel",
    prompt:
      "Background gelombang lembut warna pastel untuk carousel soft selling, tekstur sutra, cahaya diffused",
    imageUrl: "/seed/unsplash/abstract-05.jpg",
    author: "Raka Wibowo",
    publishedAt: "2026-09-03T11:45:00.000Z",
  },
  {
    id: "tpl-kabut-senja-hangat",
    title: "Kabut Senja Hangat",
    prompt:
      "Kabut warna senja oranye di atas siluet bukit untuk konten storytelling, atmosfer hangat dan reflektif",
    imageUrl: "/seed/unsplash/abstract-06.jpg",
    author: "Nadia Putri",
    publishedAt: "2026-08-27T16:20:00.000Z",
  },
  {
    id: "tpl-pola-topografi",
    title: "Pola Topografi",
    prompt:
      "Pola kontur topografi modern garis tipis untuk latar konten teknologi dan AI, monokrom elegan",
    imageUrl: "/seed/unsplash/abstract-07.jpg",
    author: "Fajar Ramadhan",
    publishedAt: "2026-08-19T13:05:00.000Z",
  },
  {
    id: "tpl-holografik-ungu-pink",
    title: "Holografik Ungu-Pink",
    prompt:
      "Latar holografik ungu-pink mengkilap untuk promo produk kekinian, efek iridescent, lighting studio",
    imageUrl: "/seed/unsplash/abstract-08.jpg",
    author: "Intan Maharani",
    publishedAt: "2026-08-11T09:40:00.000Z",
  },
  {
    id: "tpl-cat-akrilik-tekstur",
    title: "Cat Akrilik Tekstur",
    prompt:
      "Tekstur lukisan akrilik tebal dengan sapuan kuas berani untuk post berani, warna saturated, detail close-up",
    imageUrl: "/seed/unsplash/abstract-09.jpg",
    author: "Yoga Pratama",
    publishedAt: "2026-08-04T15:10:00.000Z",
  },
  {
    id: "tpl-bintang-minimalis",
    title: "Bintang Minimalis",
    prompt:
      "Latar langit malam berbintang minimalis untuk kutipan dan caption reflektif, gradasi biru tua ke hitam",
    imageUrl: "/seed/unsplash/abstract-10.jpg",
    author: "Maya Sari",
    publishedAt: "2026-07-28T20:00:00.000Z",
  },
];

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function templateToGeneration(template: ImageTemplate): GenerationDTO {
  return {
    id: `template-${template.id}`,
    type: "image",
    status: "completed",
    prompt: template.prompt,
    params: {
      aspectRatio: "3:4",
      quality: "medium",
      dimensionPreset: "medium",
      width: 768,
      height: 1024,
    },
    provider: "template",
    modelId: "template",
    modelName: "Template",
    fileUrl: template.imageUrl,
    thumbnailUrl: template.imageUrl,
    width: 768,
    height: 1024,
    durationSeconds: null,
    waveform: null,
    result: null,
    errorMessage: null,
    owner: { id: "template", name: template.author, initials: initialsOf(template.author) },
    isOwner: false,
    createdAt: template.publishedAt,
    startedAt: null,
    completedAt: null,
  };
}

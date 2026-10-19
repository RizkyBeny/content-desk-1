import fs from "node:fs";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { getStorage } from "../src/lib/storage";
import {
  IMAGE_DIMENSION_PRESETS,
  IMAGE_RATIOS,
  imageTargetSize,
  resolveModel,
} from "../config/generation";
import type { ImageParams } from "../src/types";

const loadEnvFile = (process as unknown as { loadEnvFile?: (file?: string) => void }).loadEnvFile;
try {
  loadEnvFile?.(".env");
} catch {
  /* .env tidak wajib ada */
}

const DEMO_PROVIDER = "demo";
const TOTAL = 34;
const ADMIN_OWNED = 12;
const PHOTO_DIR = path.join(process.cwd(), "public", "seed", "unsplash");

const EXTRA_USERS = [
  { email: "dimas@platform.local", name: "Dimas Pratama" },
  { email: "sari@platform.local", name: "Sari Wijaya" },
  { email: "budi@platform.local", name: "Budi Santoso" },
];

const PROMPTS = [
  "Latar abstrak gradien ungu-biru untuk feed Instagram",
  "Background gelombang lembut nuansa pastel untuk banner",
  "Tekstur marmer cair warna emas dan hitam",
  "Latar geometris minimalis untuk presentasi",
  "Abstraksi cahaya neon futuristik malam hari",
  "Pola gelombang pasir dengan bayangan lembut",
  "Background cat air biru laut untuk poster",
  "Bentuk organik warna hangat untuk cover album",
  "Latar low-poly biru teal untuk landing page",
  "Kabut warna senja oranye di atas bukit",
  "Tekstur kertas bertekstur dengan cipratan tinta",
  "Latar gradien monokrom abu untuk mockup",
  "Abstraksi lingkaran bokeh warna warni",
  "Pola garis diagonal modern hitam putih",
  "Latar awan lembut dengan sinar matahari",
  "Bentuk 3D mengambang warna korporat",
  "Tekstur beton halus dengan aksen hijau",
  "Latar gelombang digital biru gelap",
  "Abstraksi cat minyak merah marun",
  "Pola topografi kontur untuk teknologi",
  "Latar holografik ungu-pink mengkilap",
  "Bentuk cairan metalik perak di permukaan gelap",
  "Latar langit malam berbintang minimalis",
  "Pola mozaik warna tanah untuk kemasan",
  "Abstraksi gelombang suara bergaya neon",
  "Latar gradien mint ke navy untuk aplikasi",
  "Tekstur lukisan akrilik bertekstur tebal",
  "Bentuk geometris 3D warna pastel lembut",
  "Latar sinar prismatik di atas latar gelap",
  "Pola anyaman warna alami untuk interior",
  "Abstraksi kabut berasap dengan cahaya ungu",
  "Latar gradien fajar merah muda ke kuning",
  "Bentuk gelombang logam biru berkilau",
  "Latar kolase tekstur kertas warna hangat",
];

async function ensureUser(email: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  const passwordHash = await hash("demo123456", 10);
  return prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "creator",
      contentLang: "id",
      theme: "system",
      niche: null,
      nicheCategories: [],
    },
  });
}

async function registerPhotos(): Promise<string[]> {
  const storage = getStorage();
  const files = fs
    .readdirSync(PHOTO_DIR)
    .filter((file) => file.toLowerCase().endsWith(".jpg"))
    .sort();
  const keys: string[] = [];
  for (const file of files) {
    const key = `demo/gallery/${file}`;
    if (!(await storage.exists(key))) {
      const buffer = fs.readFileSync(path.join(PHOTO_DIR, file));
      await storage.put(key, buffer, "image/jpeg");
    }
    keys.push(key);
  }
  return keys;
}

async function main() {
  const existing = await prisma.generation.count({ where: { provider: DEMO_PROVIDER } });
  if (existing > 0) {
    console.info(`Seed demo galeri dilewati (sudah ada ${existing} baris demo).`);
    return;
  }

  const admin = await prisma.user.findUnique({ where: { email: "admin@platform.local" } });
  if (!admin) throw new Error("User admin belum ada. Jalankan `npm run db:seed` terlebih dahulu.");

  const others: Awaited<ReturnType<typeof ensureUser>>[] = [];
  for (const user of EXTRA_USERS) others.push(await ensureUser(user.email, user.name));

  const keys = await registerPhotos();
  if (keys.length === 0) throw new Error("Tidak ada berkas foto di public/seed/unsplash.");

  const model = resolveModel("image");
  const ratios = IMAGE_RATIOS.filter((ratio) => ratio.value !== "custom").map((ratio) => ratio.value);
  const presets = IMAGE_DIMENSION_PRESETS.map((preset) => preset.value as ImageParams["dimensionPreset"]);
  const qualities: ImageParams["quality"][] = ["low", "medium", "high"];

  const owners = [
    ...Array.from({ length: ADMIN_OWNED }, () => admin.id),
    ...Array.from({ length: TOTAL - ADMIN_OWNED }, (_, index) => others[index % others.length].id),
  ];

  const now = Date.now();
  for (let index = 0; index < TOTAL; index++) {
    const aspectRatio = ratios[index % ratios.length];
    const dimensionPreset = presets[index % presets.length];
    const quality = qualities[index % qualities.length];
    const size = imageTargetSize({ aspectRatio, dimensionPreset });
    const key = keys[index % keys.length];
    const params: ImageParams = {
      aspectRatio,
      quality,
      dimensionPreset,
      width: size.width,
      height: size.height,
    };
    const createdAt = new Date(now - index * 19 * 3600 * 1000 - (index % 5) * 600_000);
    await prisma.generation.create({
      data: {
        type: "image",
        userId: owners[index],
        prompt: PROMPTS[index % PROMPTS.length],
        params: params as unknown as Prisma.InputJsonValue,
        provider: DEMO_PROVIDER,
        modelName: model.displayName,
        status: "completed",
        fileUrl: key,
        thumbnailUrl: key,
        width: size.width,
        height: size.height,
        createdAt,
        startedAt: createdAt,
        completedAt: new Date(createdAt.getTime() + 8000),
      },
    });
  }

  console.info(
    `Seed demo galeri selesai: ${TOTAL} image (${ADMIN_OWNED} milik admin, ${TOTAL - ADMIN_OWNED} milik user lain).`,
  );
}

main()
  .catch((error) => {
    console.error("Seed demo galeri gagal:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

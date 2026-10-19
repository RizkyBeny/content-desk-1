import { prisma } from "../src/lib/prisma";
import { regenerateGeneration } from "../src/lib/services/generations";
import { generateItem } from "../src/lib/services/creations-generate";

const MEDIA_CREATION_TYPES = ["image", "video", "carousel"];

async function regenerateGenerations(): Promise<void> {
  const rows = await prisma.generation.findMany({
    where: { type: { in: ["image", "video"] }, status: "completed", deletedAt: null },
    select: { id: true, type: true },
    orderBy: { createdAt: "asc" },
  });
  console.info(`Generations image/video: ${rows.length}`);
  let ok = 0;
  for (const row of rows) {
    const success = await regenerateGeneration(row.id);
    if (success) ok++;
    else console.warn(`  gagal ${row.type} ${row.id}`);
  }
  console.info(`Generations selesai: ${ok}/${rows.length}`);
}

async function regenerateCreations(): Promise<void> {
  const items = await prisma.creationItem.findMany({
    where: { creation: { type: { in: MEDIA_CREATION_TYPES } } },
    select: { id: true },
  });
  console.info(`Creation items (image/video/carousel): ${items.length}`);
  for (const item of items) {
    await generateItem(item.id);
  }
  console.info("Creation items selesai.");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const gensOnly = args.includes("--generations-only");
  const creationsOnly = args.includes("--creations-only");

  if (!creationsOnly) await regenerateGenerations();
  if (!gensOnly) await regenerateCreations();

  console.info("Regenerasi media selesai.");
}

main()
  .catch((err) => {
    console.error("media:regen gagal:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

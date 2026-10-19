import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "seed", "unsplash");

const SOURCE = "https://unsplash.com/s/photos/abstract-background";

const PHOTO_IDS = [
  "1550684848-fac1c5b4e853",
  "1558591710-4b4a1ae0f04d",
  "1541701494587-cb58502866ab",
  "1557672172-298e090bd0f1",
  "1618005182384-a83a8bd57fbe",
  "1620121692029-d088224ddc74",
  "1614850715649-1d0106293bd1",
  "1620641788421-7a1c342ea42e",
  "1604076913837-52ab5629fba9",
  "1557682224-5b8590cd9ec5",
  "1618556450991-2f1af64e8191",
  "1567095761054-7a02e69e5c43",
  "1550745165-9bc0b252726f",
  "1554034483-04fda0d3507b",
  "1543722530-d2c3201371e7",
  "1517483000871-1dbf64a6e1c6",
  "1502691876148-a84978e59af8",
  "1534796636912-3b95b3ab5986",
];

const URL_PARAMS = "w=3840&h=3840&fit=max&q=80&fm=jpg";

function cdnUrl(id) {
  return `https://images.unsplash.com/photo-${id}?${URL_PARAMS}`;
}

async function fileExists(p) {
  try {
    const stat = await fs.stat(p);
    return stat.size > 0;
  } catch {
    return false;
  }
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchBytes(url) {
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const type = res.headers.get("content-type") ?? "";
      if (!type.startsWith("image/")) throw new Error(`bukan gambar (${type})`);
      const bytes = Buffer.from(await res.arrayBuffer());
      if (bytes.length < 10_000) throw new Error(`terlalu kecil (${bytes.length} bytes)`);
      return bytes;
    } catch (err) {
      lastErr = err;
      const code = err.cause?.code ?? "";
      console.info(`  retry ${attempt}/4 (${err.message}${code ? ` ${code}` : ""})`);
      await sleep(800 * attempt);
    }
  }
  throw new Error(`Gagal mengunduh ${url}: ${lastErr?.message ?? "unknown"}`);
}

async function download(id, index) {
  const name = `abstract-${String(index + 1).padStart(2, "0")}.jpg`;
  const target = path.join(OUT_DIR, name);
  if (await fileExists(target)) {
    console.info(`skip  ${name}`);
    return { name, id, bytes: (await fs.stat(target)).size, cached: true };
  }
  const bytes = await fetchBytes(cdnUrl(id));
  await fs.writeFile(target, bytes);
  console.info(`ok    ${name}  ${(bytes.length / 1024).toFixed(0)} KB`);
  return { name, id, bytes: bytes.length, cached: false };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const entries = [];
  for (let i = 0; i < PHOTO_IDS.length; i++) {
    entries.push(await download(PHOTO_IDS[i], i));
  }
  const credits = {
    source: SOURCE,
    provider: "Unsplash",
    license: "Unsplash License (https://unsplash.com/license) — free to use, no attribution required.",
    note:
      "Photographer names are not retrievable without the Unsplash API; all photos are hotlink-derived from images.unsplash.com and used as mock generation material.",
    params: URL_PARAMS,
    photos: entries.map((e) => ({ file: e.name, id: e.id, url: cdnUrl(e.id) })),
  };
  await fs.writeFile(path.join(OUT_DIR, "CREDITS.json"), `${JSON.stringify(credits, null, 2)}\n`, "utf8");
  const total = entries.reduce((sum, e) => sum + e.bytes, 0);
  console.info(`Selesai: ${entries.length} foto, ${(total / 1024 / 1024).toFixed(1)} MB → ${path.relative(ROOT, OUT_DIR)}`);
}

main().catch((err) => {
  console.error("fetch-unsplash gagal:", err.message);
  process.exit(1);
});

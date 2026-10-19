import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "prisma", "schema.prisma");
const out = join(root, "prisma", "schema.sqlite.prisma");

let schema = readFileSync(src, "utf8");

schema = schema.replace(/provider\s*=\s*"mysql"/, 'provider = "sqlite"');
schema = schema.replace(/\s*@db\.(?:Text|LongText|MediumText|TinyText)\b/g, "");

const header =
  "// AUTO-GENERATED from prisma/schema.prisma for the SQLite dev fallback.\n" +
  "// Do not edit directly — run `npm run db:sqlite` to regenerate.\n\n";

writeFileSync(out, header + schema);
console.log(`[sqlite-schema] wrote ${out}`);

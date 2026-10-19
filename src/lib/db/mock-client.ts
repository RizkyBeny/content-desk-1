/**
 * Fake PrismaClient in-memory — pengganti `@prisma/client` saat DATA_MODE=mock.
 *
 * Kenapa ada: supaya aplikasi bisa jalan TANPA database sama sekali (deployment
 * serverless / demo front-end). Semua 40 route API dan 15 service tetap memanggil
 * `prisma.<model>.<op>` seperti biasa — tidak ada satu pun call site yang diubah.
 *
 * Cakupan (sengaja dibuat pas dengan pemakaian di codebase ini):
 *  - findUnique/findFirst/findMany/count/create/createMany/update/updateMany/
 *    upsert/delete/deleteMany/groupBy
 *  - where: equals(null), in, contains, startsWith, lt/lte/gt/gte, OR/AND/NOT,
 *    filter relasi to-one (`project: { userId }`) dan to-many (`owners: { some }`),
 *    plus compound-unique (`userId_type_date` dst) sebagai sub-where.
 *  - include/select bertingkat (termasuk orderBy di dalam relasi), skip/take,
 *    orderBy tunggal & multi-key.
 *  - nested create (`items: { create: [...] }`), increment/decrement, @updatedAt
 *    otomatis, default kolom (@default(uuid()/now())), cascade delete.
 *  - $transaction (array & callback), $disconnect/$connect no-op.
 *
 * TIDAK didukung (dan memang tidak dipakai repo ini): raw SQL, aggregate,
 * distinct, cursor Prisma, mode: "insensitive", JSON path filter.
 */
import { randomUUID } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;
type Row = Record<string, any>;

interface RelationDef {
  /** model terkait */
  model: string;
  /** field pada baris INI (untuk relasi to-one: FK-nya; untuk to-many: PK-nya) */
  local: string;
  /** field pada baris TERKAIT (kebalikan dari `local`) */
  foreign: string;
  many: boolean;
}

interface ModelDef {
  /** default kolom; "$uuid" dan "$now" adalah penanda, sisanya literal */
  defaults?: Row;
  /** model punya kolom @updatedAt → disentuh otomatis pada update */
  hasUpdatedAt?: boolean;
  relations?: Record<string, RelationDef>;
}

const CASCADE: Record<string, { model: string; foreign: string; mode: "delete" | "setNull" }[]> = {
  user: [
    { model: "session", foreign: "userId", mode: "delete" },
    { model: "invite", foreign: "invitedById", mode: "delete" },
    { model: "project", foreign: "userId", mode: "delete" },
    { model: "asset", foreign: "ownerId", mode: "delete" },
    { model: "referenceInput", foreign: "userId", mode: "delete" },
    { model: "connectionOwner", foreign: "userId", mode: "delete" },
    { model: "generation", foreign: "userId", mode: "delete" },
    { model: "quotaUsage", foreign: "userId", mode: "delete" },
  ],
  dataConnection: [
    { model: "connectionOwner", foreign: "connectionId", mode: "delete" },
    { model: "contentMetric", foreign: "connectionId", mode: "delete" },
  ],
  project: [
    { model: "contentBrief", foreign: "projectId", mode: "delete" },
    { model: "creation", foreign: "projectId", mode: "delete" },
    { model: "referenceInput", foreign: "projectId", mode: "setNull" },
  ],
  creation: [{ model: "creationItem", foreign: "creationId", mode: "delete" }],
};

const MODELS: Record<string, ModelDef> = {
  user: {
    defaults: {
      id: "$uuid",
      role: "creator",
      theme: "system",
      niche: null,
      nicheCategories: null,
      contentLang: "id",
      avatarUrl: null,
      createdAt: "$now",
      updatedAt: "$now",
    },
    hasUpdatedAt: true,
    relations: {
      sessions: { model: "session", local: "id", foreign: "userId", many: true },
      invitesSent: { model: "invite", local: "id", foreign: "invitedById", many: true },
      projects: { model: "project", local: "id", foreign: "userId", many: true },
      assets: { model: "asset", local: "id", foreign: "ownerId", many: true },
      connectionLinks: { model: "connectionOwner", local: "id", foreign: "userId", many: true },
      generations: { model: "generation", local: "id", foreign: "userId", many: true },
      quotaUsage: { model: "quotaUsage", local: "id", foreign: "userId", many: true },
    },
  },
  session: {
    defaults: { id: "$uuid", userAgent: null, createdAt: "$now" },
    relations: { user: { model: "user", local: "userId", foreign: "id", many: false } },
  },
  invite: {
    defaults: {
      id: "$uuid",
      role: "creator",
      acceptedAt: null,
      createdAt: "$now",
    },
    relations: { invitedBy: { model: "user", local: "invitedById", foreign: "id", many: false } },
  },
  dataConnection: {
    defaults: {
      id: "$uuid",
      accountHandle: null,
      externalRef: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      config: null,
      status: "connected",
      lastSyncedAt: null,
      lastError: null,
      createdAt: "$now",
      updatedAt: "$now",
    },
    hasUpdatedAt: true,
    relations: {
      owners: { model: "connectionOwner", local: "id", foreign: "connectionId", many: true },
      metrics: { model: "contentMetric", local: "id", foreign: "connectionId", many: true },
    },
  },
  connectionOwner: {
    defaults: { id: "$uuid" },
    relations: {
      connection: { model: "dataConnection", local: "connectionId", foreign: "id", many: false },
      user: { model: "user", local: "userId", foreign: "id", many: false },
    },
  },
  contentMetric: {
    defaults: { id: "$uuid", reach: null, thumbnailUrl: null, url: null, syncedAt: "$now" },
    relations: {
      connection: { model: "dataConnection", local: "connectionId", foreign: "id", many: false },
    },
  },
  trendSignal: {
    defaults: { id: "$uuid", region: "ID", category: null, rawPayload: null, fetchedAt: "$now" },
  },
  project: {
    defaults: {
      id: "$uuid",
      topicTitle: null,
      topicSource: null,
      topicInsight: null,
      angleTitle: null,
      angleDesc: null,
      contentType: null,
      angles: null,
      selectedAngleId: null,
      recommendedTypes: null,
      status: "brief",
      createdAt: "$now",
      updatedAt: "$now",
    },
    hasUpdatedAt: true,
    relations: {
      user: { model: "user", local: "userId", foreign: "id", many: false },
      brief: { model: "contentBrief", local: "id", foreign: "projectId", many: false },
      creations: { model: "creation", local: "id", foreign: "projectId", many: true },
      references: { model: "referenceInput", local: "id", foreign: "projectId", many: true },
    },
  },
  contentBrief: {
    defaults: { id: "$uuid", status: "draft", updatedAt: "$now" },
    hasUpdatedAt: true,
    relations: { project: { model: "project", local: "projectId", foreign: "id", many: false } },
  },
  referenceInput: {
    defaults: {
      id: "$uuid",
      projectId: null,
      assetId: null,
      url: null,
      extractedText: null,
      status: "processing",
      createdAt: "$now",
    },
    relations: {
      user: { model: "user", local: "userId", foreign: "id", many: false },
      project: { model: "project", local: "projectId", foreign: "id", many: false },
    },
  },
  asset: {
    defaults: {
      id: "$uuid",
      fileUrl: null,
      mimeType: null,
      textContent: null,
      tags: [],
      visibility: "private",
      sizeBytes: null,
      createdAt: "$now",
      updatedAt: "$now",
    },
    hasUpdatedAt: true,
    relations: { owner: { model: "user", local: "ownerId", foreign: "id", many: false } },
  },
  creation: {
    defaults: { id: "$uuid", editorState: null, status: "generating", createdAt: "$now", updatedAt: "$now" },
    hasUpdatedAt: true,
    relations: {
      project: { model: "project", local: "projectId", foreign: "id", many: false },
      items: { model: "creationItem", local: "id", foreign: "creationId", many: true },
    },
  },
  creationItem: {
    defaults: {
      id: "$uuid",
      assetId: null,
      prompt: null,
      provider: null,
      status: "queued",
      errorMessage: null,
      versions: [],
    },
    relations: {
      creation: { model: "creation", local: "creationId", foreign: "id", many: false },
      asset: { model: "asset", local: "assetId", foreign: "id", many: false },
    },
  },
  exportJob: {
    defaults: { id: "$uuid", status: "queued", assetId: null, expiresAt: null, createdAt: "$now" },
  },
  aiCache: { defaults: { createdAt: "$now" } },
  generation: {
    defaults: {
      id: "$uuid",
      status: "queued",
      errorMessage: null,
      fileUrl: null,
      thumbnailUrl: null,
      waveform: null,
      resultJson: null,
      width: null,
      height: null,
      durationSeconds: null,
      startFrameAssetId: null,
      createdAt: "$now",
      startedAt: null,
      completedAt: null,
      deletedAt: null,
    },
    relations: { user: { model: "user", local: "userId", foreign: "id", many: false } },
  },
  quotaUsage: {
    defaults: { id: "$uuid", used: 0 },
    relations: { user: { model: "user", local: "userId", foreign: "id", many: false } },
  },
  quotaConfig: {},
};

// ─── store ──────────────────────────────────────────────────────────────────

const store: Record<string, Row[]> = {};
for (const name of Object.keys(MODELS)) store[name] = [];

let seedHook: (() => Promise<void>) | null = null;
type SeedState = "idle" | "running" | "done";
let seedState: SeedState = "idle";
let seedPromise: Promise<void> | null = null;

/**
 * Penanda konteks pemanggilan dari DALAM seed.
 *
 * Tanpa ini ada dua pilihan buruk: (a) query saat seed berjalan diloloskan
 * begitu saja → data parsial (user belum ada → 307 /login, project belum ada
 * → 404), atau (b) semua query menunggu seed → deadlock karena seed sendiri
 * memanggil `prisma.*`. AsyncLocalStorage membedakan keduanya secara presisi.
 */
const insideSeed = new AsyncLocalStorage<boolean>();

async function ensureSeeded(): Promise<void> {
  // Pemanggil dari dalam seed tidak boleh menunggu promise-nya sendiri.
  if (insideSeed.getStore()) return;

  if (seedState === "idle") {
    if (!seedHook) {
      seedState = "done";
      return;
    }
    seedState = "running";
    seedPromise = insideSeed
      .run(true, () => Promise.resolve().then(() => seedHook!()))
      .catch((err) => {
        console.error("[mock-db] seed gagal:", err);
      })
      .finally(() => {
        seedState = "done";
      });
  }

  // Pemanggil luar menunggu seed selesai → tidak pernah melihat data parsial.
  if (seedPromise) await seedPromise;
}

// ─── util ───────────────────────────────────────────────────────────────────

function clone<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return new Date(value.getTime()) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => clone(v)) as unknown as T;
  if (typeof value === "bigint") return value;
  const out: Row = {};
  for (const key of Object.keys(value as Row)) out[key] = clone((value as Row)[key]);
  return out as T;
}

function isPlainObject(value: unknown): value is Row {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);
}

function timeOf(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === "number") return value;
  return null;
}

/** Setara Prisma: null/undefined = sama, Date dibandingkan via epoch. */
function eq(a: unknown, b: unknown): boolean {
  const left = a === undefined ? null : a;
  const right = b === undefined ? null : b;
  if (left === null || right === null) return left === right;
  if (left instanceof Date || right instanceof Date) {
    const t1 = timeOf(left);
    const t2 = timeOf(right);
    return t1 !== null && t2 !== null && t1 === t2;
  }
  return left === right;
}

function compareValues(a: unknown, b: unknown): number {
  const t1 = timeOf(a);
  const t2 = timeOf(b);
  if (t1 !== null && t2 !== null) return t1 === t2 ? 0 : t1 < t2 ? -1 : 1;
  const x = a as Any;
  const y = b as Any;
  if (x === y) return 0;
  if (x === null || x === undefined) return -1;
  if (y === null || y === undefined) return 1;
  if (typeof x === "number" && typeof y === "number") return x - y;
  return String(x) < String(y) ? -1 : String(x) > String(y) ? 1 : 0;
}

const OPERATORS = new Set([
  "equals",
  "not",
  "in",
  "notIn",
  "lt",
  "lte",
  "gt",
  "gte",
  "contains",
  "startsWith",
  "endsWith",
  "mode",
]);

function isOperatorObject(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  for (const key of Object.keys(value)) if (OPERATORS.has(key)) return true;
  return false;
}

function matchOperator(rowValue: unknown, cond: Row): boolean {
  for (const [op, expected] of Object.entries(cond)) {
    switch (op) {
      case "equals":
        if (!eq(rowValue, expected)) return false;
        break;
      case "not":
        if (isOperatorObject(expected)) {
          if (matchOperator(rowValue, expected)) return false;
        } else if (eq(rowValue, expected)) {
          return false;
        }
        break;
      case "in":
        if (!(expected as unknown[]).some((v) => eq(rowValue, v))) return false;
        break;
      case "notIn":
        if ((expected as unknown[]).some((v) => eq(rowValue, v))) return false;
        break;
      case "contains":
        // SQLite LIKE / collation MySQL default: case-insensitive.
        if (typeof rowValue !== "string" || !rowValue.toLowerCase().includes(String(expected).toLowerCase()))
          return false;
        break;
      case "startsWith":
        if (typeof rowValue !== "string" || !rowValue.toLowerCase().startsWith(String(expected).toLowerCase()))
          return false;
        break;
      case "endsWith":
        if (typeof rowValue !== "string" || !rowValue.toLowerCase().endsWith(String(expected).toLowerCase()))
          return false;
        break;
      case "mode":
        break; // tidak ada pemakaian "insensitive" di repo ini
      case "lt":
      case "lte":
      case "gt":
      case "gte": {
        const c = compareValues(rowValue, expected);
        if (c === Number.NaN) return false;
        if (op === "lt" && !(c < 0)) return false;
        if (op === "lte" && !(c <= 0)) return false;
        if (op === "gt" && !(c > 0)) return false;
        if (op === "gte" && !(c >= 0)) return false;
        break;
      }
      default:
        throw new Error(`[mock-db] operator "${op}" belum didukung.`);
    }
  }
  return true;
}

function relatedRows(model: string, rel: RelationDef, row: Row): Row[] {
  const pool = store[rel.model] ?? [];
  return pool.filter((candidate) => eq(candidate[rel.foreign], row[rel.local]));
}

function matchWhere(row: Row, where: unknown, model: string): boolean {
  if (!where) return true;
  const def = MODELS[model];
  for (const [key, value] of Object.entries(where as Row)) {
    if (value === undefined) continue;

    if (key === "OR") {
      const list = Array.isArray(value) ? value : [value];
      if (!list.some((w) => matchWhere(row, w, model))) return false;
      continue;
    }
    if (key === "AND") {
      const list = Array.isArray(value) ? value : [value];
      if (!list.every((w) => matchWhere(row, w, model))) return false;
      continue;
    }
    if (key === "NOT") {
      const list = Array.isArray(value) ? value : [value];
      if (list.some((w) => matchWhere(row, w, model))) return false;
      continue;
    }

    const rel = def?.relations?.[key];
    if (rel) {
      const pool = relatedRows(model, rel, row);
      if (rel.many) {
        const predicate = value as Row;
        if (isPlainObject(predicate) && "some" in predicate) {
          if (!pool.some((r) => matchWhere(r, predicate.some, rel.model))) return false;
        } else if (isPlainObject(predicate) && "none" in predicate) {
          if (pool.some((r) => matchWhere(r, predicate.none, rel.model))) return false;
        } else if (isPlainObject(predicate) && "every" in predicate) {
          if (!pool.every((r) => matchWhere(r, predicate.every, rel.model))) return false;
        } else if (!pool.some((r) => matchWhere(r, predicate, rel.model))) {
          return false;
        }
      } else {
        const target = pool[0];
        if (!target || !matchWhere(target, value, rel.model)) return false;
      }
      continue;
    }

    if (isOperatorObject(value)) {
      if (!matchOperator(row[key], value as Row)) return false;
      continue;
    }
    if (isPlainObject(value)) {
      // compound unique: `userId_type_date: { userId, type, date }` → sub-where
      if (!matchWhere(row, value, model)) return false;
      continue;
    }
    if (!eq(row[key], value)) return false;
  }
  return true;
}

function orderByCompare(model: string, a: Row, b: Row, orderBy: unknown): number {
  const specs = Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : [];
  for (const spec of specs as Row[]) {
    for (const [field, direction] of Object.entries(spec)) {
      const result = compareValues(a[field], b[field]);
      if (result !== 0) return direction === "desc" ? -result : result;
    }
  }
  void model;
  return 0;
}

function projectRow(model: string, row: Row | null, args?: { select?: Row; include?: Row }): Any {
  if (!row) return null;
  const def = MODELS[model];
  const { select, include } = args ?? {};

  if (select) {
    const out: Row = {};
    for (const [key, value] of Object.entries(select)) {
      if (!value) continue;
      const rel = def?.relations?.[key];
      const nestedArgs = value === true ? {} : (value as Row);
      if (rel) {
        let pool = relatedRows(model, rel, row);
        if (nestedArgs.where) pool = pool.filter((r) => matchWhere(r, nestedArgs.where, rel.model));
        if (nestedArgs.orderBy) pool.sort((x, y) => orderByCompare(rel.model, x, y, nestedArgs.orderBy));
        out[key] = rel.many
          ? pool.map((r) => projectRow(rel.model, r, nestedArgs))
          : projectRow(rel.model, pool[0] ?? null, nestedArgs);
      } else {
        out[key] = clone(row[key]);
      }
    }
    return out;
  }

  const out = clone(row);
  if (include) {
    for (const [key, value] of Object.entries(include)) {
      if (!value) continue;
      const rel = def?.relations?.[key];
      if (!rel) continue;
      const nestedArgs = value === true ? {} : (value as Row);
      let pool = relatedRows(model, rel, row);
      if (nestedArgs.where) pool = pool.filter((r) => matchWhere(r, nestedArgs.where, rel.model));
      if (nestedArgs.orderBy) pool.sort((x, y) => orderByCompare(rel.model, x, y, nestedArgs.orderBy));
      if (nestedArgs.skip) pool = pool.slice(nestedArgs.skip);
      if (nestedArgs.take !== undefined && nestedArgs.take !== null) pool = pool.slice(0, nestedArgs.take);
      out[key] = rel.many
        ? pool.map((r) => projectRow(rel.model, r, nestedArgs))
        : projectRow(rel.model, pool[0] ?? null, nestedArgs);
    }
  }
  return out;
}

function applyDefault(model: string, row: Row): void {
  const defaults = MODELS[model]?.defaults ?? {};
  for (const [field, value] of Object.entries(defaults)) {
    if (value === "$uuid") row[field] = randomUUID();
    else if (value === "$now") row[field] = new Date();
    else if (row[field] === undefined) row[field] = clone(value);
  }
  if (row.createdAt === undefined && defaults.createdAt) row.createdAt = new Date();
}

function isRelationField(model: string, key: string): boolean {
  return Boolean(MODELS[model]?.relations?.[key]);
}

async function insertRow(model: string, data: Row): Promise<Row> {
  const def = MODELS[model];
  const row: Row = {};
  applyDefault(model, row);

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || isRelationField(model, key)) continue;
    row[key] = clone(value);
  }
  if (def?.hasUpdatedAt && data.updatedAt === undefined) row.updatedAt = new Date();

  store[model].push(row);

  // nested create / connect pada relasi
  for (const [key, value] of Object.entries(data)) {
    if (!isRelationField(model, key)) continue;
    const rel = def!.relations![key];
    if (!isPlainObject(value)) continue;
    if (value.create) {
      const items = Array.isArray(value.create) ? value.create : [value.create];
      for (const item of items) {
        await insertRow(rel.model, { ...(item as Row), [rel.foreign]: row[rel.local] });
      }
    } else if (value.connect) {
      const target = value.connect as Row;
      const found = (store[rel.model] ?? []).find((r) =>
        Object.entries(target).every(([k, v]) => eq(r[k], v)),
      );
      if (found) row[rel.local] = found[rel.foreign];
    }
  }
  return row;
}

function applyUpdate(model: string, row: Row, data: Row): void {
  const def = MODELS[model];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || isRelationField(model, key)) continue;
    if (isPlainObject(value)) {
      const ops = Object.keys(value);
      if (ops.includes("set")) {
        row[key] = clone(value.set);
        continue;
      }
      if (ops.includes("increment")) {
        row[key] = Number(row[key] ?? 0) + Number(value.increment);
        continue;
      }
      if (ops.includes("decrement")) {
        row[key] = Number(row[key] ?? 0) - Number(value.decrement);
        continue;
      }
      // object biasa (field Json) → tugas sebagai nilai
      if (ops.length > 0 && !OPERATORS.has(ops[0])) {
        row[key] = clone(value);
        continue;
      }
    }
    row[key] = clone(value);
  }
  if (def?.hasUpdatedAt) row.updatedAt = new Date();
}

function cascadeDelete(model: string, row: Row): void {
  for (const rule of CASCADE[model] ?? []) {
    const victims = (store[rule.model] ?? []).filter((child) => eq(child[rule.foreign], row.id));
    for (const victim of victims) {
      if (rule.mode === "setNull") {
        victim[rule.foreign] = null;
        continue;
      }
      const index = store[rule.model].indexOf(victim);
      if (index >= 0) store[rule.model].splice(index, 1);
      cascadeDelete(rule.model, victim);
    }
  }
}

function removeRow(model: string, row: Row): void {
  const index = store[model].indexOf(row);
  if (index >= 0) store[model].splice(index, 1);
  cascadeDelete(model, row);
}

/** Ambil nilai skalar dari `where` untuk dilengkapi ke `create` pada upsert. */
function scalarWhere(where: Row, model: string, into: Row): void {
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue;
    if (key === "OR" || key === "AND" || key === "NOT") continue;
    if (isRelationField(model, key)) continue;
    if (isOperatorObject(value)) continue;
    if (isPlainObject(value)) {
      scalarWhere(value, model, into);
      continue;
    }
    if (into[key] === undefined) into[key] = clone(value);
  }
}

// ─── delegate per model ─────────────────────────────────────────────────────

function makeDelegate(model: string) {
  const rows = () => store[model];

  return {
    async findUnique(args: Row = {}) {
      await ensureSeeded();
      const found = rows().find((row) => matchWhere(row, args.where, model)) ?? null;
      return projectRow(model, found, args);
    },
    async findFirst(args: Row = {}) {
      await ensureSeeded();
      let pool = rows().filter((row) => matchWhere(row, args.where, model));
      if (args.orderBy) pool = [...pool].sort((a, b) => orderByCompare(model, a, b, args.orderBy));
      return projectRow(model, pool[0] ?? null, args);
    },
    async findMany(args: Row = {}) {
      await ensureSeeded();
      let pool = rows().filter((row) => matchWhere(row, args.where, model));
      if (args.orderBy) pool = [...pool].sort((a, b) => orderByCompare(model, a, b, args.orderBy));
      if (args.skip) pool = pool.slice(args.skip);
      if (args.take !== undefined && args.take !== null) pool = pool.slice(0, args.take);
      return pool.map((row) => projectRow(model, row, args));
    },
    async count(args: Row = {}) {
      await ensureSeeded();
      return rows().filter((row) => matchWhere(row, args.where, model)).length;
    },
    async create(args: Row) {
      await ensureSeeded();
      const row = await insertRow(model, args.data ?? {});
      return projectRow(model, row, args);
    },
    async createMany(args: Row) {
      await ensureSeeded();
      let count = 0;
      for (const data of args.data ?? []) {
        await insertRow(model, data);
        count += 1;
      }
      return { count };
    },
    async update(args: Row) {
      await ensureSeeded();
      const row = rows().find((candidate) => matchWhere(candidate, args.where, model));
      if (!row) throw new Error(`[mock-db] record ${model} tidak ditemukan untuk update.`);
      applyUpdate(model, row, args.data ?? {});
      return projectRow(model, row, args);
    },
    async updateMany(args: Row) {
      await ensureSeeded();
      const targets = rows().filter((candidate) => matchWhere(candidate, args.where, model));
      for (const row of targets) applyUpdate(model, row, args.data ?? {});
      return { count: targets.length };
    },
    async upsert(args: Row) {
      await ensureSeeded();
      const row = rows().find((candidate) => matchWhere(candidate, args.where, model));
      if (row) {
        applyUpdate(model, row, args.update ?? {});
        return projectRow(model, row, args);
      }
      const data = { ...(args.create ?? {}) } as Row;
      scalarWhere(args.where ?? {}, model, data);
      const created = await insertRow(model, data);
      return projectRow(model, created, args);
    },
    async delete(args: Row) {
      await ensureSeeded();
      const row = rows().find((candidate) => matchWhere(candidate, args.where, model));
      if (!row) throw new Error(`[mock-db] record ${model} tidak ditemukan untuk delete.`);
      removeRow(model, row);
      return clone(row);
    },
    async deleteMany(args: Row = {}) {
      await ensureSeeded();
      const targets = rows().filter((candidate) => matchWhere(candidate, args.where, model));
      for (const row of [...targets]) removeRow(model, row);
      return { count: targets.length };
    },
    async groupBy(args: Row) {
      await ensureSeeded();
      const by: string[] = Array.isArray(args.by) ? args.by : [args.by];
      const matched = rows().filter((row) => matchWhere(row, args.where, model));
      const groups = new Map<string, Row>();
      for (const row of matched) {
        const key = by.map((field) => String(row[field])).join("\u0000");
        if (!groups.has(key)) groups.set(key, row);
      }
      return [...groups.values()].map((representative) => {
        const out: Row = {};
        for (const field of by) out[field] = clone(representative[field]);
        if (args._count) {
          out._count = {
            _all: matched.filter((row) => by.every((field) => eq(row[field], representative[field]))).length,
          };
        }
        return out;
      });
    },
  };
}

// ─── client ─────────────────────────────────────────────────────────────────

export interface MockClientOptions {
  /** Dijalankan sekali (lazily) saat query pertama terjadi. */
  seed?: () => Promise<void>;
}

export function createMockPrismaClient(options: MockClientOptions = {}): Any {
  if (options.seed) seedHook = options.seed;

  const client: Row = {};
  for (const name of Object.keys(MODELS)) client[name] = makeDelegate(name);

  client.$connect = async () => undefined;
  client.$disconnect = async () => undefined;
  client.$on = () => undefined;
  client.$queryRaw = async () => {
    throw new Error("[mock-db] $queryRaw tidak didukung mode mock.");
  };
  client.$executeRaw = async () => {
    throw new Error("[mock-db] $executeRaw tidak didukung mode mock.");
  };
  client.$transaction = async (arg: Any) => {
    if (typeof arg === "function") return await arg(client);
    return await Promise.all(arg);
  };
  /** Debug/testing: kuras store (seed ulang terjadi pada query berikutnya). */
  client.__resetMockData = () => {
    for (const name of Object.keys(store)) store[name] = [];
    seedState = "idle";
    seedPromise = null;
  };
  return client;
}

/** Apakah store sedang/ sudah di-seed (untuk verifikasi & test). */
export function mockDataStats(): { state: SeedState; models: Record<string, number> } {
  const models: Record<string, number> = {};
  for (const [name, rows] of Object.entries(store)) models[name] = rows.length;
  return { state: seedState, models };
}

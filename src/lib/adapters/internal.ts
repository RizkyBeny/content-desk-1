import type { RawContentRecord } from "./social/types";

/** Contract for the Internal Data Connector (FR-CONN-3, Technical Requirements). */
export interface InternalContentRecord {
  id: string;
  title: string;
  format: string;
  publishedAt: string;
  ownerEmail?: string;
  url?: string;
  thumbnailUrl?: string;
  metrics: {
    reach?: number;
    impressions?: number;
    engagement?: number;
    pageViews?: number;
    avgReadTimeSeconds?: number;
    shares?: number;
  };
}

export interface InternalResponse {
  items: InternalContentRecord[];
  nextCursor: string | null;
}

function mapRecord(rec: InternalContentRecord): RawContentRecord {
  const m = rec.metrics ?? {};
  const impressions = m.impressions ?? m.pageViews ?? 0;
  const reach = m.reach ?? null;
  const engagement = m.engagement ?? 0;
  return {
    externalId: rec.id,
    format: "artikel",
    title: rec.title,
    thumbnailUrl: rec.thumbnailUrl ?? null,
    url: rec.url ?? null,
    publishedAt: rec.publishedAt,
    reach,
    impressions,
    engagement,
    formatMetrics: {
      pageViews: m.pageViews ?? 0,
      avgReadTimeSeconds: m.avgReadTimeSeconds ?? 0,
      shares: m.shares ?? 0,
    },
  };
}

/** Validate + normalize a raw record; returns null if it does not match the schema. */
export function normalizeInternalRecord(raw: unknown): RawContentRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.title !== "string") return null;
  if (typeof r.publishedAt !== "string" || Number.isNaN(Date.parse(r.publishedAt))) return null;
  const metrics = (r.metrics as Record<string, unknown>) ?? {};
  return mapRecord({
    id: r.id,
    title: r.title,
    format: typeof r.format === "string" ? r.format : "artikel",
    publishedAt: r.publishedAt,
    url: typeof r.url === "string" ? r.url : undefined,
    thumbnailUrl: typeof r.thumbnailUrl === "string" ? r.thumbnailUrl : undefined,
    metrics: {
      reach: typeof metrics.reach === "number" ? metrics.reach : undefined,
      impressions: typeof metrics.impressions === "number" ? metrics.impressions : undefined,
      engagement: typeof metrics.engagement === "number" ? metrics.engagement : undefined,
      pageViews: typeof metrics.pageViews === "number" ? metrics.pageViews : undefined,
      avgReadTimeSeconds:
        typeof metrics.avgReadTimeSeconds === "number" ? metrics.avgReadTimeSeconds : undefined,
      shares: typeof metrics.shares === "number" ? metrics.shares : undefined,
    },
  });
}

/** Fetch from a JSON endpoint following the InternalContentRecord contract. */
export async function fetchInternalRecords(
  url: string,
  apiKey: string,
  since: Date,
): Promise<{ records: RawContentRecord[]; skipped: number }> {
  const records: RawContentRecord[] = [];
  let skipped = 0;
  let cursor: string | null = null;

  for (let page = 0; page < 20; page++) {
    const q = new URLSearchParams({ since: since.toISOString() });
    if (cursor) q.set("cursor", cursor);
    const res = await fetch(`${url}?${q.toString()}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Internal endpoint error ${res.status}`);
    const body = (await res.json()) as InternalResponse;
    for (const item of body.items ?? []) {
      const normalized = normalizeInternalRecord(item);
      if (normalized) records.push(normalized);
      else skipped++;
    }
    cursor = body.nextCursor ?? null;
    if (!cursor) break;
  }
  return { records, skipped };
}

/** Minimal CSV parser (handles quoted fields and escaped quotes). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1)
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      header.forEach((h, i) => (obj[h] = (r[i] ?? "").trim()));
      return obj;
    });
}

/** Normalize a CSV row (per the documented columns) to a RawContentRecord. */
export function normalizeCsvRow(row: Record<string, string>): RawContentRecord | null {
  if (!row.id || !row.title || !row.publishedAt) return null;
  if (Number.isNaN(Date.parse(row.publishedAt))) return null;
  const num = (v: string | undefined) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  return normalizeInternalRecord({
    id: row.id,
    title: row.title,
    format: row.format || "artikel",
    publishedAt: row.publishedAt,
    url: row.url || undefined,
    thumbnailUrl: row.thumbnailUrl || undefined,
    metrics: {
      reach: num(row.reach),
      impressions: num(row.impressions),
      engagement: num(row.engagement),
      pageViews: num(row.pageViews),
      avgReadTimeSeconds: num(row.avgReadTimeSeconds),
      shares: num(row.shares),
    },
  });
}

export function parseInternalCsv(text: string): { records: RawContentRecord[]; skipped: number } {
  const records: RawContentRecord[] = [];
  let skipped = 0;
  for (const row of parseCsv(text)) {
    const rec = normalizeCsvRow(row);
    if (rec) records.push(rec);
    else skipped++;
  }
  return { records, skipped };
}

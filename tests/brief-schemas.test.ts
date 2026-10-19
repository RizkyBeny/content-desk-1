import { describe, it, expect } from "vitest";
import { BRIEF_SCHEMAS, CONTENT_TYPE_LABELS, getBriefSchema } from "../config/brief-schemas";
import type { ContentType } from "@/types";

const ALL_TYPES: ContentType[] = ["image", "carousel", "video", "audio", "article"];

describe("brief schemas", () => {
  it("defines a schema and label for every content type", () => {
    for (const t of ALL_TYPES) {
      expect(BRIEF_SCHEMAS[t]).toBeDefined();
      expect(CONTENT_TYPE_LABELS[t]).toBeTruthy();
    }
  });

  it("every schema has at least one required column and unique keys", () => {
    for (const t of ALL_TYPES) {
      const schema = getBriefSchema(t);
      expect(schema.columns.some((c) => c.required)).toBe(true);
      const keys = schema.columns.map((c) => c.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("visual types carry per-row media, non-visual do not", () => {
    expect(getBriefSchema("image").mediaPerRow).toBe(true);
    expect(getBriefSchema("carousel").mediaPerRow).toBe(true);
    expect(getBriefSchema("article").mediaPerRow).toBe(false);
    expect(getBriefSchema("audio").mediaPerRow).toBe(false);
  });

  it("default row ranges are ordered [min, max]", () => {
    for (const t of ALL_TYPES) {
      const [min, max] = getBriefSchema(t).defaultRows;
      expect(min).toBeLessThanOrEqual(max);
      expect(min).toBeGreaterThan(0);
    }
  });

  it("image and carousel include an optional catatan column", () => {
    for (const t of ["image", "carousel"] as const) {
      const catatan = getBriefSchema(t).columns.find((c) => c.key === "catatan");
      expect(catatan).toBeDefined();
      expect(catatan?.required).toBe(false);
    }
  });
});

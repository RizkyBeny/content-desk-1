import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-key-at-least-16-chars";
  process.env.DATABASE_URL = "mysql://user:pass@localhost:3306/test";
});

describe("buildItemDefs", () => {
  it("creates one item per carousel row with derived prompts", async () => {
    const { buildItemDefs } = await import("@/lib/services/creations");
    const rows = [
      { slide: "1", judul: "Intro", visual: "Hook besar", isi: "Awal" },
      { slide: "2", judul: "Poin", visual: "Ikon listrik", isi: "Hemat" },
    ];
    const defs = buildItemDefs("carousel", rows, []);
    expect(defs).toHaveLength(2);
    expect(defs[0].briefRowRef).toBe(1);
    expect(defs[1].briefRowRef).toBe(2);
    expect(defs[0].mediaSource).toBe("ai_generated");
    expect(defs[0].prompt).toContain("Hook besar");
    expect(defs[1].prompt).toContain("Ikon listrik");
  });

  it("honours an edited AI prompt", async () => {
    const { buildItemDefs } = await import("@/lib/services/creations");
    const defs = buildItemDefs("image", [{ elemenVisual: "asli" }], [
      { briefRow: 1, source: "ai_generated", prompt: "prompt kustom" },
    ]);
    expect(defs[0].prompt).toBe("prompt kustom");
  });

  it("uses a provided asset and keeps its id", async () => {
    const { buildItemDefs } = await import("@/lib/services/creations");
    const defs = buildItemDefs("image", [{}], [
      { briefRow: 1, source: "asset_management", assetId: "asset-1" },
    ]);
    expect(defs[0].mediaSource).toBe("asset_management");
    expect(defs[0].assetId).toBe("asset-1");
  });

  it("collapses article rows into a single text item", async () => {
    const { buildItemDefs } = await import("@/lib/services/creations");
    const defs = buildItemDefs("article", [{ judul: "A", poin: "Satu" }, { judul: "B", poin: "Dua" }], []);
    expect(defs).toHaveLength(1);
    expect(defs[0].prompt).toContain("## A");
    expect(defs[0].prompt).toContain("## B");
  });

  it("falls back to a single item when rows are empty", async () => {
    const { buildItemDefs } = await import("@/lib/services/creations");
    expect(buildItemDefs("image", [], [])).toHaveLength(1);
    expect(buildItemDefs("audio", [], [])).toHaveLength(1);
  });
});

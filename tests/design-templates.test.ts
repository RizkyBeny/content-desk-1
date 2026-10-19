import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-key-at-least-16-chars";
  process.env.DATABASE_URL = "mysql://user:pass@localhost:3306/test";
});

describe("design templates", () => {
  it("has unique ids and valid kind, ratio, thumbnail", async () => {
    const { DESIGN_TEMPLATES, DESIGN_RATIOS } = await import("../config/design-templates");
    expect(DESIGN_TEMPLATES.length).toBeGreaterThanOrEqual(12);
    const ids = DESIGN_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of DESIGN_TEMPLATES) {
      expect(DESIGN_RATIOS).toContain(t.ratio);
      expect(["image", "carousel"]).toContain(t.kind);
      expect(t.thumbnail.startsWith("/")).toBe(true);
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.category.length).toBeGreaterThan(0);
    }
  });

  it("every template builds a state that passes server validation", async () => {
    const { DESIGN_TEMPLATES } = await import("../config/design-templates");
    const { validateDesignInput } = await import("@/lib/services/designs");
    for (const t of DESIGN_TEMPLATES) {
      const state = t.build();
      expect(state.type).toBe(t.kind);
      expect(state.ratio).toBe(t.ratio);
      expect(() => validateDesignInput(t.kind, state)).not.toThrow();

      const layers =
        state.type === "image" ? state.slide.layers : state.slides.flatMap((s) => s.layers);
      const layerIds = layers.map((l) => l.id);
      expect(new Set(layerIds).size).toBe(layerIds.length);

      const slideIds = state.type === "image" ? ["slide-1"] : state.slides.map((s) => s.id);
      expect(new Set(slideIds).size).toBe(slideIds.length);
      expect(layers.every((l) => l.type === "text" && l.text.trim().length > 0)).toBe(true);
      for (const l of layers) {
        if (l.type === "text" && l.fontStyle) {
          expect(["normal", "italic", "bold", "italic bold"]).toContain(l.fontStyle);
        }
      }
    }
  });

  it("blankEditorState produces an empty valid state per kind and ratio", async () => {
    const { blankEditorState, DESIGN_RATIOS } = await import("../config/design-templates");
    const { validateDesignInput } = await import("@/lib/services/designs");
    for (const ratio of DESIGN_RATIOS) {
      const image = blankEditorState("image", ratio);
      expect(image).toMatchObject({ type: "image", ratio });
      if (image.type === "image") {
        expect(image.slide.layers).toHaveLength(0);
        expect(image.slide.background).toBeNull();
      }
      expect(() => validateDesignInput("image", image)).not.toThrow();

      const carousel = blankEditorState("carousel", ratio);
      expect(carousel).toMatchObject({ type: "carousel", ratio });
      if (carousel.type === "carousel") {
        expect(carousel.slides).toHaveLength(3);
      }
      expect(() => validateDesignInput("carousel", carousel)).not.toThrow();
    }
  });

  it("getDesignTemplate finds by id", async () => {
    const { DESIGN_TEMPLATES, getDesignTemplate } = await import("../config/design-templates");
    expect(getDesignTemplate(DESIGN_TEMPLATES[0].id)).toBe(DESIGN_TEMPLATES[0]);
    expect(getDesignTemplate("nope")).toBeUndefined();
  });
});

describe("validateDesignInput", () => {
  it("rejects unknown kind and missing state", async () => {
    const { validateDesignInput } = await import("@/lib/services/designs");
    const { blankEditorState } = await import("../config/design-templates");
    expect(() => validateDesignInput("video", blankEditorState("image", "1:1"))).toThrow(
      "Jenis desain harus image atau carousel.",
    );
    expect(() => validateDesignInput("image", null)).toThrow("editorState wajib diisi.");
    expect(() => validateDesignInput("image", "nope")).toThrow("editorState wajib diisi.");
  });

  it("rejects type mismatch between kind and editor state", async () => {
    const { validateDesignInput } = await import("@/lib/services/designs");
    const { blankEditorState } = await import("../config/design-templates");
    const image = blankEditorState("image", "1:1");
    expect(() => validateDesignInput("carousel", image)).toThrow(
      "Tipe editorState tidak cocok dengan jenis desain.",
    );
  });

  it("rejects invalid ratios and empty carousel slides", async () => {
    const { validateDesignInput } = await import("@/lib/services/designs");
    const { blankEditorState } = await import("../config/design-templates");
    const image = blankEditorState("image", "1:1");
    expect(() => validateDesignInput("image", { ...image, ratio: "3:4" })).toThrow(
      "Rasio desain tidak valid.",
    );
    const carousel = blankEditorState("carousel", "4:5");
    expect(() => validateDesignInput("carousel", { ...carousel, slides: [] })).toThrow(
      "Data slide carousel tidak valid.",
    );
    expect(() =>
      validateDesignInput("carousel", { ...carousel, slides: [{ bad: true }] }),
    ).toThrow("Data slide carousel tidak valid.");
  });

  it("rejects oversized payloads", async () => {
    const { validateDesignInput } = await import("@/lib/services/designs");
    const { blankEditorState } = await import("../config/design-templates");
    const image = blankEditorState("image", "1:1");
    const padded = { ...image, pad: "x".repeat(410_000) };
    expect(() => validateDesignInput("image", padded)).toThrow("Ukuran desain terlalu besar.");
  });
});

describe("collectAssetIds", () => {
  it("skips direct URL paths (template backgrounds)", async () => {
    const { collectAssetIds } = await import("@/components/editor/use-asset-urls");
    const state = {
      type: "image",
      ratio: "1:1",
      slide: {
        id: "s1",
        background: { assetId: "/seed/unsplash/abstract-01.jpg", src: "/seed/unsplash/abstract-01.jpg", fit: "cover" },
        layers: [],
      },
    };
    expect(collectAssetIds(state as never)).toEqual([]);
  });

  it("collects real asset ids", async () => {
    const { collectAssetIds } = await import("@/components/editor/use-asset-urls");
    const state = {
      type: "image",
      ratio: "1:1",
      slide: {
        id: "s1",
        background: { assetId: "asset-1", fit: "cover" },
        layers: [
          { id: "l1", type: "image", assetId: "asset-2", src: null, x: 0, y: 0, width: 10, height: 10 },
          { id: "t1", type: "text", text: "hi", x: 0, y: 0, fontSize: 12, fontFamily: "Inter", color: "#fff", align: "left" },
        ],
      },
    };
    expect(collectAssetIds(state as never).sort()).toEqual(["asset-1", "asset-2"]);
  });
});

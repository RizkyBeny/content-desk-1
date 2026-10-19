import { describe, expect, it } from "vitest";
import { mockReviseText } from "@/lib/adapters/ai/mock/revise-text";

describe("mockReviseText", () => {
  const text = "Satu dua tiga empat lima enam tujuh delapan sembilan sepuluh sebelas dua belas.";

  it("shortens text", () => {
    const out = mockReviseText({ text, action: "shorten", lang: "id" });
    expect(out.length).toBeLessThan(text.length);
    expect(out.endsWith(".")).toBe(true);
  });

  it("expands text", () => {
    const out = mockReviseText({ text, action: "expand", lang: "id" });
    expect(out.length).toBeGreaterThan(text.length);
    expect(out).toContain(text);
  });

  it("applies tone", () => {
    const out = mockReviseText({ text, action: "tone", tone: "santai", lang: "id" });
    expect(out).toContain("santai");
  });

  it("keeps empty text", () => {
    expect(mockReviseText({ text: "   ", action: "shorten", lang: "id" })).toBe("");
  });
});

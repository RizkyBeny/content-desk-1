import { describe, it, expect } from "vitest";
import { slugify, formatPercent, formatNumber } from "@/lib/utils";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Cara Cepat Belajar AI")).toBe("cara-cepat-belajar-ai");
  });

  it("strips punctuation and collapses separators", () => {
    expect(slugify("Top 10: Tips & Trik!")).toBe("top-10-tips-trik");
    expect(slugify("a   b")).toBe("a-b");
  });

  it("trims leading/trailing hyphens and caps length at 60", () => {
    expect(slugify("--hello--")).toBe("hello");
    expect(slugify("x".repeat(100)).length).toBe(60);
  });
});

describe("formatPercent", () => {
  it("formats with comma decimal and percent sign", () => {
    expect(formatPercent(2.5)).toBe("2,50%");
    expect(formatPercent(2.5, 1)).toBe("2,5%");
  });
});

describe("formatNumber", () => {
  it("formats using id-ID grouping", () => {
    expect(formatNumber(1500)).toBe("1.500");
  });
});

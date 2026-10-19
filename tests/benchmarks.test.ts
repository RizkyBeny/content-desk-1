import { describe, it, expect } from "vitest";
import { getBenchmark, compareToBenchmark, BENCHMARKS } from "../config/benchmarks";

describe("getBenchmark", () => {
  it("returns the band for a known source:format", () => {
    expect(getBenchmark("tiktok", "video")?.line).toBe(3.39);
  });

  it("returns null for unknown platform/format", () => {
    expect(getBenchmark("youtube", "shorts")).toBeNull();
  });
});

describe("compareToBenchmark", () => {
  const band = { line: 1 };

  it("flags above when ER >= 115% of benchmark", () => {
    expect(compareToBenchmark(1.15, band)).toBe("above");
    expect(compareToBenchmark(2, band)).toBe("above");
  });

  it("flags below when ER <= 85% of benchmark", () => {
    expect(compareToBenchmark(0.85, band)).toBe("below");
    expect(compareToBenchmark(0.1, band)).toBe("below");
  });

  it("flags around within the neutral band", () => {
    expect(compareToBenchmark(1, band)).toBe("around");
    expect(compareToBenchmark(1.1, band)).toBe("around");
    expect(compareToBenchmark(0.9, band)).toBe("around");
  });
});

describe("BENCHMARKS config", () => {
  it("uses percentage values (0-100), not ratios", () => {
    for (const band of Object.values(BENCHMARKS)) {
      expect(band.line).toBeGreaterThan(0);
      expect(band.line).toBeLessThan(100);
    }
  });
});

import { describe, it, expect } from "vitest";
import {
  computeEngagementRate,
  seededRandom,
  buildFormatMetrics,
} from "@/lib/adapters/social/metrics";

describe("computeEngagementRate", () => {
  it("uses reach as the base when reach > 0 (percent, 2 decimals)", () => {
    expect(computeEngagementRate(50, 1000, 5000)).toBe(5);
    expect(computeEngagementRate(123, 4567, 99999)).toBeCloseTo(2.69, 2);
  });

  it("falls back to impressions when reach is null/zero", () => {
    expect(computeEngagementRate(50, null, 2000)).toBe(2.5);
    expect(computeEngagementRate(50, 0, 2000)).toBe(2.5);
  });

  it("returns 0 when there is no base", () => {
    expect(computeEngagementRate(50, null, 0)).toBe(0);
  });
});

describe("seededRandom", () => {
  it("is deterministic for the same seed", () => {
    const a = seededRandom("instagram:abc");
    const b = seededRandom("instagram:abc");
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("produces values in [0, 1)", () => {
    const r = seededRandom("seed");
    for (let i = 0; i < 50; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("differs between seeds", () => {
    expect(seededRandom("a")()).not.toEqual(seededRandom("b")());
  });
});

describe("buildFormatMetrics", () => {
  it("returns instagram reels metrics with a retention curve", () => {
    const m = buildFormatMetrics("instagram", "reels", 1000, 5000, seededRandom("x"));
    expect(m).toHaveProperty("retentionCurve");
    expect(Array.isArray((m as { retentionCurve: unknown }).retentionCurve)).toBe(true);
  });

  it("returns a fallback object for unknown formats", () => {
    const m = buildFormatMetrics("x", "unknown", null, 100, seededRandom("x"));
    expect(m).toEqual({ note: "No format-specific metrics" });
  });
});

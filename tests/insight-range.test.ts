import { describe, it, expect } from "vitest";
import { computeRange, type InsightFilterState } from "@/components/insight/insight-filters";

function filter(period: InsightFilterState["period"], from = "", to = ""): InsightFilterState {
  return { period, from, to, sources: [] };
}

describe("computeRange", () => {
  it("returns a 7-day window for period 7", () => {
    const { from, to } = computeRange(filter("7"));
    const days = Math.round((to.getTime() - from.getTime()) / 86400000);
    expect(days).toBe(7);
  });

  it("returns a 30-day window for period 30", () => {
    const { from, to } = computeRange(filter("30"));
    expect(Math.round((to.getTime() - from.getTime()) / 86400000)).toBe(30);
  });

  it("returns a 90-day window for period 90", () => {
    const { from, to } = computeRange(filter("90"));
    expect(Math.round((to.getTime() - from.getTime()) / 86400000)).toBe(90);
  });

  it("uses the explicit dates for custom when both are present", () => {
    const { from, to } = computeRange(filter("custom", "2026-09-01", "2026-09-10"));
    expect(from.toISOString().slice(0, 10)).toBe("2026-09-01");
    expect(to.toISOString().slice(0, 10)).toBe("2026-09-10");
  });

  it("falls back to 30 days for custom without dates", () => {
    const { from, to } = computeRange(filter("custom"));
    expect(Math.round((to.getTime() - from.getTime()) / 86400000)).toBe(30);
  });
});

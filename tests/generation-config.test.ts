import { describe, it, expect } from "vitest";
import {
  BRIEF_ROW_COUNTS,
  IMAGE_RATIOS,
  IMAGE_QUALITIES,
  VIDEO_RATIOS,
  VIDEO_DURATIONS,
  PROMPT_LIMITS,
  DEFAULT_DAILY_LIMITS,
  DEFAULT_MAX_CONCURRENT,
  approximateRatio,
  defaultParams,
  imageTargetSize,
  isGenerationType,
  labelFor,
  videoTargetSize,
} from "../config/generation";

describe("generation config", () => {
  it("uses PRD image ratios and qualities", () => {
    expect(IMAGE_RATIOS.map((r) => r.value)).toEqual(["1:1", "4:5", "3:4", "9:16", "16:9", "4:3", "custom"]);
    expect(IMAGE_QUALITIES.map((q) => q.value)).toEqual(["low", "medium", "high"]);
  });

  it("resolves image target sizes from presets and custom", () => {
    expect(imageTargetSize({ aspectRatio: "1:1", dimensionPreset: "medium" })).toEqual({ width: 1024, height: 1024 });
    expect(imageTargetSize({ aspectRatio: "16:9", dimensionPreset: "large" })).toEqual({ width: 1920, height: 1080 });
    expect(imageTargetSize({ aspectRatio: "custom", width: 1200, height: 800 })).toEqual({ width: 1200, height: 800 });
  });

  it("resolves video output sizes per ratio and resolution", () => {
    expect(videoTargetSize("16:9", "720p")).toEqual({ width: 1280, height: 720 });
    expect(videoTargetSize("9:16", "1080p")).toEqual({ width: 1080, height: 1920 });
    expect(videoTargetSize("1:1", "720p")).toEqual({ width: 720, height: 720 });
    expect(VIDEO_RATIOS.map((r) => r.value)).toEqual(["16:9", "9:16", "1:1"]);
    expect(VIDEO_DURATIONS).toEqual([5, 10, 15]);
  });

  it("approximates custom ratios in lowest terms", () => {
    expect(approximateRatio(1200, 800)).toBe("≈ 3:2");
    expect(approximateRatio(1024, 1024)).toBe("≈ 1:1");
  });

  it("uses PRD defaults per type", () => {
    expect(defaultParams("image")).toMatchObject({ aspectRatio: "1:1", quality: "medium", dimensionPreset: "medium" });
    expect(defaultParams("video")).toMatchObject({ aspectRatio: "16:9", durationSeconds: 5, resolution: "720p" });
    expect(defaultParams("brief")).toMatchObject({ contentType: "image", platform: "instagram", length: "standard" });
  });

  it("matches PRD quota and prompt limits", () => {
    expect(DEFAULT_DAILY_LIMITS).toEqual({ image: 20, video: 5, audio: 30, brief: 30 });
    expect(DEFAULT_MAX_CONCURRENT).toEqual({ image: 3, video: 2, audio: 3, brief: 3 });
    expect(PROMPT_LIMITS).toEqual({ image: 1000, video: 1000, audio: 5000, brief: 2000 });
  });

  it("maps brief length to row counts", () => {
    expect(BRIEF_ROW_COUNTS).toEqual({ short: 5, standard: 7, detailed: 10 });
  });

  it("guards generation types and resolves labels", () => {
    expect(isGenerationType("image")).toBe(true);
    expect(isGenerationType("text")).toBe(false);
    expect(labelFor(IMAGE_QUALITIES, "high")).toBe("Maksimal");
    expect(labelFor(IMAGE_QUALITIES, null)).toBe("—");
  });
});

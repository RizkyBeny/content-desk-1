import { describe, it, expect } from "vitest";
import { parseGenerationParams, assertGenerationType, createGenerationSchema } from "@/lib/validators/generation";

describe("generation validators", () => {
  it("accepts PRD image params and defaults dimensionPreset null for custom", () => {
    const params = parseGenerationParams("image", {
      aspectRatio: "16:9",
      quality: "high",
      dimensionPreset: "medium",
      width: 1280,
      height: 720,
    });
    expect(params).toMatchObject({ aspectRatio: "16:9", quality: "high" });
  });

  it("requires stepped custom dimensions within range", () => {
    expect(() =>
      parseGenerationParams("image", { aspectRatio: "custom", quality: "low", dimensionPreset: null, width: 1200, height: 800 }),
    ).not.toThrow();
    expect(() =>
      parseGenerationParams("image", { aspectRatio: "custom", quality: "low", dimensionPreset: null, width: 1001, height: 800 }),
    ).toThrow();
    expect(() =>
      parseGenerationParams("image", { aspectRatio: "custom", quality: "low", dimensionPreset: null, width: 40, height: 800 }),
    ).toThrow();
  });

  it("validates video duration and resolution against the allowed sets", () => {
    expect(() =>
      parseGenerationParams("video", { aspectRatio: "9:16", durationSeconds: 10, resolution: "1080p", startFrameAssetId: null }),
    ).not.toThrow();
    expect(() =>
      parseGenerationParams("video", { aspectRatio: "9:16", durationSeconds: 7, resolution: "1080p" }),
    ).toThrow();
  });

  it("validates audio speed steps and style", () => {
    expect(() =>
      parseGenerationParams("audio", { voiceId: "v", language: "id", speed: 1.1, style: "expressive", format: "mp3" }),
    ).not.toThrow();
    expect(() =>
      parseGenerationParams("audio", { voiceId: "v", language: "id", speed: 1.05, style: "expressive", format: "mp3" }),
    ).toThrow();
    expect(() =>
      parseGenerationParams("audio", { voiceId: "v", language: "id", speed: 1, style: "shout", format: "mp3" }),
    ).toThrow();
  });

  it("validates brief audience length and length enum", () => {
    expect(() =>
      parseGenerationParams("brief", {
        contentType: "carousel",
        platform: "instagram",
        tone: "casual",
        language: "id",
        audience: "karyawan muda",
        length: "detailed",
      }),
    ).not.toThrow();
    expect(() =>
      parseGenerationParams("brief", {
        contentType: "carousel",
        platform: "instagram",
        tone: "casual",
        language: "id",
        audience: "x".repeat(200),
        length: "detailed",
      }),
    ).toThrow();
  });

  it("enforces prompt minimum and per-type maximum", () => {
    expect(createGenerationSchema.safeParse({ type: "image", prompt: "ab", params: {} }).success).toBe(false);
    expect(
      createGenerationSchema.safeParse({ type: "brief", prompt: "x".repeat(2001), params: {} }).success,
    ).toBe(false);
    expect(
      createGenerationSchema.safeParse({ type: "image", prompt: "x".repeat(1000), params: {} }).success,
    ).toBe(true);
  });

  it("asserts known generation types", () => {
    expect(assertGenerationType("audio")).toBe("audio");
    expect(() => assertGenerationType("text")).toThrow();
  });
});

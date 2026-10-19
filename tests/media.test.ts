import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-key-at-least-16-chars";
  process.env.DATABASE_URL = "mysql://user:pass@localhost:3306/test";
});

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("mock media provider", () => {
  it("generates a valid PNG at the requested ratio", async () => {
    const { mockMediaProvider } = await import("@/lib/adapters/media/mock");
    const out = await mockMediaProvider.generateImage({
      prompt: "Tips WFH hemat listrik",
      ratio: "4:5",
    });
    expect(out.contentType).toBe("image/png");
    expect(out.ext).toBe("png");
    expect(out.data.subarray(0, 8)).toEqual(PNG_SIGNATURE);
    expect(out.width).toBe(1080);
    expect(out.height).toBe(1350);
  });

  it("produces a fresh variant for regenerate", async () => {
    const { mockMediaProvider } = await import("@/lib/adapters/media/mock");
    const a = await mockMediaProvider.generateImage({ prompt: "same prompt", variant: 0 });
    const b = await mockMediaProvider.generateImage({ prompt: "same prompt", variant: 1 });
    expect(a.data.equals(b.data)).toBe(false);
  });

  it("synthesizes a valid WAV sized to the script", async () => {
    const { mockMediaProvider } = await import("@/lib/adapters/media/mock");
    const out = await mockMediaProvider.synthesizeSpeech({
      text: "Halo dunia, ini contoh naskah untuk segmen audio.",
      voice: "voice-a",
    });
    expect(out.contentType).toBe("audio/wav");
    expect(out.data.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(out.data.subarray(8, 12).toString("ascii")).toBe("WAVE");
    expect(out.durationSec ?? 0).toBeGreaterThan(0);
  });

  it("assembles a valid MP4 from scene frames", async () => {
    const { mockMediaProvider } = await import("@/lib/adapters/media/mock");
    const out = await mockMediaProvider.generateVideo({
      prompt: "POV senin WFH lagi",
      ratio: "9:16",
      scenes: [
        { prompt: "scene one", durationSec: 1 },
        { prompt: "scene two", durationSec: 1 },
      ],
    });
    expect(out.contentType).toBe("video/mp4");
    expect(out.data.subarray(4, 8).toString("ascii")).toBe("ftyp");
    expect(out.data.length).toBeGreaterThan(1000);
  }, 60000);
});

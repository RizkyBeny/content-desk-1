import { describe, it, expect } from "vitest";
import { buildInitialEditorState } from "@/lib/services/creations-editor";

describe("buildInitialEditorState", () => {
  it("image: single slide with background and a text layer", () => {
    const s = buildInitialEditorState("image", [{ briefRowRef: 1, assetId: "a1" }], [{ rasio: "1:1", teks: "Halo dunia" }]);
    expect(s.type).toBe("image");
    if (s.type !== "image") return;
    expect(s.ratio).toBe("1:1");
    expect(s.slide.background?.assetId).toBe("a1");
    expect(s.slide.layers[0]).toMatchObject({ type: "text", text: "Halo dunia" });
  });

  it("carousel: one slide per item, ratio defaults to 4:5", () => {
    const s = buildInitialEditorState(
      "carousel",
      [{ briefRowRef: 1, assetId: "a1" }, { briefRowRef: 2, assetId: "a2" }],
      [{ judul: "Satu" }, { judul: "Dua" }],
    );
    expect(s.type).toBe("carousel");
    if (s.type !== "carousel") return;
    expect(s.ratio).toBe("4:5");
    expect(s.slides).toHaveLength(2);
    expect(s.slides[0].background?.assetId).toBe("a1");
    expect(s.slides[0].config?.titleText).toBe("Satu");
    expect(s.slides[1].config?.titleText).toBe("Dua");
  });

  it("video: scenes carry clip asset and duration", () => {
    const s = buildInitialEditorState("video", [{ briefRowRef: 1, assetId: "v1" }], [{ durasi: "6", teks_onscreen: "POV" }]);
    expect(s.type).toBe("video");
    if (s.type !== "video") return;
    expect(s.ratio).toBe("9:16");
    expect(s.scenes[0].clipAssetId).toBe("v1");
    expect(s.scenes[0].endSec).toBe(6);
    expect(s.scenes[0].texts[0].text).toBe("POV");
  });

  it("audio: segments from item rows", () => {
    const s = buildInitialEditorState("audio", [{ briefRowRef: 1, assetId: "au1" }], [{ naskah: "Selamat pagi", durasi: "8", nada: "hangat" }]);
    expect(s.type).toBe("audio");
    if (s.type !== "audio") return;
    expect(s.segments[0].assetId).toBe("au1");
    expect(s.segments[0].text).toBe("Selamat pagi");
    expect(s.segments[0].tone).toBe("hangat");
    expect(s.segments[0].durationSec).toBe(8);
  });

  it("article: renders html from rows", () => {
    const s = buildInitialEditorState("article", [], [{ judul: "Pendahuluan", poin: "Isi" }]);
    expect(s.type).toBe("article");
    if (s.type !== "article") return;
    expect(s.html).toContain("<h2>Pendahuluan</h2>");
    expect(s.html).toContain("<p>Isi</p>");
  });

  it("falls back to a single item when items are empty", () => {
    const s = buildInitialEditorState("image", [], []);
    expect(s.type).toBe("image");
    if (s.type !== "image") return;
    expect(s.slide).toBeTruthy();
  });
});

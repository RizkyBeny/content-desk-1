import { describe, it, expect } from "vitest";
import { columnsFor, tileSpan } from "@/lib/gallery";

describe("tileSpan", () => {
  it("audio stays one column, brief spans two", () => {
    expect(tileSpan("audio")).toEqual({ col: 1, row: 1 });
    expect(tileSpan("brief")).toEqual({ col: 2, row: 1 });
    expect(tileSpan("brief", 100, 1000)).toEqual({ col: 2, row: 1 });
  });

  it("wide images span two columns", () => {
    expect(tileSpan("image", 1920, 1080)).toEqual({ col: 2, row: 1 });
    expect(tileSpan("video", 1600, 1000)).toEqual({ col: 2, row: 1 });
  });

  it("tall media span two rows", () => {
    expect(tileSpan("image", 720, 1280)).toEqual({ col: 1, row: 2 });
    expect(tileSpan("video", 1080, 1920)).toEqual({ col: 1, row: 2 });
  });

  it("balanced ratios stay 1x1", () => {
    expect(tileSpan("image", 1024, 1024)).toEqual({ col: 1, row: 1 });
    expect(tileSpan("image", 1280, 960)).toEqual({ col: 1, row: 1 });
  });

  it("missing dimensions default to square", () => {
    expect(tileSpan("image")).toEqual({ col: 1, row: 1 });
  });
});

describe("columnsFor", () => {
  it("follows FR-GAL-2 breakpoints", () => {
    expect(columnsFor(1280)).toBe(4);
    expect(columnsFor(1024)).toBe(4);
    expect(columnsFor(1023)).toBe(3);
    expect(columnsFor(768)).toBe(3);
    expect(columnsFor(767)).toBe(2);
    expect(columnsFor(375)).toBe(2);
  });

  it("audio uses a 3/2/1 column grid", () => {
    expect(columnsFor(1280, "audio")).toBe(3);
    expect(columnsFor(1024, "audio")).toBe(3);
    expect(columnsFor(1023, "audio")).toBe(2);
    expect(columnsFor(768, "audio")).toBe(2);
    expect(columnsFor(767, "audio")).toBe(1);
    expect(columnsFor(375, "audio")).toBe(1);
  });
});

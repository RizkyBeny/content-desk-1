import { CANVAS_DIMS } from "./canvas/dims";
import type { ImageLayer, LayerPatch, SlideObject, TextLayer } from "@/types";

export function uid(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

export function newTextLayer(ratio: keyof typeof CANVAS_DIMS): TextLayer {
  const { w, h } = CANVAS_DIMS[ratio];
  return {
    id: uid("text"),
    type: "text",
    text: "Teks baru",
    x: Math.round(w * 0.08),
    y: Math.round(h * 0.5),
    fontSize: Math.round(w * 0.066),
    fontFamily: "Inter",
    color: "#FFFFFF",
    align: "left",
    shadow: true,
    rotation: 0,
  };
}

export function newImageLayer(assetId: string, src: string | null, ratio: keyof typeof CANVAS_DIMS): ImageLayer {
  const { w, h } = CANVAS_DIMS[ratio];
  const size = Math.round(Math.min(w, h) * 0.4);
  return {
    id: uid("img"),
    type: "image",
    assetId,
    src,
    x: Math.round((w - size) / 2),
    y: Math.round((h - size) / 2),
    width: size,
    height: size,
    rotation: 0,
    opacity: 1,
  };
}

export function patchLayer(slide: SlideObject, id: string, patch: LayerPatch): SlideObject {
  return {
    ...slide,
    layers: slide.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as SlideObject["layers"][number]) : l)),
  };
}

export function addLayer(slide: SlideObject, layer: SlideObject["layers"][number]): SlideObject {
  return { ...slide, layers: [...slide.layers, layer] };
}

export function removeLayer(slide: SlideObject, id: string): SlideObject {
  return { ...slide, layers: slide.layers.filter((l) => l.id !== id) };
}

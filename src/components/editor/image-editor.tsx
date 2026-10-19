"use client";

import { useState } from "react";
import { GlassCard, SectionHeader } from "@/components/ui/primitives";
import { SlideCanvas } from "./canvas/slide-canvas";
import { SlideControls } from "./inspector/slide-controls";
import { LayerInspector } from "./inspector/layer-inspector";
import { LayersPanel } from "./layers-panel";
import { addLayer, newImageLayer, newTextLayer, patchLayer, removeLayer } from "./layer-utils";
import { MediaSourcePicker, type MediaSelection } from "@/components/media/media-source-picker";
import type { EditorController } from "./use-editor-state";
import type { CanvasFilters, ImageEditorState, LayerPatch, SlideObject } from "@/types";

export function ImageEditor({
  controller,
  assetUrls,
}: {
  controller: EditorController;
  assetUrls: Record<string, string>;
}) {
  const state = controller.state as ImageEditorState;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [picker, setPicker] = useState<null | "background" | "layer">(null);

  function patchSlide(patch: Partial<SlideObject> & { ratio?: ImageEditorState["ratio"] }) {
    controller.setState((s) => {
      if (s.type !== "image") return s;
      const { ratio, ...slidePatch } = patch;
      return { ...s, ratio: ratio ?? s.ratio, slide: { ...s.slide, ...slidePatch } };
    });
  }

  function patchSelected(patch: LayerPatch) {
    if (!selectedId) return;
    controller.setState((s) => (s.type === "image" ? { ...s, slide: patchLayer(s.slide, selectedId, patch) } : s));
  }

  function duplicateLayer(id: string) {
    controller.setState((s) => {
      if (s.type !== "image") return s;
      const layer = s.slide.layers.find((l) => l.id === id);
      if (!layer) return s;
      const copy = { ...layer, id: `${layer.type}-${Math.random().toString(36).slice(2, 8)}`, x: layer.x + 24, y: layer.y + 24 };
      return { ...s, slide: addLayer(s.slide, copy) };
    });
  }

  function moveLayer(id: string, dir: -1 | 1) {
    controller.setState((s) => {
      if (s.type !== "image") return s;
      const layers = [...s.slide.layers];
      const i = layers.findIndex((l) => l.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= layers.length) return s;
      [layers[i], layers[j]] = [layers[j], layers[i]];
      return { ...s, slide: { ...s.slide, layers } };
    });
  }

  function onPick(sel: MediaSelection) {
    const asset = sel.asset;
    const mode = picker;
    setPicker(null);
    if (!asset) {
      return;
    }
    if (mode === "background") {
      patchSlide({ background: { assetId: asset.id, fit: "cover" } });
    } else {
      const layer = newImageLayer(asset.id, asset.fileUrl, state.ratio);
      controller.setState((s) => (s.type === "image" ? { ...s, slide: addLayer(s.slide, layer) } : s));
      setSelectedId(layer.id);
    }
  }

  const selected = state.slide.layers.find((l) => l.id === selectedId) ?? null;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <GlassCard className="flex items-center justify-center p-4">
          <div className="w-full max-w-[520px]">
            <SlideCanvas
              slide={state.slide}
              ratio={state.ratio}
              assetUrls={assetUrls}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onPatchLayer={(id, patch) => controller.setState((s) => (s.type === "image" ? { ...s, slide: patchLayer(s.slide, id, patch) } : s))}
            />
          </div>
        </GlassCard>

        <div className="space-y-4" id="editor-controls">
          <GlassCard>
            <SectionHeader title="Kartu" description="Rasio, latar, dan filter dasar." />
            <div className="mt-3">
              <SlideControls
                slide={state.slide}
                ratio={state.ratio}
                showRatio
                onPatchSlide={patchSlide}
                onPatchFilters={(f: CanvasFilters) => patchSlide({ filters: f })}
                onSwapBackground={() => setPicker("background")}
                onRemoveBackground={() => patchSlide({ background: null })}
              />
            </div>
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Layer" />
            <div className="mt-3">
              <LayersPanel
                slide={state.slide}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAddText={() => {
                  const l = newTextLayer(state.ratio);
                  controller.setState((s) => (s.type === "image" ? { ...s, slide: addLayer(s.slide, l) } : s));
                  setSelectedId(l.id);
                }}
                onAddImage={() => setPicker("layer")}
                onDuplicate={duplicateLayer}
                onRemove={(id) => {
                  controller.setState((s) => (s.type === "image" ? { ...s, slide: removeLayer(s.slide, id) } : s));
                  setSelectedId(null);
                }}
                onMove={moveLayer}
              />
            </div>
          </GlassCard>

          {selected ? (
            <GlassCard>
              <LayerInspector
                layer={selected}
                onPatch={patchSelected}
                onDelete={() => {
                  controller.setState((s) => (s.type === "image" ? { ...s, slide: removeLayer(s.slide, selected.id) } : s));
                  setSelectedId(null);
                }}
                onReplaceImage={() => setPicker("layer")}
              />
            </GlassCard>
          ) : (
            <p className="px-1 text-xs text-zinc-500 dark:text-zinc-400">Pilih layer untuk mengedit propertinya.</p>
          )}
        </div>
      </div>

      <MediaSourcePicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        type="image"
        onSelect={onPick}
      />
    </>
  );
}

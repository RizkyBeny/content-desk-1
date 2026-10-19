"use client";

import { useState } from "react";
import { toast } from "@heroui/react";
import { SlideCanvas } from "./canvas/slide-canvas";
import { SlideControls } from "./inspector/slide-controls";
import { LayerInspector } from "./inspector/layer-inspector";
import { LayersPanel } from "./layers-panel";
import { addLayer, newImageLayer, newTextLayer, patchLayer, removeLayer } from "./layer-utils";
import { MediaSourcePicker, type MediaSelection } from "@/components/media/media-source-picker";
import { EditorFrame } from "./frame/editor-frame";
import { AssetRail } from "./frame/asset-rail";
import { StageBar, fitFrame } from "./frame/stage";
import { TimelineBar, TimelineItem } from "./frame/timeline-bar";
import {
  CanvasEditorSection,
  MediaConfigSection,
  TypographySection,
} from "./frame/sections";
import { SectionBlock } from "./frame/ui";
import { ImageIcon, TextIcon } from "@/components/ui/icons";
import type { TypeEditorProps } from "./frame/types";
import type { CanvasFilters, ImageEditorState, LayerPatch, SlideObject } from "@/types";

export function ImageEditor({ creation, controller, assetUrls, chrome, ui, patchUi }: TypeEditorProps) {
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
    if (!asset) return;
    if (mode === "background") {
      patchSlide({ background: { assetId: asset.id, fit: "cover" } });
    } else {
      const layer = newImageLayer(asset.id, asset.fileUrl, state.ratio);
      controller.setState((s) => (s.type === "image" ? { ...s, slide: addLayer(s.slide, layer) } : s));
      setSelectedId(layer.id);
    }
  }

  // Klik aset di rail → jadi latar slide.
  function pickFromRail(assetId: string) {
    patchSlide({ background: { assetId, fit: "cover" } });
    toast.success("Latar diperbarui.");
  }

  const selected = state.slide.layers.find((l) => l.id === selectedId) ?? null;
  const layers = state.slide.layers;

  // ── Stage ───────────────────────────────────────────────────────────────
  const stage = (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <StageBar controller={controller} onSwapAsset={() => setPicker("background")} swapLabel="Ganti Aset" />
      <div
        className="flex min-h-0 flex-1 items-center justify-center"
        style={{ containerType: "size" }}
      >
        <div className="relative" style={fitFrame(state.ratio)}>
          <SlideCanvas
            slide={state.slide}
            ratio={state.ratio}
            assetUrls={assetUrls}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onPatchLayer={(id, patch) =>
              controller.setState((s) => (s.type === "image" ? { ...s, slide: patchLayer(s.slide, id, patch) } : s))
            }
          />
        </div>
      </div>
    </div>
  );

  // ── Timeline (strip layer) ──────────────────────────────────────────────
  const timeline = (
    <TimelineBar
      zoom={ui.zoom}
      onZoom={(v) => patchUi({ zoom: v })}
      pageLabel={`Layer ${selectedId ? layers.findIndex((l) => l.id === selectedId) + 1 : 0}/${layers.length}`}
      showBacksound={false}
    >
      <button
        type="button"
        onClick={() => {
          const l = newTextLayer(state.ratio);
          controller.setState((s) => (s.type === "image" ? { ...s, slide: addLayer(s.slide, l) } : s));
          setSelectedId(l.id);
        }}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-zinc-500 transition-colors hover:border-indigo-400 hover:text-indigo-500 dark:border-zinc-600 dark:text-zinc-400"
        aria-label="Tambah layer teks"
      >
        <TextIcon width={18} height={18} />
      </button>
      {layers.map((l) => (
        <TimelineItem
          key={l.id}
          active={l.id === selectedId}
          onClick={() => setSelectedId(l.id)}
          label={l.type === "text" ? l.text.slice(0, 18) || "Teks" : "Gambar"}
          sublabel={l.type}
        >
          {l.type === "text" ? (
            <TextIcon width={18} height={18} className="text-zinc-400" />
          ) : (
            <ImageIcon width={18} height={18} className="text-zinc-400" />
          )}
        </TimelineItem>
      ))}
    </TimelineBar>
  );

  // ── Panel Properties ────────────────────────────────────────────────────
  const panel = (
    <>
      <CanvasEditorSection
        ratio={state.ratio}
        onRatio={(r) => patchSlide({ ratio: r })}
        ui={ui}
        patchUi={patchUi}
      />

      <SectionBlock title="Kartu" description="Latar, pas, dan filter dasar.">
        <SlideControls
          slide={state.slide}
          ratio={state.ratio}
          showRatio={false}
          onPatchSlide={patchSlide}
          onPatchFilters={(f: CanvasFilters) => patchSlide({ filters: f })}
          onSwapBackground={() => setPicker("background")}
          onRemoveBackground={() => patchSlide({ background: null })}
        />
      </SectionBlock>

      <SectionBlock title="Layer" description={`${layers.length} layer pada slide ini.`}>
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
        {selected ? (
          <div className="mt-3 border-t border-zinc-200/60 pt-3 dark:border-white/10">
            <LayerInspector
              layer={selected}
              onPatch={patchSelected}
              onDelete={() => {
                controller.setState((s) => (s.type === "image" ? { ...s, slide: removeLayer(s.slide, selected.id) } : s));
                setSelectedId(null);
              }}
              onReplaceImage={() => setPicker("layer")}
            />
          </div>
        ) : (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Pilih layer untuk mengedit propertinya.</p>
        )}
      </SectionBlock>

      <TypographySection ui={ui} patchUi={patchUi} />
      <MediaConfigSection ui={ui} patchUi={patchUi} />
    </>
  );

  return (
    <>
      <EditorFrame
        chrome={chrome}
        rail={<AssetRail creation={creation} backHref={chrome.backHref} onPickAsset={(a) => pickFromRail(a.id)} />}
        stage={stage}
        panel={panel}
        timeline={timeline}
      />
      <MediaSourcePicker open={picker !== null} onClose={() => setPicker(null)} type="image" onSelect={onPick} />
    </>
  );
}

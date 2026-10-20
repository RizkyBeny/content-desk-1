"use client";

import { useState } from "react";
import { toast } from "@heroui/react";
import { SlideCanvas } from "./canvas/slide-canvas";
import { addLayer, newTextLayer, patchLayer } from "./layer-utils";
import { MediaSourcePicker, type MediaSelection } from "@/components/media/media-source-picker";
import { EditorFrame } from "./frame/editor-frame";
import { AssetRail } from "./frame/asset-rail";
import { StageBar, fitFrame } from "./frame/stage";
import { TimelineBar, TimelineItem } from "./frame/timeline-bar";
import { OrientationSection, TypographySection } from "./frame/sections";
import { ImageIcon, TextIcon } from "@/components/ui/icons";
import type { TypeEditorProps } from "./frame/types";
import type { ImageEditorState, SlideObject } from "@/types";

export function ImageEditor({ creation, controller, assetUrls, chrome, ui, patchUi }: TypeEditorProps) {
  const state = controller.state as ImageEditorState;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  function patchSlide(patch: Partial<SlideObject> & { ratio?: ImageEditorState["ratio"] }) {
    controller.setState((s) => {
      if (s.type !== "image") return s;
      const { ratio, ...slidePatch } = patch;
      return { ...s, ratio: ratio ?? s.ratio, slide: { ...s.slide, ...slidePatch } };
    });
  }

  function onPick(sel: MediaSelection) {
    const asset = sel.asset;
    setPickerOpen(false);
    if (!asset) return;
    patchSlide({ background: { assetId: asset.id, fit: "cover" } });
  }

  // Klik aset di rail → jadi latar slide.
  function pickFromRail(assetId: string) {
    patchSlide({ background: { assetId, fit: "cover" } });
    toast.success("Latar diperbarui.");
  }

  const layers = state.slide.layers;

  // ── Stage ───────────────────────────────────────────────────────────────
  const stage = (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <StageBar controller={controller} onSwapAsset={() => setPickerOpen(true)} swapLabel="Ganti Aset" />
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

  // ── Panel Properties (node 344-10326) ───────────────────────────────────
  const panel = (
    <>
      <OrientationSection ratio={state.ratio} onRatio={(r) => patchSlide({ ratio: r })} />
      <TypographySection ui={ui} patchUi={patchUi} showHighlightColor={false} />
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
      <MediaSourcePicker open={pickerOpen} onClose={() => setPickerOpen(false)} type="image" onSelect={onPick} />
    </>
  );
}

"use client";

import { useState } from "react";
import { toast } from "@heroui/react";
import { cn } from "@/lib/utils";
import { SlideCanvas } from "./canvas/slide-canvas";
import { addLayer, newTextLayer, patchLayer } from "./layer-utils";
import { MediaSourcePicker, type MediaSelection } from "@/components/media/media-source-picker";
import { EditorFrame } from "./frame/editor-frame";
import { AssetRail } from "./frame/asset-rail";
import { StageBar, fitFrame } from "./frame/stage";
import { TimelineBar, TimelineItem } from "./frame/timeline-bar";
import { MediaConfigSection, OrientationSection, TypographySection } from "./frame/sections";
import { WatermarkOverlay } from "./frame/watermark-overlay";
import { isLightColor } from "./frame/ui";
import { ImageIcon, TextIcon } from "@/components/ui/icons";
import type { TypeEditorProps } from "./frame/types";
import type { ImageEditorState, SlideObject } from "@/types";

function placedClass(placement: "top" | "middle" | "bottom") {
  if (placement === "top") return "justify-start pt-[5cqw]";
  if (placement === "middle") return "justify-center";
  return "justify-end pb-[5cqw]";
}

function alignClass(alignment: "left" | "center" | "right") {
  if (alignment === "center") return "text-center";
  if (alignment === "right") return "text-right";
  return "text-left";
}

export function ImageEditor({ creation, controller, assetUrls, chrome, ui, patchUi, channelLogoUrl }: TypeEditorProps) {
  const state = controller.state as ImageEditorState;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

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

  // Klik aset di rail → jadi latar slide
  function pickFromRail(assetId: string) {
    patchSlide({ background: { assetId, fit: "cover" } });
    setIsSwapping(false);
    toast.success("Latar diperbarui.");
  }

  const layers = state.slide.layers;

  // Typography overlay synchronization
  const initialTitle = creation.captions[0]?.text.split("\n")[0]?.trim() || "";
  const titleText = ui.titleText || initialTitle;
  const highlightText = ui.highlightOn ? ui.highlightText.trim() : "";
  const highlightIndex = highlightText
    ? titleText.toLowerCase().indexOf(highlightText.toLowerCase())
    : -1;
  const canHighlight = Boolean(highlightText && highlightIndex >= 0);
  const extraHighlight = Boolean(highlightText && highlightIndex < 0);

  const titleNode = canHighlight && highlightText ? (
    <>
      {titleText.slice(0, highlightIndex)}
      <mark
        className="rounded-[3px] px-[0.12em]"
        style={{
          backgroundColor: ui.highlightColor || "#FACC15",
          color: isLightColor(ui.highlightColor || "#FACC15") ? "#171717" : "#FFFFFF",
        }}
      >
        {titleText.slice(highlightIndex, highlightIndex + highlightText.length)}
      </mark>
      {titleText.slice(highlightIndex + highlightText.length)}
    </>
  ) : (
    titleText
  );

  // ── Stage (Padding diselaraskan presisi dengan Figma EL-718e44dc: 64px 129px 32px) ──
  const stage = (
    <div className="flex h-full min-h-0 flex-col gap-2 p-2 sm:gap-4 sm:px-8 sm:py-4 xl:gap-6 xl:px-[129px] xl:pt-16 xl:pb-8">
      <StageBar controller={controller} />
      <div
        className="flex min-h-[220px] flex-1 items-center justify-center p-1 sm:p-2"
        style={{ containerType: "size" }}
      >
        <div
          className="relative flex items-center justify-center overflow-hidden rounded-lg bg-black shadow-lg"
          style={{ ...fitFrame(state.ratio), containerType: "inline-size" }}
        >
          <SlideCanvas
            slide={{
              ...state.slide,
              // Hilangkan layer teks template/nama frame agar tidak bertumpuk di bawah text overlay
              layers: state.slide.layers.filter((l) => l.type !== "text"),
            }}
            ratio={state.ratio}
            assetUrls={assetUrls}
            selectedId={selectedId}
            onSelect={setSelectedId}
            fitMode={ui.fitMode}
            onPatchLayer={(id, patch) =>
              controller.setState((s) => (s.type === "image" ? { ...s, slide: patchLayer(s.slide, id, patch) } : s))
            }
          />

          {/* Overlay konfigurasi media (Figma node 344:7334) */}
          {ui.overlay === "gradient" && (
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          )}
          {ui.overlay === "blur" && (
            <div className="pointer-events-none absolute inset-0 z-10 bg-black/40 backdrop-blur-xs" />
          )}
          {ui.overlay === "vignette" && (
            <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.85)_100%)]" />
          )}

          {/* Typography structured overlay (Figma Single Image node 367:16650) */}
          {titleText || extraHighlight || (ui.descOn && ui.descText) ? (
            <div className={cn("pointer-events-none absolute inset-0 z-10 flex flex-col", placedClass(ui.textPlacement))}>
              <div className={cn("w-full px-[7cqw] pb-[4cqw]", alignClass(ui.alignment))}>
                {titleText ? (
                  <p className="text-[clamp(14px,6.4cqw,34px)] font-bold leading-[1.15] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                    {titleNode}
                  </p>
                ) : null}
                {extraHighlight && highlightText ? (
                  <p className="mt-[1.5cqw] text-[clamp(13px,5.6cqw,30px)] font-bold leading-[1.1] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                    <span
                      className="rounded-[3px] px-[0.12em]"
                      style={{
                        backgroundColor: ui.highlightColor || "#FACC15",
                        color: isLightColor(ui.highlightColor || "#FACC15") ? "#171717" : "#FFFFFF",
                      }}
                    >
                      {highlightText}
                    </span>
                  </p>
                ) : null}
                {ui.descOn && ui.descText ? (
                  <p className="mt-[1.5cqw] text-[clamp(11px,3.8cqw,18px)] leading-[1.3] text-zinc-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                    {ui.descText}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <WatermarkOverlay ui={ui} channelLogoUrl={channelLogoUrl} />
        </div>
      </div>
    </div>
  );

  // ── Timeline (strip layer & zoom) ──────────────────────────────────────────────
  const timeline = (
    <TimelineBar
      zoom={ui.zoom}
      onZoom={(v) => patchUi({ zoom: v })}
      pageLabel="Page 1/1"
      showBacksound={false}
    >
      <button
        type="button"
        onClick={() => {
          const l = newTextLayer(state.ratio);
          controller.setState((s) => (s.type === "image" ? { ...s, slide: addLayer(s.slide, l) } : s));
          setSelectedId(l.id);
        }}
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-zinc-500 transition-colors hover:border-indigo-400 hover:text-indigo-500 dark:border-zinc-700 dark:text-zinc-400"
        aria-label="Tambah layer teks bebas"
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

  // ── Panel Properties (Figma node 367:16650) ───────────────────────────────────
  const panel = (
    <>
      <OrientationSection ratio={state.ratio} onRatio={(r) => patchSlide({ ratio: r })} />
      <TypographySection
        ui={ui}
        patchUi={patchUi}
        titleText={titleText}
        onTitleText={(v) => patchUi({ titleText: v })}
        showHighlightColor={true}
      />
      <MediaConfigSection
        ui={ui}
        patchUi={patchUi}
      />
    </>
  );

  return (
    <>
      <EditorFrame
        chrome={chrome}
        isSwapping={isSwapping}
        rail={
          <AssetRail
            creation={creation}
            backHref={chrome.backHref}
            onBack={chrome.onBack}
            isSwapping={isSwapping}
            onCancelSwap={() => setIsSwapping(false)}
            onPickAsset={(a) => pickFromRail(a.id)}
          />
        }
        stage={stage}
        panel={panel}
        timeline={timeline}
      />
      <MediaSourcePicker open={pickerOpen} onClose={() => setPickerOpen(false)} type="image" onSelect={onPick} />
    </>
  );
}

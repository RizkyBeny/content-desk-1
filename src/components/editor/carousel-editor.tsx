"use client";

import { useMemo, useState } from "react";
import { Button, toast } from "@heroui/react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CopyIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { SlideCanvas } from "./canvas/slide-canvas";
import { patchLayer, uid } from "./layer-utils";
import { MediaSourcePicker, type MediaSelection } from "@/components/media/media-source-picker";
import { EditorFrame } from "./frame/editor-frame";
import { AssetRail } from "./frame/asset-rail";
import { StageBar, fitFrame } from "./frame/stage";
import { TimelineBar } from "./frame/timeline-bar";
import { MediaConfigSection, OrientationSection, TypographySection } from "./frame/sections";
import { WatermarkOverlay } from "./frame/watermark-overlay";
import { isLightColor } from "./frame/ui";
import type { TypeEditorProps } from "./frame/types";
import type { CarouselEditorState, SlideConfig, SlideObject } from "@/types";
import type { EditorUiState } from "./frame/use-editor-ui";

const MAX_SLIDES = 10;

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

function Thumb({
  id,
  index,
  active,
  url,
  onClick,
}: {
  id: string;
  index: number;
  active: boolean;
  url: string | null;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "shrink-0 rounded-[4px] transition-all",
        active
          ? "border-2 border-[#1A55D8]"
          : "border border-zinc-200/60 hover:border-zinc-400 dark:border-white/10"
      )}
      {...attributes}
      {...listeners}
    >
      <button
        type="button"
        onClick={onClick}
        className="relative block h-[82px] w-[82px] overflow-hidden rounded-[2px]"
        aria-label={`Slide ${index + 1}`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={`Slide ${index + 1}`} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-800">
            {index + 1}
          </span>
        )}
      </button>
    </div>
  );
}

export function CarouselEditor({ creation, controller, assetUrls, chrome, ui, patchUi, channelLogoUrl }: TypeEditorProps) {
  const state = controller.state as CarouselEditorState;
  const [activeId, setActiveId] = useState<string>(state.slides[0]?.id ?? "");
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const active = state.slides.find((s) => s.id === activeId) ?? state.slides[0];
  const activeIndex = Math.max(0, state.slides.findIndex((s) => s.id === active?.id));

  function mutate(fn: (slides: SlideObject[]) => SlideObject[]) {
    controller.setState((s) => (s.type === "carousel" ? { ...s, slides: fn(s.slides) } : s));
  }

  function patchActive(patch: Partial<SlideObject>) {
    mutate((slides) => slides.map((s) => (s.id === active.id ? { ...s, ...patch } : s)));
  }

  // Konfigurasi independen per slide/frame
  const activeConfig: Required<SlideConfig> = useMemo(() => {
    const c = active?.config ?? {};
    const defaultTitle =
      activeIndex === 0
        ? creation.captions[0]?.text.split("\n")[0]?.trim() || "Headline"
        : `Slide ${activeIndex + 1}`;
    const title = c.titleText !== undefined ? c.titleText : defaultTitle;
    const desc = c.descText ?? "";
    return {
      titleText: title,
      descText: desc,
      descOn: c.descOn !== undefined ? c.descOn : Boolean(desc),
      alignment: c.alignment ?? "left",
      textPlacement: c.textPlacement ?? "bottom",
      highlightOn: c.highlightOn ?? false,
      highlightText: c.highlightText ?? "",
      highlightColor: c.highlightColor ?? "#00B1B0",
      fitMode: c.fitMode ?? "fill",
      overlay: c.overlay ?? "gradient",
      durationSec: c.durationSec ?? 2,
    };
  }, [active?.config, activeIndex, creation.captions]);

  function patchActiveConfig(patch: Partial<SlideConfig>) {
    mutate((slides) =>
      slides.map((s) => {
        if (s.id !== active?.id) return s;
        return {
          ...s,
          config: {
            ...(s.config ?? {}),
            ...patch,
          },
        };
      })
    );
  }

  // Adapter UI per-slide untuk TypographySection & MediaConfigSection
  const slideUi: EditorUiState = useMemo(
    () => ({
      ...ui,
      alignment: activeConfig.alignment,
      textPlacement: activeConfig.textPlacement,
      titleText: activeConfig.titleText,
      highlightOn: activeConfig.highlightOn,
      highlightText: activeConfig.highlightText,
      highlightColor: activeConfig.highlightColor,
      descOn: activeConfig.descOn,
      descText: activeConfig.descText,
      fitMode: activeConfig.fitMode,
      overlay: activeConfig.overlay,
      mediaDurationSec: activeConfig.durationSec,
    }),
    [ui, activeConfig]
  );

  function patchSlideUi(patch: Partial<EditorUiState>) {
    const configPatch: Partial<SlideConfig> = {};
    if (patch.titleText !== undefined) configPatch.titleText = patch.titleText;
    if (patch.alignment !== undefined) configPatch.alignment = patch.alignment;
    if (patch.textPlacement !== undefined) configPatch.textPlacement = patch.textPlacement;
    if (patch.highlightOn !== undefined) configPatch.highlightOn = patch.highlightOn;
    if (patch.highlightText !== undefined) configPatch.highlightText = patch.highlightText;
    if (patch.highlightColor !== undefined) configPatch.highlightColor = patch.highlightColor;
    if (patch.descOn !== undefined) configPatch.descOn = patch.descOn;
    if (patch.descText !== undefined) configPatch.descText = patch.descText;
    if (patch.fitMode !== undefined) configPatch.fitMode = patch.fitMode;
    if (patch.overlay !== undefined) configPatch.overlay = patch.overlay;
    if (patch.mediaDurationSec !== undefined) configPatch.durationSec = patch.mediaDurationSec;
    patchActiveConfig(configPatch);
  }

  function addSlide() {
    if (state.slides.length >= MAX_SLIDES) {
      toast.warning(`Maksimal ${MAX_SLIDES} slide.`);
      return;
    }
    const newIndex = state.slides.length;
    const slide: SlideObject = {
      id: uid("slide"),
      background: null,
      background_color: "#111318",
      layers: [],
      filters: { brightness: 0, contrast: 0, saturation: 0 },
      rotation: 0,
      scale: 1,
      config: {
        titleText: `Slide ${newIndex + 1}`,
        descText: "",
        descOn: false,
        alignment: "left",
        textPlacement: "bottom",
        highlightOn: false,
        highlightText: "",
        highlightColor: "#00B1B0",
        fitMode: "fill",
        overlay: "gradient",
        durationSec: 2,
      },
    };
    mutate((slides) => [...slides, slide]);
    setActiveId(slide.id);
    setSelectedLayerId(null);
  }

  function duplicateSlide() {
    if (state.slides.length >= MAX_SLIDES) {
      toast.warning(`Maksimal ${MAX_SLIDES} slide.`);
      return;
    }
    const currentTitle = activeConfig.titleText || `Slide ${activeIndex + 1}`;
    const copy: SlideObject = {
      ...structuredClone(active),
      id: uid("slide"),
      layers: active.layers.map((l) => ({ ...l, id: uid(l.type) })),
      config: {
        ...activeConfig,
        titleText: `${currentTitle} (Salinan)`,
      },
    };
    mutate((slides) => [...slides, copy]);
    setActiveId(copy.id);
  }

  function deleteSlide() {
    if (state.slides.length <= 1) {
      toast.warning("Minimal 1 slide.");
      return;
    }
    const next = state.slides.filter((s) => s.id !== active.id);
    mutate(() => next);
    setActiveId(next[0].id);
    setSelectedLayerId(null);
  }

  function applyStyleToAll() {
    const styleFields: Partial<SlideConfig> = {
      alignment: activeConfig.alignment,
      textPlacement: activeConfig.textPlacement,
      highlightColor: activeConfig.highlightColor,
      fitMode: activeConfig.fitMode,
      overlay: activeConfig.overlay,
    };
    mutate((slides) =>
      slides.map((s) => ({
        ...s,
        config: {
          ...(s.config ?? {}),
          ...styleFields,
        },
      }))
    );
    toast.success("Gaya tampilan diterapkan ke semua slide.");
  }

  function onDragEnd(e: DragEndEvent) {
    const { active: a, over } = e;
    if (!over || a.id === over.id) return;
    mutate((slides) => {
      const from = slides.findIndex((s) => s.id === a.id);
      const to = slides.findIndex((s) => s.id === over.id);
      return arrayMove(slides, from, to);
    });
  }

  function onPick(sel: MediaSelection) {
    const asset = sel.asset;
    setPickerOpen(false);
    if (!asset) return;
    patchActive({ background: { assetId: asset.id, fit: "cover" } });
  }

  // Klik aset di rail → latar slide aktif
  function pickFromRail(assetId: string) {
    patchActive({ background: { assetId, fit: "cover" } });
    setIsSwapping(false);
    toast.success("Latar slide diperbarui.");
  }

  // Typography overlay synchronization (per slide)
  const titleText = activeConfig.titleText;
  const highlightText = activeConfig.highlightOn ? activeConfig.highlightText.trim() : "";
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
          backgroundColor: activeConfig.highlightColor || "#00B1B0",
          color: isLightColor(activeConfig.highlightColor || "#00B1B0") ? "#171717" : "#FFFFFF",
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
    <div className="flex h-full min-h-0 flex-col gap-6 px-4 py-4 sm:px-8 xl:px-[129px] xl:pt-16 xl:pb-8">
      <StageBar
        controller={controller}
        right={
          <div className="flex items-center gap-1">
            <Button size="sm" variant="secondary" onPress={duplicateSlide} isDisabled={state.slides.length >= MAX_SLIDES}>
              <CopyIcon width={14} height={14} /> Duplikat
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={deleteSlide}
              isDisabled={state.slides.length <= 1}
              aria-label="Hapus slide"
            >
              <TrashIcon width={14} height={14} />
            </Button>
            <Button size="sm" variant="secondary" onPress={applyStyleToAll}>
              Gaya ke semua
            </Button>
          </div>
        }
      />
      <div className="flex min-h-0 flex-1 items-center justify-center" style={{ containerType: "size" }}>
        <div
          className="relative flex items-center justify-center overflow-hidden rounded-lg bg-black shadow-lg"
          style={{ ...fitFrame(state.ratio), containerType: "inline-size" }}
        >
          {active && (
            <SlideCanvas
              slide={{
                ...active,
                // Hilangkan layer teks template/nama frame agar tidak bertumpuk di bawah text overlay
                layers: active.layers.filter((l) => l.type !== "text"),
              }}
              ratio={state.ratio}
              assetUrls={assetUrls}
              selectedId={selectedLayerId}
              onSelect={setSelectedLayerId}
              fitMode={activeConfig.fitMode}
              onPatchLayer={(id, patch) =>
                mutate((slides) => slides.map((s) => (s.id === active.id ? patchLayer(s, id, patch) : s)))
              }
            />
          )}

          {/* Overlay konfigurasi media (Figma node 344:7334) */}
          {activeConfig.overlay === "gradient" && (
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          )}
          {activeConfig.overlay === "blur" && (
            <div className="pointer-events-none absolute inset-0 z-10 bg-black/40 backdrop-blur-xs" />
          )}
          {activeConfig.overlay === "vignette" && (
            <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.85)_100%)]" />
          )}

          {/* Typography structured overlay (Figma Carousel node 391:21229) */}
          {titleText || extraHighlight || (activeConfig.descOn && activeConfig.descText) ? (
            <div className={cn("pointer-events-none absolute inset-0 z-10 flex flex-col", placedClass(activeConfig.textPlacement))}>
              <div className={cn("w-full px-[7cqw] pb-[4cqw]", alignClass(activeConfig.alignment))}>
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
                        backgroundColor: activeConfig.highlightColor || "#00B1B0",
                        color: isLightColor(activeConfig.highlightColor || "#00B1B0") ? "#171717" : "#FFFFFF",
                      }}
                    >
                      {highlightText}
                    </span>
                  </p>
                ) : null}
                {activeConfig.descOn && activeConfig.descText ? (
                  <p className="mt-[1.5cqw] text-[clamp(11px,3.8cqw,18px)] leading-[1.3] text-zinc-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                    {activeConfig.descText}
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

  // ── Timeline (strip slide + DnD sesuai Figma 53:5460) ────────────────────
  const timeline = (
    <TimelineBar
      zoom={ui.zoom}
      onZoom={(v) => patchUi({ zoom: v })}
      pageLabel={`Slide ${activeIndex + 1}/${state.slides.length}`}
      showBacksound={false}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={state.slides.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
          {state.slides.map((s, i) => (
            <Thumb
              key={s.id}
              id={s.id}
              index={i}
              active={s.id === active.id}
              url={s.background ? assetUrls[s.background.assetId] ?? s.background.src ?? null : null}
              onClick={() => {
                setActiveId(s.id);
                setSelectedLayerId(null);
              }}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={addSlide}
        className="ml-1 flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-[4px] border border-dashed border-zinc-300 text-zinc-500 transition-colors hover:border-[#1A55D8] hover:text-[#1A55D8] dark:border-zinc-700 dark:text-zinc-400"
        aria-label="Tambah slide"
      >
        <PlusIcon width={20} height={20} />
      </button>
    </TimelineBar>
  );

  // ── Panel Properties (Figma node 344:7334 & 391:21229) ──────────────────────
  const panel = (
    <>
      <OrientationSection
        ratio={state.ratio}
        onRatio={(r) => controller.setState((s) => (s.type === "carousel" ? { ...s, ratio: r } : s))}
      />
      <TypographySection
        ui={slideUi}
        patchUi={patchSlideUi}
        titleText={activeConfig.titleText}
        onTitleText={(v) => patchActiveConfig({ titleText: v })}
        showHighlightColor={true}
      />
      <MediaConfigSection
        ui={slideUi}
        patchUi={patchSlideUi}
        durationSec={activeConfig.durationSec}
        onDuration={(v) => patchActiveConfig({ durationSec: v })}
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

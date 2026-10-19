"use client";

import { useState } from "react";
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
import { GlassCard, SectionHeader } from "@/components/ui/primitives";
import { CopyIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { SlideCanvas } from "./canvas/slide-canvas";
import { SlideControls } from "./inspector/slide-controls";
import { LayerInspector } from "./inspector/layer-inspector";
import { LayersPanel } from "./layers-panel";
import { addLayer, newImageLayer, newTextLayer, patchLayer, removeLayer, uid } from "./layer-utils";
import { RATIOS } from "./canvas/dims";
import { MediaSourcePicker, type MediaSelection } from "@/components/media/media-source-picker";
import type { EditorController } from "./use-editor-state";
import type { CarouselEditorState, LayerPatch, SlideObject, TextLayer } from "@/types";

const MAX_SLIDES = 10;
const STYLE_KEYS: (keyof TextLayer)[] = ["fontFamily", "fontSize", "color", "align", "shadow"];

function Thumb({
  id,
  index,
  active,
  url,
  text,
  onClick,
}: {
  id: string;
  index: number;
  active: boolean;
  url: string | null;
  text: string;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`shrink-0 ${active ? "rounded-xl ring-2 ring-zinc-900 dark:ring-white" : ""}`}
      {...attributes}
      {...listeners}
    >
      <button type="button" onClick={onClick} className="relative block h-24 w-16 overflow-hidden rounded-xl border border-zinc-200/60 dark:border-white/10">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={`Slide ${index + 1}`} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-800">{index + 1}</span>
        )}
        {text ? <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1 py-0.5 text-[10px] text-white">{text}</span> : null}
      </button>
    </div>
  );
}

export function CarouselEditor({
  controller,
  assetUrls,
}: {
  controller: EditorController;
  assetUrls: Record<string, string>;
}) {
  const state = controller.state as CarouselEditorState;
  const [activeId, setActiveId] = useState<string>(state.slides[0]?.id ?? "");
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [picker, setPicker] = useState<null | "background" | "layer">(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const active = state.slides.find((s) => s.id === activeId) ?? state.slides[0];
  const selected = active?.layers.find((l) => l.id === selectedLayerId) ?? null;

  function mutate(fn: (slides: SlideObject[]) => SlideObject[]) {
    controller.setState((s) => (s.type === "carousel" ? { ...s, slides: fn(s.slides) } : s));
  }

  function patchActive(patch: Partial<SlideObject>) {
    mutate((slides) => slides.map((s) => (s.id === active.id ? { ...s, ...patch } : s)));
  }

  function withActiveLayer(id: string, patch: LayerPatch) {
    mutate((slides) => slides.map((s) => (s.id === active.id ? patchLayer(s, id, patch) : s)));
  }

  function addSlide() {
    if (state.slides.length >= MAX_SLIDES) {
      toast.warning(`Maksimal ${MAX_SLIDES} slide.`);
      return;
    }
    const slide: SlideObject = { id: uid("slide"), background: null, background_color: "#111318", layers: [], filters: { brightness: 0, contrast: 0, saturation: 0 }, rotation: 0, scale: 1 };
    mutate((slides) => [...slides, slide]);
    setActiveId(slide.id);
    setSelectedLayerId(null);
  }

  function duplicateSlide() {
    if (state.slides.length >= MAX_SLIDES) {
      toast.warning(`Maksimal ${MAX_SLIDES} slide.`);
      return;
    }
    const copy: SlideObject = { ...structuredClone(active), id: uid("slide"), layers: active.layers.map((l) => ({ ...l, id: uid(l.type) })) };
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
    const source = active.layers.find((l): l is TextLayer => l.type === "text");
    if (!source) {
      toast.warning("Tidak ada layer teks pada slide ini.");
      return;
    }
    const style: Partial<TextLayer> = {};
    for (const k of STYLE_KEYS) (style as Record<string, unknown>)[k] = source[k];
    mutate((slides) =>
      slides.map((s) => ({
        ...s,
        layers: s.layers.map((l) => (l.type === "text" ? { ...l, ...style } : l)),
      })),
    );
    toast.success("Gaya teks diterapkan ke semua slide.");
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
    const mode = picker;
    setPicker(null);
    if (!asset) return;
    if (mode === "background") {
      patchActive({ background: { assetId: asset.id, fit: "cover" } });
    } else {
      const layer = newImageLayer(asset.id, asset.fileUrl, state.ratio);
      mutate((slides) => slides.map((s) => (s.id === active.id ? addLayer(s, layer) : s)));
      setSelectedLayerId(layer.id);
    }
  }

  return (
    <>
      <GlassCard className="p-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={state.slides.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {state.slides.map((s, i) => (
                <Thumb
                  key={s.id}
                  id={s.id}
                  index={i}
                  active={s.id === active.id}
                  url={s.background ? assetUrls[s.background.assetId] ?? s.background.src ?? null : null}
                  text={s.layers.find((l): l is TextLayer => l.type === "text")?.text ?? ""}
                  onClick={() => {
                    setActiveId(s.id);
                    setSelectedLayerId(null);
                  }}
                />
              ))}
              <Button variant="secondary" size="sm" onPress={addSlide} aria-label="Tambah slide">
                <PlusIcon width={16} height={16} />
              </Button>
            </div>
          </SortableContext>
        </DndContext>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{state.slides.length} slide</span>
          <Button variant="ghost" size="sm" onPress={duplicateSlide}>
            <CopyIcon width={14} height={14} /> Duplikat
          </Button>
          <Button variant="ghost" size="sm" onPress={deleteSlide}>
            <TrashIcon width={14} height={14} /> Hapus slide
          </Button>
          <Button variant="ghost" size="sm" onPress={applyStyleToAll}>
            Terapkan gaya ke semua
          </Button>
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <GlassCard className="flex items-center justify-center p-4">
          <div className="w-full max-w-[520px]">
            {active && (
              <SlideCanvas
                slide={active}
                ratio={state.ratio}
                assetUrls={assetUrls}
                selectedId={selectedLayerId}
                onSelect={setSelectedLayerId}
                onPatchLayer={(id, patch) => withActiveLayer(id, patch)}
              />
            )}
          </div>
        </GlassCard>

        <div className="space-y-4" id="editor-controls">
          <GlassCard>
            <SectionHeader title="Carousel" description="Rasio berlaku untuk semua slide." />
            <label className="mt-3 block text-xs text-zinc-600 dark:text-zinc-300">
              <span>Rasio</span>
              <select
                value={state.ratio}
                onChange={(e) => controller.setState((s) => (s.type === "carousel" ? { ...s, ratio: e.target.value as CarouselEditorState["ratio"] } : s))}
                className="mt-1 w-full rounded-lg border border-zinc-200/70 bg-white/80 px-2 py-1 text-sm dark:border-white/10 dark:bg-zinc-900/70"
              >
                {RATIOS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
          </GlassCard>

          {active && (
            <GlassCard>
              <SectionHeader title="Slide aktif" description="Latar dan filter." />
              <div className="mt-3">
                <SlideControls
                  slide={active}
                  ratio={state.ratio}
                  showRatio={false}
                  onPatchSlide={patchActive}
                  onPatchFilters={(f) => patchActive({ filters: f })}
                  onSwapBackground={() => setPicker("background")}
                  onRemoveBackground={() => patchActive({ background: null })}
                />
              </div>
            </GlassCard>
          )}

          {active && (
            <GlassCard>
              <SectionHeader title="Layer" />
              <div className="mt-3">
                <LayersPanel
                  slide={active}
                  selectedId={selectedLayerId}
                  onSelect={setSelectedLayerId}
                  onAddText={() => {
                    const l = newTextLayer(state.ratio);
                    mutate((slides) => slides.map((s) => (s.id === active.id ? addLayer(s, l) : s)));
                    setSelectedLayerId(l.id);
                  }}
                  onAddImage={() => setPicker("layer")}
                  onDuplicate={(id) => {
                    const layer = active.layers.find((l) => l.id === id);
                    if (!layer) return;
                    const copy = { ...layer, id: uid(layer.type), x: layer.x + 24, y: layer.y + 24 };
                    mutate((slides) => slides.map((s) => (s.id === active.id ? addLayer(s, copy) : s)));
                  }}
                  onRemove={(id) => {
                    mutate((slides) => slides.map((s) => (s.id === active.id ? removeLayer(s, id) : s)));
                    setSelectedLayerId(null);
                  }}
                  onMove={(id, dir) =>
                    mutate((slides) =>
                      slides.map((s) => {
                        if (s.id !== active.id) return s;
                        const layers = [...s.layers];
                        const i = layers.findIndex((l) => l.id === id);
                        const j = i + dir;
                        if (i < 0 || j < 0 || j >= layers.length) return s;
                        [layers[i], layers[j]] = [layers[j], layers[i]];
                        return { ...s, layers };
                      }),
                    )
                  }
                />
              </div>
            </GlassCard>
          )}

          {selected ? (
            <GlassCard>
              <LayerInspector
                layer={selected}
                onPatch={(patch) => withActiveLayer(selected.id, patch)}
                onDelete={() => {
                  mutate((slides) => slides.map((s) => (s.id === active.id ? removeLayer(s, selected.id) : s)));
                  setSelectedLayerId(null);
                }}
                onReplaceImage={() => setPicker("layer")}
              />
            </GlassCard>
          ) : (
            <p className="px-1 text-xs text-zinc-500 dark:text-zinc-400">Pilih layer untuk mengedit propertinya.</p>
          )}
        </div>
      </div>

      <MediaSourcePicker open={picker !== null} onClose={() => setPicker(null)} type="image" onSelect={onPick} />
    </>
  );
}

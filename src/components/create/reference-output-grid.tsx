"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { GenerationDTO } from "@/types";
import type { ImageTemplate } from "../../../config/templates";
import { templateToGeneration } from "../../../config/templates";
import { DetailModal } from "./detail-modal";

const SLOT_COUNT = 8;

type Slot =
  | { kind: "generation"; item: GenerationDTO }
  | { kind: "template"; template: ImageTemplate };

function slotImage(slot: Slot): string {
  if (slot.kind === "generation") return (slot.item.thumbnailUrl ?? slot.item.fileUrl) as string;
  return slot.template.imageUrl;
}

function slotTitle(slot: Slot): string {
  return slot.kind === "generation" ? slot.item.prompt : slot.template.title;
}

function slotAuthor(slot: Slot): string {
  return slot.kind === "generation" ? (slot.item.owner?.name ?? "Tanpa nama") : slot.template.author;
}

function buildSlots(generations: GenerationDTO[], templates: ImageTemplate[]): Slot[] {
  const gen: Slot[] = generations
    .filter((item) => item.status === "completed" && (item.thumbnailUrl || item.fileUrl))
    .slice(0, SLOT_COUNT)
    .map((item) => ({ kind: "generation", item }));
  const tpl: Slot[] = templates
    .slice(0, Math.max(0, SLOT_COUNT - gen.length))
    .map((template) => ({ kind: "template", template }));
  return [...gen, ...tpl].slice(0, SLOT_COUNT);
}

/**
 * Mosaic "Referensi Output" (Figma node 776:23662).
 *
 * Delapan slot: 1 feature tile (lebar) + grid 2×2 di sampingnya, lalu di baris
 * bawah 2 tile kecil + 1 wide tile. Isi utama dari hasil generasi image; jika
 * belum ada, diisi template referensi.
 */
export function ReferenceOutputGrid({
  generations,
  templates,
  onOpenGeneration,
}: {
  generations: GenerationDTO[];
  templates: ImageTemplate[];
  onOpenGeneration?: (item: GenerationDTO) => void;
}) {
  const slots = buildSlots(generations, templates);
  const [selectedTemplate, setSelectedTemplate] = useState<ImageTemplate | null>(null);

  const [feature, ...rest] = slots;
  const compact = rest.slice(0, 4);
  const [smallA, smallB, wide] = rest.slice(4);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
      {feature ? (
        <MosaicTile
          slot={feature}
          className="aspect-[4/5] sm:col-span-2 lg:col-span-7 lg:row-span-2 lg:aspect-auto"
          priority
          onOpen={() => openSlot(feature)}
        />
      ) : null}

      {compact.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-5 lg:row-span-2">
          {compact.map((slot, index) => (
            <MosaicTile key={index} slot={slot} className="aspect-square" onOpen={() => openSlot(slot)} />
          ))}
        </div>
      ) : null}

      {smallA ? (
        <MosaicTile slot={smallA} className="aspect-[4/5] lg:col-span-3" onOpen={() => openSlot(smallA)} />
      ) : null}
      {smallB ? (
        <MosaicTile slot={smallB} className="aspect-[4/5] lg:col-span-3" onOpen={() => openSlot(smallB)} />
      ) : null}
      {wide ? (
        <MosaicTile slot={wide} className="aspect-[16/9] sm:col-span-2 lg:col-span-6" onOpen={() => openSlot(wide)} />
      ) : null}

      {selectedTemplate ? (
        <DetailModal
          item={templateToGeneration(selectedTemplate)}
          fetchDetail={false}
          downloadUrl={selectedTemplate.imageUrl}
          onClose={() => setSelectedTemplate(null)}
          onSimilar={() => setSelectedTemplate(null)}
          onDeleted={() => setSelectedTemplate(null)}
        />
      ) : null}
    </div>
  );

  function openSlot(slot: Slot) {
    if (slot.kind === "generation") onOpenGeneration?.(slot.item);
    else setSelectedTemplate(slot.template);
  }
}

function MosaicTile({
  slot,
  className,
  onOpen,
  priority = false,
}: {
  slot: Slot;
  className?: string;
  onOpen: () => void;
  priority?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Buka referensi: ${slotTitle(slot).slice(0, 120)}`}
      className={cn(
        "group relative block w-full overflow-hidden rounded-xl bg-zinc-100 text-left transition-shadow hover:shadow-lg hover:shadow-zinc-900/10 dark:bg-zinc-800",
        className,
      )}
    >
      <Image
        src={slotImage(slot)}
        alt={slotTitle(slot).slice(0, 120)}
        fill
        unoptimized
        priority={priority}
        sizes="(max-width:768px) 100vw, 320px"
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 block bg-gradient-to-t from-black/70 to-transparent p-2 pt-6 text-[11px] font-medium text-white">
        <span className="line-clamp-1">{slotTitle(slot)}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-white/85">
          <span className="flex size-4 items-center justify-center rounded-full bg-black/55 text-[8px] font-semibold">
            {slotAuthor(slot).slice(0, 1).toUpperCase()}
          </span>
          <span className="truncate">{slotAuthor(slot)}</span>
        </span>
      </span>
    </button>
  );
}

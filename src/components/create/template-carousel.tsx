"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/primitives";
import type { GenerationDTO } from "@/types";
import { IMAGE_TEMPLATES, templateToGeneration } from "../../../config/templates";
import { DetailModal } from "./detail-modal";
import { OwnerBadge } from "./tiles";

const GAP = 12;

const CARDS = IMAGE_TEMPLATES.map((template) => ({ template, item: templateToGeneration(template) }));

function visibleCount(): number {
  if (window.innerWidth >= 1024) return 5.5;
  if (window.innerWidth >= 768) return 3.5;
  return 2.5;
}

const ARROW_CLASS =
  "absolute top-1/2 z-10 -translate-y-1/2 rounded-full border border-zinc-900/10 bg-white/90 p-2 text-zinc-700 shadow-sm backdrop-blur transition hover:bg-white disabled:pointer-events-none disabled:opacity-40 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800";

export function TemplateCarousel({ onApply }: { onApply: (item: GenerationDTO) => void }) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [visible, setVisible] = useState(5.5);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<GenerationDTO | null>(null);
  const [imagesReady, setImagesReady] = useState(false);

  const updateLayout = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);
    setVisible(visibleCount());
  }, []);

  useEffect(() => {
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, [updateLayout]);

  useEffect(() => {
    let cancelled = false;
    let pending = CARDS.length;
    const settle = () => {
      if (cancelled || pending > 0) return;
      setImagesReady(true);
    };
    const timer = window.setTimeout(() => {
      if (!cancelled) setImagesReady(true);
    }, 5000);
    CARDS.forEach(({ template }) => {
      const img = new window.Image();
      img.onload = img.onerror = () => {
        pending -= 1;
        settle();
      };
      img.src = template.imageUrl;
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const ready = imagesReady && containerWidth > 0;

  const card = Math.max(
    56,
    Math.floor((containerWidth - GAP * Math.floor(visible)) / Math.max(visible, 1)),
  );
  const contentWidth = CARDS.length * card + (CARDS.length - 1) * GAP;
  const maxOffset = Math.max(0, contentWidth - containerWidth);
  const offset = page === 0 ? 0 : maxOffset;
  const totalPages = maxOffset > 0 ? 2 : 1;

  function go(delta: number) {
    setPage((current) => Math.min(totalPages - 1, Math.max(0, current + delta)));
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Referensi Output"
        description="Pilih referensi untuk melihat detail dan menggunakannya sebagai inspirasi."
      />
      <div className="relative">
        <div ref={viewportRef} className="overflow-hidden">
          {!ready ? (
            <div className="flex" style={{ gap: GAP }}>
              {Array.from({ length: Math.max(3, Math.ceil(visible)) }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="skeleton skeleton--shimmer aspect-[3/4] min-w-0 flex-1 rounded-2xl"
                />
              ))}
            </div>
          ) : (
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${offset}px)`, gap: GAP }}
            >
              {CARDS.map(({ template, item }, index) => (
                <button
                  key={`${page}-${template.id}`}
                  type="button"
                  onClick={() => setSelected(item)}
                  aria-label={`Buka detail template: ${template.title}`}
                  className="card-in group relative block shrink-0 overflow-hidden rounded-2xl bg-zinc-100 text-left transition-shadow hover:shadow-lg hover:shadow-zinc-900/10 dark:bg-zinc-800"
                  style={{ width: card, animationDelay: `${Math.min(index, 6) * 40}ms` }}
                >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={template.imageUrl}
                  alt={template.title}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
                />
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                  Template
                </span>
                <span className="pointer-events-none absolute inset-x-0 bottom-0 block bg-gradient-to-t from-black/70 to-transparent p-2 pt-6 text-[11px] font-medium text-white">
                  <OwnerBadge item={item} />
                </span>
                </button>
              ))}
            </div>
          )}
        </div>
        {totalPages > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={page === 0}
              aria-label="Slide sebelumnya"
              className={cn(ARROW_CLASS, "left-2")}
            >
              <ChevronLeftIcon width={16} height={16} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={page === totalPages - 1}
              aria-label="Slide berikutnya"
              className={cn(ARROW_CLASS, "right-2")}
            >
              <ChevronRightIcon width={16} height={16} />
            </button>
            <div className="mt-1 flex justify-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setPage(index)}
                  aria-label={`Slide ${index + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    index === page
                      ? "w-4 bg-zinc-900 dark:bg-white"
                      : "w-1.5 bg-zinc-300 dark:bg-zinc-600",
                  )}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <DetailModal
        item={selected}
        fetchDetail={false}
        downloadUrl={selected?.fileUrl ?? null}
        onClose={() => setSelected(null)}
        onSimilar={(item) => {
          setSelected(null);
          onApply(item);
        }}
        onDeleted={() => {}}
      />
    </div>
  );
}

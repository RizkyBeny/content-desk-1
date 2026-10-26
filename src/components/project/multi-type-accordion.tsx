"use client";

import { useState } from "react";
import { Button, Chip } from "@heroui/react";
import { BriefEditor } from "./brief-editor";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ImageIcon,
  LayersIcon,
  LockIcon,
  SparkIcon,
  VideoIcon,
} from "@/components/ui/icons";
import type { MultiTypeConfig } from "./multi-type-config-modal";
import type { BriefDTO, ContentType } from "@/types";

export interface MultiTypeAccordionProps {
  projectId: string;
  types: ContentType[];
  initialBriefs?: Partial<Record<ContentType, BriefDTO | null>>;
  config?: MultiTypeConfig | null;
  onAllCompleted?: () => void;
  onPreviewVideo?: (brief: BriefDTO) => void;
}

const TYPE_METADATA: Record<
  ContentType,
  { title: string; subtitle: string; icon: typeof VideoIcon }
> = {
  image: {
    title: "Single Image Mode",
    subtitle: "Brief visual 1 frame utama untuk konten gambar statis",
    icon: ImageIcon,
  },
  carousel: {
    title: "Multiple Image (Carousel) Mode",
    subtitle: "Rangkaian slide visual untuk storytelling carousel",
    icon: LayersIcon,
  },
  video: {
    title: "Storyboard Video Mode",
    subtitle: "Alur scene, durasi, dan voiceover terstruktur",
    icon: VideoIcon,
  },
  audio: {
    title: "Audio Podcast / Voiceover Mode",
    subtitle: "Segmen audio dan naskah suara",
    icon: LayersIcon,
  },
  article: {
    title: "Artikel & Longform Mode",
    subtitle: "Poin-poin narasi tulisan mendalam",
    icon: LayersIcon,
  },
};

export function MultiTypeAccordion({
  projectId,
  types = ["image", "carousel", "video"],
  initialBriefs = {},
  config,
  onAllCompleted,
  onPreviewVideo,
}: MultiTypeAccordionProps) {
  // Accordion 1 is open by default (index 0).
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [briefs, setBriefs] = useState<Partial<Record<ContentType, BriefDTO | null>>>(initialBriefs);

  function handleCompleteStep(index: number) {
    if (!completedSteps.includes(index)) {
      setCompletedSteps((prev) => [...prev, index]);
    }
    // Move to next step if available
    if (index + 1 < types.length) {
      setActiveStep(index + 1);
    } else {
      onAllCompleted?.();
    }
  }

  return (
    <div className="space-y-4">
      {types.map((type, idx) => {
        const meta = TYPE_METADATA[type] ?? {
          title: `${type.toUpperCase()} Mode`,
          subtitle: "Brief konten",
          icon: LayersIcon,
        };
        const Icon = meta.icon;
        const isCurrent = activeStep === idx;
        const isDone = completedSteps.includes(idx);
        const isLocked = idx > 0 && !completedSteps.includes(idx - 1);

        return (
          <div
            key={type}
            className={`glass-card overflow-hidden rounded-2xl border transition-all duration-300 ${
              isCurrent
                ? "border-brand/40 shadow-md ring-1 ring-brand/20 dark:border-brand/50"
                : isDone
                ? "border-zinc-200/90 dark:border-white/10"
                : "border-zinc-200/50 opacity-75 dark:border-white/5"
            }`}
          >
            {/* Header Accordion */}
            <button
              type="button"
              disabled={isLocked}
              onClick={() => {
                if (!isLocked) {
                  setActiveStep(isCurrent ? -1 : idx);
                }
              }}
              className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-zinc-50/50 dark:hover:bg-white/5"
            >
              <div className="flex items-center gap-3.5">
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                    isDone
                      ? "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                      : isCurrent
                      ? "bg-brand/15 text-brand-strong dark:bg-brand/20 dark:text-brand"
                      : "bg-zinc-100 text-zinc-400 dark:bg-white/5 dark:text-zinc-500"
                  }`}
                >
                  {isDone ? <CheckIcon width={18} height={18} /> : <Icon width={18} height={18} />}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Bagian {idx + 1} dari {types.length}
                    </span>
                    {isDone && (
                      <Chip size="sm" variant="soft" color="accent" className="text-[10px]">
                        Selesai
                      </Chip>
                    )}
                    {isLocked && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                        <LockIcon width={11} height={11} /> Terkunci
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {meta.title}
                  </h3>
                  <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {meta.subtitle}
                  </p>

                  {/* Config Badges */}
                  {config && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {type === "image" && (
                        <>
                          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300">
                            Rasio {config.image.ratio}
                          </span>
                          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300">
                            Persona: {config.image.persona}
                          </span>
                        </>
                      )}
                      {type === "carousel" && (
                        <>
                          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300">
                            Rasio {config.carousel.ratio}
                          </span>
                          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300">
                            {config.carousel.slideCount} Slide
                          </span>
                          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300">
                            Persona: {config.carousel.persona}
                          </span>
                        </>
                      )}
                      {type === "video" && (
                        <>
                          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300">
                            Rasio {config.video.ratio}
                          </span>
                          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300">
                            Persona: {config.video.persona}
                          </span>
                          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300">
                            VO: {config.video.voiceOver}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isLocked ? (
                  <span className="rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-500 dark:bg-white/5">
                    Selesaikan tahap sebelumnya
                  </span>
                ) : isCurrent ? (
                  <ChevronUpIcon width={20} height={20} className="text-zinc-500" />
                ) : (
                  <ChevronDownIcon width={20} height={20} className="text-zinc-500" />
                )}
              </div>
            </button>

            {/* Accordion Content */}
            {isCurrent && !isLocked && (
              <div className="border-t border-zinc-200/80 p-5 dark:border-white/10">
                <BriefEditor
                  projectId={projectId}
                  contentType={type}
                  brief={briefs[type] ?? null}
                  onBrief={(newBrief) => {
                    setBriefs((prev) => ({ ...prev, [type]: newBrief }));
                  }}
                  onPreviewVideo={type === "video" ? onPreviewVideo : undefined}
                  isMultiType={true}
                  singleConfig={
                    config
                      ? type === "image"
                        ? config.image
                        : type === "carousel"
                        ? config.carousel
                        : config.video
                      : undefined
                  }
                />

                <div className="mt-6 flex items-center justify-end border-t border-zinc-200/80 pt-4 dark:border-white/10">
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={() => handleCompleteStep(idx)}
                    className="gap-1.5 font-semibold shadow-sm"
                  >
                    {idx + 1 < types.length ? (
                      <>
                        Simpan & Lanjut ke {TYPE_METADATA[types[idx + 1]]?.title || "Tahap Berikutnya"}
                        <CheckIcon width={14} height={14} />
                      </>
                    ) : (
                      <>
                        <SparkIcon width={14} height={14} /> Selesaikan Semua Konten
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

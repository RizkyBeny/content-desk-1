"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const activeStepParam = searchParams.get("activeStep");
  const doneParam = searchParams.get("done");

  // Load completed steps from query params and localStorage
  const [completedSteps, setCompletedSteps] = useState<number[]>(() => {
    const doneList: string[] = [];
    if (doneParam) {
      doneParam.split(",").map((s) => s.trim()).filter(Boolean).forEach((t) => doneList.push(t));
    }
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(`done_types_${projectId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((t) => {
              if (!doneList.includes(t)) doneList.push(t);
            });
          }
        }
      } catch {}
    }

    const indices: number[] = [];
    types.forEach((t, i) => {
      if (doneList.includes(t)) indices.push(i);
    });
    return indices;
  });

  // Calculate default active step (first uncompleted step)
  const [activeStep, setActiveStep] = useState<number>(() => {
    if (activeStepParam) {
      const targetIdx = types.indexOf(activeStepParam as ContentType);
      if (targetIdx !== -1) return targetIdx;
    }
    const firstIncomplete = types.findIndex((_, idx) => !completedSteps.includes(idx));
    return firstIncomplete !== -1 ? firstIncomplete : 0;
  });

  const [briefs, setBriefs] = useState<Partial<Record<ContentType, BriefDTO | null>>>(initialBriefs);

  // Sync state if URL changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (doneParam) {
        const parts = doneParam.split(",").map((s) => s.trim()).filter(Boolean);
        const newIndices: number[] = [];
        types.forEach((t, i) => {
          if (parts.includes(t) || completedSteps.includes(i)) newIndices.push(i);
        });
        setCompletedSteps(Array.from(new Set(newIndices)));
      }
      if (activeStepParam) {
        const targetIdx = types.indexOf(activeStepParam as ContentType);
        if (targetIdx !== -1) setActiveStep(targetIdx);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [doneParam, activeStepParam, types, completedSteps]);

  function handleCompleteStep(index: number) {
    if (!completedSteps.includes(index)) {
      setCompletedSteps((prev) => [...prev, index]);
    }
    if (index + 1 < types.length) {
      setActiveStep(index + 1);
    } else {
      onAllCompleted?.();
    }
  }

  const isAllCompleted = types.length > 0 && completedSteps.length === types.length;

  return (
    <div className="space-y-4">
      {/* Celebration Banner when all steps done */}
      {isAllCompleted && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-emerald-950 sm:flex-row dark:border-emerald-400/20 dark:bg-emerald-950/40 dark:text-emerald-200">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base font-bold sm:text-lg">
              🎉 Semua Tipe Konten Selesai Diproduksi & Dipublikasikan!
            </h3>
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              Seluruh format ({types.join(", ")}) telah berhasil diselesaikan satu per satu.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem(`done_types_${projectId}`);
              } catch {}
              setCompletedSteps([]);
              setActiveStep(0);
            }}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 dark:bg-emerald-500 dark:text-zinc-900 dark:hover:bg-emerald-400"
          >
            Reset Alur Proyek
          </button>
        </div>
      )}

      {types.map((type, idx) => {
        const meta = TYPE_METADATA[type] ?? {
          title: `${type.toUpperCase()} Mode`,
          subtitle: "Brief konten",
          icon: LayersIcon,
        };
        const Icon = meta.icon;
        const isDone = completedSteps.includes(idx);
        const isCurrent = activeStep === idx && !isDone;
        const isLocked = idx > 0 && !completedSteps.includes(idx - 1);

        return (
          <div
            key={type}
            className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
              isDone
                ? "border-emerald-500/30 bg-emerald-50/40 dark:border-emerald-500/20 dark:bg-emerald-950/20"
                : isCurrent
                ? "border-zinc-300 bg-white shadow-md dark:border-white/20 dark:bg-zinc-900/90"
                : isLocked
                ? "border-zinc-200/50 bg-zinc-50/40 opacity-60 dark:border-white/5 dark:bg-zinc-900/20"
                : "border-zinc-200/80 bg-zinc-50/60 opacity-85 dark:border-white/10 dark:bg-zinc-900/40"
            }`}
          >
            {/* Header Accordion */}
            <div
              onClick={() => {
                // Permanently locked when Done, or locked if previous step is not completed
                if (!isDone && !isLocked) {
                  setActiveStep(isCurrent ? -1 : idx);
                }
              }}
              className={`flex w-full items-center justify-between p-5 text-left transition-colors ${
                isDone || isLocked ? "cursor-default" : "cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-white/5"
              }`}
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
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                        <CheckIcon width={10} height={10} /> Done · Published
                      </span>
                    ) : isLocked ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                        <LockIcon width={11} height={11} /> Terkunci (Selesaikan tahap sebelumnya)
                      </span>
                    ) : isCurrent ? (
                      <Chip size="sm" variant="soft" color="accent" className="text-[10px] font-bold">
                        Sedang Dikerjakan
                      </Chip>
                    ) : null}
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {meta.title}
                  </h3>
                  <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {meta.subtitle}
                  </p>

                  {/* Config Badges */}
                  {config && !isDone && (
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
                {isDone ? (
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Terkunci (Selesai)
                  </span>
                ) : isLocked ? (
                  <span className="rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-500 dark:bg-white/5">
                    Selesaikan tahap sebelumnya
                  </span>
                ) : isCurrent ? (
                  <ChevronUpIcon width={20} height={20} className="text-zinc-500" />
                ) : (
                  <ChevronDownIcon width={20} height={20} className="text-zinc-500" />
                )}
              </div>
            </div>

            {/* If Done: Display brief completed summary collapsed permanently */}
            {isDone ? (
              <div className="border-t border-emerald-500/20 bg-emerald-500/5 p-4 px-5 text-xs text-emerald-900 dark:border-emerald-500/10 dark:text-emerald-200">
                <p className="font-medium">
                  ✓ Konten <strong>{meta.title}</strong> telah dipublikasikan. Silakan selesaikan tahapan berikutnya di bawah.
                </p>
              </div>
            ) : (
              /* Accordion Content Active */
              isCurrent &&
              !isLocked && (
                <div className="border-t border-zinc-200/80 p-5 dark:border-white/10">
                  <div className="mb-4 rounded-xl border border-blue-500/20 bg-blue-50/50 p-3 text-xs text-blue-900 dark:border-blue-400/20 dark:bg-blue-950/20 dark:text-blue-200">
                    💡 <strong>Alur 1-per-1:</strong> Buka editor melalui tombol <strong>&quot;Buka di Editor&quot;</strong>, selesaikan penyesuaian, lalu tekan <strong>&quot;Publish Content&quot;</strong> di Canvas Editor untuk otomatis kembali dan mengaktifkan format berikutnya!
                  </div>

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
                          Lanjut ke {TYPE_METADATA[types[idx + 1]]?.title || "Tahap Berikutnya"}
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
              )
            )}
          </div>
        );
      })}
    </div>
  );
}

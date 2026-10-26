"use client";

import { Chip } from "@heroui/react";
import { GlassCard } from "@/components/ui/primitives";
import { CheckIcon, ImageIcon, LayersIcon, VideoIcon } from "@/components/ui/icons";
import type { SingleMediaConfig } from "./angle-step";
import type { ContentType } from "@/types";

export interface ProjectHeaderSummaryProps {
  topicTitle: string;
  angleTitle: string;
  selectedType: ContentType;
  availableTypes?: ContentType[];
  isMultiType?: boolean;
  singleConfig?: SingleMediaConfig | null;
  onSelectType?: (type: ContentType) => void;
  className?: string;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof VideoIcon }
> = {
  image: { label: "Single Image", icon: ImageIcon },
  carousel: { label: "Multiple Image", icon: LayersIcon },
  video: { label: "Video", icon: VideoIcon },
};

export function ProjectHeaderSummary({
  topicTitle,
  angleTitle,
  selectedType,
  availableTypes = ["image", "carousel", "video"],
  isMultiType = false,
  singleConfig,
  className = "",
}: ProjectHeaderSummaryProps) {
  const effectiveConfig = singleConfig ?? {
    ratio: "9:16",
    persona: "investigatif",
    voiceOver: selectedType === "video" ? "Dalipin" : undefined,
  };

  return (
    <GlassCard className={`grid grid-cols-1 divide-y divide-zinc-200 border border-zinc-200/80 p-0 shadow-sm dark:divide-white/10 dark:border-white/10 md:grid-cols-3 md:divide-x md:divide-y-0 ${className}`}>
      {/* Box 1: Tipe Konten */}
      <div className="flex flex-col gap-2 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Tipe Konten
          </span>
          {isMultiType && (
            <Chip size="sm" variant="soft" color="accent" className="text-[10px] font-semibold">
              Multiple Type Content
            </Chip>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {isMultiType ? (
            availableTypes.map((t) => {
              const config = TYPE_CONFIG[t] ?? { label: t, icon: LayersIcon };
              const Icon = config.icon;
              return (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30"
                >
                  <CheckIcon width={12} height={12} className="text-emerald-600 dark:text-emerald-400" />
                  <Icon width={13} height={13} className="shrink-0" />
                  <span>{config.label}</span>
                </span>
              );
            })
          ) : (
            (() => {
              const config = TYPE_CONFIG[selectedType] ?? { label: selectedType, icon: LayersIcon };
              const Icon = config.icon;
              return (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand-strong ring-1 ring-brand/30 dark:bg-brand/20 dark:text-brand">
                  <Icon width={13} height={13} className="shrink-0" />
                  <span>{config.label}</span>
                </span>
              );
            })()
          )}

          {!isMultiType && effectiveConfig && (
            <>
              <span className="rounded-md border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300">
                Rasio {effectiveConfig.ratio}
              </span>
              <span className="rounded-md border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium capitalize text-zinc-600 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300">
                {effectiveConfig.persona}
              </span>
              {effectiveConfig.voiceOver && (
                <span className="rounded-md border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300">
                  VO: {effectiveConfig.voiceOver}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Box 2: Topik */}
      <div className="flex flex-col gap-2 p-4 sm:p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Topik
        </span>
        <p className="line-clamp-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100" title={topicTitle}>
          {topicTitle || "Topik Tanpa Judul"}
        </p>
      </div>

      {/* Box 3: Angle */}
      <div className="flex flex-col gap-2 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Angle
          </span>
          <Chip size="sm" variant="soft" color="accent" className="text-[11px] font-medium">
            Dipilih
          </Chip>
        </div>
        <p className="line-clamp-2 text-sm font-semibold text-brand-strong dark:text-brand" title={angleTitle}>
          {angleTitle || "Belum ada angle terpilih"}
        </p>
      </div>
    </GlassCard>
  );
}

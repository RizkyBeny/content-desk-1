"use client";

import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "@/components/ui/icons";
import { TOPIC_CHIPS, type TopicChip } from "../../../config/generation";

const BADGE_TONE: Record<string, string> = {
  Panas: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  Baru: "bg-brand/10 text-brand-strong dark:text-brand",
  Hot: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

/**
 * Baris "Skill Chips" topik pada halaman Create Image & Create Video.
 * Data statis dari config; klik chip mengisi prompt composer.
 */
export function TopicChips({
  chips = TOPIC_CHIPS,
  onSelect,
}: {
  chips?: TopicChip[];
  onSelect?: (label: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Topik yang sedang tren"
      className="mx-auto flex w-full max-w-[760px] flex-wrap items-center justify-center gap-2"
    >
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onSelect?.(chip.label.replace(/^\/\s*/, ""))}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/70 bg-white/70 px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-900/5 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
        >
          <span>{chip.label}</span>
          {chip.badge ? (
            <span className={cn("rounded-full px-1.5 py-px text-[10px] font-semibold", BADGE_TONE[chip.badge])}>
              {chip.badge}
            </span>
          ) : null}
        </button>
      ))}
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-full border border-zinc-200/70 bg-white/70 px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-900/5 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
      >
        Lebih banyak topik
        <ChevronRightIcon width={12} height={12} />
      </button>
    </div>
  );
}

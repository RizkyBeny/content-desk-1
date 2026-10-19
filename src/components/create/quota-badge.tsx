"use client";

import { cn } from "@/lib/utils";
import { ClockIcon } from "@/components/ui/icons";
import type { QuotaDTO } from "@/types";

/** "Sisa 12/20 hari ini" + jam reset WIB (FR-CMP-5). */
export function QuotaBadge({ quota, className }: { quota: QuotaDTO | null; className?: string }) {
  if (!quota) return null;

  const ratio = quota.limit > 0 ? quota.remaining / quota.limit : 0;
  const tone =
    quota.remaining <= 0
      ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
      : ratio <= 0.2
        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";

  const resetTime = new Date(quota.resetAt).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        tone,
        className,
      )}
      title={`Kuota harian diperbarui pukul 00.00 WIB (${resetTime} WIB)`}
    >
      <ClockIcon width={14} height={14} />
      Sisa {quota.remaining}/{quota.limit} hari ini
    </span>
  );
}

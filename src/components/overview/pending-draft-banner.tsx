"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { FileTextIcon, XIcon } from "@/components/ui/icons";

interface PendingDraftBannerProps {
  onDismiss?: () => void;
}

export function PendingDraftBanner({ onDismiss }: PendingDraftBannerProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  function handleDismiss() {
    setVisible(false);
    onDismiss?.();
  }

  function handleContinue() {
    router.push("/ai-studio/brief");
  }

  function handleStartNew() {
    router.push("/ai-studio/image");
  }

  return (
    <div
      role="region"
      aria-label="Pemberitahuan draft tertunda"
      className="relative flex flex-col items-start justify-between gap-3.5 rounded-xl border border-brand/20 bg-brand/10 p-3 sm:flex-row sm:items-center dark:border-brand/30 dark:bg-brand/15"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand-strong dark:bg-brand/30 dark:text-brand">
          <FileTextIcon width={18} height={18} />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
            Kamu punya draft yang belum selesai
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Terakhir diedit hari ini, pukul 19.30</p>
        </div>
      </div>

      <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
        <Button
          size="sm"
          variant="primary"
          onPress={handleContinue}
          className="h-8 rounded-lg px-3 text-xs font-semibold"
        >
          Lanjutkan draft
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onPress={handleStartNew}
          className="h-8 rounded-lg px-3 text-xs font-medium"
        >
          Mulai Baru
        </Button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Tutup pemberitahuan"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-900/10 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <XIcon width={16} height={16} />
        </button>
      </div>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { Button, EmptyState, Skeleton, Spinner } from "@heroui/react";
import { AlertIcon, InboxIcon, RefreshIcon } from "./icons";

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-busy="true" aria-label="Memuat">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function SpinnerBlock({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-zinc-500 dark:text-zinc-400">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({
  message = "Gagal memuat data.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState className="glass-card flex flex-col items-center gap-3 p-8 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
        <AlertIcon />
      </span>
      <p className="text-sm font-medium">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onPress={onRetry}>
          <RefreshIcon width={16} height={16} /> Coba lagi
        </Button>
      ) : null}
    </EmptyState>
  );
}

export function EmptyBlock({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <EmptyState className="glass-card flex flex-col items-center gap-3 p-8 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        {icon ?? <InboxIcon />}
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {description ? (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        ) : null}
      </div>
      {action}
    </EmptyState>
  );
}

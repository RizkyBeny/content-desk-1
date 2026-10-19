"use client";

import Link from "next/link";
import { Button, Chip } from "@heroui/react";
import { ChevronLeftIcon, DownloadIcon, RedoIcon, SaveIcon, UndoIcon } from "@/components/ui/icons";
import type { SaveStatus } from "./use-editor-state";

const STATUS: Record<SaveStatus, { label: string; color: "default" | "warning" | "success" | "danger" }> = {
  idle: { label: "Tersimpan", color: "default" },
  saving: { label: "Menyimpan…", color: "warning" },
  saved: { label: "Tersimpan", color: "success" },
  error: { label: "Gagal menyimpan", color: "danger" },
  conflict: { label: "Konflik", color: "danger" },
};

export function EditorToolbar({
  title,
  status,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onExport,
  onTogglePanel,
  backHref = "/studio",
}: {
  title: string;
  status: SaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExport: () => void;
  onTogglePanel: () => void;
  backHref?: string;
}) {
  const s = STATUS[status];
  return (
    <div className="glass-card flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="flex min-w-0 items-center gap-2">
        <Link href={backHref} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white" aria-label="Kembali">
          <ChevronLeftIcon />
        </Link>
        <p className="truncate text-sm font-semibold">{title}</p>
        <Chip size="sm" color={s.color} variant="soft">{s.label}</Chip>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" isDisabled={!canUndo} onPress={onUndo} aria-label="Undo">
          <UndoIcon width={16} height={16} />
        </Button>
        <Button variant="secondary" size="sm" isDisabled={!canRedo} onPress={onRedo} aria-label="Redo">
          <RedoIcon width={16} height={16} />
        </Button>
        <Button variant="secondary" size="sm" onPress={onSave}>
          <SaveIcon width={16} height={16} /> Simpan
        </Button>
        <Button variant="ghost" size="sm" className="lg:hidden" onPress={onTogglePanel}>
          Properti
        </Button>
        <Button variant="primary" size="sm" onPress={onExport}>
          <DownloadIcon width={16} height={16} /> Ekspor
        </Button>
      </div>
    </div>
  );
}

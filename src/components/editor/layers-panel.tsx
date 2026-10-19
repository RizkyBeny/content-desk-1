"use client";

import { Button } from "@heroui/react";
import { CopyIcon, ImageIcon, TextIcon, TrashIcon } from "@/components/ui/icons";
import type { SlideObject } from "@/types";

export function LayersPanel({
  slide,
  selectedId,
  onSelect,
  onAddText,
  onAddImage,
  onDuplicate,
  onRemove,
  onMove,
}: {
  slide: SlideObject;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddText: () => void;
  onAddImage: () => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  const ordered = [...slide.layers].reverse();
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onPress={onAddText}>
          <TextIcon width={16} height={16} /> Teks
        </Button>
        <Button variant="secondary" size="sm" onPress={onAddImage}>
          <ImageIcon width={16} height={16} /> Gambar
        </Button>
      </div>
      {slide.layers.length === 0 && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Belum ada layer. Tambahkan teks atau gambar.</p>
      )}
      <ul className="space-y-1">
        {ordered.map((l) => (
          <li
            key={l.id}
            className={`flex items-center justify-between gap-1 rounded-lg border px-2 py-1 text-xs ${
              selectedId === l.id
                ? "border-zinc-900/60 bg-zinc-900/5 dark:border-white/40 dark:bg-white/5"
                : "border-zinc-200/60 dark:border-white/10"
            }`}
          >
            <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => onSelect(l.id)}>
              {l.type === "text" ? <TextIcon width={14} height={14} /> : <ImageIcon width={14} height={14} />}
              <span className="truncate">{l.type === "text" ? l.text || "(teks kosong)" : "Gambar"}</span>
            </button>
            <button type="button" onClick={() => onMove(l.id, 1)} aria-label="Naikkan" className="px-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white">↑</button>
            <button type="button" onClick={() => onMove(l.id, -1)} aria-label="Turunkan" className="px-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white">↓</button>
            <button type="button" onClick={() => onDuplicate(l.id)} aria-label="Duplikat" className="px-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
              <CopyIcon width={13} height={13} />
            </button>
            <button type="button" onClick={() => onRemove(l.id)} aria-label="Hapus" className="px-1 text-zinc-400 hover:text-red-500">
              <TrashIcon width={13} height={13} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { Button } from "@heroui/react";
import { cn } from "@/lib/utils";
import { ImageIcon, PlusIcon, SendIcon, XIcon } from "@/components/ui/icons";
import type { ComposerAttachment } from "./composer";

const MIN_LINES = 3;
const MAX_LINES = 8;

/**
 * Kartu composer Create Image (Figma node 776:23662).
 *
 * Struktur mengikuti desain: textarea di atas, lalu toolbar bawah berisi
 * tombol "Lampirkan referensi" (kiri) dan hint + tombol kirim bulat (kanan).
 * `children` menampung baris chip konfigurasi (rasio/kualitas/dimensi) yang
 * dirender di dalam kartu, di bawah toolbar.
 */
export function ComposerCard({
  value,
  onChange,
  onSubmit,
  maxLength,
  placeholder,
  busy = false,
  exhausted = false,
  attachAccept,
  attachment,
  onAttachFile,
  onRemoveAttachment,
  onAttachmentModeChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  maxLength: number;
  placeholder: string;
  busy?: boolean;
  exhausted?: boolean;
  attachAccept?: string;
  attachment?: ComposerAttachment | null;
  onAttachFile?: (file: File) => void;
  onRemoveAttachment?: () => void;
  onAttachmentModeChange?: (mode: "edit" | "reference") => void;
  children?: ReactNode;
}) {
  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const attachInputRef = useRef<HTMLInputElement | null>(null);
  const [rejected, setRejected] = useState(false);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const lineHeight = 24;
    area.style.height = "auto";
    const next = Math.min(
      Math.max(area.scrollHeight, lineHeight * MIN_LINES),
      lineHeight * MAX_LINES,
    );
    area.style.height = `${next}px`;
    area.style.overflowY = area.scrollHeight > next ? "auto" : "hidden";
  }, [value]);

  const trimmed = value.trim();
  const canSubmit = trimmed.length >= 3 && !busy && !exhausted;
  const canAttach = Boolean(attachAccept && onAttachFile);

  function reject() {
    setRejected(true);
    window.setTimeout(() => setRejected(false), 600);
  }

  function trySubmit() {
    if (trimmed.length < 3 || busy) {
      if (trimmed.length < 3) reject();
      return;
    }
    onSubmit();
  }

  return (
    <section className="mx-auto w-full max-w-[760px]">
      <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4">
        <label htmlFor="image-composer-input" className="sr-only">
          Prompt gambar
        </label>
        <textarea
          id="image-composer-input"
          ref={areaRef}
          value={value}
          rows={MIN_LINES}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey) return;
            event.preventDefault();
            trySubmit();
          }}
          className={cn(
            "w-full resize-none bg-transparent px-1 py-1 text-[15px] leading-6 outline-none dark:placeholder:text-zinc-500",
            rejected && "animate-pulse text-red-500",
          )}
        />

        {attachment ? (
          <AttachmentCard
            attachment={attachment}
            busy={busy}
            onRemove={onRemoveAttachment}
            onModeChange={onAttachmentModeChange}
          />
        ) : null}

        <div className="flex items-center justify-between gap-2 border-t border-zinc-900/10 pt-3 dark:border-white/10">
          <div className="flex min-w-0 items-center gap-2">
            {canAttach ? (
              <>
                <input
                  ref={attachInputRef}
                  type="file"
                  accept={attachAccept}
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onAttachFile?.(file);
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => attachInputRef.current?.click()}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/70 bg-white/60 px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-900/5 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                >
                  <PlusIcon width={14} height={14} />
                  Lampirkan referensi
                </button>
              </>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {value.length === 0 ? "Minimal 4 karakter" : `${value.length}/${maxLength}`}
            </span>
            <Button
              isIconOnly
              aria-label="Buat sekarang"
              isDisabled={!canSubmit}
              onPress={trySubmit}
              className="rounded-full"
            >
              <SendIcon width={18} height={18} />
            </Button>
          </div>
        </div>

        {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
      </div>

      {exhausted ? (
        <p className="mt-3 text-center text-xs text-red-500" role="alert">
          Kuota harian habis. Reset pukul 00.00 WIB.
        </p>
      ) : null}
    </section>
  );
}

function AttachmentCard({
  attachment,
  busy = false,
  onRemove,
  onModeChange,
}: {
  attachment: ComposerAttachment;
  busy?: boolean;
  onRemove?: () => void;
  onModeChange?: (mode: "edit" | "reference") => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-900/10 p-2 dark:border-white/10">
      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        {attachment.kind === "image" && attachment.fileUrl ? (
          <Image src={attachment.fileUrl} alt={attachment.name} fill unoptimized className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-zinc-500 dark:text-zinc-400">
            <ImageIcon width={16} height={16} />
          </span>
        )}
      </div>
      <span className="min-w-0 flex-1 truncate text-xs text-zinc-600 dark:text-zinc-300">{attachment.name}</span>
      {attachment.kind === "image" && onModeChange ? (
        <div className="flex shrink-0 gap-1 rounded-full bg-zinc-900/5 p-1 text-xs dark:bg-white/5">
          {(["edit", "reference"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onModeChange(mode)}
              aria-pressed={attachment.mode === mode}
              className={cn(
                "rounded-full px-2 py-1 font-medium transition-colors",
                attachment.mode === mode
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400",
              )}
            >
              {mode === "edit" ? "Edit" : "Referensi"}
            </button>
          ))}
        </div>
      ) : null}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={busy}
          aria-label="Hapus lampiran"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-900/5 disabled:opacity-50 dark:hover:bg-white/10"
        >
          <XIcon width={14} height={14} />
        </button>
      ) : null}
    </div>
  );
}

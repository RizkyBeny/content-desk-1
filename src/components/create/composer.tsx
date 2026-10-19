"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { Button } from "@heroui/react";
import { cn } from "@/lib/utils";
import { ImageIcon, PlusIcon, SparkIcon, VideoIcon, XIcon } from "@/components/ui/icons";
import { DESKTOP_QUERY, useMediaQuery } from "./use-media-query";

const MIN_LINES = 2;
const MAX_LINES = 6;
/** Di atas ambang ini penghitung karakter mulai tampil (80%). */
const COUNTER_THRESHOLD = 0.8;

export interface ComposerAttachment {
  assetId: string;
  fileUrl: string;
  name: string;
  kind: "image" | "video";
  mode: "edit" | "reference";
}

export function Composer({
  value,
  onChange,
  onSubmit,
  maxLength,
  placeholder,
  label,
  busy,
  children,
  attachAccept,
  onAttachFile,
  attachment,
  onRemoveAttachment,
  onAttachmentModeChange,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  maxLength: number;
  placeholder: string;
  label: string;
  busy?: boolean;
  children?: ReactNode;
  attachAccept?: string;
  onAttachFile?: (file: File) => void;
  attachment?: ComposerAttachment | null;
  onRemoveAttachment?: () => void;
  onAttachmentModeChange?: (mode: "edit" | "reference") => void;
}) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [rejected, setRejected] = useState(false);
  const [docked, setDocked] = useState(false);
  const [dockedHeight, setDockedHeight] = useState(0);
  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const attachInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setDocked(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (typeof ResizeObserver === "undefined") {
      setDockedHeight(panel.offsetHeight);
      return;
    }
    const observer = new ResizeObserver(() => setDockedHeight(panel.offsetHeight));
    observer.observe(panel);
    setDockedHeight(panel.offsetHeight);
    return () => observer.disconnect();
  }, []);

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
  const canSubmit = trimmed.length >= 3 && !busy;
  const showCounter = value.length >= Math.floor(maxLength * COUNTER_THRESHOLD);

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

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter") return;
    if (!isDesktop) return;
    if (e.shiftKey) return;
    e.preventDefault();
    trySubmit();
  }

  const canAttach = Boolean(attachAccept && onAttachFile);

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />
      {docked ? <div aria-hidden style={{ height: dockedHeight }} className="w-full" /> : null}
      <div
        ref={panelRef}
        className={cn(
          "z-20",
          docked
            ? "pointer-events-none fixed inset-x-0 bottom-0 z-20 px-3 md:pl-20 lg:pl-64 lg:pr-6"
            : "relative mx-auto mb-4 w-full max-w-[760px]",
        )}
      >
        <div className={cn(docked && "mx-auto w-full max-w-6xl")}>
          <div className="glass-panel angle-card pointer-events-auto mx-auto flex w-full max-w-[760px] flex-col gap-3 rounded-3xl p-3 md:p-4 transition-all duration-300">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label htmlFor="composer-input" className="sr-only">
                  {label}
                </label>
                <textarea
                  id="composer-input"
                  ref={areaRef}
                  value={value}
                  rows={MIN_LINES}
                  maxLength={maxLength}
                  placeholder={placeholder}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={onKeyDown}
                  className={cn(
                    "w-full resize-none bg-transparent px-2 py-1 text-sm leading-6 outline-none outline-0 focus-visible:outline-none dark:placeholder:text-zinc-500",
                    rejected && "animate-pulse text-red-500",
                  )}
                />
              </div>

              <Button
                isIconOnly
                size="lg"
                aria-label="Buat sekarang"
                isDisabled={!canSubmit}
                onPress={trySubmit}
                className="mb-1 shrink-0"
              >
                <SparkIcon width={20} height={20} />
              </Button>
            </div>

            {attachment ? (
              <div className="flex items-center gap-3 rounded-xl border border-zinc-900/10 p-2 dark:border-white/10">
                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  {attachment.kind === "image" && attachment.fileUrl ? (
                    <Image
                      src={attachment.fileUrl}
                      alt={attachment.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-zinc-500 dark:text-zinc-400">
                      {attachment.kind === "video" ? (
                        <VideoIcon width={16} height={16} />
                      ) : (
                        <ImageIcon width={16} height={16} />
                      )}
                    </span>
                  )}
                </div>
                <span className="min-w-0 flex-1 truncate text-xs text-zinc-600 dark:text-zinc-300">
                  {attachment.name}
                </span>
                {attachment.kind === "image" && onAttachmentModeChange ? (
                  <div className="flex shrink-0 gap-1 rounded-full bg-zinc-900/5 p-1 text-xs dark:bg-white/5">
                    {(["edit", "reference"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => onAttachmentModeChange(mode)}
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
                {onRemoveAttachment ? (
                  <button
                    type="button"
                    onClick={onRemoveAttachment}
                    aria-label="Hapus lampiran"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-900/5 dark:hover:bg-white/10"
                  >
                    <XIcon width={14} height={14} />
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
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
                  <Button
                    isIconOnly
                    size="lg"
                    variant="secondary"
                    aria-label="Lampirkan media"
                    isDisabled={busy}
                    onPress={() => attachInputRef.current?.click()}
                    className="shrink-0"
                  >
                    <PlusIcon width={18} height={18} />
                  </Button>
                </>
              ) : null}
              {children}
              <span className="ml-auto text-[11px] text-zinc-500 dark:text-zinc-400">
                {showCounter ? `${value.length}/${maxLength}` : isDesktop ? "Enter untuk kirim · Shift+Enter baris baru" : `${value.length}/${maxLength}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

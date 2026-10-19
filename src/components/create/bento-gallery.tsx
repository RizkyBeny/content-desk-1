"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { columnsFor, tileSpan } from "@/lib/gallery";
import type { GenerationDTO, GenerationType } from "@/types";
import { AlertIcon, LoaderIcon } from "@/components/ui/icons";
import { AudioTile, BriefTile, FailedTile, ImageTile, ProcessingTile, VideoTile } from "./tiles";

export interface BentoGalleryProps {
  type: GenerationType;
  items: GenerationDTO[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  onLoadMore: () => void;
  onRetryLoad: () => void;
  onOpen: (item: GenerationDTO) => void;
  onRetry: (item: GenerationDTO) => void;
  playingAudioId?: string | null;
  onToggleAudio?: (item: GenerationDTO) => void;
}

const LOAD_MORE_THROTTLE = 300;

export function BentoGallery({
  type,
  items,
  loading,
  loadingMore,
  hasMore,
  error,
  onLoadMore,
  onRetryLoad,
  onOpen,
  onRetry,
  playingAudioId,
  onToggleAudio,
}: BentoGalleryProps) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const lastLoadRef = useRef(0);
  const [columns, setColumns] = useState(4);
  const [tile, setTile] = useState(220);

  const updateLayout = useCallback(() => {
    const el = gridRef.current;
    if (!el) return;
    const width = el.clientWidth;
    const cols = columnsFor(window.innerWidth, type);
    const gap = 12;
    setColumns(cols);
    setTile(Math.max(96, Math.floor((width - gap * (cols - 1)) / cols)));
  }, [type]);

  useEffect(() => {
    updateLayout();
    const el = gridRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateLayout);
      return () => window.removeEventListener("resize", updateLayout);
    }
    const observer = new ResizeObserver(updateLayout);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateLayout]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        const now = Date.now();
        if (now - lastLoadRef.current < LOAD_MORE_THROTTLE) return;
        lastLoadRef.current = now;
        onLoadMore();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, items.length]);

  const spans = useMemo(() => items.map((item) => tileSpan(type, item.width, item.height)), [items, type]);

  if (loading && items.length === 0) {
    return (
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="shimmer rounded-2xl"
            style={{ height: tile }}
            role="status"
            aria-label="Memuat hasil"
          />
        ))}
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center gap-3 p-8 text-center">
        <AlertIcon className="text-red-500" width={22} height={22} />
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{error}</p>
        <button
          type="button"
          onClick={onRetryLoad}
          className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-zinc-900"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center gap-2 p-10 text-center">
        <p className="text-sm font-medium">Belum ada hasil</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Mulai dengan menulis deskripsi di kotak di atas.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={gridRef}
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridAutoRows: `${tile}px`,
          gridAutoFlow: "dense",
          gap: 12,
        }}
      >
        {items.map((item, index) => {
          const span = spans[index];
          const style = {
            gridColumn: `span ${Math.min(span.col, columns)}`,
            gridRow: `span ${span.row}`,
          };
          const eager = index < 4;
          const tileProps = {
            item,
            span,
            onOpen,
            onRetry,
            playing: playingAudioId === item.id,
            onToggleAudio,
          };
          return (
            <div
              key={item.id}
              style={{ ...style, contentVisibility: eager ? "visible" : "auto" }}
              data-generation-id={item.id}
            >
              {item.status === "failed" ? (
                <FailedTile {...tileProps} />
              ) : item.status === "queued" || item.status === "processing" ? (
                <ProcessingTile item={item} />
              ) : type === "image" ? (
                <ImageTile {...tileProps} />
              ) : type === "video" ? (
                <VideoTile {...tileProps} />
              ) : type === "audio" ? (
                <AudioTile {...tileProps} />
              ) : (
                <BriefTile {...tileProps} />
              )}
            </div>
          );
        })}
      </div>

      <div ref={sentinelRef} aria-hidden className="h-px w-full" />

      {loadingMore ? (
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-500 dark:text-zinc-400">
          <LoaderIcon className="animate-spin" width={14} height={14} /> Memuat…
        </div>
      ) : null}

      {!hasMore && items.length > 0 ? (
        <p className="py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">Semua hasil sudah ditampilkan</p>
      ) : null}
    </div>
  );
}

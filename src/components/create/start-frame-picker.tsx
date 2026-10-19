"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "@heroui/react";
import { cn } from "@/lib/utils";
import { apiFetch, post, ClientError } from "@/lib/client";
import type { GenerationDTO, GenerationListDTO } from "@/types";
import { ImageIcon, LoaderIcon, TrashIcon, UploadIcon } from "@/components/ui/icons";
import { START_FRAME_ACCEPT, START_FRAME_MAX_BYTES } from "../../../config/generation";

export interface StartFrame {
  assetId: string;
  thumbnailUrl: string;
}

/** FR-VID-3/4: unggah gambar atau pilih dari galeri Image sebagai start frame. */
export function StartFramePicker({
  value,
  onChange,
}: {
  value: StartFrame | null;
  onChange: (frame: StartFrame | null) => void;
}) {
  const [mode, setMode] = useState<"upload" | "gallery">("upload");
  const [uploading, setUploading] = useState(false);
  const [gallery, setGallery] = useState<GenerationDTO[] | null>(null);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (mode !== "gallery" || gallery) return;
    let disposed = false;
    void (async () => {
      await Promise.resolve();
      if (disposed) return;
      setLoadingGallery(true);
      try {
        const data = await apiFetch<GenerationListDTO>("/api/generations?type=image&limit=10");
        if (!disposed) setGallery(data.items.filter((item) => item.status === "completed"));
      } catch {
        if (!disposed) setGallery([]);
      } finally {
        if (!disposed) setLoadingGallery(false);
      }
    })();
    return () => {
      disposed = true;
    };
  }, [mode, gallery]);

  async function handleFile(file: File) {
    if (!START_FRAME_ACCEPT.includes(file.type)) {
      toast.danger("Format harus JPG, PNG, atau WEBP.");
      return;
    }
    if (file.size > START_FRAME_MAX_BYTES) {
      toast.danger("Ukuran maksimal 10 MB.");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/uploads/start-frame", { method: "POST", body: form });
      const data = (await res.json()) as { assetId?: string; thumbnailUrl?: string; message?: string };
      if (!res.ok || !data.assetId) throw new Error(data.message ?? "Gagal mengunggah start frame.");
      onChange({ assetId: data.assetId, thumbnailUrl: data.thumbnailUrl ?? "" });
    } catch (err) {
      toast.danger(err instanceof Error ? err.message : "Gagal mengunggah start frame.");
    } finally {
      setUploading(false);
    }
  }

  async function pickFromGallery(item: GenerationDTO) {
    try {
      const data = await post<StartFrame>("/api/uploads/start-frame", { generationId: item.id });
      onChange({ assetId: data.assetId, thumbnailUrl: data.thumbnailUrl ?? item.thumbnailUrl ?? "" });
    } catch (err) {
      toast.danger(err instanceof ClientError ? err.message : "Gagal memilih gambar.");
    }
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-zinc-900/10 p-2 dark:border-white/10">
        <div className="relative size-14 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
          {value.thumbnailUrl ? (
            <Image src={value.thumbnailUrl} alt="Start frame" fill unoptimized className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-zinc-500 dark:text-zinc-400">
              <ImageIcon width={18} height={18} />
            </span>
          )}
        </div>
        <span className="flex-1 text-xs text-zinc-500 dark:text-zinc-400">Start frame dipilih</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Hapus start frame"
          className="flex size-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-900/5 dark:hover:bg-white/10"
        >
          <TrashIcon width={16} height={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1 rounded-full bg-zinc-900/5 p-1 text-xs dark:bg-white/5">
        {(["upload", "gallery"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMode(tab)}
            className={cn(
              "flex-1 rounded-full py-1.5 font-medium transition-colors",
              mode === tab
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                : "text-zinc-500 dark:text-zinc-400",
            )}
          >
            {tab === "upload" ? "Unggah" : "Dari galeri"}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={START_FRAME_ACCEPT.join(",")}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-4 text-xs font-medium text-zinc-600 hover:bg-zinc-900/5 disabled:opacity-50 dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/5"
          >
            {uploading ? (
              <>
                <LoaderIcon className="animate-spin" width={15} height={15} /> Mengunggah…
              </>
            ) : (
              <>
                <UploadIcon width={15} height={15} /> Pilih gambar (JPG/PNG/WEBP, maks 10 MB)
              </>
            )}
          </button>
        </div>
      ) : (
        <div>
          {loadingGallery ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-zinc-500 dark:text-zinc-400">
              <LoaderIcon className="animate-spin" width={14} height={14} /> Memuat galeri…
            </div>
          ) : !gallery?.length ? (
            <p className="py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Belum ada gambar di galeri. Buat image dahulu.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {gallery.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void pickFromGallery(item)}
                  className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 ring-offset-2 hover:ring-2 hover:ring-indigo-500 dark:bg-zinc-800"
                >
                  {item.thumbnailUrl ? (
                    <Image
                      src={item.thumbnailUrl}
                      alt={item.prompt.slice(0, 60)}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-zinc-500 dark:text-zinc-400">
                      <ImageIcon width={18} height={18} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

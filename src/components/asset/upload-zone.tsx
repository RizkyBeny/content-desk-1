"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "@heroui/react";
import { UploadIcon } from "@/components/ui/icons";
import type { AssetDTO, AssetVisibility } from "@/types";

export function UploadZone({
  onUploaded,
  visibility = "private",
  compact = false,
}: {
  onUploaded?: (asset: AssetDTO) => void;
  visibility?: AssetVisibility;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const upload = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setBusy(true);
      setProgress({ done: 0, total: files.length });
      let ok = 0;
      let fail = 0;
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append("file", files[i]);
        fd.append("name", files[i].name);
        fd.append("visibility", visibility);
        try {
          const res = await fetch("/api/assets", { method: "POST", body: fd });
          const data = (await res.json()) as { asset?: AssetDTO; error?: string };
          if (!res.ok) throw new Error(data.error ?? "Gagal mengunggah.");
          ok += 1;
          if (data.asset) onUploaded?.(data.asset);
        } catch (e) {
          fail += 1;
          toast.danger((e as Error).message);
        }
        setProgress({ done: i + 1, total: files.length });
      }
      setBusy(false);
      setProgress(null);
      if (ok) toast.success(`${ok} aset berhasil diunggah.`);
      if (fail && !ok) toast.danger(`${fail} aset gagal diunggah.`);
    },
    [onUploaded, visibility],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: upload,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div
      {...getRootProps()}
      className={[
        "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-center transition-colors",
        compact ? "p-4" : "p-8",
        isDragActive
          ? "border-zinc-900/60 bg-zinc-900/5 dark:border-white/60 dark:bg-white/5"
          : "border-zinc-300/70 dark:border-white/15",
      ].join(" ")}
    >
      <input {...getInputProps()} />
      <span className="flex size-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        <UploadIcon />
      </span>
      {!compact && (
        <div>
          <p className="text-sm font-semibold">Tarik & lepas berkas di sini</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Gambar, video, audio, atau dokumen (maks 200 MB per berkas).
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="mt-1 rounded-lg border border-zinc-200/70 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-white/10 dark:hover:bg-white/5"
      >
        {busy && progress ? `Mengunggah ${progress.done}/${progress.total}…` : "Pilih berkas"}
      </button>
    </div>
  );
}

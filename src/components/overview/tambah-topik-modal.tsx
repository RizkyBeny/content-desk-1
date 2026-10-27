"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react";
import { XIcon } from "@/components/ui/icons";
import { post } from "@/lib/client";

interface TambahTopikModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TambahTopikModal({ isOpen, onClose }: TambahTopikModalProps) {
  const router = useRouter();
  const [topicName, setTopicName] = useState("");
  const [topicDesc, setTopicDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit() {
    const title = topicName.trim();
    if (!title) {
      toast.warning("Silakan isi nama topik terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await post<{ projectId: string }>("/api/projects", {
        origin: "custom",
        topicTitle: title,
        topicSource: "custom_topic",
        topicInsight: {
          summary: topicDesc.trim() || title,
          score: 95,
        },
      });

      toast.success("Topik berhasil dibuat. Mengalihkan ke pemilihan angle...");
      onClose();
      router.push(`/proyek/${res.projectId}`);
    } catch {
      toast.warning("Mengalihkan ke alur proyek demo...");
      onClose();
      router.push("/proyek/demo-angle");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tambah-topik-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Panel (Figma #314:19393) */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all dark:border-white/10 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <h3
            id="tambah-topik-title"
            className="text-lg font-bold text-zinc-900 dark:text-zinc-50"
          >
            Tambah Topik
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-800 dark:bg-white/10 dark:text-zinc-400 dark:hover:bg-white/20 dark:hover:text-white"
            aria-label="Tutup dialog"
          >
            <XIcon width={16} height={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 pt-1">
          {/* Field 1: Nama Topik */}
          <div className="space-y-1.5">
            <label
              htmlFor="nama-topik"
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
            >
              Nama Topik
            </label>
            <input
              id="nama-topik"
              type="text"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="Contoh: Tiket Mudik yang Cepat Habis KAI"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-brand focus:outline-none dark:border-white/10 dark:bg-zinc-800/80 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>

          {/* Field 2: Deskripsi topik atau link */}
          <div className="space-y-1.5">
            <label
              htmlFor="deskripsi-topik"
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
            >
              Deskripsi topik atau link
            </label>
            <textarea
              id="deskripsi-topik"
              rows={5}
              value={topicDesc}
              onChange={(e) => setTopicDesc(e.target.value)}
              placeholder={`KAI mencatat 131.756 tiket mudik Lebaran 2026 sudah terjual hingga 30 Januari 2026.\n\nhttps://ekonomi.bisnis.com/read/20260201/98/1948960/tiket-mudik-lebaran`}
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white p-3.5 text-xs leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-brand focus:outline-none dark:border-white/10 dark:bg-zinc-800/80 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-black active:scale-[0.98] disabled:opacity-75 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            {isSubmitting ? (
              <>
                <span className="size-3 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-zinc-900 dark:border-t-transparent" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Tambahkan Referensi</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

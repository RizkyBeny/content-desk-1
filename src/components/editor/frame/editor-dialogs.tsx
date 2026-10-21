import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "@heroui/react";
import { SaveIcon, XIcon } from "@/components/ui/icons";
import type { CreationDTO } from "@/types";

export const AlertCircleIcon = ({ width = 20, height = 20, className = "" }: { width?: number; height?: number; className?: string }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/**
 * Modal Konfirmasi Kembali (Figma node 423:27258 "Pop-up back")
 */
export function BackConfirmDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Konfirmasi Kembali"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-[320px] flex-col overflow-hidden rounded-[14px] border border-zinc-200/80 bg-white shadow-2xl dark:border-zinc-800 dark:bg-[#18181B]">
        <div className="flex flex-col items-center px-4 pt-5 pb-2 text-center">
          <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
            <AlertCircleIcon width={22} height={22} />
          </div>
          <h3 className="font-[family-name:var(--font-ed)] text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Apakah anda yakin ingin kembali?
          </h3>
          <p className="mt-2 font-[family-name:var(--font-ed-alt)] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Project anda saat ini akan hilang jika anda kembali ke content brief dan tidak dapat disimpan atau dikembalikan
          </p>
        </div>

        <div className="flex flex-col gap-2 p-4 pt-2">
          <button
            type="button"
            onClick={onConfirm}
            className="flex h-9 w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 font-[family-name:var(--font-ed)] text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50"
          >
            Tetap Kembali
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-full items-center justify-center rounded-lg bg-zinc-900 font-[family-name:var(--font-ed)] text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            Batalkan
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal Konfirmasi Simpan Draft (Figma node 423:28735 "Pop-up save")
 */
export function SaveConfirmDialog({
  open,
  onConfirm,
  onCancel,
  saving = false,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Konfirmasi Simpan Draft"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-[320px] flex-col overflow-hidden rounded-[14px] border border-zinc-200/80 bg-white shadow-2xl dark:border-zinc-800 dark:bg-[#18181B]">
        <div className="flex flex-col items-center px-4 pt-5 pb-2 text-center">
          <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
            <SaveIcon width={20} height={20} />
          </div>
          <h3 className="font-[family-name:var(--font-ed)] text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Apakah anda yakin ingin simpan project ini ke draft?
          </h3>
        </div>

        <div className="flex gap-2 p-4 pt-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex h-9 flex-1 items-center justify-center rounded-lg border border-zinc-200 bg-white font-[family-name:var(--font-ed)] text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
          >
            Batalkan
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="flex h-9 flex-1 items-center justify-center rounded-lg bg-zinc-900 font-[family-name:var(--font-ed)] text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-50"
          >
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal Export Media (Figma node 533:30916 "Popup export")
 * Sesuai 100% dengan Figma:
 * - Layout 2 kolom tanpa header bar umum
 * - Sisi kiri: Card background #EEF2FF (447px) dengan preview 1:1 (367x367px), watermark logo di kanan atas, dan headline teks di overlay gradien bawah
 * - Sisi kanan: Tombol close bulat hitam di kanan atas, Header "Export Media", Textarea Caption (240px, border #E5E5E5), dan tombol penuh "Export Media" (#171717, h=40px, rounded=10px)
 */
export function ExportMediaModal({
  open,
  onClose,
  creation,
  assetUrls,
  channelLogoUrl,
  previewNode,
}: {
  open: boolean;
  onClose: () => void;
  creation: CreationDTO;
  assetUrls?: Record<string, string>;
  channelLogoUrl?: string | null;
  previewNode?: ReactNode;
}) {
  if (!open) return null;
  return (
    <ExportModalInner
      onClose={onClose}
      creation={creation}
      assetUrls={assetUrls}
      channelLogoUrl={channelLogoUrl}
      previewNode={previewNode}
    />
  );
}

function ExportModalInner({
  onClose,
  creation,
  assetUrls,
  channelLogoUrl,
  previewNode,
}: {
  onClose: () => void;
  creation: CreationDTO;
  assetUrls?: Record<string, string>;
  channelLogoUrl?: string | null;
  previewNode?: ReactNode;
}) {
  const defaultCaption =
    creation.captions[0]?.text ||
    "Dominasi Baru ASEAN: Indonesia Jadi Satu-Satunya Negara yang Loloskan Semua Kategori Usia ke Piala Asia!\n\nMau update berita terkini, follow Kumparan sekarang!";

  const [caption, setCaption] = useState(defaultCaption);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Resolusi gambar preview
  const previewImageSrc = useMemo(() => {
    if (creation.editorState?.type === "carousel") {
      const firstSlide = creation.editorState.slides[0];
      if (firstSlide?.background?.assetId && assetUrls?.[firstSlide.background.assetId]) {
        return assetUrls[firstSlide.background.assetId];
      }
      if (firstSlide?.background?.src) return firstSlide.background.src;
    } else if (creation.editorState?.type === "image") {
      const slide = creation.editorState.slide;
      if (slide?.background?.assetId && assetUrls?.[slide.background.assetId]) {
        return assetUrls[slide.background.assetId];
      }
      if (slide?.background?.src) return slide.background.src;
    }
    for (const it of creation.items) {
      if (it.asset?.fileUrl) return it.asset.fileUrl;
      if (it.assetId && assetUrls?.[it.assetId]) return assetUrls[it.assetId];
      if (it.versions?.[0]) return it.versions[0];
    }
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";
  }, [creation, assetUrls]);

  // Headline teks di atas preview
  const headlineText = useMemo(() => {
    if (creation.editorState?.type === "carousel") {
      const firstSlide = creation.editorState.slides[0];
      if (firstSlide?.config?.titleText) return firstSlide.config.titleText;
    }
    const capFirstLine = creation.captions[0]?.text.split("\n")[0]?.trim();
    if (capFirstLine) return capFirstLine;
    return "Listrik di Batam Padam, Diduga Gardu Kemasukan Hewan Liar";
  }, [creation]);

  async function handleExport() {
    setExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Media berhasil diekspor dan siap dipublikasikan!");
      onClose();
    } catch {
      toast.danger("Gagal mengekspor media.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Export Media"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-6"
    >
      <div className="relative flex w-full max-w-[926px] flex-col gap-6 overflow-hidden rounded-[16px] bg-white p-6 shadow-2xl dark:bg-[#18181B] md:flex-row border border-black/5 dark:border-white/10">
        {/* Kolom Kiri: Preview Card (Figma node I533:30916;522:30819) */}
        <div className="flex w-full shrink-0 flex-col items-center justify-center rounded-[16px] bg-[#EEF2FF] p-6 dark:bg-[#1E2235] md:w-[447px] md:p-10">
          <div className="relative aspect-square w-full max-w-[367px] overflow-hidden rounded-[8px] bg-black shadow-md">
            {previewNode ? (
              previewNode
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImageSrc}
                  alt="Preview Media"
                  className="h-full w-full object-cover"
                />

                {/* Watermark Logo (Kanan Atas) */}
                <div className="absolute top-4 right-4 z-10 sm:top-5 sm:right-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={channelLogoUrl || "/brand/kumparan-logo.png"}
                    alt="Logo Kumparan"
                    className="h-8 w-auto max-w-[114px] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] sm:h-9"
                  />
                </div>

                {/* Gradient & Headline Teks (Bawah) */}
                <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 sm:p-7">
                  <p className="font-[family-name:var(--font-ed)] text-lg font-bold leading-[1.25] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] sm:text-[22px]">
                    {headlineText}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Title, Caption & Action (Figma node I533:30916;478:24255) */}
        <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
          {/* Tombol Close di sudut kanan atas */}
          <div className="flex w-full justify-end">
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="flex size-7 items-center justify-center rounded-full bg-[#171717] text-white transition-opacity hover:opacity-85 dark:bg-white dark:text-[#171717]"
            >
              <XIcon width={14} height={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* Tengah: Header + Field Caption */}
          <div className="my-auto flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1">
              <h2 className="font-[family-name:var(--font-ed)] text-xl font-bold leading-7 text-[#262626] dark:text-neutral-100">
                Export Media
              </h2>
              <p className="font-[family-name:var(--font-ed-alt)] text-xs leading-4 text-[#737373] dark:text-neutral-400">
                Simpan media lalu publish ke multichannel
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="export-caption-input"
                className="font-[family-name:var(--font-ed-alt)] text-xs font-medium leading-4 text-[#737373] dark:text-neutral-400"
              >
                Caption
              </label>
              <textarea
                id="export-caption-input"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Tulis caption..."
                aria-label="Caption"
                className="h-[240px] w-full resize-none rounded-[10px] border border-[#E5E5E5] bg-white p-[8px_10px] font-[family-name:var(--font-ed)] text-sm leading-5 text-[#171717] outline-none transition-colors placeholder:text-neutral-400 focus:border-[#171717] dark:border-neutral-700 dark:bg-[#202024] dark:text-neutral-100 dark:focus:border-white"
              />
            </div>
          </div>

          {/* Bawah: Action Button */}
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex h-10 w-full items-center justify-center rounded-[10px] bg-[#171717] font-[family-name:var(--font-ed)] text-sm font-medium leading-5 text-[#FAFAFA] transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-[#171717] dark:hover:bg-neutral-200"
          >
            {exporting ? "Mengekspor…" : "Export Media"}
          </button>
        </div>
      </div>
    </div>
  );
}

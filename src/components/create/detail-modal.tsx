"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button, Chip, toast } from "@heroui/react";
import { apiFetch, ClientError } from "@/lib/client";
import { formatDuration, formatJakartaDateTime } from "@/lib/utils";
import type { GenerationDTO, BriefResult } from "@/types";
import {
  AUDIO_FORMATS,
  AUDIO_LANGUAGES,
  AUDIO_STYLES,
  BRIEF_CONTENT_TYPES,
  BRIEF_LANGUAGES,
  BRIEF_LENGTHS,
  BRIEF_PLATFORMS,
  BRIEF_TONES,
  IMAGE_QUALITIES,
  VIDEO_RESOLUTIONS,
  labelFor,
} from "../../../config/generation";
import {
  AudioIcon,
  CopyIcon,
  DownloadIcon,
  FileTextIcon,
  ImageIcon,
  LoaderIcon,
  RefreshIcon,
  TrashIcon,
  VideoIcon,
  XIcon,
} from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { AudioPlayer } from "./audio-player";

const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

export interface DetailModalProps {
  item: GenerationDTO | null;
  canModerate?: boolean;
  fetchDetail?: boolean;
  downloadUrl?: string | null;
  onClose: () => void;
  onSimilar: (item: GenerationDTO) => void;
  onDeleted: (id: string) => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-900/5 py-2 text-sm last:border-0 dark:border-white/10">
      <span className="shrink-0 text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function TypeIcon({ type }: { type: GenerationDTO["type"] }) {
  if (type === "image") return <ImageIcon width={16} height={16} />;
  if (type === "video") return <VideoIcon width={16} height={16} />;
  if (type === "audio") return <AudioIcon width={16} height={16} />;
  return <FileTextIcon width={16} height={16} />;
}

function detailRows(item: GenerationDTO, params: GenerationDTO["params"]): { label: string; value: string }[] {
  const safe = (params ?? {}) as unknown as Record<string, unknown>;
  const rows: { label: string; value: string }[] = [{ label: "Model", value: item.modelName }];
  if (item.type === "image") {
    const p = safe as unknown as import("@/types").ImageParams;
    rows.push({ label: "Rasio", value: p.aspectRatio === "custom" ? "Kustom" : p.aspectRatio });
    rows.push({ label: "Dimensi", value: `${item.width ?? p.width}×${item.height ?? p.height} px` });
    rows.push({ label: "Kualitas", value: labelFor(IMAGE_QUALITIES, p.quality) });
    if (p.referenceAssetId) {
      rows.push({ label: "Referensi", value: p.referenceMode === "reference" ? "Gambar referensi" : "Edit gambar" });
    }
  } else if (item.type === "video") {
    const p = safe as unknown as import("@/types").VideoParams;
    rows.push({ label: "Rasio", value: p.aspectRatio });
    rows.push({ label: "Dimensi", value: `${item.width ?? "—"}×${item.height ?? "—"}` });
    rows.push({ label: "Resolusi", value: labelFor(VIDEO_RESOLUTIONS, p.resolution) });
    rows.push({ label: "Durasi", value: `${p.durationSeconds} detik` });
    if (p.startFrameAssetId) rows.push({ label: "Start frame", value: "Ada" });
    if (p.referenceAssetId) rows.push({ label: "Referensi", value: "Video diedit" });
  } else if (item.type === "audio") {
    const p = safe as unknown as import("@/types").AudioParams;
    rows.push({ label: "Suara", value: p.voiceName || p.voiceId });
    rows.push({ label: "Bahasa", value: labelFor(AUDIO_LANGUAGES, p.language) });
    rows.push({ label: "Kecepatan", value: `${p.speed}×` });
    rows.push({ label: "Gaya", value: labelFor(AUDIO_STYLES, p.style) });
    rows.push({ label: "Format", value: labelFor(AUDIO_FORMATS, p.format) });
    rows.push({ label: "Durasi", value: formatDuration(item.durationSeconds) });
  } else {
    const p = safe as unknown as import("@/types").BriefParams;
    rows.push({ label: "Jenis konten", value: labelFor(BRIEF_CONTENT_TYPES, p.contentType) });
    rows.push({ label: "Platform tujuan", value: labelFor(BRIEF_PLATFORMS, p.platform) });
    rows.push({ label: "Tone", value: labelFor(BRIEF_TONES, p.tone) });
    rows.push({ label: "Bahasa", value: labelFor(BRIEF_LANGUAGES, p.language) });
    rows.push({ label: "Target audiens", value: p.audience || "—" });
    rows.push({ label: "Panjang", value: labelFor(BRIEF_LENGTHS, p.length) });
  }
  return rows;
}

function BriefPreview({ result }: { result: BriefResult | null }) {
  if (!result) return null;
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold">{result.summary.title}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{result.summary.goal}</p>
      </div>
      <div className="max-h-[45vh] overflow-auto rounded-xl border border-zinc-900/10 dark:border-white/10">
        <table className="w-full border-collapse text-left text-xs">
          <tbody>
            {result.rows.map((row, index) => (
              <tr key={index} className="border-b border-zinc-900/5 align-top last:border-0 dark:border-white/10">
                <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                  {String(row.slide ?? row.scene ?? row.segmen ?? index + 1)}
                </td>
                <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">
                  {Object.entries(row)
                    .filter(([key]) => !["slide", "scene", "segmen"].includes(key))
                    .map(([key, value]) => (
                      <span key={key} className="mr-2 inline-block">
                        <span className="text-zinc-500 dark:text-zinc-400">{key}: </span>
                        {String(value)}
                      </span>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DetailModal({
  item,
  canModerate,
  fetchDetail = true,
  downloadUrl,
  onClose,
  onSimilar,
  onDeleted,
}: DetailModalProps) {
  const [detail, setDetail] = useState<GenerationDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const open = Boolean(item);
  const current = detail ?? item;

  useEffect(() => {
    if (!open || !item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDetail(null);
      setConfirmDelete(false);
      return;
    }
    if (!fetchDetail) {
      setDetail(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    let disposed = false;
    void (async () => {
      try {
        const data = await apiFetch<{ generation: GenerationDTO }>(`/api/generations/${item.id}`);
        if (!disposed) setDetail(data.generation);
      } catch (err) {
        if (disposed) return;
        if (err instanceof ClientError && err.status === 404) {
          toast.danger("Hasil tidak ditemukan.");
          onClose();
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    })();
    return () => {
      disposed = true;
    };
  }, [open, item, fetchDetail, onClose]);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "Tab" && dialogRef.current) {
        const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null,
        );
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? dialogRef.current)?.focus();
    }, 30);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      window.clearTimeout(timer);
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  const copyPrompt = useCallback(async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.prompt);
      toast.success("Prompt disalin.");
    } catch {
      toast.danger("Gagal menyalin prompt.");
    }
  }, [current]);

  async function handleDelete() {
    if (!current) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/generations/${current.id}`, { method: "DELETE" });
      toast.success("Hasil dihapus.");
      onDeleted(current.id);
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      toast.danger(err instanceof ClientError ? err.message : "Gagal menghapus.");
    } finally {
      setDeleting(false);
    }
  }

  if (!open || !current) return null;

  const showDelete = current.isOwner || canModerate;
  const result = current.result as BriefResult | null;
  const downloadHref = downloadUrl !== undefined ? downloadUrl : `/api/generations/${current.id}/download`;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-[4.8px] md:items-center md:p-4"
        role="presentation"
        onClick={onClose}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Detail hasil generate"
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
          className="glass-panel flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/15 shadow-2xl md:max-h-[88vh] md:max-w-5xl md:flex-row md:rounded-3xl"
        >
          <div className="relative flex min-h-[240px] flex-1 items-center justify-center bg-zinc-950/90 p-3 md:min-h-0 md:basis-3/5">
            {loading ? (
              <LoaderIcon className="animate-spin text-white/70" width={26} height={26} />
            ) : current.type === "image" && (current.fileUrl || current.thumbnailUrl) ? (
              <div className="relative h-full max-h-[70vh] w-full">
                <Image
                  src={(current.fileUrl ?? current.thumbnailUrl) as string}
                  alt={current.prompt.slice(0, 140)}
                  fill
                  unoptimized
                  sizes="(max-width:768px) 100vw, 60vw"
                  className="object-contain"
                />
              </div>
            ) : current.type === "video" && current.fileUrl ? (
              <video
                src={current.fileUrl}
                controls
                autoPlay
                muted
                loop
                playsInline
                className="max-h-[70vh] w-full rounded-xl bg-black object-contain"
              />
            ) : current.type === "audio" && current.fileUrl ? (
              <div className="w-full px-2 py-4">
                <AudioPlayer url={current.fileUrl} fallbackPoints={current.waveform} />
              </div>
            ) : current.type === "brief" ? (
              <div className="w-full overflow-auto p-4">
                <BriefPreview result={result} />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/60">
                <TypeIcon type={current.type} />
                <p className="text-xs">Pratinjau tidak tersedia</p>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 md:hidden"
            >
              <XIcon width={18} height={18} />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5 md:basis-2/5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                  <TypeIcon type={current.type} />
                </span>
                <Chip size="sm" variant="soft">
                  {current.owner?.initials ?? "?"}
                </Chip>
                <span className="text-sm font-medium">{current.owner?.name ?? "Tanpa nama"}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="hidden size-8 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-900/5 md:flex dark:text-zinc-300 dark:hover:bg-white/10"
              >
                <XIcon width={18} height={18} />
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatJakartaDateTime(current.createdAt)}
            </p>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Prompt
                </span>
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-strong hover:underline dark:text-brand"
                >
                  <CopyIcon width={13} height={13} /> Salin
                </button>
              </div>
              <p className="max-h-[200px] overflow-auto whitespace-pre-wrap rounded-xl bg-zinc-900/5 p-3 text-sm dark:bg-white/5">
                {current.prompt}
              </p>
            </div>

            <div>
              {detailRows(current, current.params).map((row) => (
                <Row key={row.label} label={row.label} value={row.value} />
              ))}
            </div>

            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              <Button variant="primary" onPress={() => onSimilar(current)}>
                <RefreshIcon width={15} height={15} /> Buat serupa
              </Button>
              {downloadHref ? (
                <a
                  href={downloadHref}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-900/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-900/5 dark:border-white/20 dark:hover:bg-white/10"
                >
                  <DownloadIcon width={15} height={15} /> Unduh
                </a>
              ) : null}
              {showDelete ? (
                <Button variant="ghost" onPress={() => setConfirmDelete(true)}>
                  <TrashIcon width={15} height={15} /> Hapus
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Hapus hasil ini?"
        description="Hasil akan hilang dari galeri. Tindakan ini tidak bisa dibatalkan."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onPress={() => setConfirmDelete(false)}>
              Batal
            </Button>
            <Button variant="danger" isDisabled={deleting} onPress={handleDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="line-clamp-3 text-sm text-zinc-500 dark:text-zinc-400">{current.prompt}</p>
      </Modal>
    </>
  );
}

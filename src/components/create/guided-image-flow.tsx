"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button, toast } from "@heroui/react";
import { apiFetch, ClientError, post } from "@/lib/client";
import { cn } from "@/lib/utils";
import { CheckIcon, DownloadIcon, LoaderIcon, RefreshIcon, SaveIcon, SendIcon } from "@/components/ui/icons";
import type { GenerationDTO, ImageParams, QuotaDTO } from "@/types";
import {
  IMAGE_GUIDED_CONTENT_KINDS,
  IMAGE_GUIDED_FORMATS,
  guidedImageParams,
  type ImageGuidedContentKind,
  type ImageGuidedFormat,
} from "../../../config/generation";
import { DetailModal } from "./detail-modal";
import { QuotaBadge } from "./quota-badge";

const MIN_DESCRIPTION = 10;
const CAROUSEL_COUNT = 3;
/** Durasi loader singkat sebelum langkah berikutnya muncul (ms). */
const STEP_TRANSITION_MS = 750;
/** Kunci localStorage untuk hasil yang disimpan ke Data Jurnalism (mode mock, tanpa backend). */
const JURNALISM_STORAGE_KEY = "aistudio:jurnalism:image";

type JurnalismEntry = {
  id: string;
  prompt: string;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  savedAt: string;
};

/** Ambil nama file dari header `content-disposition` (fallback: null). */
function fileNameFromDisposition(response: Response): string | null {
  const header = response.headers.get("content-disposition") ?? "";
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match?.[1] ?? null;
}

const Q1 = "Format apa yang kamu inginkan?";
const Q2 = "Jenis konten apa yang ingin kamu bikin?";
const Q3 = "Masukkan deskripsi image/gambar yang ingin dibuat";

type Option = { value: string; label: string; hint?: string; disabled?: boolean };
type Pending = 2 | 3 | "final" | null;
type EditingStep = 1 | 2 | 3 | null;

function buildFinalPrompt(
  context: string,
  description: string,
  format: ImageGuidedFormat | null,
  contentKind: ImageGuidedContentKind | null,
): string {
  const formatLabel = IMAGE_GUIDED_FORMATS.find((item) => item.value === format)?.label ?? "Square (1:1)";
  const kindLabel = IMAGE_GUIDED_CONTENT_KINDS.find((item) => item.value === contentKind)?.label ?? "Single Image";
  return [
    `Buat konten gambar tentang "${context}".`,
    description.trim(),
    `Gunakan format ${formatLabel} dengan jenis konten ${kindLabel}.`,
    "Gunakan pendekatan visual yang informatif, faktual, dan mudah dipahami. Hindari spekulasi, rumor yang belum terverifikasi, dan clickbait berlebihan.",
  ].join(" ");
}

const PENDING_LABEL: Record<Exclude<Pending, null>, string> = {
  2: "Menyiapkan pilihan jenis konten…",
  3: "Menyiapkan input deskripsi…",
  final: "Menyusun final prompt…",
};

/**
 * Guided mode halaman Create Image — struktur mengikuti Figma:
 * - Langkah aktif (node 776:24030): kartu composer berisi baris [Step N + pertanyaan]
 *   lalu daftar opsi/placeholder di bawahnya.
 * - Langkah selesai (node 828:26960): runtuh jadi baris ringkas [Step N pill + pertanyaan abu]
 *   dengan jawaban putih di kanan.
 * - Final prompt (node 828:26960): brief + langkah runtuh + kartu prompt (badge + teks)
 *   + tombol [Edit Prompt] & [Generate Image].
 * - Hasil (node 828:27247): brief & langkah disembunyikan, tampil kartu hasil
 *   (area gambar + Regenerate) + kartu prompt + tombol [Download Image/Aset] & [Simpan di Data Jurnalism].
 *
 * Transisi antar langkah melewati loader singkat; setiap kartu muncul dengan
 * animasi reveal (`card-in`). Carousel menghasilkan 3 gambar sekaligus.
 */
export function GuidedImageFlow({
  context,
  quota,
  onExit,
  onGenerated,
}: {
  context: string;
  quota: QuotaDTO | null;
  onExit: () => void;
  onGenerated?: () => void;
}) {
  const [format, setFormat] = useState<ImageGuidedFormat | null>(null);
  const [contentKind, setContentKind] = useState<ImageGuidedContentKind | null>(null);
  const [description, setDescription] = useState("");
  const [editingStep, setEditingStep] = useState<EditingStep>(1);
  const [revealed, setRevealed] = useState({ step2: false, step3: false, final: false });
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const [promptDraft, setPromptDraft] = useState<string | null>(null);
  const [promptEditing, setPromptEditing] = useState(false);
  const [results, setResults] = useState<GenerationDTO[]>([]);
  const [selected, setSelected] = useState<GenerationDTO | null>(null);
  const [downloading, setDownloading] = useState(false);

  const exhausted = quota ? quota.remaining <= 0 : false;
  const descriptionValid = description.trim().length >= MIN_DESCRIPTION;
  const computedPrompt = useMemo(
    () => buildFinalPrompt(context, description, format, contentKind),
    [context, description, format, contentKind],
  );
  const finalPrompt = promptDraft ?? computedPrompt;

  const formatLabel = IMAGE_GUIDED_FORMATS.find((item) => item.value === format)?.label ?? "Belum dipilih";
  const kindLabel = IMAGE_GUIDED_CONTENT_KINDS.find((item) => item.value === contentKind)?.label ?? "Belum dipilih";
  const hasResults = results.length > 0;

  /** Loader singkat, lalu reveal langkah berikutnya dengan animasi. */
  function advance(target: Exclude<Pending, null>) {
    setPending(target);
    window.setTimeout(() => {
      if (target === 2) {
        setRevealed((prev) => ({ ...prev, step2: true }));
        setEditingStep(2);
      } else if (target === 3) {
        setRevealed((prev) => ({ ...prev, step3: true }));
        setEditingStep(3);
      } else {
        setRevealed((prev) => ({ ...prev, final: true }));
        setEditingStep(null);
      }
      setPending(null);
    }, STEP_TRANSITION_MS);
  }

  function selectFormat(value: string) {
    if (pending) return;
    setFormat(value as ImageGuidedFormat);
    advance(2);
  }

  function selectKind(value: string) {
    if (pending) return;
    setContentKind(value as ImageGuidedContentKind);
    advance(3);
  }

  function sendDescription() {
    if (pending || !descriptionValid) return;
    advance("final");
  }

  function toggleEditPrompt() {
    if (!promptEditing) setPromptDraft(finalPrompt);
    setPromptEditing((prev) => !prev);
  }

  async function generate() {
    if (busy || exhausted || !format || !contentKind || !descriptionValid) return;
    setBusy(true);
    setPromptEditing(false);
    try {
      const params = guidedImageParams(format, "medium") as ImageParams;
      const count = contentKind === "carousel" ? CAROUSEL_COUNT : 1;
      const items: GenerationDTO[] = [];
      for (let index = 0; index < count; index += 1) {
        const result = await post<{ generation: GenerationDTO; quota: QuotaDTO }>("/api/generations", {
          type: "image",
          prompt: finalPrompt,
          params,
        });
        items.push(result.generation);
      }
      setResults(items);
      onGenerated?.();
      await pollUntilDone(items.map((item) => item.id));
    } catch (err) {
      toast.danger(err instanceof ClientError ? err.message : "Gagal memulai generate.");
    } finally {
      setBusy(false);
    }
  }

  async function pollUntilDone(ids: string[]) {
    for (;;) {
      const updated = await Promise.all(
        ids.map(async (id) => {
          try {
            const data = await apiFetch<{ generation: GenerationDTO }>(`/api/generations/${id}`);
            return data.generation;
          } catch {
            return null;
          }
        }),
      );
      setResults((prev) => prev.map((row) => updated.find((item) => item && item.id === row.id) ?? row));
      if (updated.every((item) => !item || item.status === "completed" || item.status === "failed")) return;
      await new Promise((resolve) => window.setTimeout(resolve, 1500));
    }
  }

  /** Unduh seluruh hasil generate ke perangkat lewat endpoint download yang sudah ada. */
  async function downloadResults() {
    const targets = results.filter((item) => item.status === "completed" && item.fileUrl);
    if (targets.length === 0) {
      toast.danger("Belum ada hasil yang bisa diunduh.");
      return;
    }
    setDownloading(true);
    try {
      for (const item of targets) {
        const response = await fetch(`/api/generations/${item.id}/download`);
        if (!response.ok) throw new ClientError("Gagal mengunduh file.", response.status);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileNameFromDisposition(response) ?? `image-${item.id.slice(0, 8)}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
      toast.success(
        targets.length > 1 ? `${targets.length} aset diunduh ke perangkat.` : "Aset diunduh ke perangkat.",
      );
    } catch (err) {
      toast.danger(err instanceof ClientError ? err.message : "Gagal mengunduh file.");
    } finally {
      setDownloading(false);
    }
  }

  /** Simpan hasil ke Data Jurnalism (localStorage) lalu kembali ke halaman landing Create Image. */
  function saveToDataJurnalism() {
    if (busy || results.length === 0) return;
    try {
      const existingRaw = window.localStorage.getItem(JURNALISM_STORAGE_KEY);
      const existing: JurnalismEntry[] = existingRaw ? JSON.parse(existingRaw) : [];
      const known = new Set(existing.map((entry) => entry.id));
      const added: JurnalismEntry[] = results
        .filter((item) => !known.has(item.id))
        .map((item) => ({
          id: item.id,
          prompt: item.prompt,
          fileUrl: item.fileUrl,
          thumbnailUrl: item.thumbnailUrl,
          savedAt: new Date().toISOString(),
        }));
      window.localStorage.setItem(JURNALISM_STORAGE_KEY, JSON.stringify([...added, ...existing]));
    } catch {
      /* localStorage tidak tersedia — abaikan, tetap anggap tersimpan */
    }
    onGenerated?.();
    toast.success("Disimpan ke Data Jurnalism.");
    onExit();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mx-auto flex w-full max-w-[760px] items-center justify-between pb-1">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-brand-strong dark:text-zinc-400 dark:hover:text-brand"
        >
          ← Kembali
        </button>
        <QuotaBadge quota={quota} />
      </div>

      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-2">
        {/* Bagian langkah — disembunyikan sekali hasil tampil (Figma 828:27247) */}
        {!hasResults ? (
          <>
            {/* Brief */}
            <div className="glass-panel card-in rounded-lg px-6 py-4">
              <p className="text-[15px] leading-[22px] text-foreground">{context}</p>
            </div>

            {/* Langkah yang sudah selesai — runtuh jadi baris ringkas */}
            {revealed.step2 && editingStep !== 1 ? (
              <CollapsedStep step={1} question={Q1} answer={formatLabel} onEdit={() => setEditingStep(1)} />
            ) : null}
            {revealed.step3 && editingStep !== 2 ? (
              <CollapsedStep step={2} question={Q2} answer={kindLabel} onEdit={() => setEditingStep(2)} />
            ) : null}
            {revealed.final && editingStep !== 3 ? (
              <CollapsedStep step={3} question={Q3} answer={description} long onEdit={() => setEditingStep(3)} />
            ) : null}

            {/* Langkah aktif — pertanyaan di atas, placeholder di bawah */}
            {editingStep === 1 ? (
              <StepComposer step={1} question={Q1}>
                <OptionGrid
                  options={IMAGE_GUIDED_FORMATS as Option[]}
                  value={format}
                  disabled={Boolean(pending)}
                  onChange={selectFormat}
                />
              </StepComposer>
            ) : null}
            {editingStep === 2 ? (
              <StepComposer step={2} question={Q2}>
                <OptionGrid
                  options={IMAGE_GUIDED_CONTENT_KINDS as Option[]}
                  value={contentKind}
                  disabled={Boolean(pending)}
                  onChange={selectKind}
                />
              </StepComposer>
            ) : null}
            {editingStep === 3 ? (
              <StepComposer step={3} question={Q3}>
                <DescriptionComposer
                  value={description}
                  onChange={setDescription}
                  valid={descriptionValid}
                  busy={pending === "final"}
                  onSend={sendDescription}
                />
              </StepComposer>
            ) : null}
          </>
        ) : null}

        {/* Loader transisi */}
        {pending ? <StepLoader label={PENDING_LABEL[pending]} /> : null}

        {/* Kartu hasil (node 828:27247) */}
        {hasResults ? (
          <ResultCard items={results} busy={busy} onRegenerate={generate} onOpen={setSelected} />
        ) : null}

        {/* Kartu final prompt */}
        {revealed.final ? (
          <PromptCard
            prompt={finalPrompt}
            editing={promptEditing}
            onChange={setPromptDraft}
            exhausted={exhausted}
          />
        ) : null}

        {/* Loader generate */}
        {busy && revealed.final && !promptEditing ? <StepLoader label="Sedang membuat gambar…" /> : null}

        {/* Baris aksi (rata kanan) — sebelum generate: Edit Prompt + Generate Image; sesudah hasil: Download + Simpan */}
        {revealed.final ? (
          <div className="card-in flex items-center justify-end gap-2 pt-1">
            {hasResults ? (
              <>
                <Button variant="secondary" onPress={() => void downloadResults()} isDisabled={downloading || busy}>
                  <DownloadIcon width={15} height={15} />
                  {downloading ? "Mengunduh…" : "Download Image/Aset"}
                </Button>
                <Button variant="primary" onPress={saveToDataJurnalism} isDisabled={busy}>
                  <SaveIcon width={15} height={15} />
                  Simpan di Data Jurnalism
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onPress={toggleEditPrompt} isDisabled={busy}>
                  {promptEditing ? "Selesai Edit" : "Edit Prompt"}
                </Button>
                <Button
                  variant="primary"
                  onPress={() => void generate()}
                  isDisabled={busy || exhausted || !descriptionValid}
                >
                  {busy ? "Memproses…" : "Generate Image"}
                </Button>
              </>
            )}
          </div>
        ) : null}
      </div>

      <DetailModal
        item={selected}
        onClose={() => setSelected(null)}
        onSimilar={() => setSelected(null)}
        onDeleted={() => setSelected(null)}
      />
    </div>
  );
}

/** Baris skeleton + spinner yang tampil sesaat sebelum langkah berikutnya muncul. */
function StepLoader({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="glass-panel card-in flex items-center gap-3 rounded-lg px-6 py-4"
    >
      <LoaderIcon width={16} height={16} className="animate-spin text-brand" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="shimmer h-3 w-1/3 rounded-full" />
        <div className="shimmer h-3 w-1/2 rounded-full" />
      </div>
      <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
    </div>
  );
}

/** Langkah selesai — runtuh jadi baris ringkas (Step pill + pertanyaan abu + jawaban putih). */
function CollapsedStep({
  step,
  question,
  answer,
  long = false,
  onEdit,
}: {
  step: 1 | 2 | 3;
  question: string;
  answer: string;
  long?: boolean;
  onEdit: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="glass-panel angle-card card-in flex w-full items-center justify-between gap-3 rounded-lg px-6 py-4 text-left"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 rounded-full border border-zinc-900/10 bg-zinc-900/[0.04] px-2.5 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
          Step {step}
        </span>
        <span className="px-2 py-2 text-xs text-zinc-500 dark:text-zinc-400">{question}</span>
      </span>
      <span
        className={cn(
          "text-[15px] leading-[22px] text-foreground",
          long ? "max-w-[220px] text-right" : "shrink-0",
        )}
      >
        {answer}
      </span>
    </button>
  );
}

/** Langkah aktif — baris [Step N + pertanyaan] lalu placeholder (opsi/textarea) di bawahnya. */
function StepComposer({
  step,
  question,
  children,
}: {
  step: 1 | 2 | 3;
  question: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-panel angle-card card-in flex flex-col gap-4 rounded-lg p-4">
      <div className="flex items-center gap-2">
        <span className="shrink-0 rounded-full border border-zinc-900/10 bg-zinc-900/[0.04] px-2.5 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
          Step {step}
        </span>
        <span className="text-[15px] leading-[22px] text-foreground">{question}</span>
      </div>
      {children}
    </div>
  );
}

function OptionGrid({
  options,
  value,
  disabled = false,
  onChange,
}: {
  options: Option[];
  value: string | null;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div role="group" className="flex flex-col gap-1">
      {options.map((option, index) => {
        const letter = String.fromCharCode(65 + index);
        const selected = value === option.value;
        const optionDisabled = disabled || Boolean(option.disabled);
        return (
          <button
            key={option.value}
            type="button"
            disabled={optionDisabled}
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-left text-[15px] leading-[22px] transition-colors",
              selected
                ? "bg-brand/10 text-brand-strong ring-1 ring-brand/40 dark:text-brand"
                : "bg-zinc-900/[0.06] text-foreground hover:bg-zinc-900/[0.1] dark:bg-white/[0.05] dark:hover:bg-white/[0.1]",
              optionDisabled && "cursor-not-allowed opacity-50",
            )}
          >
            <span>
              {letter}. {option.label}
            </span>
            {option.hint ? (
              <span className="rounded-full bg-zinc-900/5 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
                {option.hint}
              </span>
            ) : selected ? (
              <CheckIcon width={16} height={16} />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Composer deskripsi Step 3: textarea + toolbar berisi tombol kirim bulat (Figma 782:24526). */
function DescriptionComposer({
  value,
  onChange,
  valid,
  busy,
  onSend,
}: {
  value: string;
  onChange: (value: string) => void;
  valid: boolean;
  busy: boolean;
  onSend: () => void;
}) {
  const [rejected, setRejected] = useState(false);

  function trySend() {
    if (!valid) {
      setRejected(true);
      window.setTimeout(() => setRejected(false), 700);
      return;
    }
    onSend();
  }

  return (
    <div className="flex flex-col">
      <textarea
        value={value}
        rows={4}
        placeholder="Jelaskan deskripsi mulai dari angle, topik dan visual brief"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey) return;
          event.preventDefault();
          trySend();
        }}
        className={cn(
          "min-h-[100px] w-full resize-y rounded-lg bg-zinc-900/[0.06] px-3.5 py-2.5 text-[15px] leading-6 outline-none transition-all duration-300 placeholder:text-zinc-500 hover:bg-zinc-900/[0.09] hover:ring-1 hover:ring-brand/30 focus:ring-2 focus:ring-brand/20 dark:bg-white/5 dark:placeholder:text-zinc-500 dark:hover:bg-white/[0.08]",
          rejected && "animate-pulse ring-2 ring-red-400",
        )}
      />
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-900/10 pt-3 dark:border-white/10">
        <span className="text-xs text-zinc-500 dark:text-zinc-400" aria-live="polite">
          {value.length === 0 ? `Minimal ${MIN_DESCRIPTION} karakter` : `${value.length} karakter`}
        </span>
        <Button
          isIconOnly
          aria-label="Lanjut ke finalisasi prompt"
          isDisabled={busy}
          onPress={trySend}
          className="rounded-full"
        >
          <SendIcon width={18} height={18} />
        </Button>
      </div>
      {rejected ? (
        <p className="mt-1.5 text-[11px] text-red-500" role="alert">
          Deskripsi masih kurang dari {MIN_DESCRIPTION} karakter.
        </p>
      ) : null}
    </div>
  );
}

/** Kartu final prompt — badge di kiri atas + teks prompt (bisa diedit). */
function PromptCard({
  prompt,
  editing,
  onChange,
  exhausted,
}: {
  prompt: string;
  editing: boolean;
  onChange: (value: string) => void;
  exhausted: boolean;
}) {
  return (
    <div className="glass-panel card-in flex flex-col gap-2 rounded-lg px-6 py-4">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-zinc-900/10 bg-zinc-900/[0.04] px-2.5 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
          Final Prompt
        </span>
        <span className="rounded-full bg-amber-500/15 px-2.5 py-2 text-xs font-semibold text-amber-600 dark:text-amber-300">
          {exhausted ? "Kuota Habis" : "Butuh Validasi"}
        </span>
      </div>
      {editing ? (
        <textarea
          value={prompt}
          rows={6}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Edit final prompt"
          className="min-h-[120px] w-full resize-y rounded-lg bg-zinc-900/[0.06] px-3.5 py-2.5 text-[15px] leading-[22px] outline-none transition-all duration-300 hover:bg-zinc-900/[0.09] hover:ring-1 hover:ring-brand/30 focus:ring-2 focus:ring-brand/20 dark:bg-white/5 dark:hover:bg-white/[0.08]"
        />
      ) : (
        <p className="whitespace-pre-wrap text-[15px] leading-[22px] text-foreground">{prompt}</p>
      )}
    </div>
  );
}

/** Kartu hasil (node 828:27247) — area gambar 400px + tombol Regenerate di tengah. */
function ResultCard({
  items,
  busy,
  onRegenerate,
  onOpen,
}: {
  items: GenerationDTO[];
  busy: boolean;
  onRegenerate: () => void;
  onOpen: (item: GenerationDTO) => void;
}) {
  const withImage = items.filter((item) => item.thumbnailUrl || item.fileUrl);
  return (
    <div className="glass-card card-in flex flex-col gap-5 rounded-2xl p-5">
      <div className="flex h-[400px] items-center justify-center gap-3 overflow-x-auto rounded-xl bg-zinc-900/[0.06] p-4 dark:bg-white/5">
        {withImage.length > 0 ? (
          withImage.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item)}
              aria-label="Buka hasil gambar"
              className="relative aspect-[4/5] h-full shrink-0 overflow-hidden rounded-lg bg-zinc-800"
            >
              <Image
                src={(item.thumbnailUrl ?? item.fileUrl) as string}
                alt={item.prompt}
                fill
                unoptimized
                className="object-cover"
              />
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-6 text-center">
            <p className="text-sm font-bold">Tentukan Visual Anda</p>
            <p className="max-w-sm text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Pilih gambar dari galeri aset, unggah langsung dari perangkat, atau generate tampilan baru sesuai
              keinginan Anda.
            </p>
            {busy ? (
              <LoaderIcon width={20} height={20} className="animate-spin mt-2 text-brand" />
            ) : null}
          </div>
        )}
      </div>
      <div className="flex justify-center">
        <Button variant="secondary" onPress={onRegenerate} isDisabled={busy}>
          <RefreshIcon width={16} height={16} />
          Regenerate
        </Button>
      </div>
    </div>
  );
}

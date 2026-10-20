"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "@heroui/react";
import { apiFetch, ClientError, post } from "@/lib/client";
import { cn } from "@/lib/utils";
import { CheckIcon, DownloadIcon, LoaderIcon, SaveIcon, SendIcon } from "@/components/ui/icons";
import type { GenerationDTO, QuotaDTO, VideoParams } from "@/types";
import {
  VIDEO_GUIDED_CONTENT_KINDS,
  VIDEO_GUIDED_FORMATS,
  guidedVideoParams,
  type VideoGuidedContentKind,
  type VideoGuidedFormat,
} from "../../../config/generation";
import { DetailModal } from "./detail-modal";
import type { ComposerAttachment } from "./composer";

const MIN_DESCRIPTION = 10;
const STEP_TRANSITION_MS = 600;
const JURNALISM_STORAGE_KEY = "aistudio:jurnalism:video";

type JurnalismEntry = {
  id: string;
  prompt: string;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  savedAt: string;
};

function fileNameFromDisposition(response: Response): string | null {
  const header = response.headers.get("content-disposition") ?? "";
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match?.[1] ?? null;
}

const Q1 = "Format rasio apa yang kamu inginkan?";
const Q2 = "Tipe konten video apa yang ingin kamu buat?";
const Q3 = "Masukkan deskripsi video dan arahan visual";

type Option = { value: string; label: string; hint?: string; disabled?: boolean };
type Pending = 2 | 3 | "final" | null;
type EditingStep = 1 | 2 | 3 | null;

function buildSingleVideoPrompt(
  context: string,
  description: string,
  format: VideoGuidedFormat | null,
  contentKind: VideoGuidedContentKind | null,
): string {
  const formatLabel = VIDEO_GUIDED_FORMATS.find((item) => item.value === format)?.label ?? "Landscape (16:9)";
  const kindLabel = VIDEO_GUIDED_CONTENT_KINDS.find((item) => item.value === contentKind)?.label ?? "Short Video";
  return [
    `Buat video sinematik tentang "${context.trim()}".`,
    description.trim(),
    `Format rasio ${formatLabel} dengan tipe ${kindLabel}.`,
    "Gunakan pencahayaan profesional, pergerakan kamera stabil dan terarah, visual beresolusi tinggi, serta narasi visual yang menarik perhatian.",
  ].join(" ");
}

function buildExplainerVideoPrompts(
  context: string,
  description: string,
  format: VideoGuidedFormat | null,
): string[] {
  const formatLabel = VIDEO_GUIDED_FORMATS.find((item) => item.value === format)?.label ?? "Landscape (16:9)";
  return [
    `Scene 1 (Opening / Hook): Video pembuka tentang "${context.trim()}". ${description.trim()}. Format ${formatLabel}, pergerakan kamera zoom-in dinamis, hook visual yang memikat dalam 3 detik pertama dengan pencahayaan kuat.`,
    `Scene 2 (Core Content / Explainer): Pembahasan inti tentang "${context.trim()}". ${description.trim()}. Format ${formatLabel}, pergerakan kamera panning stabil, fokus pada aksi subjek dan penjelasan visual yang terstruktur dan mudah dipahami.`,
    `Scene 3 (Closing / CTA): Penutup video tentang "${context.trim()}". ${description.trim()}. Format ${formatLabel}, visual kesimpulan bersih dengan transisi halus, mempertegas pesan utama dan ajakan bertindak (call to action).`,
  ];
}

const PENDING_LABEL: Record<Exclude<Pending, null>, string> = {
  2: "Menyiapkan pilihan tipe video…",
  3: "Menyiapkan input deskripsi visual…",
  final: "Menyusun prompt video…",
};

export function GuidedVideoFlow({
  context,
  attachment,
  quota: _quota,
  onExit,
  onGenerated,
}: {
  context: string;
  attachment?: ComposerAttachment | null;
  quota: QuotaDTO | null;
  onExit: () => void;
  onGenerated?: () => void;
}) {
  const [format, setFormat] = useState<VideoGuidedFormat | null>(null);
  const [contentKind, setContentKind] = useState<VideoGuidedContentKind | null>(null);
  const [description, setDescription] = useState("");
  const [editingStep, setEditingStep] = useState<EditingStep>(1);
  const [revealed, setRevealed] = useState({ step2: false, step3: false, final: false });
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const [promptEditing, setPromptEditing] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<string[] | null>(null);
  const [results, setResults] = useState<GenerationDTO[]>([]);
  const [selected, setSelected] = useState<GenerationDTO | null>(null);
  const [downloading, setDownloading] = useState(false);

  const descriptionValid = description.trim().length >= MIN_DESCRIPTION;

  const defaultPrompts = useMemo(() => {
    if (contentKind === "explainer") {
      return buildExplainerVideoPrompts(context, description, format);
    }
    return [buildSingleVideoPrompt(context, description, format, contentKind)];
  }, [context, description, format, contentKind]);

  const prompts = customPrompts ?? defaultPrompts;

  const formatLabel = VIDEO_GUIDED_FORMATS.find((item) => item.value === format)?.label ?? "Belum dipilih";
  const kindLabel = VIDEO_GUIDED_CONTENT_KINDS.find((item) => item.value === contentKind)?.label ?? "Belum dipilih";
  const hasResults = results.length > 0;

  function updatePrompt(index: number, val: string) {
    setCustomPrompts((prev) => {
      const arr = prev ? [...prev] : [...defaultPrompts];
      arr[index] = val;
      return arr;
    });
  }

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
    setFormat(value as VideoGuidedFormat);
    advance(2);
  }

  function selectKind(value: string) {
    if (pending) return;
    setContentKind(value as VideoGuidedContentKind);
    advance(3);
  }

  function sendDescription() {
    if (pending || !descriptionValid) return;
    advance("final");
  }

  function toggleEditPrompt() {
    if (!promptEditing && !customPrompts) {
      setCustomPrompts([...defaultPrompts]);
    }
    setPromptEditing((prev) => !prev);
  }

  async function generate() {
    if (busy || !format || !contentKind || !descriptionValid) return;
    setBusy(true);
    setPromptEditing(false);
    try {
      const selectedKind = VIDEO_GUIDED_CONTENT_KINDS.find((k) => k.value === contentKind);
      const count = selectedKind?.sceneCount ?? 1;
      const params = guidedVideoParams(format, 5, "720p");
      const items: GenerationDTO[] = [];

      for (let index = 0; index < count; index += 1) {
        const promptToUse = prompts[index] ?? prompts[0];
        const result = await post<{ generation: GenerationDTO; quota: QuotaDTO }>("/api/generations", {
          type: "video",
          prompt: promptToUse,
          params,
        });
        items.push(result.generation);
      }

      setResults(items);
      onGenerated?.();
      await pollUntilDone(items.map((item) => item.id));
    } catch (err) {
      toast.danger(err instanceof ClientError ? err.message : "Gagal memulai generate video.");
    } finally {
      setBusy(false);
    }
  }

  async function regenerateItem(index: number) {
    if (busy || !format) return;
    const oldItem = results[index];
    if (!oldItem) return;
    try {
      const params = guidedVideoParams(format, 5, "720p");
      const promptToUse = prompts[index] ?? oldItem.prompt;
      const result = await post<{ generation: GenerationDTO; quota: QuotaDTO }>("/api/generations", {
        type: "video",
        prompt: promptToUse,
        params,
      });
      setResults((prev) => {
        const next = [...prev];
        next[index] = result.generation;
        return next;
      });
      toast.success(`Video ${index + 1} sedang di-generate ulang.`);
      await pollUntilDone([result.generation.id]);
    } catch (err) {
      toast.danger(err instanceof ClientError ? err.message : "Gagal me-regenerate video.");
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

  async function downloadResults() {
    const targets = results.filter((item) => Boolean(item.fileUrl));
    if (targets.length === 0) {
      toast.danger("Belum ada video yang siap diunduh.");
      return;
    }
    setDownloading(true);
    try {
      for (const item of targets) {
        const fileUrl = item.fileUrl;
        if (!fileUrl) continue;

        let blob: Blob;
        let filename = `video-${item.id.slice(0, 8)}.mp4`;

        try {
          const response = await fetch(`/api/generations/${item.id}/download`);
          if (response.ok) {
            blob = await response.blob();
            filename = fileNameFromDisposition(response) ?? filename;
          } else {
            const directResp = await fetch(fileUrl);
            blob = await directResp.blob();
          }
        } catch {
          const directResp = await fetch(fileUrl);
          blob = await directResp.blob();
        }

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
      toast.success(
        targets.length > 1 ? `${targets.length} video berhasil diunduh ke perangkat.` : "Video berhasil diunduh ke perangkat.",
      );
    } catch (err) {
      toast.danger(err instanceof ClientError ? err.message : "Gagal mengunduh file video.");
    } finally {
      setDownloading(false);
    }
  }

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
      toast.success("Berhasil disimpan di Data Jurnalism.");
      onGenerated?.();

      window.setTimeout(() => {
        onExit();
      }, 500);
    } catch {
      toast.danger("Gagal menyimpan ke Data Jurnalism.");
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // TAMPILAN HALAMAN HASIL GENERATE VIDEO (FIGMA 828:27247)
  // ══════════════════════════════════════════════════════════════════
  if (hasResults) {
    return (
      <div className="mx-auto flex flex-1 w-full max-w-[760px] flex-col gap-6 pb-6 animate-in fade-in duration-300">
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={() => setResults([])}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            ← Kembali
          </button>
        </div>

        <header className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-[48px] md:leading-[52px]">
            Generate Video
          </h1>
          <p className="max-w-2xl text-xs sm:text-base leading-relaxed text-zinc-400">
            Generate video kini makin mudah dengan mode panduan memberikan output yang lebih maksimal tanpa harus bikin
            prompt yang panjang
          </p>
        </header>

        <div className="flex flex-col gap-5 w-full">
          {results.map((item, index) => (
            <GeneratedVideoCard
              key={item.id}
              item={item}
              index={index}
              total={results.length}
              busy={busy}
              onRegenerate={() => void regenerateItem(index)}
              onOpen={setSelected}
            />
          ))}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => void downloadResults()}
              disabled={downloading || busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#171717] px-4 py-2 text-xs font-normal text-white transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              <DownloadIcon width={14} height={14} />
              {downloading ? "Mengunduh…" : "Download Aset"}
            </button>
            <button
              type="button"
              onClick={saveToDataJurnalism}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-medium text-[#0F0F0F] transition-all hover:bg-zinc-200 active:scale-95 disabled:opacity-50"
            >
              Simpan ke Data Jurnalism
            </button>
          </div>
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

  // ══════════════════════════════════════════════════════════════════
  // TAMPILAN GUIDED QUESTIONNAIRE & PROMPT RESULT VIDEO (FIGMA 782:24676 & 828:26960)
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="mx-auto flex flex-1 w-full max-w-[760px] flex-col justify-between gap-6 pb-0">
      <div className="flex flex-col gap-6 w-full shrink-0">
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-brand-strong dark:text-zinc-400 dark:hover:text-brand"
          >
            ← Kembali
          </button>
        </div>

        <header className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-[48px] md:leading-[52px]">
            Generate Video
          </h1>
          <p className="max-w-2xl text-xs sm:text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
            Generate video kini makin mudah dengan mode panduan memberikan output yang lebih maksimal tanpa harus bikin
            prompt yang panjang
          </p>
        </header>

        <div className="flex w-full flex-col gap-2">
          {/* Kartu Konteks Input */}
          <div className="flex w-full items-center justify-between gap-4 rounded-lg bg-[#1A1A1A] px-6 py-4 border border-white/10 text-white shadow-sm transition-all duration-200">
            <p className="text-[15px] font-normal leading-[22px] text-white flex-1">{context}</p>
            {attachment?.fileUrl ? (
              <div className="relative h-[62px] w-[62px] shrink-0 overflow-hidden rounded-lg border border-white/15 bg-zinc-800">
                <Image
                  src={attachment.fileUrl}
                  alt={attachment.name || "Attachment"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : null}
          </div>

          {/* Langkah 1 yang sudah dipilih (CollapsedStep) */}
          {revealed.step2 && editingStep !== 1 ? (
            <CollapsedStep step={1} question={Q1} answer={formatLabel} onEdit={() => setEditingStep(1)} />
          ) : null}

          {/* Langkah 2 yang sudah dipilih (CollapsedStep) */}
          {revealed.step3 && editingStep !== 2 ? (
            <CollapsedStep step={2} question={Q2} answer={kindLabel} onEdit={() => setEditingStep(2)} />
          ) : null}

          {/* Langkah 3 yang sudah diisi (CollapsedStep) */}
          {revealed.final && editingStep !== 3 ? (
            <CollapsedStep step={3} question={Q3} answer={description} onEdit={() => setEditingStep(3)} />
          ) : null}

          {/* ── PROMPT RESULT TEPAT DI BAWAH STEP 3 (Figma 828:26960) ── */}
          {revealed.final && !hasResults && !editingStep ? (
            <div className="flex flex-col gap-2 pt-0 w-full animate-in fade-in duration-300">
              {busy ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg bg-[#1A1A1A] p-8 border border-white/10 text-center">
                  <LoaderIcon width={32} height={32} className="animate-spin text-brand" />
                  <p className="text-sm font-medium text-white">Sedang men-generate video…</p>
                  <p className="text-xs text-zinc-400">
                    {contentKind === "explainer"
                      ? "Menyiapkan 3 adegan/scene video sesuai prompt brief."
                      : "Menyiapkan video sinematik sesuai prompt brief."}
                  </p>
                </div>
              ) : (
                <>
                  {prompts.map((promptText, idx) => (
                    <PromptResultCard
                      key={idx}
                      index={idx}
                      total={prompts.length}
                      prompt={promptText}
                      editing={promptEditing}
                      onChange={(val) => updatePrompt(idx, val)}
                    />
                  ))}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={toggleEditPrompt}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#171717] px-4 py-2 text-xs font-normal text-white transition-colors hover:bg-white/10"
                    >
                      {promptEditing ? "Selesai Edit" : "Edit Prompt"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void generate()}
                      disabled={busy || !descriptionValid}
                      className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-medium text-[#0F0F0F] transition-all hover:bg-zinc-200 active:scale-95 disabled:opacity-50"
                    >
                      Generate Video
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {pending ? (
        <div className="w-full">
          <StepLoader label={PENDING_LABEL[pending]} />
        </div>
      ) : null}

      {!hasResults && editingStep ? (
        <div className="mt-auto w-full shrink-0 pb-0">
          <div className="card-in transition-all duration-300">
            {editingStep === 1 ? (
              <StepComposer step={1} question={Q1}>
                <OptionGrid
                  options={VIDEO_GUIDED_FORMATS as Option[]}
                  value={format}
                  disabled={Boolean(pending)}
                  onChange={selectFormat}
                />
              </StepComposer>
            ) : null}

            {editingStep === 2 ? (
              <StepComposer step={2} question={Q2}>
                <OptionGrid
                  options={VIDEO_GUIDED_CONTENT_KINDS as Option[]}
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
          </div>
        </div>
      ) : null}

      <DetailModal
        item={selected}
        onClose={() => setSelected(null)}
        onSimilar={() => setSelected(null)}
        onDeleted={() => setSelected(null)}
      />
    </div>
  );
}

function StepLoader({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="card-in flex items-center gap-3 rounded-xl bg-[#1A1A1A] border border-white/10 px-5 py-3.5 transition-all duration-300"
    >
      <LoaderIcon width={16} height={16} className="animate-spin text-brand" />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="shimmer h-2.5 w-1/3 rounded-full" />
        <div className="shimmer h-2.5 w-1/2 rounded-full" />
      </div>
      <span className="shrink-0 text-xs text-zinc-400">{label}</span>
    </div>
  );
}

function CollapsedStep({
  step,
  question,
  answer,
  onEdit,
}: {
  step: 1 | 2 | 3;
  question: string;
  answer: string;
  onEdit: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="group flex w-full items-center justify-between gap-4 rounded-lg bg-[#1A1A1A] px-6 py-4 border border-white/10 text-left transition-all duration-200 hover:border-white/20 active:scale-[0.99]"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-400">
          Step {step}
        </span>
        <span className="truncate text-xs sm:text-sm text-zinc-400">{question}</span>
      </div>
      <span className="shrink-0 text-[15px] font-normal leading-[22px] text-white">
        {answer}
      </span>
    </button>
  );
}

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
    <div className="flex flex-col gap-4 rounded-2xl bg-[#1A1A1A] p-5 border border-white/10 shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-zinc-300">
          Step {step}
        </span>
        <span className="text-[15px] font-semibold text-white">{question}</span>
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
    <div role="group" className="flex flex-col gap-2">
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
              "flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left text-[15px] leading-[22px] transition-all duration-200",
              selected
                ? "bg-brand/20 text-white ring-1 ring-brand/50 shadow-sm"
                : "bg-white/[0.04] text-white hover:bg-white/[0.08] hover:translate-x-0.5",
              optionDisabled && "cursor-not-allowed opacity-50",
            )}
          >
            <span className="font-normal text-white">
              {letter}. {option.label}
            </span>
            {option.hint ? (
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-normal text-zinc-400">
                {option.hint}
              </span>
            ) : selected ? (
              <CheckIcon width={16} height={16} className="text-brand" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

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
    <div className="flex flex-col gap-3">
      <textarea
        value={value}
        rows={4}
        placeholder="Jelaskan deskripsi video, aksi subjek, pergerakan kamera, dan suasana visual"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey) return;
          event.preventDefault();
          trySend();
        }}
        className={cn(
          "min-h-[100px] w-full resize-y rounded-lg bg-white/[0.04] px-4 py-3 text-[15px] leading-relaxed text-white outline-none focus:outline-none focus:ring-1 focus:ring-white/20 border border-transparent focus:border-white/20 transition-all duration-200 placeholder:text-zinc-500 hover:bg-white/[0.07]",
          rejected && "animate-pulse ring-2 ring-red-400",
        )}
      />
      <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
        <span className="text-xs text-zinc-400" aria-live="polite">
          {value.length === 0 ? `Minimal ${MIN_DESCRIPTION} karakter` : `${value.length} karakter`}
        </span>
        <button
          type="button"
          aria-label="Lanjut ke finalisasi prompt video"
          disabled={busy}
          onClick={trySend}
          className="inline-flex size-10 items-center justify-center rounded-full bg-white text-zinc-900 transition-transform active:scale-95 hover:bg-zinc-200 disabled:opacity-50"
        >
          <SendIcon width={18} height={18} />
        </button>
      </div>
      {rejected ? (
        <p className="text-[11px] text-red-500" role="alert">
          Deskripsi masih kurang dari {MIN_DESCRIPTION} karakter.
        </p>
      ) : null}
    </div>
  );
}

function PromptResultCard({
  index,
  total,
  prompt,
  editing,
  onChange,
}: {
  index: number;
  total: number;
  prompt: string;
  editing: boolean;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-2 rounded-lg bg-[#1A1A1A] p-4 sm:px-6 sm:py-4 border border-white/10 text-white shadow-sm transition-all duration-200">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-400">
          Prompt Video
        </span>
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-400">
          {total > 1 ? `Scene ${index + 1}` : "Butuh Validasi"}
        </span>
      </div>
      {editing ? (
        <textarea
          value={prompt}
          rows={total > 1 ? 4 : 5}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`Edit prompt video scene ${index + 1}`}
          className="w-full resize-y rounded-lg bg-black/40 p-3 text-[15px] leading-relaxed text-white outline-none border border-transparent focus:border-white/20 transition-all duration-200"
        />
      ) : (
        <p className="text-[15px] font-normal leading-[22px] text-white whitespace-pre-wrap">{prompt}</p>
      )}
    </div>
  );
}

function GeneratedVideoCard({
  item,
  index,
  busy,
  onRegenerate,
  onOpen,
}: {
  item: GenerationDTO;
  index: number;
  total: number;
  busy: boolean;
  onRegenerate: () => void;
  onOpen: (item: GenerationDTO) => void;
}) {
  const [title, setTitle] = useState(`Video ${index + 1}`);
  const hasFile = Boolean(item.fileUrl);

  return (
    <div className="flex w-full flex-col md:flex-row gap-5 rounded-2xl bg-[#171717] border border-white/10 p-5 shadow-lg transition-all duration-200">
      {/* Kolom Kiri: Video Preview (tinggi 335px) */}
      <div className="relative flex h-[335px] w-full md:w-[340px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#262626]">
        {hasFile ? (
          <video
            src={item.fileUrl!}
            poster={item.thumbnailUrl ?? undefined}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-cover rounded-xl"
          />
        ) : item.status === "processing" || item.status === "queued" ? (
          <div className="flex flex-col items-center gap-2 text-zinc-400 p-6 text-center">
            <LoaderIcon width={28} height={28} className="animate-spin text-brand" />
            <span className="text-xs">Sedang merender video…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 p-6 text-center">
            <span className="text-sm font-bold text-zinc-200">Tentukan Visual Video</span>
            <p className="text-xs leading-relaxed text-zinc-400">
              Video berhasil dibuat dan dapat diputar langsung di sini atau diunduh ke perangkat Anda.
            </p>
          </div>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={onRegenerate}
          className="absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1.5 rounded-2xl border border-[#DEDEE0] bg-[#EBEBEC] px-3 py-1.5 text-xs font-medium text-[#18181B] shadow-sm transition-all hover:bg-white active:scale-95 disabled:opacity-50"
        >
          Regenerate
        </button>
      </div>

      {/* Kolom Kanan: Detail Judul & Prompt Video */}
      <div className="flex flex-1 flex-col justify-center gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`video-title-${item.id}`} className="text-xs font-normal text-zinc-400">
            Judul pada video
          </label>
          <input
            id={`video-title-${item.id}`}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-8 w-full rounded-md bg-[#262626] border border-white/10 px-3 text-sm text-white outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <label htmlFor={`video-prompt-${item.id}`} className="text-xs font-normal text-zinc-400">
            Prompt Video
          </label>
          <textarea
            id={`video-prompt-${item.id}`}
            readOnly
            rows={7}
            value={item.prompt}
            className="w-full flex-1 resize-none rounded-md bg-[#262626] border border-white/10 p-3 text-xs leading-relaxed text-zinc-200 outline-none"
          />
        </div>

        {hasFile ? (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="text-xs text-zinc-400 hover:text-white underline transition-colors"
            >
              Lihat Detail Video
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

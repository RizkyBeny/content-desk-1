"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { Button } from "@heroui/react";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronRightIcon, ImageIcon, PlusIcon, XIcon } from "@/components/ui/icons";
import type { ImageParams, QuotaDTO } from "@/types";
import {
  IMAGE_GUIDED_CONTENT_KINDS,
  IMAGE_GUIDED_FORMATS,
  PROMPT_LIMITS,
  guidedImageFormatFromRatio,
  guidedImageParams,
  type ImageGuidedContentKind,
  type ImageGuidedFormat,
} from "../../../config/generation";
import type { ComposerAttachment } from "./composer";
import { QuotaBadge } from "./quota-badge";

const MIN_DESCRIPTION = 10;
const DEFAULT_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export interface GuidedImageSeed {
  description: string;
  aspectRatio: string;
  contentKind?: ImageGuidedContentKind;
  quality?: ImageParams["quality"];
  startAtReview?: boolean;
}

export interface GuidedImageSubmission {
  prompt: string;
  params: ImageParams;
  attachment: ComposerAttachment | null;
}

type Step = 1 | 2 | 3 | "review";

export function GuidedImageComposer({
  busy = false,
  quota,
  exhausted,
  seed,
  attachment,
  attachAccept = DEFAULT_ACCEPT,
  onAttachFile,
  onRemoveAttachment,
  onAttachmentModeChange,
  onSubmit,
}: {
  busy?: boolean;
  quota: QuotaDTO | null;
  exhausted?: boolean;
  seed?: GuidedImageSeed | null;
  attachment: ComposerAttachment | null;
  attachAccept?: string;
  onAttachFile?: (file: File) => void;
  onRemoveAttachment?: () => void;
  onAttachmentModeChange?: (mode: "edit" | "reference") => void;
  onSubmit: (submission: GuidedImageSubmission) => Promise<boolean>;
}) {
  const seededKind = seed?.contentKind === "carousel" ? "single" : seed?.contentKind ?? null;
  const seededDescription = seed?.description ?? "";
  const [format, setFormat] = useState<ImageGuidedFormat | null>(() =>
    seed ? guidedImageFormatFromRatio(seed.aspectRatio) : null,
  );
  const [contentKind, setContentKind] = useState<ImageGuidedContentKind | null>(seededKind);
  const [description, setDescription] = useState(seededDescription);
  const [activeStep, setActiveStep] = useState<Step>(() =>
    seed?.startAtReview && seededDescription.trim().length >= MIN_DESCRIPTION ? "review" : 1,
  );
  const [error, setError] = useState<string | null>(null);
  const attachInputRef = useRef<HTMLInputElement | null>(null);

  const quality = seed?.quality ?? "medium";
  const selectedFormat = IMAGE_GUIDED_FORMATS.find((option) => option.value === format) ?? null;
  const selectedKind = IMAGE_GUIDED_CONTENT_KINDS.find((option) => option.value === contentKind) ?? null;
  const trimmedDescription = description.trim();
  const descriptionValid = trimmedDescription.length >= MIN_DESCRIPTION;
  const canSubmit = Boolean(format && contentKind && descriptionValid && !busy && !exhausted);

  function reset() {
    setFormat(null);
    setContentKind(null);
    setDescription("");
    setActiveStep(1);
    setError(null);
    onRemoveAttachment?.();
  }

  async function submit() {
    if (busy || exhausted) return;
    if (!format) {
      setActiveStep(1);
      return;
    }
    if (!contentKind) {
      setActiveStep(2);
      return;
    }
    if (!descriptionValid) {
      setActiveStep(3);
      setError(`Deskripsi minimal ${MIN_DESCRIPTION} karakter.`);
      return;
    }
    setError(null);
    try {
      const ok = await onSubmit({
        prompt: trimmedDescription,
        params: guidedImageParams(format, quality),
        attachment,
      });
      if (ok) reset();
    } catch {
      setError("Gagal memulai generate. Coba lagi.");
    }
  }

  function nextFrom(step: 1 | 2) {
    if (step === 1 && !format) return;
    if (step === 2 && !contentKind) return;
    setError(null);
    setActiveStep(step === 1 ? 2 : 3);
  }

  function onDescriptionKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || (!event.metaKey && !event.ctrlKey)) return;
    event.preventDefault();
    if (!descriptionValid) {
      setError(`Deskripsi minimal ${MIN_DESCRIPTION} karakter.`);
      return;
    }
    setError(null);
    setActiveStep("review");
  }

  const stepOneSummary = selectedFormat?.label ?? "Belum dipilih";
  const stepTwoSummary = selectedKind?.label ?? "Belum dipilih";
  const stepThreeSummary = trimmedDescription || "Belum diisi";

  return (
    <section className="mx-auto w-full max-w-[760px] py-4">
      <header className="mx-auto mb-6 flex max-w-2xl flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-bold tracking-[-0.025em] sm:text-4xl md:text-[48px] md:leading-[52px]">
          Generate Image
        </h1>
        <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400 sm:text-base">
          Generate gambar kini makin mudah dengan mode panduan, memberikan output yang lebih maksimal tanpa harus
          bikin prompt yang panjang.
        </p>
      </header>

      {exhausted && activeStep !== "review" ? (
        <p className="mb-3 text-center text-xs text-red-500" role="alert">
          Kuota harian habis. Reset pukul 00.00 WIB.
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <StepShell
          step={1}
          title="Format apa yang kamu inginkan?"
          active={activeStep === 1}
          summary={stepOneSummary}
          onEdit={() => setActiveStep(1)}
        >
          <div role="group" aria-label="Pilih format gambar" className="flex flex-col gap-1">
            {IMAGE_GUIDED_FORMATS.map((option, index) => {
              const selected = format === option.value;
              return (
                <ChoiceRow
                  key={option.value}
                  letter={String.fromCharCode(65 + index)}
                  label={option.label}
                  selected={selected}
                  disabled={busy}
                  onPress={() => setFormat(option.value)}
                />
              );
            })}
          </div>
          <StepFooter
            hint="Pilih salah satu format."
            nextLabel="Lanjut ke jenis konten"
            disabled={!format || busy}
            onNext={() => nextFrom(1)}
          />
        </StepShell>

        {activeStep !== 1 ? (
          <StepShell
            step={2}
            title="Jenis konten apa yang ingin kamu bikin?"
            active={activeStep === 2}
            summary={stepTwoSummary}
            onEdit={() => setActiveStep(2)}
          >
            <div role="group" aria-label="Pilih jenis konten" className="flex flex-col gap-1">
              {IMAGE_GUIDED_CONTENT_KINDS.map((option, index) => (
                <ChoiceRow
                  key={option.value}
                  letter={String.fromCharCode(65 + index)}
                  label={option.label}
                  selected={contentKind === option.value}
                  disabled={busy || option.disabled}
                  hint={option.hint}
                  onPress={() => setContentKind(option.value)}
                />
              ))}
            </div>
            <StepFooter
              hint="Pilih jenis konten yang akan dibuat."
              nextLabel="Lanjut ke deskripsi"
              disabled={!contentKind || busy}
              onNext={() => nextFrom(2)}
            />
          </StepShell>
        ) : null}

        {activeStep === 3 || activeStep === "review" ? (
          <StepShell
            step={3}
            title="Masukkan deskripsi image/gambar yang ingin dibuat"
            active={activeStep === 3}
            summary={stepThreeSummary}
            onEdit={() => setActiveStep(3)}
          >
            <label htmlFor="guided-image-description" className="sr-only">
              Deskripsi gambar
            </label>
            <textarea
              id="guided-image-description"
              rows={4}
              maxLength={PROMPT_LIMITS.image}
              value={description}
              placeholder="Jelaskan deskripsi mulai dari angle, topik dan visual brief"
              onChange={(event) => {
                setDescription(event.target.value);
                if (error) setError(null);
              }}
              onKeyDown={onDescriptionKeyDown}
              className="min-h-[120px] w-full resize-y rounded-xl border border-zinc-900/10 bg-white/60 px-3 py-2.5 text-sm leading-6 outline-none transition-colors placeholder:text-zinc-500 focus:border-brand/50 focus:ring-2 focus:ring-brand/15 dark:border-white/10 dark:bg-zinc-900/40 dark:placeholder:text-zinc-500"
            />

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {onAttachFile ? (
                <>
                  <input
                    ref={attachInputRef}
                    type="file"
                    accept={attachAccept}
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) onAttachFile(file);
                      event.target.value = "";
                    }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={busy}
                    onPress={() => attachInputRef.current?.click()}
                  >
                    <PlusIcon width={15} height={15} />
                    Lampirkan referensi
                  </Button>
                </>
              ) : null}
              <span className="ml-auto text-[11px] text-zinc-500 dark:text-zinc-400">
                {description.length}/{PROMPT_LIMITS.image}
              </span>
            </div>

            {attachment ? (
              <AttachmentCard
                attachment={attachment}
                busy={busy}
                onRemove={onRemoveAttachment}
                onModeChange={onAttachmentModeChange}
              />
            ) : null}

            {description.length > 0 && !descriptionValid ? (
              <p className="mt-2 text-xs text-red-500">Minimal {MIN_DESCRIPTION} karakter.</p>
            ) : (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Jelaskan angle, topik, dan visual brief agar hasil lebih terarah.
              </p>
            )}

            <StepFooter
              hint="Tekan Ctrl/Cmd + Enter untuk lanjut."
              nextLabel="Lihat ringkasan"
              disabled={!descriptionValid || busy}
              onNext={() => {
                setError(null);
                setActiveStep("review");
              }}
            />
          </StepShell>
        ) : null}

        {activeStep === "review" ? (
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Siap dibuat?</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Periksa ringkasan di atas. Kamu masih bisa mengubah tiap langkah.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <QuotaBadge quota={quota} />
                <Button variant="secondary" onPress={reset} isDisabled={busy}>
                  Buat Ulang
                </Button>
                <Button variant="primary" onPress={submit} isDisabled={!canSubmit}>
                  {busy ? "Membuat..." : "Mulai Generate Image"}
                </Button>
              </div>
            </div>
            {exhausted ? (
              <p className="mt-3 text-xs text-red-500" role="alert">
                Kuota harian habis. Reset pukul 00.00 WIB.
              </p>
            ) : null}
            {error ? (
              <p className="mt-3 text-xs text-red-500" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function StepShell({
  step,
  title,
  active,
  summary,
  onEdit,
  children,
}: {
  step: 1 | 2 | 3;
  title: string;
  active: boolean;
  summary: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  const headingId = `guided-image-step-${step}-heading`;
  return (
    <section
      id={`guided-image-step-${step}`}
      aria-labelledby={headingId}
      aria-current={active ? "step" : undefined}
      className={cn(
        "glass-panel rounded-2xl p-4 transition-shadow",
        active && "ring-1 ring-brand/15 shadow-[0_10px_30px_-18px_color-mix(in_oklab,var(--brand)_55%,transparent)]",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="shrink-0 rounded-full bg-zinc-900/5 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
          Step {step}
        </span>
        {active ? (
          <h2 id={headingId} className="min-w-0 text-sm font-semibold">
            {title}
          </h2>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            aria-expanded={false}
            aria-label={`Edit Step ${step}: ${title}. Dipilih: ${summary}`}
            className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg text-left text-sm transition-colors hover:text-brand-strong sm:flex-row sm:items-center sm:gap-2 dark:hover:text-brand"
          >
            <span
              id={headingId}
              className="min-w-0 font-medium text-zinc-600 sm:truncate dark:text-zinc-300"
            >
              {title}
            </span>
            <span className="flex min-w-0 items-center gap-1.5 sm:ml-auto sm:shrink">
              <CheckIcon width={14} height={14} className="shrink-0 text-brand-strong dark:text-brand" />
              <span className="min-w-0 truncate text-xs text-zinc-500 sm:max-w-[220px] dark:text-zinc-400">
                {summary}
              </span>
              <ChevronRightIcon width={14} height={14} className="ml-auto shrink-0 text-zinc-400 sm:ml-0" />
            </span>
          </button>
        )}
      </div>
      {active ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

function ChoiceRow({
  letter,
  label,
  selected,
  disabled,
  hint,
  onPress,
}: {
  letter: string;
  label: string;
  selected: boolean;
  disabled?: boolean;
  hint?: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
        selected
          ? "border-brand/40 bg-brand/10 text-brand-strong dark:text-brand"
          : "border-transparent text-zinc-700 hover:bg-zinc-900/5 dark:text-zinc-200 dark:hover:bg-white/5",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
          selected
            ? "bg-brand-strong text-white"
            : "bg-zinc-900/5 text-zinc-500 dark:bg-white/10 dark:text-zinc-400",
        )}
      >
        {letter}
      </span>
      <span className="min-w-0 flex-1">{label}</span>
      {hint ? (
        <span className="rounded-full bg-zinc-900/5 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
          {hint}
        </span>
      ) : selected ? (
        <CheckIcon width={16} height={16} className="shrink-0" />
      ) : null}
    </button>
  );
}

function StepFooter({
  hint,
  nextLabel,
  disabled,
  onNext,
}: {
  hint: string;
  nextLabel: string;
  disabled: boolean;
  onNext: () => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-900/10 pt-3 dark:border-white/10">
      <p className="min-w-0 text-[11px] text-zinc-500 dark:text-zinc-400">{hint}</p>
      <Button
        isIconOnly
        size="sm"
        variant="primary"
        aria-label={nextLabel}
        isDisabled={disabled}
        onPress={onNext}
        className="shrink-0 rounded-full"
      >
        <ChevronRightIcon width={16} height={16} />
      </Button>
    </div>
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
    <div className="mt-3 flex items-center gap-3 rounded-xl border border-zinc-900/10 p-2 dark:border-white/10">
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

"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button, toast } from "@heroui/react";
import { apiFetch, ClientError, post } from "@/lib/client";
import { cn } from "@/lib/utils";
import { CheckIcon, LoaderIcon, RefreshIcon } from "@/components/ui/icons";
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

type Option = { value: string; label: string; hint?: string; disabled?: boolean };

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

/**
 * Guided mode halaman Create Image (Figma "Guided Step" — node 791:25181).
 *
 * Alur: brief → Step 1 Format → Step 2 Jenis konten → Step 3 Deskripsi →
 * Final Prompt (butuh validasi) → generate → kartu hasil (strip gambar +
 * Regenerate). Untuk carousel, dihasilkan 3 gambar sekaligus.
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
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [format, setFormat] = useState<ImageGuidedFormat | null>(null);
  const [contentKind, setContentKind] = useState<ImageGuidedContentKind | null>(null);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<GenerationDTO[]>([]);
  const [selected, setSelected] = useState<GenerationDTO | null>(null);

  const exhausted = quota ? quota.remaining <= 0 : false;
  const descriptionValid = description.trim().length >= MIN_DESCRIPTION;
  const allStepsDone = Boolean(format && contentKind && descriptionValid);
  const finalPrompt = useMemo(
    () => buildFinalPrompt(context, description, format, contentKind),
    [context, description, format, contentKind],
  );

  const formatLabel = IMAGE_GUIDED_FORMATS.find((item) => item.value === format)?.label ?? "Belum dipilih";
  const kindLabel = IMAGE_GUIDED_CONTENT_KINDS.find((item) => item.value === contentKind)?.label ?? "Belum dipilih";

  async function generate() {
    if (busy || exhausted || !format || !contentKind || !descriptionValid) return;
    setBusy(true);
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-brand-strong dark:text-zinc-400 dark:hover:text-brand"
        >
          ← Kembali
        </button>
        <QuotaBadge quota={quota} />
      </div>

      {/* Kartu context (brief) */}
      <div className="glass-panel rounded-lg px-4 py-4">
        <p className="text-sm">{context}</p>
      </div>

      {/* Step 1 — Format */}
      <StepCard
        step={1}
        question="Format apa yang kamu inginkan?"
        answer={formatLabel}
        active={activeStep === 1}
        onEdit={() => setActiveStep(1)}
      >
        <OptionGrid
          options={IMAGE_GUIDED_FORMATS as Option[]}
          value={format}
          onChange={(value) => {
            setFormat(value as ImageGuidedFormat);
            setActiveStep(2);
          }}
        />
      </StepCard>

      {/* Step 2 — Jenis konten */}
      {format ? (
        <StepCard
          step={2}
          question="Jenis konten apa yang ingin kamu bikin?"
          answer={kindLabel}
          active={activeStep === 2}
          onEdit={() => setActiveStep(2)}
        >
          <OptionGrid
            options={IMAGE_GUIDED_CONTENT_KINDS as Option[]}
            value={contentKind}
            onChange={(value) => {
              setContentKind(value as ImageGuidedContentKind);
              setActiveStep(3);
            }}
          />
        </StepCard>
      ) : null}

      {/* Step 3 — Deskripsi */}
      {contentKind ? (
        <StepCard
          step={3}
          question="Masukkan deskripsi image/gambar yang ingin dibuat"
          answer={description.trim() ? "Sudah diisi" : "Belum diisi"}
          active={activeStep === 3}
          onEdit={() => setActiveStep(3)}
        >
          <textarea
            value={description}
            rows={4}
            placeholder="Jelaskan deskripsi mulai dari angle, topik dan visual brief"
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-[120px] w-full resize-y rounded-xl border border-zinc-900/10 bg-white/60 px-3 py-2.5 text-sm leading-6 outline-none transition-colors placeholder:text-zinc-500 focus:border-brand/50 focus:ring-2 focus:ring-brand/15 dark:border-white/10 dark:bg-zinc-900/40 dark:placeholder:text-zinc-500"
          />
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            {description.length > 0 && !descriptionValid
              ? `Minimal ${MIN_DESCRIPTION} karakter.`
              : "Jelaskan angle, topik, dan visual brief agar hasil lebih terarah."}
          </p>
        </StepCard>
      ) : null}

      {/* Final Prompt */}
      {allStepsDone && results.length === 0 ? (
        <FinalPromptCard prompt={finalPrompt} busy={busy} onValidate={generate} />
      ) : null}

      {/* Hasil */}
      {results.length > 0 ? (
        <ResultCard items={results} busy={busy} onRegenerate={generate} onOpen={setSelected} />
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

function StepCard({
  step,
  question,
  answer,
  active,
  onEdit,
  children,
}: {
  step: 1 | 2 | 3;
  question: string;
  answer: string;
  active: boolean;
  onEdit: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass-panel rounded-lg p-4">
      <button
        type="button"
        onClick={onEdit}
        aria-expanded={active}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 rounded-full bg-zinc-900/5 px-2 py-0.5 text-xs text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
            Step {step}
          </span>
          <span className="truncate text-sm">{question}</span>
        </span>
        <span className="shrink-0 text-right text-sm font-medium">{answer}</span>
      </button>
      {active ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

function OptionGrid({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <div role="group" className="flex flex-col gap-1">
      {options.map((option) => {
        const selected = value === option.value;
        const disabled = Boolean(option.disabled);
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
              selected
                ? "border-brand/40 bg-brand/10 text-brand-strong dark:text-brand"
                : "border-transparent text-zinc-700 hover:bg-zinc-900/5 dark:text-zinc-200 dark:hover:bg-white/5",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <span>{option.label}</span>
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

function FinalPromptCard({ prompt, busy, onValidate }: { prompt: string; busy: boolean; onValidate: () => void }) {
  return (
    <div className="glass-card flex flex-col gap-3 rounded-lg p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-zinc-900/5 px-2 py-0.5 text-xs text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
          Final Prompt
        </span>
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-300">
          Butuh Validasi
        </span>
      </div>
      <p className="max-h-40 overflow-y-auto text-sm leading-6 text-zinc-600 dark:text-zinc-300">{prompt}</p>
      <div className="flex justify-end">
        <Button variant="primary" onPress={onValidate} isDisabled={busy}>
          {busy ? "Memproses..." : "Validasi & Generate"}
        </Button>
      </div>
    </div>
  );
}

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
  return (
    <div className="glass-card flex flex-col gap-5 rounded-2xl p-5">
      <div className="flex flex-col gap-4 rounded-xl bg-zinc-500/10 p-4 dark:bg-white/5">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold">Tentukan Visual Anda</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Pilih gambar dari galeri aset, unggah langsung dari perangkat, atau generate tampilan baru sesuai keinginan
            Anda.
          </p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item)}
              aria-label="Buka hasil gambar"
              className="relative aspect-[4/5] w-40 shrink-0 overflow-hidden rounded-lg bg-zinc-800"
            >
              {item.thumbnailUrl || item.fileUrl ? (
                <Image
                  src={(item.thumbnailUrl ?? item.fileUrl) as string}
                  alt={item.prompt}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-zinc-400">
                  <LoaderIcon className="animate-spin" width={20} height={20} />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="secondary" onPress={onRegenerate} isDisabled={busy}>
          <RefreshIcon width={16} height={16} />
          Regenerate
        </Button>
      </div>
    </div>
  );
}

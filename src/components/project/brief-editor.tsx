"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Chip, Spinner, toast } from "@heroui/react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { patch, post } from "@/lib/client";
import { cn } from "@/lib/utils";
import { getBriefSchema, type BriefSchema } from "../../../config/brief-schemas";
import { GlassCard, SectionHeader } from "@/components/ui/primitives";
import { EmptyBlock, SpinnerBlock } from "@/components/ui/states";
import {
  CheckIcon,
  DownloadIcon,
  GripIcon,
  ImageIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  SparkIcon,
  TrashIcon,
  XIcon,
} from "@/components/ui/icons";
import type { BriefDTO, BriefRow, BriefSummary, Caption, ContentType } from "@/types";

const SHOW_REVISI_AI = false;

/** Single image selalu satu baris; tipe lain boleh menambah/menghapus baris. */
const ADDABLE_TYPES: ContentType[] = ["carousel", "video", "audio", "article"];

/** Tipe yang bisa diurutkan ulang lewat drag & drop. */
const SORTABLE_TYPES: ContentType[] = ["carousel", "video", "audio", "article"];

const ROW_NOUN: Record<ContentType, string> = {
  image: "baris",
  carousel: "slide",
  video: "scene",
  audio: "segmen",
  article: "section",
};

/** Susun prompt generate per baris brief (selaras dengan alur Generate). */
function derivedPrompt(type: ContentType, row: BriefRow): string {
  if (type === "carousel") return [row.visual, row.judul, row.isi].filter(Boolean).join(". ");
  if (type === "audio") return row.naskah ?? "";
  if (type === "video") return row.visual ?? "";
  if (type === "article") return row.poin ?? "";
  return [row.elemenVisual, row.gaya, row.teks].filter(Boolean).join(". ");
}

const GRIP_CLASS =
  "inline-flex h-8 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 active:cursor-grabbing disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-zinc-300";

interface RowCellProps {
  row: BriefRow;
  ri: number;
  schema: BriefSchema;
  contentType: ContentType;
  isEditing: boolean;
  showActions: boolean;
  sortable: boolean;
  noun: string;
  updateCell: (rowIndex: number, key: string, value: string) => void;
  removeRow: (rowIndex: number) => void;
  canRemove: boolean;
  onStartEdit?: () => void;
}

/**
 * Kartu visual 2-kolom sesuai Figma node 799:44769:
 * - Kiri: Area visual preview / placeholder "Tentukan Visual Anda" + tombol "Pilih Gambar"
 * - Kanan: Judul pada gambar, Deskripsi pada gambar, dan Deskripsi Visual
 */
function BriefVisualCard(props: RowCellProps & { id: string }) {
  const {
    row,
    ri,
    contentType,
    schema,
    isEditing,
    showActions,
    sortable,
    noun,
    updateCell,
    removeRow,
    canRemove,
    onStartEdit,
    id,
  } = props;

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !sortable,
  });

  // Pemetaan kolom fleksibel berdasarkan content type
  const titleKey =
    schema.columns.find((c) => ["judul", "teks", "title"].includes(c.key))?.key ?? schema.columns[1]?.key ?? "judul";
  const bodyKey =
    schema.columns.find((c) => ["isi", "narasi", "teks_onscreen", "konten"].includes(c.key))?.key ??
    schema.columns[2]?.key ??
    "isi";
  const visualKey =
    schema.columns.find((c) => ["visual", "elemenVisual"].includes(c.key))?.key ?? schema.columns[3]?.key ?? "visual";

  const titleVal = row[titleKey] ?? "";
  const bodyVal = row[bodyKey] ?? "";
  const visualVal = row[visualKey] ?? "";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "glass-card relative flex flex-col gap-5 rounded-2xl p-5 transition-all duration-300 hover:border-zinc-300/80 dark:hover:border-white/20 lg:flex-row",
        isDragging && "z-10 opacity-70 shadow-2xl",
      )}
    >
      {/* Kolom Kiri: Visual Placeholder Container (Figma 799:44769) */}
      <div className="relative flex min-h-[280px] w-full flex-col justify-between overflow-hidden rounded-xl border border-zinc-200/70 bg-zinc-950/40 p-4 dark:border-white/10 dark:bg-black/40 lg:h-[335px] lg:w-[400px] lg:shrink-0">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300/80 bg-white/80 px-3 py-1 text-xs font-medium text-zinc-800 shadow-sm transition-colors hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
          >
            <ImageIcon width={14} height={14} />
            Pilih Gambar
          </button>
          <span className="rounded-md bg-zinc-900/40 px-2 py-0.5 text-[11px] font-medium text-zinc-400 capitalize">
            {noun} {ri + 1}
          </span>
        </div>

        <div className="my-auto flex flex-col items-center gap-1.5 py-6 text-center">
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-zinc-400">
            <ImageIcon width={20} height={20} />
          </div>
          <p className="text-sm font-bold tracking-tight text-foreground">Tentukan Visual Anda</p>
          <p className="max-w-[280px] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Pilih gambar dari galeri aset, unggah langsung dari perangkat, atau generate tampilan baru sesuai keinginan
            Anda.
          </p>
        </div>

        <div className="text-[10px] text-zinc-500 dark:text-zinc-500">Rasio {contentType === "video" ? "16:9" : "4:5"}</div>
      </div>

      {/* Kolom Kanan: Detail Konten Slide */}
      <div className="flex flex-1 flex-col justify-between gap-4">
        {/* Header baris / tindakan edit */}
        <div className="flex items-center justify-between gap-2 border-b border-zinc-200/50 pb-2 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand-strong dark:text-brand">
              {noun.toUpperCase()} {ri + 1}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {showActions ? (
              <>
                <Button
                  size="sm"
                  variant="danger-soft"
                  onPress={() => removeRow(ri)}
                  isDisabled={!canRemove}
                  aria-label={`Hapus ${noun} ${ri + 1}`}
                >
                  <TrashIcon width={16} height={16} />
                </Button>
                {sortable ? (
                  <button
                    type="button"
                    ref={setActivatorNodeRef}
                    {...attributes}
                    {...listeners}
                    aria-label={`Ubah urutan ${noun} ${ri + 1}`}
                    disabled={!canRemove}
                    className={GRIP_CLASS}
                  >
                    <GripIcon width={16} height={16} />
                  </button>
                ) : null}
              </>
            ) : onStartEdit ? (
              <Button size="sm" variant="secondary" onPress={onStartEdit}>
                <PencilIcon width={14} height={14} /> Edit
              </Button>
            ) : null}
          </div>
        </div>

        {/* Field 1: Judul pada gambar */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Judul pada gambar</label>
          {isEditing ? (
            <input
              value={titleVal}
              onChange={(e) => updateCell(ri, titleKey, e.target.value)}
              placeholder="Masukkan judul / headline..."
              className="w-full rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm font-medium text-foreground outline-none transition-colors focus:border-brand dark:border-white/10 dark:bg-zinc-900/70"
            />
          ) : (
            <div className="rounded-lg border border-zinc-200/50 bg-zinc-50/50 px-3 py-2 text-sm font-semibold text-foreground dark:border-white/5 dark:bg-zinc-900/40">
              {titleVal || <span className="text-zinc-400 italic font-normal">Belum ada judul</span>}
            </div>
          )}
        </div>

        {/* Field 2: Deskripsi pada gambar */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Deskripsi pada gambar</label>
          {isEditing ? (
            <textarea
              rows={2}
              value={bodyVal}
              onChange={(e) => updateCell(ri, bodyKey, e.target.value)}
              placeholder="Isi teks narasi slide..."
              className="w-full resize-y rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-brand dark:border-white/10 dark:bg-zinc-900/70"
            />
          ) : (
            <div className="rounded-lg border border-zinc-200/50 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-700 dark:border-white/5 dark:bg-zinc-900/40 dark:text-zinc-300">
              {bodyVal || <span className="text-zinc-400 italic">Belum ada deskripsi teks</span>}
            </div>
          )}
        </div>

        {/* Field 3: Deskripsi Visual */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Deskripsi Visual</label>
          {isEditing ? (
            <textarea
              rows={3}
              value={visualVal}
              onChange={(e) => updateCell(ri, visualKey, e.target.value)}
              placeholder="Prompt visual untuk generate gambar..."
              className="w-full resize-y rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-brand dark:border-white/10 dark:bg-zinc-900/70"
            />
          ) : (
            <div className="rounded-lg border border-zinc-200/50 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-700 dark:border-white/5 dark:bg-zinc-900/40 dark:text-zinc-300">
              {visualVal || <span className="text-zinc-400 italic">Belum ada deskripsi visual</span>}
            </div>
          )}
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Ubah atau sesuaikan prompt visual ini untuk menghasilkan variasi gambar yang berbeda.
          </p>
        </div>
      </div>
    </div>
  );
}

interface Props {
  projectId: string;
  contentType: ContentType;
  brief?: BriefDTO | null;
  onBrief: (b: BriefDTO | null) => void;
}

export function BriefEditor({ projectId, contentType, brief, onBrief }: Props) {
  const router = useRouter();
  const schema = getBriefSchema(contentType);
  const caption: Caption | undefined = brief?.captions?.[0];
  const noun = ROW_NOUN[contentType];
  const canAddRows = ADDABLE_TYPES.includes(contentType);
  const canSort = SORTABLE_TYPES.includes(contentType);

  const [editRows, setEditRows] = useState<BriefRow[]>([]);
  const [instruction, setInstruction] = useState("");
  const [rowTarget, setRowTarget] = useState("all");
  const [busy, setBusy] = useState<"generate" | "revise" | "captions" | "export" | "save" | "media" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const autoGenRef = useRef(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const rows: BriefRow[] = isEditing ? editRows : brief?.rows ?? [];
  const summary: BriefSummary | null = brief?.summary ?? null;
  const showActions = isEditing && canAddRows;
  const rowIds = rows.map((row, i) => row.__id ?? `row-${i}`);

  function rowIdAt(source: BriefRow[], i: number) {
    return source[i]?.__id ?? `row-${i}`;
  }

  function normalizeRows(source: BriefRow[]): BriefRow[] {
    return source.map((row, i) => {
      const next: BriefRow = { ...row, __id: row.__id ?? crypto.randomUUID() };
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    setEditRows((prev) => {
      const from = prev.findIndex((_, i) => rowIdAt(prev, i) === activeId);
      const to = prev.findIndex((_, i) => rowIdAt(prev, i) === overId);
      if (from < 0 || to < 0) return prev;
      return normalizeRows(arrayMove(prev, from, to));
    });
  }

  function apply(b: BriefDTO, exitEdit = false) {
    onBrief(b);
    if (exitEdit) {
      setIsEditing(false);
      setEditRows([]);
    }
  }

  async function generate() {
    setBusy("generate");
    try {
      const res = await post<{ brief: BriefDTO }>(`/api/projects/${projectId}/brief`);
      apply(res.brief, true);
      toast.success("Brief berhasil dibuat.");
    } catch (e: unknown) {
      toast.danger((e as Error).message ?? "Gagal membuat brief.");
    } finally {
      setBusy(null);
    }
  }

  function startEdit() {
    if (!brief) return;
    setEditRows(normalizeRows(brief.rows));
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditRows([]);
    setInstruction("");
  }

  function updateCell(rowIndex: number, key: string, value: string) {
    setEditRows((r) => r.map((row, i) => (i === rowIndex ? { ...row, [key]: value } : row)));
  }

  function addRow() {
    setEditRows((prev) => {
      const next: BriefRow = { __id: crypto.randomUUID() };
      for (const c of schema.columns) next[c.key] = "";
      return normalizeRows([...prev, next]);
    });
  }

  function removeRow(rowIndex: number) {
    setEditRows((prev) => (prev.length <= 1 ? prev : normalizeRows(prev.filter((_, i) => i !== rowIndex))));
  }

  function allRequiredFilled(source: BriefRow[]): boolean {
    const required = schema.columns.filter((c) => c.required);
    return source.every((row) => required.every((c) => String(row[c.key] ?? "").trim().length > 0));
  }

  async function saveEdit() {
    if (!brief) return;
    if (!allRequiredFilled(editRows)) {
      toast.danger("Mohon isi semua kolom wajib.");
      return;
    }
    setBusy("save");
    try {
      const res = await patch<{ brief: BriefDTO }>(`/api/briefs/${brief.id}`, { rows: editRows });
      apply(res.brief, true);
      toast.success("Perubahan brief disimpan.");
    } catch (e: unknown) {
      toast.danger((e as Error).message ?? "Gagal menyimpan.");
    } finally {
      setBusy(null);
    }
  }

  async function revise() {
    if (!brief || !instruction.trim()) return;
    setBusy("revise");
    try {
      const target = rowTarget === "all" ? "all" : Number(rowTarget);
      const res = await post<{ brief: BriefDTO }>(`/api/briefs/${brief.id}/revise`, {
        instruction: instruction.trim(),
        rowTarget: target,
      });
      apply(res.brief, true);
      setInstruction("");
      toast.success("Brief berhasil direvisi.");
    } catch (e: unknown) {
      toast.danger((e as Error).message ?? "Gagal merevisi brief.");
    } finally {
      setBusy(null);
    }
  }

  async function regenerateCaptions() {
    if (!brief) return;
    setBusy("captions");
    try {
      const res = await post<{ brief: BriefDTO }>(`/api/briefs/${brief.id}/captions`);
      apply(res.brief);
      toast.success("Caption diperbarui.");
    } catch (e: unknown) {
      toast.danger((e as Error).message ?? "Gagal membuat caption.");
    } finally {
      setBusy(null);
    }
  }

  async function exportPdf() {
    if (!brief) return;
    setBusy("export");
    try {
      const res = await fetch(`/api/briefs/${brief.id}/export-pdf`);
      if (!res.ok) throw new Error("Gagal mengunduh PDF.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `brief-${projectId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF berhasil diunduh.");
    } catch (e: unknown) {
      toast.danger((e as Error).message ?? "Gagal export PDF.");
    } finally {
      setBusy(null);
    }
  }

  async function generateMedia() {
    if (!brief) return;
    setBusy("media");
    try {
      const mediaSources = rows.map((row, i) => ({
        briefRow: i + 1,
        source: "ai_generated" as const,
        prompt: derivedPrompt(contentType, row),
      }));
      const res = await post<{ creationId: string }>("/api/creations", { projectId, mediaSources });
      toast.success("Generate dimulai. Mengalihkan ke editor...");
      router.push(`/studio/${res.creationId}`);
    } catch (e: unknown) {
      toast.danger((e as Error).message ?? "Gagal memproses media.");
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    if (!brief && !autoGenRef.current) {
      autoGenRef.current = true;
      generate();
    }
  }, []);

  if (!brief) {
    return (
      <GlassCard className="flex flex-col gap-4">
        <SectionHeader title="Brief" description="Rincian konten berdasarkan angle terpilih." />
        {busy === "generate" ? (
          <SpinnerBlock label="Menyusun brief dengan AI..." />
        ) : (
          <EmptyBlock
            title="Belum ada brief"
            description="Brief disusun otomatis dari angle dan jenis konten yang sudah dipilih."
            action={
              <Button variant="primary" onPress={() => generate()} isDisabled={!!busy}>
                Buat brief
              </Button>
            }
          />
        )}
      </GlassCard>
    );
  }

  // Paragraf ringkasan brief deskriptif (sesuai layout Figma 799:44769)
  const briefParagraph = summary
    ? `Buat konten media sosial berjudul “${summary.title}” untuk ${summary.goal} dengan audiens ${summary.audience}. Gunakan nada ${summary.tone}. Buat dalam format ${contentType} ${summary.size}. Konten ditujukan untuk platform ${summary.platforms.join(", ")}, dengan visual yang relevan, konsisten, dan mudah dibaca di layar ponsel.`
    : "Rincian konten berdasarkan angle terpilih.";

  return (
    <div className="space-y-6">
      {/* Kartu Header Brief (Figma 799:44769) */}
      <GlassCard className="flex flex-col gap-4">
        <SectionHeader
          title="Brief"
          description="Rincian konten berdasarkan angle terpilih."
          action={<Chip size="sm" variant="soft">{brief.status === "siap" ? "Siap" : "Draft"}</Chip>}
        />

        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{briefParagraph}</p>

        {summary ? (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-200/50 dark:border-white/5">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Platform:</span>
            {summary.platforms.map((p) => (
              <span key={p} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-300">
                {p}
              </span>
            ))}
            <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">Ukuran:</span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-300">
              {summary.size}
            </span>
            <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">Nada:</span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-300">
              {summary.tone}
            </span>
          </div>
        ) : null}
      </GlassCard>

      {/* Toolbar Aksi Brief (Figma 799:44769) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {rows.length} {noun === "slide" ? "Slide Konten" : "Baris Konten"}
          </span>
          {isEditing && (
            <Chip size="sm" variant="soft" color="warning">
              Mode Edit Aktif
            </Chip>
          )}
        </div>

        {!isEditing ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onPress={startEdit}>
              <PencilIcon width={16} height={16} /> Edit
            </Button>
            <Button size="sm" variant="secondary" onPress={exportPdf} isDisabled={!!busy}>
              <DownloadIcon width={16} height={16} /> Export .pdf
            </Button>
            <Button size="sm" variant="primary" onPress={generateMedia} isDisabled={!!busy}>
              <SparkIcon width={16} height={16} /> Generate Media
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onPress={cancelEdit} isDisabled={busy === "save"}>
              <XIcon width={16} height={16} /> Batal
            </Button>
            <Button size="sm" variant="primary" onPress={saveEdit} isDisabled={busy === "save"}>
              {busy === "save" ? <Spinner size="sm" /> : <CheckIcon width={16} height={16} />} Simpan
            </Button>
          </div>
        )}
      </div>

      {/* Daftar Kartu Visual 2-Kolom (Figma 799:44769) */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-5">
            {rows.map((row, ri) => (
              <BriefVisualCard
                key={row.__id ?? `row-${ri}`}
                id={row.__id ?? `row-${ri}`}
                row={row}
                ri={ri}
                schema={schema}
                contentType={contentType}
                isEditing={isEditing}
                showActions={showActions}
                sortable={canSort && isEditing}
                noun={noun}
                updateCell={updateCell}
                removeRow={removeRow}
                canRemove={rows.length > 1}
                onStartEdit={!isEditing ? startEdit : undefined}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Tombol Tambah Baris */}
      {showActions ? (
        <div className="flex justify-center pt-2">
          <Button size="sm" variant="secondary" onPress={addRow}>
            <PlusIcon width={16} height={16} /> Tambah {noun}
          </Button>
        </div>
      ) : null}

      {/* Kartu Revisi AI Cepat (opsional) */}
      {SHOW_REVISI_AI && !isEditing ? (
        <GlassCard className="flex flex-col gap-3">
          <SectionHeader
            title="Revisi Cepat dengan AI"
            description="Minta AI mengubah narasi, sudut pandang, atau nada pada baris tertentu."
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={rowTarget}
              onChange={(e) => setRowTarget(e.target.value)}
              className="rounded-xl border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900/70"
            >
              <option value="all">Semua baris</option>
              {rows.map((_, i) => (
                <option key={i} value={i}>
                  {`Baris ${i + 1}`}
                </option>
              ))}
            </select>
            <input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Contoh: buat lebih ringkas & persuasif"
              className="flex-1 rounded-xl border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900/70"
            />
            <Button variant="primary" onPress={revise} isDisabled={!!busy || !instruction}>
              {busy === "revise" ? "Memproses..." : "Revisi"}
            </Button>
          </div>
        </GlassCard>
      ) : null}

      {/* Kartu Caption Bawah (Figma 799:44769) */}
      <GlassCard className="flex flex-col gap-3">
        <SectionHeader
          title="Caption"
          action={
            <Button size="sm" variant="secondary" onPress={regenerateCaptions} isDisabled={!!busy}>
              <RefreshIcon width={16} height={16} /> Buat ulang
            </Button>
          }
        />
        {busy === "captions" ? (
          <SpinnerBlock label="Membuat caption..." />
        ) : caption ? (
          <div className="rounded-xl border border-zinc-200/70 bg-white/50 p-4 text-sm dark:border-white/10 dark:bg-zinc-900/40">
            <p className="whitespace-pre-wrap leading-relaxed text-foreground">{caption.text}</p>
            {caption.hashtags?.length > 0 && (
              <p className="mt-2 text-xs font-medium text-brand-strong dark:text-brand">
                {caption.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Belum ada caption. Klik &quot;Buat ulang&quot;.</p>
        )}
      </GlassCard>
    </div>
  );
}

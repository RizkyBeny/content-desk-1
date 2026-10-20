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
  rectSortingStrategy,
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
  AudioIcon,
  CheckIcon,
  DownloadIcon,
  FileTextIcon,
  GripIcon,
  ImageIcon,
  LayersIcon,
  MenuIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  SparkIcon,
  TrashIcon,
  VideoIcon,
  XIcon,
} from "@/components/ui/icons";
import type { BriefDTO, BriefRow, BriefSummary, Caption, ContentType, MediaSource } from "@/types";

const SHOW_REVISI_AI = false;

const TYPE_ICON: Record<ContentType, React.ReactNode> = {
  image: <ImageIcon />,
  carousel: <LayersIcon />,
  video: <VideoIcon />,
  audio: <AudioIcon />,
  article: <FileTextIcon />,
};

function isLongInput(input: string) {
  return input === "long";
}

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

const GRIP_CLASS =
  "inline-flex h-7 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 active:cursor-grabbing disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-zinc-300";

interface RowCellProps {
  row: BriefRow;
  ri: number;
  schema: BriefSchema;
  isEditing: boolean;
  showActions: boolean;
  sortable: boolean;
  indexColKey: string | null;
  noun: string;
  updateCell: (rowIndex: number, key: string, value: string) => void;
  removeRow: (rowIndex: number) => void;
  canRemove: boolean;
}

function BriefTableRow(props: RowCellProps & { id: string }) {
  const { row, ri, schema, isEditing, showActions, sortable, indexColKey, noun, updateCell, removeRow, canRemove, id } = props;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !sortable,
  });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`border-b border-zinc-100/70 last:border-0 dark:border-white/5 ${
        isDragging ? "relative z-10 bg-zinc-50 opacity-70 dark:bg-zinc-900/60" : ""
      }`}
    >
      {schema.columns.map((c) => (
        <td key={c.key} className="p-2 align-top">
          {isEditing && c.key === indexColKey ? (
            <div className="flex min-h-[30px] items-center">
              <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                {row[c.key] ?? ri + 1}
              </span>
            </div>
          ) : isEditing && isLongInput(c.input) ? (
            <textarea
              rows={3}
              value={row[c.key] ?? ""}
              onChange={(e) => updateCell(ri, c.key, e.target.value)}
              className="w-full rounded-lg border border-zinc-200/70 bg-white/80 px-2 py-1 text-sm dark:border-white/10 dark:bg-zinc-900/70"
            />
          ) : isEditing ? (
            <input
              value={row[c.key] ?? ""}
              onChange={(e) => updateCell(ri, c.key, e.target.value)}
              className="w-full rounded-lg border border-zinc-200/70 bg-white/80 px-2 py-1 text-sm dark:border-white/10 dark:bg-zinc-900/70"
            />
          ) : (
            <div className="whitespace-pre-wrap">{row[c.key] ?? ""}</div>
          )}
        </td>
      ))}
      {showActions ? (
        <td className="p-2 align-top">
          <div className="flex items-center justify-end gap-1">
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
          </div>
        </td>
      ) : null}
    </tr>
  );
}

function BriefCard(props: RowCellProps & { id: string; contentType: ContentType }) {
  const { row, ri, contentType, schema, isEditing, showActions, sortable, indexColKey, noun, updateCell, removeRow, canRemove, id } = props;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !sortable,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`angle-card glass-panel relative flex flex-col gap-3 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 ${
        isDragging ? "z-10 opacity-70" : ""
      }`}
    >
      {showActions ? (
        <div className="absolute right-2 top-2 flex items-center gap-1">
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
        </div>
      ) : (
        <span className="absolute right-3 top-3 text-zinc-400 dark:text-zinc-500" aria-hidden="true">
          {TYPE_ICON[contentType]}
        </span>
      )}
      {schema.columns.map((c) => (
        <div key={c.key} className="flex flex-col gap-1">
          <span className={`text-xs font-medium text-zinc-500 dark:text-zinc-400 ${showActions ? "pr-24" : "pr-6"}`}>
            {c.label}
            {isEditing && c.required && c.key !== indexColKey ? <span className="text-red-500"> *</span> : null}
          </span>
          {isEditing && c.key === indexColKey ? (
            <span className="inline-flex w-fit items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold tabular-nums text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
              {row[c.key] ?? ri + 1}
            </span>
          ) : isEditing && isLongInput(c.input) ? (
            <textarea
              rows={3}
              value={row[c.key] ?? ""}
              onChange={(e) => updateCell(ri, c.key, e.target.value)}
              className="w-full rounded-lg border border-zinc-200/70 bg-white/80 px-2 py-1 text-sm dark:border-white/10 dark:bg-zinc-900/70"
            />
          ) : isEditing ? (
            <input
              value={row[c.key] ?? ""}
              onChange={(e) => updateCell(ri, c.key, e.target.value)}
              className="w-full rounded-lg border border-zinc-200/70 bg-white/80 px-2 py-1 text-sm dark:border-white/10 dark:bg-zinc-900/70"
            />
          ) : isLongInput(c.input) ? (
            <div className="brief-clamp text-sm">{row[c.key] ?? ""}</div>
          ) : (
            <div className="whitespace-pre-wrap text-sm">{row[c.key] ?? ""}</div>
          )}
        </div>
      ))}
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
  const indexCol = canAddRows ? schema.columns.find((c) => c.input === "short") ?? null : null;
  const indexColKey = indexCol?.key ?? null;

  const [editRows, setEditRows] = useState<BriefRow[]>([]);
  const [instruction, setInstruction] = useState("");
  const [rowTarget, setRowTarget] = useState("all");
  const [busy, setBusy] = useState<"generate" | "revise" | "captions" | "export" | "save" | "media" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
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
      if (indexCol) next[indexCol.key] = String(i + 1);
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
    setBusy("save");
    try {
      const normalized = normalizeRows(editRows);
      const ready = allRequiredFilled(normalized);
      const res = await patch<{ brief: BriefDTO }>(`/api/briefs/${brief.id}`, {
        rows: normalized,
        status: ready ? "siap" : "draft",
      });
      apply(res.brief, true);
      toast.success(
        ready ? "Brief tersimpan & ditandai siap." : "Brief tersimpan — isi kolom wajib untuk menandai siap.",
      );
    } catch (e: unknown) {
      toast.danger((e as Error).message ?? "Gagal menyimpan.");
    } finally {
      setBusy(null);
    }
  }

  async function revise() {
    if (!brief) return;
    setBusy("revise");
    try {
      const rowIndex = rowTarget === "all" ? null : Number(rowTarget);
      const res = await post<{ brief: BriefDTO }>(`/api/briefs/${brief.id}/revise`, {
        instruction,
        rowIndex,
      });
      apply(res.brief, true);
      toast.success("Revisi berhasil.");
      setInstruction("");
    } catch (e: unknown) {
      toast.danger((e as Error).message ?? "Gagal merevisi.");
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
      toast.success("Caption dibuat ulang.");
    } catch (e: unknown) {
      toast.danger((e as Error).message ?? "Gagal membuat caption.");
    } finally {
      setBusy(null);
    }
  }

  async function exportPdf() {
    setBusy("export");
    try {
      toast.success("Export PDF sedang disiapkan.");
    } finally {
      setBusy(null);
    }
  }

  async function generateMedia() {
    if (!brief) return;
    setBusy("media");
    try {
      const mediaSources = rows.map((_, i) => ({
        briefRow: i + 1,
        source: "ai_generated" as MediaSource,
      }));
      const res = await post<{ creationId: string }>("/api/creations", { projectId, mediaSources });
      toast.success("Generate dimulai.");
      router.push(`/studio/${res.creationId}`);
    } catch (e: unknown) {
      toast.danger((e as Error).message ?? "Gagal memulai generate.");
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    if (brief || autoGenRef.current) return;
    autoGenRef.current = true;
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!brief) {
    return (
      <GlassCard className="flex flex-col gap-4">
        <SectionHeader title="Brief" description="Brief otomatis dibuat dari topik & angle terpilih." />
        {busy === "generate" ? (
          <SpinnerBlock label="Membuat brief otomatis..." />
        ) : (
          <EmptyBlock
            icon={<SparkIcon />}
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

  return (
    <div className="space-y-4">
      <GlassCard className="flex flex-col gap-4">
        <SectionHeader
          title="Brief"
          description="Rincian konten berdasarkan angle terpilih."
          action={<Chip size="sm" variant="soft">{brief.status === "siap" ? "Siap" : "Draft"}</Chip>}
        />

        {summary ? (
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-zinc-200/70 bg-white/50 p-4 text-sm md:grid-cols-3 dark:border-white/10 dark:bg-zinc-900/50">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Judul</p>
              <p className="mt-0.5 font-medium">{summary.title}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tujuan</p>
              <p className="mt-0.5">{summary.goal}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Audiens</p>
              <p className="mt-0.5">{summary.audience}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Nada</p>
              <p className="mt-0.5">{summary.tone}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Ukuran</p>
              <p className="mt-0.5">{summary.size}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Platform</p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {summary.platforms.map((p) => (
                  <span key={p} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-white/10">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex shrink-0 gap-1 rounded-full bg-zinc-900/5 p-1 text-xs dark:bg-white/5"
            role="group"
            aria-label="Tampilan brief"
          >
            <button
              type="button"
              onClick={() => setViewMode("table")}
              aria-pressed={viewMode === "table"}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-colors",
                viewMode === "table"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400",
              )}
            >
              <MenuIcon width={14} height={14} /> Tabel
            </button>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              aria-pressed={viewMode === "card"}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-colors",
                viewMode === "card"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400",
              )}
            >
              <LayersIcon width={14} height={14} /> Kartu
            </button>
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

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {viewMode === "table" ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200/70 text-left dark:border-white/10">
                      {schema.columns.map((c) => (
                        <th key={c.key} className="p-2 font-medium text-zinc-500 dark:text-zinc-400">
                          {c.label}
                          {isEditing && c.required && c.key !== indexColKey ? (
                            <span className="text-red-500"> *</span>
                          ) : null}
                        </th>
                      ))}
                      {showActions ? (
                        <th className="w-24 p-2 text-right font-medium text-zinc-500 dark:text-zinc-400">Aksi</th>
                      ) : null}
                    </tr>
                  </thead>
                  <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
                    <tbody>
                      {rows.map((row, ri) => (
                        <BriefTableRow
                          key={rowIdAt(rows, ri)}
                          id={rowIdAt(rows, ri)}
                          row={row}
                          ri={ri}
                          schema={schema}
                          isEditing={isEditing}
                          showActions={showActions}
                          sortable={canSort && isEditing}
                          indexColKey={indexColKey}
                          noun={noun}
                          updateCell={updateCell}
                          removeRow={removeRow}
                          canRemove={rows.length > 1}
                        />
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </div>
              {showActions ? (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{`${rows.length} ${noun}`}</span>
                  <Button size="sm" variant="secondary" onPress={addRow} aria-label={`Tambah ${noun}`}>
                    <PlusIcon width={16} height={16} /> Tambah {noun}
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <SortableContext items={rowIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {rows.map((row, ri) => (
                  <BriefCard
                    key={rowIdAt(rows, ri)}
                    id={rowIdAt(rows, ri)}
                    row={row}
                    ri={ri}
                    contentType={contentType}
                    schema={schema}
                    isEditing={isEditing}
                    showActions={showActions}
                    sortable={canSort && isEditing}
                    indexColKey={indexColKey}
                    noun={noun}
                    updateCell={updateCell}
                    removeRow={removeRow}
                    canRemove={rows.length > 1}
                  />
                ))}
                {showActions ? (
                  <button
                    type="button"
                    onClick={addRow}
                    aria-label={`Tambah ${noun}`}
                    className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 text-sm font-medium text-zinc-500 transition-colors hover:border-brand hover:text-brand-strong dark:border-white/15 dark:text-zinc-400 dark:hover:border-brand dark:hover:text-brand"
                  >
                    <PlusIcon width={20} height={20} />
                    Tambah {noun}
                  </button>
                ) : null}
              </div>
            </SortableContext>
          )}
        </DndContext>

        {SHOW_REVISI_AI ? (
          <GlassCard className="flex flex-col gap-3">
            <SectionHeader title="Revisi AI" description="Terapkan instruksi ke semua atau baris tertentu." />
            <div className="flex flex-col gap-2 sm:flex-row">
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
      </GlassCard>

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
          <div className="glass-panel p-3 text-sm">
            <p>{caption.text}</p>
            <p className="mt-1 text-xs text-brand-strong dark:text-brand">
              {caption.hashtags.map((h) => `#${h}`).join(" ")}
            </p>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Belum ada caption. Klik &quot;Buat ulang&quot;.</p>
        )}
      </GlassCard>
    </div>
  );
}

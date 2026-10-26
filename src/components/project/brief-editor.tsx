"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Spinner, toast } from "@heroui/react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { patch, post } from "@/lib/client";
import { cn } from "@/lib/utils";
import { getBriefSchema } from "../../../config/brief-schemas";
import { EmptyBlock, SpinnerBlock } from "@/components/ui/states";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DatabaseIcon,
  DownloadIcon,
  FolderIcon,
  ImageIcon,
  PencilIcon,
  PlusIcon,
  RectangleVerticalIcon,
  RefreshIcon,
  SparkIcon,
  TrashIcon,
  VideoIcon,
  XIcon,
} from "@/components/ui/icons";
import { InsertMediaModal, type MediaAsset } from "./insert-media-modal";
import type { SingleMediaConfig } from "./angle-step";
import type { BriefDTO, BriefRow, Caption, ContentType } from "@/types";

const ROW_NOUN: Record<ContentType, string> = {
  image: "image",
  carousel: "slide",
  video: "scene",
  audio: "segmen",
  article: "section",
};

export interface GeneratedVisual {
  id: string;
  url: string;
  title: string;
  createdAt?: string;
}

const GENERATED_IMAGE_POOL: { url: string; title: string }[] = [
  { url: "/post-media/card-1.png", title: "AI Variasi: Liputan Investigasi" },
  { url: "/post-media/card-2.png", title: "AI Variasi: Sorotan Pelaku UMKM" },
  { url: "/post-media/card-3.png", title: "AI Variasi: Standarisasi & Data" },
  { url: "/seed/unsplash/abstract-03.jpg", title: "AI Variasi: Nuansa Visual Editorial" },
  { url: "/seed/unsplash/abstract-07.jpg", title: "AI Variasi: Komposisi Berita Terkini" },
];

function derivedPrompt(type: ContentType, row: BriefRow): string {
  if (type === "carousel") return [row.visual, row.judul, row.isi].filter(Boolean).join(". ");
  if (type === "audio") return row.naskah ?? "";
  if (type === "video") return row.visual ?? "";
  if (type === "article") return row.poin ?? "";
  return [row.elemenVisual, row.gaya, row.teks].filter(Boolean).join(". ");
}

export interface BriefEditorProps {
  projectId: string;
  contentType: ContentType;
  brief?: BriefDTO | null;
  onBrief: (b: BriefDTO | null) => void;
  onPreviewVideo?: (b: BriefDTO) => void;
  angleTitle?: string;
  singleConfig?: SingleMediaConfig | null;
  isMultiType?: boolean;
}

export function BriefEditor({
  projectId,
  contentType,
  brief,
  onBrief,
  onPreviewVideo,
  angleTitle = "Standarisasi Dapur dan Nasib Pelaku UMKM Lokal",
  singleConfig,
  isMultiType = false,
}: BriefEditorProps) {
  const router = useRouter();
  const schema = getBriefSchema(contentType);
  const caption: Caption | undefined = brief?.captions?.[0];
  const noun = ROW_NOUN[contentType] || "baris";

  const [editRows, setEditRows] = useState<BriefRow[]>([]);
  const [busy, setBusy] = useState<"generate" | "revise" | "captions" | "export" | "save" | "media" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const [activeThumbnails, setActiveThumbnails] = useState<Record<number, number>>({});
  const autoGenRef = useRef(false);

  // 1. Manual media attachment state per baris / scene (Gambar / Video untuk kotak 80x80)
  const [sceneMedia, setSceneMedia] = useState<Record<number, MediaAsset>>({});
  // 2. Referensi gambar untuk panduan AI generation per baris / scene
  const [sceneReferences, setSceneReferences] = useState<Record<number, MediaAsset[]>>({});
  // 3. Riwayat visual hasil AI generate per baris (Single Image / Carousel)
  const [sceneGeneratedImages, setSceneGeneratedImages] = useState<Record<number, GeneratedVisual[]>>({});
  // 4. Mode visual yang sedang aktif: "empty" | "manual" | "generated"
  const [activeVisualMode, setActiveVisualMode] = useState<Record<number, "empty" | "manual" | "generated">>({});
  // 5. Status proses loading generate per baris
  const [generatingRows, setGeneratingRows] = useState<Record<number, boolean>>({});

  // Target modal media picker yang sedang aktif
  const [activeMediaTarget, setActiveMediaTarget] = useState<{
    rowIndex: number;
    mode: "manual" | "reference";
    title: string;
    subtitle?: string;
    defaultTab: "video" | "image" | "upload";
    allowedTypes?: ("video" | "image")[];
    multiSelect?: boolean;
  } | null>(null);

  function handleGenerateAIImage(rowIndex: number) {
    const currentList = sceneGeneratedImages[rowIndex] || [];
    if (currentList.length >= 3) {
      toast.warning("Maksimal 3x generate image telah tercapai.");
      setActiveVisualMode((prev) => ({ ...prev, [rowIndex]: "generated" }));
      setOpenDropdownIndex(null);
      return;
    }

    setOpenDropdownIndex(null);
    setGeneratingRows((prev) => ({ ...prev, [rowIndex]: true }));
    setActiveVisualMode((prev) => ({ ...prev, [rowIndex]: "generated" }));

    // Efek loading spinner ~1.2 detik
    setTimeout(() => {
      const nextIdx = currentList.length;
      const poolItem = GENERATED_IMAGE_POOL[(rowIndex * 2 + nextIdx) % GENERATED_IMAGE_POOL.length];
      const newVisual: GeneratedVisual = {
        id: `ai-gen-${rowIndex}-${Date.now()}`,
        url: poolItem.url,
        title: `${poolItem.title} #${nextIdx + 1}`,
        createdAt: new Date().toLocaleTimeString(),
      };

      setSceneGeneratedImages((prev) => {
        const nextList = [...(prev[rowIndex] || []), newVisual];
        return { ...prev, [rowIndex]: nextList };
      });

      setActiveThumbnails((prev) => ({ ...prev, [rowIndex]: nextIdx }));
      setGeneratingRows((prev) => ({ ...prev, [rowIndex]: false }));
      toast.success(`Variasi visual AI #${nextIdx + 1} berhasil digenerate!`);
    }, 1200);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const rows: BriefRow[] = useMemo(() => {
    const raw = isEditing ? editRows : brief?.rows ?? [];
    if (contentType === "image") {
      // Single Image Mode: HANYA TEPAT 1 GAMBAR
      if (raw.length === 0) {
        return [
          {
            elemenVisual: "Visual utama untuk konten Single Image",
            teks: "Headline dan pesan utama",
            rasio: singleConfig?.ratio || "1:1",
            gaya: "Editorial & Modern",
          },
        ];
      }
      return raw.slice(0, 1);
    }
    if (contentType === "carousel") {
      // Multiple Image (Carousel) Mode: HARUS LEBIH DARI 1 (Minimal 5 slide)
      if (raw.length <= 1) {
        return [
          { slide: "1", judul: "Headline Menarik", isi: "Pengenalan topik utama yang menggugah rasa ingin tahu pembaca.", visual: "Cover visual dengan headline tegas" },
          { slide: "2", judul: "Konteks & Latar Belakang", isi: "Penjelasan kronologi atau fakta awal secara ringkas.", visual: "Grafis timeline atau foto pendukung" },
          { slide: "3", judul: "Fakta Kunci & Data", isi: "Angka penting, data statistik, atau temuan investigasi.", visual: "Infografis data perbandingan" },
          { slide: "4", judul: "Dampak & Reaksi", isi: "Respon pihak terkait serta implikasinya bagi masyarakat.", visual: "Foto figur atau kutipan pernyataan" },
          { slide: "5", judul: "Kesimpulan & Diskusi", isi: "Rangkuman singkat dan ajakan berpendapat di kolom komentar.", visual: "Branding penutup + call to action" },
        ];
      }
      return raw;
    }
    return raw;
  }, [isEditing, editRows, brief?.rows, contentType, singleConfig?.ratio]);
  const rowIds = useMemo(() => rows.map((row, i) => row.__id ?? `row-${i}`), [rows]);

  function rowIdAt(source: BriefRow[], i: number) {
    return source[i]?.__id ?? `row-${i}`;
  }

  function normalizeRows(source: BriefRow[]): BriefRow[] {
    return source.map((row) => ({
      ...row,
      __id: row.__id ?? crypto.randomUUID(),
    }));
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
      const res = await post<{ brief: BriefDTO }>(`/api/projects/${projectId}/brief`, {
        contentType,
      });
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
    const raw = normalizeRows(rows);
    setEditRows(contentType === "image" ? raw.slice(0, 1) : raw);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditRows([]);
  }

  function updateCell(rowIndex: number, key: string, value: string) {
    if (isEditing) {
      setEditRows((r) => r.map((row, i) => (i === rowIndex ? { ...row, [key]: value } : row)));
    } else {
      if (!brief) return;
      const next = normalizeRows(brief.rows).map((row, i) =>
        i === rowIndex ? { ...row, [key]: value } : row,
      );
      setEditRows(next);
      setIsEditing(true);
    }
  }

  function addRow() {
    setEditRows((prev) => {
      const next: BriefRow = { __id: crypto.randomUUID() };
      for (const c of schema.columns) next[c.key] = "";
      return normalizeRows([...prev, next]);
    });
    if (!isEditing) setIsEditing(true);
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
      const mediaSources = rows.map((row, i) => {
        const manual = sceneMedia[i];
        if (manual) {
          return {
            briefRow: i + 1,
            source: "manual" as const,
            assetId: manual.id,
          };
        }
        return {
          briefRow: i + 1,
          source: "ai_generated" as const,
          prompt: derivedPrompt(contentType, row),
        };
      });
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

  // Durasi kalkulasi untuk Video Storyboard
  const durations = useMemo(() => {
    return rows.map((r) => parseInt(r.durasi || "12", 10) || 12);
  }, [rows]);

  const totalDuration = useMemo(() => {
    return durations.reduce((a, b) => a + b, 0);
  }, [durations]);

  const sceneTimeRanges = useMemo(() => {
    const fmtTime = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    };
    return rows.map((_, idx) => {
      const start = durations.slice(0, idx).reduce((a, b) => a + b, 0);
      const end = start + durations[idx];
      return `${fmtTime(start)} - ${fmtTime(end)}`;
    });
  }, [rows, durations]);

  if (!brief) {
    return (
      <div className="glass-card flex flex-col gap-4 rounded-2xl border border-zinc-200/90 bg-white/95 p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/95">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Brief Konten</h3>
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
      </div>
    );
  }

  const activeRatio = singleConfig?.ratio || (contentType === "image" ? "1:1" : "9:16");

  return (
    <div className="space-y-6">
      {/* Container Card Composer SceneI (Figma #1022:12117 / #1022:11951 / #1022:12265) */}
      <div className="glass-card relative flex flex-col gap-6 rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900 sm:p-6">
        {/* Identitas mode bar (Figma #1022:12118 / #1022:11952 / #1022:12266) */}
        <div className="flex w-full items-center justify-between border-b border-zinc-100 pb-3 dark:border-white/5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              {contentType === "image" && <RectangleVerticalIcon className="size-3.5" />}
              {contentType === "carousel" && <FolderIcon className="size-3.5" />}
              {contentType === "video" && <VideoIcon className="size-3.5" />}
              {contentType === "image"
                ? "Single Image"
                : contentType === "carousel"
                  ? "Multiple Image"
                  : contentType === "video"
                    ? "Video"
                    : contentType.toUpperCase()}
            </span>
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {angleTitle}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex size-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-white/10 dark:hover:text-zinc-300"
            aria-label={isCollapsed ? "Buka brief" : "Tutup brief"}
          >
            {isCollapsed ? <ChevronDownIcon className="size-5" /> : <ChevronUpIcon className="size-5" />}
          </button>
        </div>

        {!isCollapsed && (
          <>
            {/* Header Title Row (Figma #1022:12131 / #1022:11964 / #1022:12278) */}
            <div className="flex flex-col gap-4 border-b border-zinc-100 pb-5 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1.5">
                <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {contentType === "video" ? "Story Board " : "Visual Brief"}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {contentType === "video"
                    ? "Template produksi video siap diisi untuk semua jenis konten."
                    : contentType === "image"
                    ? "Brief visual 1 frame utama untuk konten gambar statis."
                    : "Rangkaian slide visual untuk storytelling carousel."}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="rounded-full bg-zinc-100 px-3 py-0.5 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-300">
                    Aspect Ratio {activeRatio}
                  </span>
                  {contentType === "video" && (
                    <span className="rounded-full bg-zinc-100 px-3 py-0.5 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-300">
                      {totalDuration} detik
                    </span>
                  )}
                  <span className="rounded-full bg-zinc-100 px-3 py-0.5 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-300">
                    {rows.length} {contentType === "video" ? "Scene" : contentType === "image" ? "Image" : "Slide"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!isEditing ? (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={startEdit}
                      className="gap-1.5 border-zinc-200 text-xs font-medium dark:border-white/10"
                    >
                      <PencilIcon width={13} height={13} /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={exportPdf}
                      isDisabled={!!busy}
                      className="gap-1.5 border-zinc-200 text-xs font-medium dark:border-white/10"
                    >
                      <DownloadIcon width={13} height={13} /> Unduh PDF
                    </Button>
                    {!isMultiType && contentType !== "video" && (
                      <Button
                        size="sm"
                        onPress={generateMedia}
                        isDisabled={!!busy}
                        className="gap-1.5 bg-zinc-900 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                      >
                        <SparkIcon width={13} height={13} /> Lanjut ke Editor
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="secondary" onPress={cancelEdit} isDisabled={busy === "save"}>
                      <XIcon width={13} height={13} /> Batal
                    </Button>
                    <Button size="sm" variant="primary" onPress={saveEdit} isDisabled={busy === "save"}>
                      {busy === "save" ? <Spinner size="sm" /> : <CheckIcon width={13} height={13} />} Simpan
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* LAYOUT 1: VIDEO STORYBOARD TABLE (Figma #1022:11911) */}
            {contentType === "video" && (
              <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900/60">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-white/10 dark:bg-zinc-800/50 dark:text-zinc-400">
                        <th className="w-20 px-4 py-3.5">Scene</th>
                        <th className="w-32 px-4 py-3.5">Durasi</th>
                        <th className="min-w-[280px] px-4 py-3.5">Visual</th>
                        <th className="w-64 px-4 py-3.5">TEXT PADA Visual</th>
                        <th className="min-w-[260px] px-4 py-3.5">Voiceover (VO)</th>
                        {isEditing && <th className="w-16 px-4 py-3.5 text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 text-sm dark:divide-white/5">
                      {rows.map((row, ri) => {
                        const sceneNumber = ri + 1;
                        const timeRange = sceneTimeRanges[ri] ?? "00:00 - 00:10";
                        const visualText = row.visual || row.elemenVisual || "";
                        const textPadaVisual = row.teks_onscreen || row.judul || row.teks || "";
                        const voiceoverText = row.narasi || row.naskah || row.isi || "";
                        const mediaAttachment = sceneMedia[ri];

                        return (
                          <tr
                            key={row.__id ?? `video-scene-${ri}`}
                            className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]"
                          >
                            {/* Col 1: Scene */}
                            <td className="px-4 py-4 align-top font-semibold text-zinc-900 dark:text-zinc-100">
                              {sceneNumber}
                            </td>

                            {/* Col 2: Durasi */}
                            <td className="px-4 py-4 align-top text-xs font-medium text-zinc-600 dark:text-zinc-400">
                              {timeRange}
                            </td>

                            {/* Col 3: Visual (Interactive Media Box + Deskripsi) */}
                            <td className="px-4 py-4 align-top">
                              <div className="flex items-start gap-3">
                                {/* Thumbnail Box 80x80 (Figma EL-a56f717b): KHUSUS MEDIA MANUAL SCENE */}
                                {mediaAttachment ? (
                                  /* State 1: Ada Media Manual Terpilih (Gambar/Video) */
                                  <div className="group relative size-20 shrink-0 overflow-hidden rounded-lg border border-brand/40 bg-black shadow-xs">
                                    <Image
                                      src={mediaAttachment.url}
                                      alt={mediaAttachment.title}
                                      fill
                                      className="object-cover"
                                    />
                                    {mediaAttachment.type === "video" && (
                                      <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.2 text-[9px] font-mono font-medium text-white">
                                        {mediaAttachment.duration || "Video"}
                                      </span>
                                    )}

                                    {/* Hover Actions: Ganti / Hapus Media Manual */}
                                    <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setActiveMediaTarget({
                                            rowIndex: ri,
                                            mode: "manual",
                                            title: `Ganti Media Scene ${sceneNumber}`,
                                            subtitle: "Ganti berkas media manual untuk scene ini",
                                            defaultTab: mediaAttachment.type === "video" ? "video" : "image",
                                            allowedTypes: ["video", "image"],
                                            multiSelect: false,
                                          })
                                        }
                                        className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/40"
                                        title="Ganti media manual"
                                      >
                                        <PencilIcon className="size-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSceneMedia((prev) => {
                                            const next = { ...prev };
                                            delete next[ri];
                                            return next;
                                          });
                                          toast.info(`Media manual Scene ${sceneNumber} dihapus.`);
                                        }}
                                        className="rounded-full bg-red-500/80 p-1.5 text-white hover:bg-red-600"
                                        title="Hapus media manual"
                                      >
                                        <TrashIcon className="size-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* State 2: Placeholder Kosong -> Klik untuk tambah/upload media manual */
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveMediaTarget({
                                        rowIndex: ri,
                                        mode: "manual",
                                        title: `Pilih Media Manual Scene ${sceneNumber}`,
                                        subtitle: "Pilih foto atau video manual dari galeri atau unggah dari perangkat",
                                        defaultTab: "video",
                                        allowedTypes: ["video", "image"],
                                        multiSelect: false,
                                      })
                                    }
                                    className="group flex size-20 shrink-0 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50/70 text-zinc-400 transition-all hover:border-brand hover:bg-brand/5 hover:text-brand dark:border-zinc-700 dark:bg-zinc-800/60"
                                    title="Klik untuk memilih atau mengunggah media video/gambar manual"
                                  >
                                    <PlusIcon className="size-5 transition-transform group-hover:scale-110" />
                                    <span className="mt-1 text-[9px] font-semibold text-zinc-400 group-hover:text-brand">
                                      Add Media
                                    </span>
                                  </button>
                                )}

                                <div className="flex flex-1 flex-col gap-2">
                                  {isEditing ? (
                                    <textarea
                                      rows={2}
                                      value={visualText}
                                      onChange={(e) => updateCell(ri, "visual", e.target.value)}
                                      placeholder="Visual / B-roll prompt..."
                                      className="w-full resize-y rounded-lg border border-zinc-200/80 bg-white px-2.5 py-1.5 text-xs text-foreground outline-none transition-colors focus:border-brand dark:border-white/10 dark:bg-zinc-900"
                                    />
                                  ) : (
                                    <p className="text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
                                      {visualText || <span className="italic text-zinc-400">Belum ada visual</span>}
                                    </p>
                                  )}

                                  {/* Bagian Referensi Gambar AI: Sembunyi jika media manual sudah terpasang */}
                                  {!mediaAttachment ? (
                                    <div className="flex items-center gap-2 pt-0.5">
                                      {(sceneReferences[ri] || []).length === 0 ? (
                                        /* Subcase B1: Belum ada referensi -> Tombol "+ Add Referensi" (Figma #1022:10170) */
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setActiveMediaTarget({
                                              rowIndex: ri,
                                              mode: "reference",
                                              title: `Pilih Gambar Referensi Scene ${sceneNumber}`,
                                              subtitle: "Pilih gambar referensi dari galeri atau upload untuk panduan AI generate",
                                              defaultTab: "image",
                                              allowedTypes: ["image"],
                                              multiSelect: true,
                                            })
                                          }
                                          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 shadow-2xs hover:border-brand hover:text-brand dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-brand dark:hover:text-brand transition-colors"
                                        >
                                          <PlusIcon className="size-3" />
                                          <span>Add Referensi</span>
                                        </button>
                                      ) : (
                                        /* Subcase B2: Ada Referensi -> Avatar stack + label "X Referensi" (Figma #1022:11992 row-2) */
                                        <div className="inline-flex items-center gap-2 rounded-lg border border-sky-200/80 bg-sky-50/70 px-2.5 py-1 dark:border-sky-900/40 dark:bg-sky-950/30">
                                          <div className="flex items-center -space-x-2">
                                            {(sceneReferences[ri] || []).slice(0, 3).map((ref, idx) => (
                                              <div
                                                key={ref.id || idx}
                                                className="relative size-5.5 overflow-hidden rounded-full border-1.5 border-white bg-zinc-100 shadow-2xs dark:border-zinc-900"
                                                title={ref.title}
                                              >
                                                <Image src={ref.url} alt={ref.title} fill className="object-cover" />
                                              </div>
                                            ))}
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              setActiveMediaTarget({
                                                rowIndex: ri,
                                                mode: "reference",
                                                title: `Kelola Gambar Referensi Scene ${sceneNumber}`,
                                                subtitle: "Pilih atau ubah gambar referensi panduan AI",
                                                defaultTab: "image",
                                                allowedTypes: ["image"],
                                                multiSelect: true,
                                              })
                                            }
                                            className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline dark:text-sky-400"
                                            title="Kelola gambar referensi"
                                          >
                                            {(sceneReferences[ri] || []).length} Referensi
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSceneReferences((prev) => {
                                                const next = { ...prev };
                                                delete next[ri];
                                                return next;
                                              });
                                              toast.info(`Referensi Scene ${sceneNumber} dihapus.`);
                                            }}
                                            className="ml-0.5 rounded-full p-0.5 text-zinc-400 hover:bg-zinc-200/60 hover:text-red-500 dark:hover:bg-zinc-800"
                                            title="Hapus semua referensi"
                                          >
                                            <XIcon className="size-3" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 pt-0.5">
                                      <span className="inline-flex items-center gap-1 rounded-md bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand-strong dark:bg-brand/20 dark:text-brand">
                                        <CheckIcon className="size-3" />
                                        <span className="max-w-[180px] truncate">{mediaAttachment.title}</span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Col 4: Text Pada Visual */}
                            <td className="px-4 py-4 align-top">
                              {isEditing ? (
                                <textarea
                                  rows={2}
                                  value={textPadaVisual}
                                  onChange={(e) => updateCell(ri, "teks_onscreen", e.target.value)}
                                  placeholder="Headline di video..."
                                  className="w-full resize-y rounded-lg border border-zinc-200/80 bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none transition-colors focus:border-brand dark:border-white/10 dark:bg-zinc-900"
                                />
                              ) : (
                                <p className="text-xs font-medium leading-relaxed text-zinc-800 dark:text-zinc-200">
                                  {textPadaVisual || <span className="italic text-zinc-400 font-normal">Tidak ada teks visual</span>}
                                </p>
                              )}
                            </td>

                            {/* Col 5: Voiceover (VO) */}
                            <td className="px-4 py-4 align-top">
                              {isEditing ? (
                                <textarea
                                  rows={2}
                                  value={voiceoverText}
                                  onChange={(e) => updateCell(ri, "narasi", e.target.value)}
                                  placeholder="Naskah voiceover..."
                                  className="w-full resize-y rounded-lg border border-zinc-200/80 bg-white px-2.5 py-1.5 text-xs text-foreground outline-none transition-colors focus:border-brand dark:border-white/10 dark:bg-zinc-900"
                                />
                              ) : (
                                <p className="text-xs italic leading-relaxed text-zinc-700 dark:text-zinc-300">
                                  {voiceoverText ? `"${voiceoverText}"` : <span className="text-zinc-400 not-italic">Belum ada VO</span>}
                                </p>
                              )}
                            </td>

                            {/* Col 6: Aksi Hapus */}
                            {isEditing && (
                              <td className="px-4 py-4 align-top text-center">
                                <button
                                  type="button"
                                  onClick={() => removeRow(ri)}
                                  disabled={rows.length <= 1}
                                  className="rounded p-1 text-zinc-400 hover:text-red-500 disabled:opacity-30"
                                  title="Hapus scene"
                                >
                                  <TrashIcon width={14} height={14} />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {isEditing && (
                  <div className="flex justify-center border-t border-zinc-100 p-3 dark:border-white/5">
                    <Button size="sm" variant="secondary" onPress={addRow} className="gap-1.5 text-xs">
                      <PlusIcon width={14} height={14} /> Tambah Scene
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* LAYOUT 2 & 3: SINGLE IMAGE (#1022:12092) & MULTI IMAGE CAROUSEL (#1022:12239) */}
            {contentType !== "video" && (
              <div className="flex flex-col gap-6">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
                    {rows.map((row, ri) => {
                      const titleKey =
                        schema.columns.find((c) => ["judul", "teks", "title"].includes(c.key))?.key ??
                        schema.columns[1]?.key ??
                        "judul";
                      const bodyKey =
                        schema.columns.find((c) => ["isi", "narasi", "teks_onscreen", "konten"].includes(c.key))?.key ??
                        schema.columns[2]?.key ??
                        "isi";
                      const visualKey =
                        schema.columns.find((c) => ["visual", "elemenVisual"].includes(c.key))?.key ??
                        schema.columns[3]?.key ??
                        "visual";

                      const titleVal = row[titleKey] ?? "";
                      const bodyVal = row[bodyKey] ?? "";
                      const visualVal = row[visualKey] ?? "";

                      const visualMode = activeVisualMode[ri] ?? (sceneMedia[ri] ? "manual" : "empty");
                      const manualMedia = sceneMedia[ri];
                      const genList = sceneGeneratedImages[ri] || [];
                      const selectedThumb = activeThumbnails[ri] ?? (genList.length > 0 ? genList.length - 1 : 0);
                      const activeGenVisual = genList[selectedThumb];
                      const isRowGenerating = !!generatingRows[ri];

                      const activeDisplayMedia =
                        visualMode === "manual" && manualMedia
                          ? { url: manualMedia.url, title: manualMedia.title, isManual: true }
                          : visualMode === "generated" && activeGenVisual
                            ? { url: activeGenVisual.url, title: activeGenVisual.title, isManual: false }
                            : null;

                      return (
                        <div
                          key={row.__id ?? `image-card-${ri}`}
                          className="relative flex flex-col gap-6 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 dark:border-white/10 dark:bg-zinc-900/80 lg:flex-row"
                        >
                          {/* Left Column: Visual Preview + Ubah Gambar Dropdown (Figma #1022:12147 / #1022:12296) */}
                          <div className="flex w-full flex-col gap-3 lg:w-[320px] lg:shrink-0">
                            <div className="relative flex h-[240px] w-full flex-col justify-between overflow-hidden rounded-xl border border-zinc-200/80 bg-gradient-to-br from-zinc-100 to-zinc-200/60 p-3 dark:border-white/10 dark:from-zinc-950 dark:to-zinc-900">
                              {/* Background Image jika media aktif ada dan sedang tidak generating */}
                              {activeDisplayMedia && !isRowGenerating && (
                                <Image
                                  src={activeDisplayMedia.url}
                                  alt={activeDisplayMedia.title}
                                  fill
                                  className="object-cover"
                                />
                              )}

                              {/* Overlay Loading State ketika sedang generate AI */}
                              {isRowGenerating && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2.5 bg-black/60 p-4 text-center backdrop-blur-sm transition-all">
                                  <div className="relative flex size-12 items-center justify-center rounded-full bg-white/10 text-brand ring-2 ring-brand/40">
                                    <RefreshIcon className="size-6 animate-spin text-brand" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white">
                                      Sedang Generate Gambar AI...
                                    </span>
                                    <span className="text-[10px] text-zinc-300">
                                      Variasi ke-{genList.length + 1} dari 3
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Overlay Ubah Gambar Dropdown (Figma #1022:12297 / #1022:12298) */}
                              <div className="relative z-10 self-start">
                                <button
                                  type="button"
                                  onClick={() => setOpenDropdownIndex(openDropdownIndex === ri ? null : ri)}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur hover:bg-zinc-900 dark:bg-white/90 dark:text-zinc-900 dark:hover:bg-white"
                                >
                                  Ubah Gambar
                                </button>

                                {openDropdownIndex === ri && (
                                  <div className="absolute left-0 top-9 z-30 w-64 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/15 dark:bg-zinc-900">
                                    {/* 1. Pilih dari Magneto */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMediaTarget({
                                          rowIndex: ri,
                                          mode: "manual",
                                          title: `Pilih Gambar Aset Magneto (${noun} ${ri + 1})`,
                                          defaultTab: "image",
                                          allowedTypes: ["image"],
                                          multiSelect: false,
                                        });
                                        setOpenDropdownIndex(null);
                                      }}
                                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10"
                                    >
                                      <DatabaseIcon className="size-4 text-brand" />
                                      <span>Pilih dari Magneto</span>
                                    </button>

                                    {/* 2. Pilih dari Perangkat Saya */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMediaTarget({
                                          rowIndex: ri,
                                          mode: "manual",
                                          title: `Upload Berkas Gambar (${noun} ${ri + 1})`,
                                          defaultTab: "upload",
                                          allowedTypes: ["image"],
                                          multiSelect: false,
                                        });
                                        setOpenDropdownIndex(null);
                                      }}
                                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10"
                                    >
                                      <FolderIcon className="size-4 text-brand" />
                                      <span>Pilih dari Perangkat Saya</span>
                                    </button>

                                    {/* 3. Generate Image AI */}
                                    <button
                                      type="button"
                                      disabled={isRowGenerating || genList.length >= 3}
                                      onClick={() => handleGenerateAIImage(ri)}
                                      className={cn(
                                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors",
                                        genList.length >= 3
                                          ? "cursor-not-allowed text-zinc-400 opacity-60"
                                          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10",
                                      )}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <SparkIcon className="size-4 text-brand-strong dark:text-brand" />
                                        <span>Generate {genList.length > 0 ? "Variasi Baru" : "Image"}</span>
                                      </div>
                                      <span className="text-[10px] text-zinc-400">
                                        {genList.length >= 3 ? "Batas 3x tercapai" : "Rp6000/gen"}
                                      </span>
                                    </button>

                                    {/* 4. Kembali ke Hasil Generate jika sedang mode manual & punya riwayat generate */}
                                    {visualMode === "manual" && genList.length > 0 && (
                                      <div className="mt-1 border-t border-zinc-100 pt-1 dark:border-white/10">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveVisualMode((prev) => ({ ...prev, [ri]: "generated" }));
                                            setOpenDropdownIndex(null);
                                            toast.info("Beralih ke Hasil Generate Image.");
                                          }}
                                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-brand hover:bg-brand/10"
                                        >
                                          <SparkIcon className="size-3.5" />
                                          <span>Lihat Hasil Generate ({genList.length} variasi)</span>
                                        </button>
                                      </div>
                                    )}

                                    {/* 5. Hapus Media Manual jika ada */}
                                    {manualMedia && (
                                      <div className="mt-1 border-t border-zinc-100 pt-1 dark:border-white/10">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSceneMedia((prev) => {
                                              const next = { ...prev };
                                              delete next[ri];
                                              return next;
                                            });
                                            setActiveVisualMode((prev) => ({
                                              ...prev,
                                              [ri]: genList.length > 0 ? "generated" : "empty",
                                            }));
                                            setOpenDropdownIndex(null);
                                            toast.info("Media manual dihapus.");
                                          }}
                                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                        >
                                          <TrashIcon className="size-3.5" />
                                          <span>Hapus Media Pilihan</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Preview Center Graphic jika belum ada media aktif & tidak sedang generating */}
                              {!activeDisplayMedia && !isRowGenerating && (
                                <div className="my-auto flex flex-col items-center justify-center gap-2 text-center">
                                  <div className="flex size-12 items-center justify-center rounded-full bg-white/70 text-zinc-400 shadow-sm dark:bg-white/10">
                                    <ImageIcon width={24} height={24} />
                                  </div>
                                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    Preview Visual {noun} {ri + 1}
                                  </span>
                                </div>
                              )}

                              <div className="relative z-10 self-end rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                                {activeDisplayMedia ? activeDisplayMedia.title : activeRatio}
                              </div>
                            </div>

                            {/* Sub-section: Hasil Generate Image (HANYA MUNCUL KETIKA MODE GENERATED / USER KLIK GENERATE) */}
                            {(contentType === "carousel" || contentType === "image") && visualMode === "generated" && (
                              <div className="flex flex-col gap-2 pt-1 transition-all">
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                      Hasil Generate Image
                                    </span>
                                    <span className="text-[11px] text-zinc-400">
                                      Maksimal 3x generate image ({genList.length}/3 terpakai)
                                    </span>
                                  </div>

                                  {genList.length < 3 && !isRowGenerating && (
                                    <button
                                      type="button"
                                      onClick={() => handleGenerateAIImage(ri)}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand transition-all hover:bg-brand hover:text-white"
                                    >
                                      <SparkIcon width={12} height={12} />
                                      <span>Generate Lagi</span>
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center gap-2.5">
                                  {[0, 1, 2].map((thumbIdx) => {
                                    const item = genList[thumbIdx];
                                    const isSelected = selectedThumb === thumbIdx && !!item;
                                    const isCurrentSlotLoading = isRowGenerating && thumbIdx === genList.length;

                                    if (item) {
                                      return (
                                        <button
                                          key={item.id || thumbIdx}
                                          type="button"
                                          onClick={() => {
                                            setActiveThumbnails((prev) => ({ ...prev, [ri]: thumbIdx }));
                                            setActiveVisualMode((prev) => ({ ...prev, [ri]: "generated" }));
                                          }}
                                          className={cn(
                                            "group relative flex size-20 items-center justify-center overflow-hidden rounded-lg border bg-zinc-100 transition-all dark:bg-zinc-800",
                                            isSelected
                                              ? "border-2 border-brand shadow-md ring-2 ring-brand/30"
                                              : "border-zinc-200/80 opacity-60 hover:opacity-100 dark:border-white/10",
                                          )}
                                          title={`${item.title} - Klik untuk tampilkan`}
                                        >
                                          <Image
                                            src={item.url}
                                            alt={item.title}
                                            fill
                                            className="object-cover"
                                          />
                                          <span className="absolute left-1 top-1 z-10 rounded bg-black/70 px-1 py-0.2 text-[9px] font-bold text-white backdrop-blur">
                                            v{thumbIdx + 1}
                                          </span>
                                          {isSelected && (
                                            <span className="absolute bottom-1 right-1 z-10 rounded-full bg-brand p-0.5 text-white shadow">
                                              <CheckIcon width={10} height={10} />
                                            </span>
                                          )}
                                        </button>
                                      );
                                    }

                                    if (isCurrentSlotLoading) {
                                      return (
                                        <div
                                          key={`loading-${thumbIdx}`}
                                          className="relative flex size-20 animate-pulse flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand/60 bg-brand/5 dark:bg-brand/10"
                                        >
                                          <RefreshIcon className="size-4 animate-spin text-brand" />
                                          <span className="mt-1 text-[9px] font-semibold text-brand">Gen {thumbIdx + 1}...</span>
                                        </div>
                                      );
                                    }

                                    return (
                                      <button
                                        key={`empty-${thumbIdx}`}
                                        type="button"
                                        disabled={isRowGenerating || thumbIdx > genList.length}
                                        onClick={() => handleGenerateAIImage(ri)}
                                        className="relative flex size-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 text-zinc-400 opacity-60 transition-all hover:border-brand hover:bg-brand/5 hover:opacity-100 hover:text-brand dark:border-white/10 dark:bg-zinc-800/40"
                                        title={thumbIdx === genList.length ? `Klik untuk generate variasi ke-${thumbIdx + 1}` : `Slot ${thumbIdx + 1}`}
                                      >
                                        <SparkIcon width={16} height={16} />
                                        <span className="mt-1 text-[9px] font-medium">Slot {thumbIdx + 1}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right Column: Content Fields (Figma #1022:12150 / #1022:12306) */}
                          <div className="flex flex-1 flex-col gap-4">
                            {/* Card Title Row with Badge Draft */}
                            <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-white/5">
                              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                                Visual Image {ri + 1}
                              </h4>
                              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                                Draft
                              </span>
                            </div>

                            {/* Field 1: Text Judul Di gambar (Figma #1022:12311) */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                Text Judul Di gambar
                              </label>
                              <input
                                value={titleVal}
                                onChange={(e) => updateCell(ri, titleKey, e.target.value)}
                                placeholder="Masukkan judul headline pada gambar..."
                                className="w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-sm font-medium text-foreground outline-none transition-colors focus:border-brand dark:border-white/10 dark:bg-zinc-900"
                              />
                            </div>

                            {/* Field 2: Text Deskripsi Di gambar (Figma #1022:12312) */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                Text Deskripsi Di gambar
                              </label>
                              <textarea
                                rows={2}
                                value={bodyVal}
                                onChange={(e) => updateCell(ri, bodyKey, e.target.value)}
                                placeholder="Isi deskripsi atau narasi singkat..."
                                className="w-full resize-y rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-brand dark:border-white/10 dark:bg-zinc-900"
                              />
                            </div>

                            {/* Field 3: Visual Prompt (Figma #1022:12313) */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                Visual
                              </label>
                              <textarea
                                rows={3}
                                value={visualVal}
                                onChange={(e) => updateCell(ri, visualKey, e.target.value)}
                                placeholder="Prompt elemen visual untuk generate gambar..."
                                className="w-full resize-y rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-brand dark:border-white/10 dark:bg-zinc-900"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </SortableContext>
                </DndContext>

                {/* Tombol Tambah Slide untuk Multi Image */}
                {contentType === "carousel" && (
                  <div className="flex justify-center pt-2">
                    <Button size="sm" variant="secondary" onPress={addRow} className="gap-1.5 text-xs">
                      <PlusIcon width={14} height={14} /> Tambah Slide
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Caption Card */}
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-zinc-200/70 bg-zinc-50/50 p-4 dark:border-white/5 dark:bg-zinc-800/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Caption Rekomendasi
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={async () => {
                    setBusy("captions");
                    try {
                      const res = await post<{ brief: BriefDTO }>(`/api/briefs/${brief.id}/captions`);
                      apply(res.brief);
                      toast.success("Caption diperbarui.");
                    } catch (e: unknown) {
                      toast.danger((e as Error).message ?? "Gagal caption.");
                    } finally {
                      setBusy(null);
                    }
                  }}
                  isDisabled={!!busy}
                  className="gap-1 text-xs"
                >
                  <RefreshIcon width={12} height={12} /> Buat ulang
                </Button>
              </div>

              {caption ? (
                <div className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                  <p className="whitespace-pre-wrap">{caption.text}</p>
                  {caption.hashtags?.length > 0 && (
                    <p className="mt-1 font-semibold text-brand-strong dark:text-brand">
                      {caption.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs italic text-zinc-400">Belum ada caption dibuat.</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* STICKY FOOTER ACTIONS (Figma #1022:12235 / #1022:12014) - Hanya untuk single media mode */}
      {!isMultiType && (
        <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-xl dark:border-white/15 dark:bg-zinc-900/95 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Simpan perubahan sebelum melanjutkan ke Canvas Editor.
          </span>

          <Button
            size="sm"
            onPress={contentType === "video" ? () => (onPreviewVideo ? onPreviewVideo(brief) : generateMedia()) : generateMedia}
            isDisabled={!!busy}
            className="gap-2 bg-zinc-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            <SparkIcon width={14} height={14} />
            {contentType === "video" ? "Lanjut Generate Video" : "Lanjut ke Editor"}
          </Button>
        </div>
      )}

      {/* MODAL INSERT MEDIA (GALERI MAGNETO & UPLOAD PERANGKAT) */}
      <InsertMediaModal
        isOpen={activeMediaTarget !== null}
        onClose={() => setActiveMediaTarget(null)}
        title={activeMediaTarget?.title}
        subtitle={activeMediaTarget?.subtitle}
        defaultTab={activeMediaTarget?.defaultTab ?? "video"}
        allowedTypes={activeMediaTarget?.allowedTypes ?? ["video", "image"]}
        multiSelect={activeMediaTarget?.multiSelect ?? false}
        initialSelectedAssets={
          activeMediaTarget
            ? activeMediaTarget.mode === "manual"
              ? sceneMedia[activeMediaTarget.rowIndex]
                ? [sceneMedia[activeMediaTarget.rowIndex]]
                : []
              : sceneReferences[activeMediaTarget.rowIndex] || []
            : []
        }
        onSelectMedia={(asset) => {
          if (activeMediaTarget !== null) {
            const { rowIndex, mode } = activeMediaTarget;
            if (mode === "manual") {
              setSceneMedia((prev) => ({
                ...prev,
                [rowIndex]: asset,
              }));
              setActiveVisualMode((prev) => ({
                ...prev,
                [rowIndex]: "manual",
              }));
              toast.success(`Media ${noun} ${rowIndex + 1} berhasil diterapkan.`);
            } else {
              setSceneReferences((prev) => {
                const existing = prev[rowIndex] || [];
                if (existing.some((a) => a.id === asset.id || a.url === asset.url)) return prev;
                return { ...prev, [rowIndex]: [...existing, asset] };
              });
              toast.success(`Referensi Scene ${rowIndex + 1} ditambahkan.`);
            }
          }
        }}
        onSelectMultiple={(assets) => {
          if (activeMediaTarget !== null) {
            const { rowIndex, mode } = activeMediaTarget;
            if (mode === "reference") {
              setSceneReferences((prev) => ({
                ...prev,
                [rowIndex]: assets,
              }));
              toast.success(`${assets.length} referensi Scene ${rowIndex + 1} berhasil disimpan.`);
            }
          }
        }}
      />
    </div>
  );
}

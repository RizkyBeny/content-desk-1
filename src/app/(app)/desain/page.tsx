"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react";
import { apiFetch, post } from "@/lib/client";
import { SectionHeader } from "@/components/ui/primitives";
import { EmptyBlock, ErrorState, LoadingState } from "@/components/ui/states";
import { ImageIcon, LayersIcon, PencilIcon } from "@/components/ui/icons";
import { CANVAS_DIMS } from "@/components/editor/canvas/dims";
import { formatDateId } from "@/lib/utils";
import {
  DESIGN_RATIOS,
  DESIGN_TEMPLATES,
  blankEditorState,
  type DesignKind,
  type DesignTemplate,
} from "../../../../config/design-templates";
import type { EditorState, Ratio } from "@/types";

interface CreationSummary {
  id: string;
  projectId: string;
  projectTitle: string;
  type: string;
  status: string;
  itemCount: number;
  completedCount: number;
  updatedAt: string;
}

const KIND_LABEL: Record<DesignKind, string> = {
  image: "Satu gambar",
  carousel: "Carousel (3 slide)",
};

const TABS: { key: "all" | DesignKind; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "image", label: "Gambar" },
  { key: "carousel", label: "Carousel" },
];

function tabCls(on: boolean) {
  return `rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
    on
      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
  }`;
}

export default function DesainPage() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<"all" | DesignKind>("all");
  const [recent, setRecent] = useState<CreationSummary[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let aborted = false;
    (async () => {
      setRecentLoading(true);
      setRecentError(null);
      try {
        const res = await apiFetch<{ items: CreationSummary[] }>("/api/creations?limit=60");
        if (!aborted) {
          setRecent(
            res.items.filter((c) => c.type === "image" || c.type === "carousel").slice(0, 8),
          );
        }
      } catch (e) {
        if (!aborted) setRecentError((e as Error).message ?? "Gagal memuat desain terakhir.");
      } finally {
        if (!aborted) setRecentLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [reload]);

  const templates = useMemo(
    () => (kindFilter === "all" ? DESIGN_TEMPLATES : DESIGN_TEMPLATES.filter((t) => t.kind === kindFilter)),
    [kindFilter],
  );

  async function createDesign(state: EditorState, key: string) {
    if (busy) return;
    setBusy(key);
    try {
      const res = await post<{ creationId: string }>("/api/designs", {
        type: state.type,
        editorState: state,
      });
      router.push(`/desain/${res.creationId}`);
    } catch (e) {
      toast.danger((e as Error).message ?? "Gagal membuat desain.");
      setBusy(null);
    }
  }

  function startBlank(kind: DesignKind, ratio: Ratio) {
    void createDesign(blankEditorState(kind, ratio), `blank-${kind}-${ratio}`);
  }

  function startTemplate(t: DesignTemplate) {
    void createDesign(t.build(), t.id);
  }

  return (
    <div className="space-y-8 py-4">
      <SectionHeader
        title="Desain"
        description="Buat desain baru dari kanvas kosong atau template — langsung terbuka di editor."
      />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Buat kosong</h2>
        {(["image", "carousel"] as DesignKind[]).map((kind) => (
          <div key={kind} className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {kind === "image" ? <ImageIcon width={14} height={14} /> : <LayersIcon width={14} height={14} />}
              {KIND_LABEL[kind]}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DESIGN_RATIOS.map((ratio) => {
                const dims = CANVAS_DIMS[ratio];
                const key = `blank-${kind}-${ratio}`;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => startBlank(kind, ratio)}
                    disabled={Boolean(busy)}
                    className="group rounded-2xl border border-zinc-200/70 bg-white/70 p-3 text-left transition-transform hover:-translate-y-0.5 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-900/60"
                  >
                    <div
                      className="flex w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 text-xs font-medium text-zinc-500 dark:border-white/15 dark:bg-zinc-950/50 dark:text-zinc-400"
                      style={{ aspectRatio: ratio.replace(":", "/") }}
                    >
                      {busy === key ? "Membuat…" : ratio}
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {dims.w}×{dims.h} px
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Template</h2>
          <div className="flex gap-1.5" role="tablist" aria-label="Filter template">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={kindFilter === tab.key}
                onClick={() => setKindFilter(tab.key)}
                className={tabCls(kindFilter === tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => startTemplate(t)}
              disabled={Boolean(busy)}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/70 text-left transition-transform hover:-translate-y-0.5 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-900/60"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <Image
                  src={t.thumbnail}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="truncate text-sm font-semibold text-white">{t.title}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                      {t.kind === "image" ? "Gambar" : "Carousel"}
                    </span>
                    <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                      {t.ratio}
                    </span>
                    <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                      {t.category}
                    </span>
                  </div>
                </div>
                {busy === t.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-medium text-white">
                    Membuat desain…
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Terakhir diedit</h2>
        {recentLoading && <LoadingState rows={1} />}
        {!recentLoading && recentError && (
          <ErrorState message={recentError} onRetry={() => setReload((n) => n + 1)} />
        )}
        {!recentLoading && !recentError && recent.length === 0 && (
          <EmptyBlock
            icon={<PencilIcon />}
            title="Belum ada desain"
            description="Pilih template atau buat kanvas kosong untuk memulai."
          />
        )}
        {!recentLoading && !recentError && recent.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {recent.map((c) => (
              <Link
                key={c.id}
                href={`/desain/${c.id}`}
                className="glass-card flex flex-col gap-2 p-4 transition-colors hover:bg-white/60 dark:hover:bg-white/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-semibold">{c.projectTitle}</p>
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {c.type === "carousel" ? "Carousel" : "Gambar"}
                  </span>
                </div>
                <span className="mt-auto text-xs text-zinc-500 dark:text-zinc-400">
                  {formatDateId(c.updatedAt, true)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

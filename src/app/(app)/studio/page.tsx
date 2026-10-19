"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Chip } from "@heroui/react";
import { apiFetch } from "@/lib/client";
import { SectionHeader } from "@/components/ui/primitives";
import { EmptyBlock, ErrorState, LoadingState } from "@/components/ui/states";
import { SparkIcon } from "@/components/ui/icons";
import { CONTENT_TYPE_LABELS } from "../../../../config/brief-schemas";
import type { ContentType } from "@/types";

interface CreationSummary {
  id: string;
  projectId: string;
  projectTitle: string;
  type: ContentType;
  status: string;
  itemCount: number;
  completedCount: number;
  updatedAt: string;
}

const STATUS_COLOR: Record<string, "default" | "warning" | "success" | "danger"> = {
  generating: "warning",
  ready: "success",
  failed: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  generating: "Diproses",
  ready: "Siap",
  failed: "Sebagian gagal",
};

export default function StudioPage() {
  const [items, setItems] = useState<CreationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let aborted = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<{ items: CreationSummary[] }>("/api/creations?limit=60");
        if (!aborted) setItems(res.items);
      } catch (e) {
        if (!aborted) setError((e as Error).message ?? "Gagal memuat studio.");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [reload]);

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        title="Studio"
        description="Konten yang di-generate dan diedit. Buka untuk melanjutkan ke editor."
      />

      {loading && <LoadingState rows={3} />}
      {error && !loading && <ErrorState message={error} onRetry={() => setReload((n) => n + 1)} />}

      {!loading && !error && items.length === 0 && (
        <EmptyBlock
          icon={<SparkIcon />}
          title="Belum ada konten"
          description="Buat brief di Proyek lalu tekan Generate Konten untuk mulai."
        />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((c) => (
            <Link
              key={c.id}
              href={c.status === "generating" ? `/proyek/${c.projectId}` : `/studio/${c.id}`}
              className="glass-card flex flex-col gap-3 p-4 transition-colors hover:bg-white/60 dark:hover:bg-white/5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-semibold">{c.projectTitle}</p>
                <Chip size="sm" color={STATUS_COLOR[c.status] ?? "default"} variant="soft">
                  {STATUS_LABEL[c.status] ?? c.status}
                </Chip>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>{CONTENT_TYPE_LABELS[c.type] ?? c.type}</span>
                <span>
                  {c.completedCount}/{c.itemCount} item
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

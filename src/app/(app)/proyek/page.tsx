"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Chip } from "@heroui/react";
import { apiFetch } from "@/lib/client";
import { SectionHeader } from "@/components/ui/primitives";
import { EmptyBlock, LoadingState } from "@/components/ui/states";
import { ProjectIcon, RefreshIcon } from "@/components/ui/icons";

interface ProjectRow {
  id: string;
  origin: string;
  topicTitle: string;
  contentType: string | null;
  status: string;
  angleTitle: string | null;
  updatedAt: string;
}

/**
 * Pintasan ke proyek demo ber-ID tetap (mode mock). Ditampilkan hanya kalau
 * memang ada proyek `demo-*` di daftar — di mode database blok ini otomatis
 * hilang karena ID-nya tidak ada.
 */
const DEMO_SHORTCUTS: { id: string; label: string; note: string }[] = [
  { id: "demo-angle", label: "1 · Angle", note: "Angle digenerate saat dibuka" },
  { id: "demo-type", label: "2 · Jenis Konten", note: "Angle sudah dipilih" },
  { id: "demo-brief", label: "3 · Brief", note: "Brief draft bisa diedit" },
  { id: "demo-generate", label: "4 · Generate", note: "Brief siap, tombol aktif" },
  { id: "demo-editor", label: "5 · Editor", note: "Konten siap dibuka di editor" },
];

export default function ProyekPage() {
  const [items, setItems] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ items: ProjectRow[] }>("/api/projects");
      setItems(res.items);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? "Gagal memuat proyek.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await apiFetch<{ items: ProjectRow[] }>("/api/projects");
        if (!aborted) setItems(res.items);
      } catch (e: unknown) {
        if (aborted) return;
        const err = e as { message?: string };
        setError(err.message ?? "Gagal memuat proyek.");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  const sorted = [...items].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 12);
  const hasDemo = items.some((p) => p.id.startsWith("demo-"));

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        title="Proyek"
        description="Daftar brief dan konten yang sedang dikerjakan."
        action={
          <Button variant="secondary" size="sm" onPress={load} isDisabled={loading}>
            <RefreshIcon width={16} height={16} /> Muat ulang
          </Button>
        }
      />
      {loading && <LoadingState rows={3} />}
      {error && !loading && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="space-y-6">
          {hasDemo && (
            <div className="glass-card space-y-3 p-5">
              <SectionHeader
                title="Proyek demo"
                description="ID tetap — tiap kartu membuka satu tahap alur Angle → Jenis → Brief → Generate."
                align="center"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {DEMO_SHORTCUTS.map((demo) => (
                  <Link
                    key={demo.id}
                    href={`/proyek/${demo.id}`}
                    className="glass-panel flex flex-col gap-1 p-3 transition-transform hover:-translate-y-0.5"
                  >
                    <p className="text-sm font-semibold">{demo.label}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{demo.note}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {sorted.map((p) => (
                <Link
                  key={p.id}
                  href={`/proyek/${p.id}`}
                  className="glass-card flex flex-col gap-3 p-5 transition-transform hover:-translate-y-0.5"
                >
                  <div className="min-w-0 space-y-2">
                    <p className="truncate text-sm font-semibold">{p.topicTitle}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <Chip size="sm">{p.status}</Chip>
                      {p.contentType && <Chip size="sm" variant="soft">{p.contentType}</Chip>}
                    </div>
                    {p.angleTitle && <p className="truncate text-xs text-zinc-500">Angle: {p.angleTitle}</p>}
                  </div>
                  <div className="mt-auto flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{new Date(p.updatedAt).toLocaleString("id-ID")}</span>
                    <span className="text-zinc-400">→</span>
                  </div>
                </Link>
              ))}
            </div>
            {items.length === 0 && (
              <EmptyBlock
                icon={<ProjectIcon />}
                title="Belum ada proyek"
                description="Mulai dari halaman Overview: pilih rekomendasi topik lalu buat konten."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

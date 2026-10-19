"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { ClientError, apiFetch } from "@/lib/client";
import { ProjectFlow, type ProjectState } from "@/components/project/project-flow";
import { EmptyBlock, ErrorState, LoadingState } from "@/components/ui/states";
import { ProjectIcon, RefreshIcon } from "@/components/ui/icons";
import type { Angle, BriefDTO, ContentType, RecommendedType } from "@/types";

/**
 * Halaman alur konten.
 *
 * Sengaja mengambil data lewat route API, bukan query DB langsung di server
 * component. Alasannya: di mode mock, store in-memory per proses serverless —
 * halaman dan `/api/*` adalah function terpisah dengan seed masing-masing, sehingga
 * query server component tidak pernah melihat project yang dibuat lewat API
 * (berujung 404 di preview Vercel). Dengan fetch ke API, semua baca/tulis
 * alur terjadi di satu tempat dan datanya konsisten di semua environment.
 */

/** Proyek demo ber-ID tetap (mode mock) — tujuan fallback untuk ID lama. */
const DEMO_PROJECT_ID = "demo-angle";

interface ProjectResponse {
  project: {
    id: string;
    topicTitle: string | null;
    topicSource: string | null;
    angles: Angle[] | null;
    selectedAngleId: string | null;
    angleTitle: string | null;
    recommendedTypes: RecommendedType[] | null;
    contentType: ContentType | null;
  };
}

type ViewState =
  | { kind: "loading" }
  | { kind: "ready"; project: ProjectState; brief: BriefDTO | null }
  | { kind: "missing" }
  | { kind: "error"; message: string };

/** Proyek demo tersedia? (hanya mode mock; di mode database hasilnya404) */
async function demoAvailable(): Promise<boolean> {
  try {
    await apiFetch(`/api/projects/${DEMO_PROJECT_ID}`);
    return true;
  } catch {
    return false;
  }
}

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [view, setView] = useState<ViewState>({ kind: "loading" });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!id) return;
    let aborted = false;
    (async () => {
      setView({ kind: "loading" });
      try {
        const res = await apiFetch<ProjectResponse>(`/api/projects/${id}`);
        if (aborted) return;

        let brief: BriefDTO | null = null;
        try {
          const briefRes = await apiFetch<{ brief: BriefDTO | null }>(`/api/projects/${id}/brief`);
          brief = briefRes.brief;
        } catch {
          brief = null;
        }
        if (aborted) return;

        const p = res.project;
        setView({
          kind: "ready",
          brief,
          project: {
            id: p.id,
            topicTitle: p.topicTitle ?? "",
            topicSource: p.topicSource ?? "custom",
            angles: p.angles ?? [],
            selectedAngleId: p.selectedAngleId,
            angleTitle: p.angleTitle,
            recommendedTypes: p.recommendedTypes ?? [],
            contentType: p.contentType ?? null,
          },
        });
      } catch (e) {
        if (aborted) return;
        if (e instanceof ClientError && e.status === 404) {
          // ID tidak dikenal. Di mode mock ini wajar: link lama menyimpan UUID
          // lama yang sudah tidak ada. Alih-alih halaman 404 bawaan, arahkan ke
          // proyek demo supaya preview tetap bisa dibuka.
          if (id !== DEMO_PROJECT_ID && (await demoAvailable())) {
            router.replace(`/proyek/${DEMO_PROJECT_ID}`);
            return;
          }
          setView({ kind: "missing" });
          return;
        }
        setView({ kind: "error", message: (e as Error).message ?? "Gagal memuat proyek." });
      }
    })();
    return () => {
      aborted = true;
    };
  }, [id, reload, router]);

  if (view.kind === "loading") {
    return (
      <div className="py-4">
        <LoadingState rows={4} />
      </div>
    );
  }

  if (view.kind === "error") {
    return (
      <div className="py-4">
        <ErrorState message={view.message} onRetry={() => setReload((n) => n + 1)} />
      </div>
    );
  }

  if (view.kind === "missing") {
    return (
      <div className="py-4">
        <EmptyBlock
          icon={<ProjectIcon />}
          title="Proyek tidak ditemukan"
          description="ID proyek ini tidak ada di data saat ini. Di mode demo, data hidup di memori server dan dibuat ulang dengan ID tetap setiap kali server start."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="primary" size="sm" onPress={() => router.push(`/proyek/${DEMO_PROJECT_ID}`)}>
                Buka proyek demo
              </Button>
              <Link
                href="/proyek"
                className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
              >
                Daftar proyek
              </Link>
              <Button variant="ghost" size="sm" onPress={() => setReload((n) => n + 1)}>
                <RefreshIcon width={16} height={16} /> Muat ulang
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="py-4">
      <ProjectFlow key={view.project.id} project={view.project} initialBrief={view.brief} />
    </div>
  );
}

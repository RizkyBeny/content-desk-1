"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Chip } from "@heroui/react";
import { toast } from "@heroui/react";
import { post } from "@/lib/client";
import { GlassCard, SectionHeader } from "@/components/ui/primitives";
import { Composer } from "@/components/create/composer";
import { PlusIcon } from "@/components/ui/icons";
import type { Angle, RecommendedType } from "@/types";
import type { ProjectState } from "./project-flow";

const PAGE_SIZE = 3;
const MAX_ANGLES = 9;

export function AngleStep({
  project,
  onUpdate,
}: {
  project: ProjectState;
  onUpdate: (patch: Partial<ProjectState>) => void;
}) {
  const [angles, setAngles] = useState<Angle[]>(project.angles);
  const [busy, setBusy] = useState(project.angles.length === 0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [customDesc, setCustomDesc] = useState("");
  const generatedRef = useRef(false);

  useEffect(() => {
    if (project.angles.length > 0 || generatedRef.current) return;
    generatedRef.current = true;
    (async () => {
      try {
        const res = await post<{ angles: Angle[] }>(`/api/projects/${project.id}/angles`, {
          count: MAX_ANGLES,
        });
        setAngles(res.angles);
        onUpdate({ angles: res.angles });
      } catch (e: unknown) {
        toast.danger((e as { message?: string }).message ?? "Gagal memuat angle.");
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function select(angle: Angle) {
    setBusy(true);
    try {
      const res = await post<{ recommendedTypes: RecommendedType[] }>(
        `/api/projects/${project.id}/select-angle`,
        { angleId: angle.id },
      );
      onUpdate({ selectedAngleId: angle.id, angleTitle: angle.title, recommendedTypes: res.recommendedTypes });
      toast.success("Angle berhasil dipilih! Beralih ke langkah berikutnya...");
    } catch (e: unknown) {
      toast.danger((e as { message?: string }).message ?? "Gagal memilih angle.");
    } finally {
      setBusy(false);
    }
  }

  async function selectCustom() {
    if (!customDesc.trim()) return toast.danger("Deskripsi angle wajib diisi.");
    setBusy(true);
    try {
      const payload = { description: customDesc.trim() };
      const res = await post<{ angles: Angle[] }>(`/api/projects/${project.id}/angles/custom`, payload);
      setAngles(res.angles);
      onUpdate({ angles: res.angles });
      setCustomDesc("");
      if (res.angles.length > 0) {
        const last = res.angles[res.angles.length - 1];
        const sel = await post<{ recommendedTypes: RecommendedType[] }>(
          `/api/projects/${project.id}/select-angle`,
          { angleId: last.id },
        );
        onUpdate({ selectedAngleId: last.id, angleTitle: last.title, recommendedTypes: sel.recommendedTypes });
        toast.success("Angle kustom berhasil dipilih! Beralih ke langkah berikutnya...");
      } else {
        toast.success("Angle kustom berhasil dibuat!");
      }
    } catch (e: unknown) {
      toast.danger((e as { message?: string }).message ?? "Gagal membuat atau memilih angle.");
    } finally {
      setBusy(false);
    }
  }

  function showMore() {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, MAX_ANGLES));
  }

  const hasMore = angles.length > visibleCount && visibleCount < MAX_ANGLES;
  const allShown = angles.length > 0 && !hasMore && visibleCount >= angles.length;

  return (
    <div className="space-y-4">
      <GlassCard className="flex flex-col gap-4 p-5">
        <SectionHeader
          title="Pilih Angle"
          description="Temukan sudut pandang yang paling pas untuk konten Anda. Pilih salah satu angle untuk melanjutkan ke Jenis Konten."
        />
        {busy && angles.length === 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3" role="status" aria-busy="true" aria-label="Memuat angle">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton skeleton--shimmer h-40 rounded-xl" />
            ))}
          </div>
        )}
        {angles.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {angles.slice(0, visibleCount).map((a) => {
              const active = project.selectedAngleId === a.id;
              return (
                <div
                  key={a.id}
                  className={`angle-card glass-panel flex flex-col gap-2 p-4 transition-all duration-300 hover:-translate-y-0.5 ${
                    active ? "angle-active" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{a.title}</p>
                    {active && (
                      <Chip size="sm" color="accent" variant="soft">
                        Dipilih
                      </Chip>
                    )}
                  </div>
                  <p className="line-clamp-3 text-sm text-zinc-500 dark:text-zinc-400">{a.description}</p>
                  {a.audience && <p className="text-xs text-zinc-500">Audiens: {a.audience}</p>}
                  <div className="mt-1 flex gap-2">
                    <Button size="sm" variant="primary" onPress={() => select(a)} isDisabled={busy}>
                      Pilih angle
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {hasMore && (
          <div className="flex justify-center">
            <Button variant="secondary" size="sm" onPress={showMore} isDisabled={busy}>
              <PlusIcon width={16} height={16} /> Lihat angle lainnya
            </Button>
          </div>
        )}
        {allShown && (
          <div className="flex justify-center">
            <p className="text-sm text-zinc-500">Semua angle sudah ditampilkan</p>
          </div>
        )}
        {angles.length === 0 && !busy && (
          <p className="text-sm text-zinc-500">Gagal memuat angle. Muat ulang halaman atau buat angle kustom di bawah.</p>
        )}
      </GlassCard>

      <div className="space-y-4">
        <SectionHeader
          title="Buat angle kustom"
          description="Tulis deskripsi singkat tentang sudut pandang yang ingin Anda gunakan untuk konten ini."
          align="center"
        />
        <Composer
          value={customDesc}
          onChange={setCustomDesc}
          onSubmit={() => void selectCustom()}
          maxLength={500}
          placeholder="Contoh: Bagikan tips praktis tentang [topik] yang bisa langsung diterapkan oleh pemula"
          label="Buat angle kustom"
          busy={busy}
        />
      </div>
    </div>
  );
}

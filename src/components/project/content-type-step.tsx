"use client";

import { useState } from "react";
import { Button, Chip } from "@heroui/react";
import { toast } from "@heroui/react";
import { post } from "@/lib/client";
import { GlassCard, SectionHeader } from "@/components/ui/primitives";
import { AudioIcon, FileTextIcon, ImageIcon, LayersIcon, VideoIcon } from "@/components/ui/icons";
import { CONTENT_TYPE_DESCRIPTIONS, CONTENT_TYPE_LABELS } from "../../../config/brief-schemas";
import type { ComponentType } from "react";
import type { IconProps } from "@/components/ui/icons";
import type { ContentType } from "@/types";
import type { ProjectState } from "./project-flow";

const TYPE_ICONS: Record<ContentType, ComponentType<IconProps>> = {
  image: ImageIcon,
  carousel: LayersIcon,
  video: VideoIcon,
  audio: AudioIcon,
  article: FileTextIcon,
};

export function ContentTypeStep({
  project,
  onUpdate,
  onDone,
}: {
  project: ProjectState;
  onUpdate: (patch: Partial<ProjectState>) => void;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function choose(type: ContentType) {
    setBusy(true);
    try {
      await post(`/api/projects/${project.id}/content-type`, { contentType: type });
      onUpdate({ contentType: type });
      toast.success("Jenis konten dipilih.");
      onDone();
    } catch (e: unknown) {
      toast.danger((e as { message?: string }).message ?? "Gagal memilih jenis konten.");
    } finally {
      setBusy(false);
    }
  }

  const allTypes: ContentType[] = ["image", "carousel", "video", "audio", "article"];

  return (
    <GlassCard className="flex flex-col gap-4 p-5">
      <SectionHeader
        title="Pilih Jenis Konten"
        description="Pilih format yang paling sesuai dengan angle dan tujuan Anda."
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {allTypes.map((t) => {
          const Icon = TYPE_ICONS[t];
          const active = project.contentType === t;
          return (
            <div
              key={t}
              className={`angle-card glass-panel flex flex-col gap-3 p-4 transition-all duration-300 hover:-translate-y-0.5 ${
                active ? "angle-active" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-strong dark:text-brand">
                    <Icon width={20} height={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{CONTENT_TYPE_LABELS[t]}</p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{CONTENT_TYPE_DESCRIPTIONS[t]}</p>
                  </div>
                </div>
                {active && (
                  <Chip size="sm" color="accent" variant="soft">
                    Dipilih
                  </Chip>
                )}
              </div>
              <div className="mt-auto flex gap-2 pt-1">
                <Button size="sm" variant="primary" onPress={() => choose(t)} isDisabled={busy}>
                  Pilih
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

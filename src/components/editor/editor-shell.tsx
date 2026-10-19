"use client";

import { useState } from "react";
import { Button, toast } from "@heroui/react";
import { apiFetch } from "@/lib/client";
import { GlassCard, SectionHeader } from "@/components/ui/primitives";
import { useEditorState } from "./use-editor-state";
import { useAssetUrls } from "./use-asset-urls";
import { EditorToolbar } from "./editor-toolbar";
import { CaptionPanel } from "./caption-panel";
import { ImageEditor } from "./image-editor";
import { CarouselEditor } from "./carousel-editor";
import { ArticleEditor } from "./article-editor";
import { AudioEditor } from "./audio-editor";
import { VideoEditor } from "./video-editor";
import type { CreationDTO, EditorState } from "@/types";

export function EditorShell({
  creation,
  backHref,
}: {
  creation: CreationDTO;
  backHref?: string;
}) {
  if (!creation.editorState) return null;
  return <EditorInner creation={creation} initial={creation.editorState} backHref={backHref} />;
}

function EditorInner({
  creation,
  initial,
  backHref,
}: {
  creation: CreationDTO;
  initial: EditorState;
  backHref?: string;
}) {
  const controller = useEditorState(creation.id, initial, creation.updatedAt);
  const assetUrls = useAssetUrls(creation, controller.state);
  const [reloading, setReloading] = useState(false);

  async function reload() {
    setReloading(true);
    try {
      const res = await apiFetch<{ creation: CreationDTO }>(`/api/creations/${creation.id}`);
      if (res.creation.editorState) {
        controller.reset(res.creation.editorState, res.creation.updatedAt);
        toast.success("Konten dimuat ulang.");
      }
    } catch (e) {
      toast.danger((e as Error).message ?? "Gagal memuat ulang.");
    } finally {
      setReloading(false);
    }
  }

  return (
    <div className="space-y-4 py-4">
      <EditorToolbar
        title={creation.captions[0]?.text?.slice(0, 40) || "Editor konten"}
        status={controller.status}
        canUndo={controller.canUndo}
        canRedo={controller.canRedo}
        onUndo={controller.undo}
        onRedo={controller.redo}
        onSave={() => void controller.save()}
        onExport={() => toast.info("Ekspor tersedia di tahap berikutnya.")}
        onTogglePanel={() => document.getElementById("editor-controls")?.scrollIntoView({ behavior: "smooth" })}
        backHref={backHref}
      />

      {controller.status === "conflict" && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <span>Konten diperbarui di tempat lain. Muat ulang untuk menyinkronkan.</span>
          <Button variant="secondary" size="sm" onPress={reload} isDisabled={reloading}>
            {reloading ? "Memuat…" : "Muat ulang"}
          </Button>
        </div>
      )}

      {creation.type === "image" && <ImageEditor controller={controller} assetUrls={assetUrls} />}
      {creation.type === "carousel" && <CarouselEditor controller={controller} assetUrls={assetUrls} />}
      {creation.type === "article" && <ArticleEditor controller={controller} creationId={creation.id} />}
      {creation.type === "audio" && <AudioEditor controller={controller} creation={creation} assetUrls={assetUrls} />}
      {creation.type === "video" && <VideoEditor controller={controller} assetUrls={assetUrls} />}

      {(creation.briefId || creation.captions.length > 0) && (
        <GlassCard>
          <SectionHeader title="Caption" description="Rekomendasi caption dari brief — bisa diedit dan disalin." />
          <div className="mt-3">
            <CaptionPanel briefId={creation.briefId} captions={creation.captions} />
          </div>
        </GlassCard>
      )}
    </div>
  );
}

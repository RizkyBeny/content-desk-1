"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, toast } from "@heroui/react";
import { apiFetch } from "@/lib/client";
import { useEditorState } from "./use-editor-state";
import { useAssetUrls } from "./use-asset-urls";
import { CaptionPanel } from "./caption-panel";
import { ImageEditor } from "./image-editor";
import { CarouselEditor } from "./carousel-editor";
import { ArticleEditor } from "./article-editor";
import { AudioEditor } from "./audio-editor";
import { VideoEditor } from "./video-editor";
import { useEditorUi } from "./frame/use-editor-ui";
import { SectionBlock } from "./frame/ui";
import { VoiceOverPanel, WatermarkPanel } from "./frame/sections";
import type { FrameChrome } from "./frame/editor-frame";
import type { TypeEditorProps } from "./frame/types";
import type { CreationDTO, EditorState } from "@/types";

export function EditorShell({
  creation,
  backHref,
}: {
  creation: CreationDTO;
  backHref?: string;
}) {
  if (!creation.editorState) return null;
  return <EditorInner key={creation.id} creation={creation} initial={creation.editorState} backHref={backHref} />;
}

/**
 * Membangun chrome yang dipakai semua tipe (controller, assetUrls, state UI
 * panel, banner konflik, caption) lalu merender editor tipe yang sesuai —
 * setiap editor tipe menyusun `EditorFrame` sendiri.
 */
function EditorInner({
  creation,
  initial,
  backHref,
}: {
  creation: CreationDTO;
  initial: EditorState;
  backHref?: string;
}) {
  const router = useRouter();
  const controller = useEditorState(creation.id, initial, creation.updatedAt);
  const assetUrls = useAssetUrls(creation, controller.state);
  const { ui, patchUi } = useEditorUi();
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

  const chrome: FrameChrome = {
    creation,
    title: creation.captions[0]?.text?.slice(0, 40) || "Editor konten",
    status: controller.status,
    backHref,
    onBack: () => router.push(backHref ?? "/studio"),
    onSave: () => void controller.save(),
    onExport: () => toast.info("Ekspor tersedia di tahap berikutnya."),
    reload,
    reloading,
    panelTab: ui.panelTab,
    onPanelTab: (t) => patchUi({ panelTab: t }),
    watermark: <WatermarkPanel ui={ui} patchUi={patchUi} />,
    voiceover: (
      <VoiceOverPanel
        ui={ui}
        patchUi={patchUi}
        onGenerate={() => toast.info("Voice over akan dihasilkan di tahap berikutnya.")}
      />
    ),
    caption:
      creation.briefId || creation.captions.length > 0 ? (
        <SectionBlock title="Caption" description="Rekomendasi caption dari brief — bisa diedit dan disalin.">
          <CaptionPanel briefId={creation.briefId} captions={creation.captions} />
        </SectionBlock>
      ) : undefined,
    conflictBanner:
      controller.status === "conflict" ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-300/60 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <span>Konten diperbarui di tempat lain. Muat ulang untuk menyinkronkan.</span>
          <Button variant="secondary" size="sm" onPress={reload} isDisabled={reloading}>
            {reloading ? "Memuat…" : "Muat ulang"}
          </Button>
        </div>
      ) : undefined,
  };

  const props: TypeEditorProps = { creation, controller, assetUrls, chrome, ui, patchUi };

  switch (creation.type) {
    case "image":
      return <ImageEditor {...props} />;
    case "carousel":
      return <CarouselEditor {...props} />;
    case "article":
      return <ArticleEditor {...props} />;
    case "audio":
      return <AudioEditor {...props} />;
    case "video":
      return <VideoEditor {...props} />;
    default:
      return null;
  }
}

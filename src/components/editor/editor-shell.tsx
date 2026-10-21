"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, toast } from "@heroui/react";
import { apiFetch } from "@/lib/client";
import { useEditorState } from "./use-editor-state";
import { useAssetUrls } from "./use-asset-urls";
import { ImageEditor } from "./image-editor";
import { CarouselEditor } from "./carousel-editor";
import { ArticleEditor } from "./article-editor";
import { AudioEditor } from "./audio-editor";
import { VideoEditor } from "./video-editor";
import {
  DEFAULT_UI,
  useEditorUi,
  videoSettingsFromUi,
  videoUiFromState,
  type EditorUiState,
} from "./frame/use-editor-ui";
import { VoiceOverPanel, WatermarkPanel } from "./frame/sections";
import { BackConfirmDialog, SaveConfirmDialog, ExportMediaModal } from "./frame/editor-dialogs";
import type { FrameChrome } from "./frame/editor-frame";
import type { TypeEditorProps } from "./frame/types";
import type { AudioTrackRef, CreationDTO, EditorState } from "@/types";

const DEFAULT_VIDEO_SETTINGS = videoSettingsFromUi(DEFAULT_UI);

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
  const [reloading, setReloading] = useState(false);
  const [uploadedChannelLogoUrl, setUploadedChannelLogoUrl] = useState<string | null>(null);

  const persistVideoUi = useCallback(
    (next: EditorUiState) => {
      if (creation.type !== "video") return;
      const settings = videoSettingsFromUi(next);
      controller.setState((s) => {
        if (s.type !== "video") return s;
        const current = (s.settings ?? DEFAULT_VIDEO_SETTINGS) as Record<string, unknown>;
        const same = Object.entries(settings).every(([key, value]) => current[key] === value);
        return same ? s : { ...s, settings };
      });
    },
    [controller, creation.type],
  );

  const { ui, patchUi, syncUi } = useEditorUi(
    creation.type === "video" ? videoUiFromState(initial as Extract<EditorState, { type: "video" }>) : undefined,
    persistVideoUi,
  );

  // Undo/redo mengganti editorState; tarik kembali nilai panel agar canvas ikut.
  const videoSettings = controller.state.type === "video" ? controller.state.settings : undefined;
  useEffect(() => {
    if (creation.type !== "video" || !videoSettings) return;
    syncUi(videoUiFromState(controller.state as Extract<EditorState, { type: "video" }>));
  }, [creation.type, videoSettings, controller.state, syncUi]);

  const narration = controller.state.type === "video" ? controller.state.narration : null;
  const patchNarration = useCallback(
    (next: AudioTrackRef | null) => {
      controller.setState((s) => (s.type === "video" ? { ...s, narration: next } : s));
    },
    [controller],
  );

  const channelLogoUrl = ui.watermarkChannelLogoAssetId
    ? assetUrls[ui.watermarkChannelLogoAssetId] ?? uploadedChannelLogoUrl
    : uploadedChannelLogoUrl;

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

  const [confirmBackOpen, setConfirmBackOpen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const chrome: FrameChrome = {
    creation,
    title: creation.captions[0]?.text.split("\n")[0]?.trim() || "Editor konten",
    backHref,
    onBack: () => setConfirmBackOpen(true),
    onSave: () => setConfirmSaveOpen(true),
    onExport: () => setExportModalOpen(true),
    panelTab: ui.panelTab,
    onPanelTab: (t) => patchUi({ panelTab: t }),
    watermark: (
      <WatermarkPanel
        ui={ui}
        patchUi={patchUi}
        channelLogoUrl={channelLogoUrl}
        onLogoUploaded={setUploadedChannelLogoUrl}
      />
    ),
    voiceover: (
      <VoiceOverPanel
        ui={ui}
        patchUi={patchUi}
        narration={narration}
        onNarration={patchNarration}
      />
    ),
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

  const props: TypeEditorProps = { creation, controller, assetUrls, chrome, ui, patchUi, channelLogoUrl };

  let content: React.ReactNode = null;
  switch (creation.type) {
    case "image":
      content = <ImageEditor {...props} />;
      break;
    case "carousel":
      content = <CarouselEditor {...props} />;
      break;
    case "article":
      content = <ArticleEditor {...props} />;
      break;
    case "audio":
      content = <AudioEditor {...props} />;
      break;
    case "video":
      content = <VideoEditor {...props} />;
      break;
    default:
      content = null;
  }

  return (
    <>
      {content}
      <BackConfirmDialog
        open={confirmBackOpen}
        onConfirm={() => router.push(backHref ?? "/studio")}
        onCancel={() => setConfirmBackOpen(false)}
      />
      <SaveConfirmDialog
        open={confirmSaveOpen}
        saving={controller.status === "saving"}
        onConfirm={async () => {
          await controller.save();
          setConfirmSaveOpen(false);
        }}
        onCancel={() => setConfirmSaveOpen(false)}
      />
      <ExportMediaModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        creation={creation}
        assetUrls={assetUrls}
        channelLogoUrl={channelLogoUrl}
      />
    </>
  );
}

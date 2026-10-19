"use client";

import { useState, type ReactNode } from "react";
import { Button, toast } from "@heroui/react";
import { Modal } from "@/components/ui/modal";
import { AssetLibrary } from "@/components/asset/asset-library";
import { UploadZone } from "@/components/asset/upload-zone";
import { AssetIcon, SparkIcon, UploadIcon } from "@/components/ui/icons";
import type { AssetDTO, AssetType, MediaSource } from "@/types";

export interface MediaSelection {
  source: MediaSource;
  asset?: AssetDTO;
  prompt?: string;
}

const SOURCES: { value: MediaSource; label: string; icon: ReactNode }[] = [
  { value: "ai_generated", label: "Generate AI", icon: <SparkIcon width={16} height={16} /> },
  { value: "creator_asset", label: "Unggah Sendiri", icon: <UploadIcon width={16} height={16} /> },
  { value: "asset_management", label: "Pustaka Aset", icon: <AssetIcon width={16} height={16} /> },
];

const TYPE_LABEL: Record<string, string> = {
  image: "gambar",
  video: "video",
  audio: "audio",
};

export function MediaSourcePicker({
  open,
  onClose,
  onSelect,
  type = "image",
  initialPrompt = "",
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (selection: MediaSelection) => void;
  type?: AssetType;
  initialPrompt?: string;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Pilih sumber media"
      description={`Pilih ${TYPE_LABEL[type] ?? "media"} dari generate AI, unggahan sendiri, atau pustaka aset.`}
    >
      {open ? (
        <PickerBody onClose={onClose} onSelect={onSelect} type={type} initialPrompt={initialPrompt} />
      ) : null}
    </Modal>
  );
}

function PickerBody({
  onClose,
  onSelect,
  type,
  initialPrompt,
}: {
  onClose: () => void;
  onSelect: (selection: MediaSelection) => void;
  type: AssetType;
  initialPrompt: string;
}) {
  const [mode, setMode] = useState<MediaSource>("ai_generated");
  const [prompt, setPrompt] = useState(initialPrompt);

  function choose(selection: MediaSelection) {
    onSelect(selection);
    onClose();
  }

  function confirmPrompt() {
    if (!prompt.trim()) return toast.danger("Prompt tidak boleh kosong.");
    choose({ source: "ai_generated", prompt: prompt.trim() });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SOURCES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setMode(s.value)}
            className={[
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              mode === s.value
                ? "border-transparent bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "border-zinc-200/70 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5",
            ].join(" ")}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {mode === "ai_generated" && (
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Prompt</span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Deskripsikan media yang ingin dihasilkan…"
              className="w-full rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900/70"
            />
          </label>
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onPress={confirmPrompt}>
              Gunakan prompt ini
            </Button>
          </div>
        </div>
      )}

      {mode === "creator_asset" && (
        <UploadZone
          onUploaded={(asset) => {
            toast.success("Berkas siap dipakai.");
            choose({ source: "creator_asset", asset });
          }}
        />
      )}

      {mode === "asset_management" && (
        <AssetLibrary
          selectable
          showUpload={false}
          typeFilter={type === "text" || type === "reference" ? undefined : type}
          onSelect={(asset) => choose({ source: "asset_management", asset })}
        />
      )}
    </div>
  );
}

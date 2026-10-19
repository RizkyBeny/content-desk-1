import type { ReactNode } from "react";
import { AudioIcon, FileTextIcon, ImageIcon, LinkIcon, VideoIcon } from "@/components/ui/icons";
import type { AssetOrigin, AssetType } from "@/types";

export function assetTypeMeta(type: AssetType): { label: string; icon: ReactNode } {
  switch (type) {
    case "image":
      return { label: "Gambar", icon: <ImageIcon width={18} height={18} /> };
    case "video":
      return { label: "Video", icon: <VideoIcon width={18} height={18} /> };
    case "audio":
      return { label: "Audio", icon: <AudioIcon width={18} height={18} /> };
    case "text":
      return { label: "Teks", icon: <FileTextIcon width={18} height={18} /> };
    default:
      return { label: "Referensi", icon: <LinkIcon width={18} height={18} /> };
  }
}

const ORIGIN_LABELS: Record<AssetOrigin, string> = {
  upload: "Unggahan",
  generated: "Hasil AI",
  reference: "Referensi",
  export: "Ekspor",
};

export function originLabel(origin: AssetOrigin): string {
  return ORIGIN_LABELS[origin] ?? origin;
}

export function formatBytes(n: number | null): string {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export const ASSET_TYPE_OPTIONS: { value: AssetType; label: string }[] = [
  { value: "image", label: "Gambar" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "text", label: "Teks" },
  { value: "reference", label: "Referensi" },
];

export const ASSET_ORIGIN_OPTIONS: { value: AssetOrigin; label: string }[] = [
  { value: "upload", label: "Unggahan" },
  { value: "generated", label: "Hasil AI" },
  { value: "reference", label: "Referensi" },
  { value: "export", label: "Ekspor" },
];

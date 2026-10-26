"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { toast } from "@heroui/react";
import {
  CheckIcon,
  ImageIcon,
  PlusIcon,
  UploadIcon,
  VideoIcon,
  XIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface MediaAsset {
  id: string;
  url: string;
  videoUrl?: string;
  title: string;
  type: "video" | "image";
  duration?: string;
}

export const GALLERY_VIDEOS: MediaAsset[] = [
  {
    id: "v1",
    url: "/seed/unsplash/abstract-01.jpg",
    videoUrl: "/seed/videos/sample-video-1.mp4",
    title: "B-roll kabut asap tebal menyelimuti jalanan",
    duration: "00:08",
    type: "video",
  },
  {
    id: "v2",
    url: "/seed/unsplash/abstract-02.jpg",
    videoUrl: "/seed/videos/sample-video-2.mp4",
    title: "Peta sebaran titik api satelit BMKG",
    duration: "00:12",
    type: "video",
  },
  {
    id: "v3",
    url: "/seed/unsplash/abstract-03.jpg",
    videoUrl: "/seed/videos/sample-video-1.mp4",
    title: "Penumpukan penumpang di bandara akibat kabut",
    duration: "00:15",
    type: "video",
  },
  {
    id: "v4",
    url: "/seed/unsplash/abstract-04.jpg",
    videoUrl: "/seed/videos/sample-video-2.mp4",
    title: "Bara api lahan gambut membara dari dalam",
    duration: "00:10",
    type: "video",
  },
  {
    id: "v5",
    url: "/seed/unsplash/abstract-05.jpg",
    videoUrl: "/seed/videos/sample-video-1.mp4",
    title: "Petugas Manggala Agni memadamkan api",
    duration: "00:14",
    type: "video",
  },
  {
    id: "v6",
    url: "/seed/unsplash/abstract-06.jpg",
    videoUrl: "/seed/videos/sample-video-2.mp4",
    title: "Warga berkendara memakai masker N95",
    duration: "00:09",
    type: "video",
  },
];

export const GALLERY_IMAGES: MediaAsset[] = [
  {
    id: "i1",
    url: "/seed/unsplash/abstract-07.jpg",
    title: "Grafis peringatan darurat kabut asap",
    type: "image",
  },
  {
    id: "i2",
    url: "/seed/unsplash/abstract-08.jpg",
    title: "Infografis bahaya ISPA dan indeks polusi",
    type: "image",
  },
  {
    id: "i3",
    url: "/seed/unsplash/abstract-09.jpg",
    title: "Peta deteksi titik panas Kalimantan",
    type: "image",
  },
  {
    id: "i4",
    url: "/seed/unsplash/abstract-01.jpg",
    title: "Potret pelaku UMKM kuliner lokal",
    type: "image",
  },
  {
    id: "i5",
    url: "/seed/unsplash/abstract-02.jpg",
    title: "Standardisasi dapur higienis modern",
    type: "image",
  },
  {
    id: "i6",
    url: "/seed/unsplash/abstract-03.jpg",
    title: "Produk makanan kemasan UMKM berizin",
    type: "image",
  },
];

export interface InsertMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (asset: MediaAsset) => void;
  onSelectMultiple?: (assets: MediaAsset[]) => void;
  multiSelect?: boolean;
  initialSelectedAssets?: MediaAsset[];
  title?: string;
  subtitle?: string;
  defaultTab?: "video" | "image" | "upload";
  allowedTypes?: ("video" | "image")[];
}

export function InsertMediaModal({
  isOpen,
  onClose,
  onSelectMedia,
  onSelectMultiple,
  multiSelect = false,
  initialSelectedAssets = [],
  title = "Pilih Media / Referensi Aset",
  subtitle = "Pilih aset dari galeri Magneto atau unggah berkas dari perangkat Anda",
  defaultTab = "video",
  allowedTypes = ["video", "image"],
}: InsertMediaModalProps) {
  const [activeTab, setActiveTab] = useState<"video" | "image" | "upload">(defaultTab);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(
    !multiSelect && initialSelectedAssets.length > 0 ? initialSelectedAssets[0] : null
  );
  const [selectedAssets, setSelectedAssets] = useState<MediaAsset[]>(
    multiSelect ? initialSelectedAssets : []
  );
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [customUploads, setCustomUploads] = useState<MediaAsset[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function toggleAssetSelection(asset: MediaAsset) {
    if (multiSelect) {
      setSelectedAssets((prev) => {
        const exists = prev.some((a) => a.id === asset.id || a.url === asset.url);
        if (exists) {
          return prev.filter((a) => a.id !== asset.id && a.url !== asset.url);
        }
        return [...prev, asset];
      });
    } else {
      setSelectedAsset(asset);
    }
  }

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video");
    const previewUrl = URL.createObjectURL(file);
    const newAsset: MediaAsset = {
      id: `upload-${Date.now()}`,
      url: previewUrl,
      videoUrl: isVideo ? previewUrl : undefined,
      title: file.name.replace(/\.[^/.]+$/, ""),
      type: isVideo ? "video" : "image",
      duration: isVideo ? "00:10" : undefined,
    };

    setCustomUploads((prev) => [newAsset, ...prev]);
    if (multiSelect) {
      setSelectedAssets((prev) => [...prev, newAsset]);
    } else {
      setSelectedAsset(newAsset);
    }
    toast.success(`Berkas "${file.name}" berhasil diunggah.`);
  }

  function handleApply() {
    if (multiSelect) {
      if (selectedAssets.length === 0) return;
      if (onSelectMultiple) {
        onSelectMultiple(selectedAssets);
      } else {
        selectedAssets.forEach(onSelectMedia);
      }
      onClose();
    } else {
      if (!selectedAsset) return;
      onSelectMedia(selectedAsset);
      onClose();
    }
  }

  const showVideoTab = allowedTypes.includes("video");
  const showImageTab = allowedTypes.includes("image");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="insert-media-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog (Figma 986:21951) */}
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl transition-all dark:border-white/15 dark:bg-zinc-900 max-h-[90vh] flex flex-col justify-between animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-4 dark:border-white/10">
          <div className="flex flex-col gap-1">
            <h2 id="insert-media-title" className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-white/10 dark:hover:text-zinc-200 transition-colors"
            aria-label="Tutup modal"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 border-b border-zinc-200 px-6 pt-3 dark:border-white/10">
          {showVideoTab && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("video");
                setPlayingVideoId(null);
              }}
              className={cn(
                "relative pb-2.5 text-sm font-semibold transition-colors inline-flex items-center gap-1.5",
                activeTab === "video"
                  ? "text-brand"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
            >
              <VideoIcon className="size-4" />
              <span>Video Asset</span>
              {activeTab === "video" && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand rounded-full" />
              )}
            </button>
          )}

          {showImageTab && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("image");
                setPlayingVideoId(null);
              }}
              className={cn(
                "relative pb-2.5 text-sm font-semibold transition-colors inline-flex items-center gap-1.5",
                activeTab === "image"
                  ? "text-brand"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
            >
              <ImageIcon className="size-4" />
              <span>Image Asset</span>
              {activeTab === "image" && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand rounded-full" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setActiveTab("upload");
              setPlayingVideoId(null);
            }}
            className={cn(
              "relative pb-2.5 text-sm font-semibold transition-colors inline-flex items-center gap-1.5",
              activeTab === "upload"
                ? "text-brand"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
            )}
          >
            <UploadIcon className="size-4" />
            <span>Upload Berkas</span>
            {customUploads.length > 0 && (
              <span className="rounded-full bg-brand/15 px-1.5 py-0.2 text-[10px] font-bold text-brand">
                {customUploads.length}
              </span>
            )}
            {activeTab === "upload" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand rounded-full" />
            )}
          </button>
        </div>

        {/* Gallery Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <input
            type="file"
            ref={fileInputRef}
            accept={showVideoTab ? "video/*,image/*" : "image/*"}
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4">
            {/* Upload Action Card */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex aspect-[9/13] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 p-4 text-center transition-all hover:border-brand hover:bg-brand/5 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-brand dark:hover:bg-brand/10"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-brand group-hover:text-white dark:bg-zinc-800 dark:text-zinc-400">
                <UploadIcon className="size-5" />
              </div>
              <h4 className="mt-3 text-xs font-semibold text-foreground">Upload berkas</h4>
              <p className="mt-1 text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">
                Pilih dari komputer atau perangkat Anda
              </p>
              <button
                type="button"
                className="mt-3 inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-[11px] font-medium text-white shadow-xs"
              >
                <PlusIcon className="size-3" />
                <span>Pilih Berkas</span>
              </button>
            </div>

            {/* Asset Items */}
            {(activeTab === "video"
              ? GALLERY_VIDEOS
              : activeTab === "image"
                ? GALLERY_IMAGES
                : customUploads
            ).map((asset) => {
              const isSelected = multiSelect
                ? selectedAssets.some((a) => a.id === asset.id || a.url === asset.url)
                : selectedAsset?.url === asset.url;
              const isPlaying = playingVideoId === asset.id;
              const videoSrc = asset.videoUrl || (asset.type === "video" ? asset.url : undefined);

              return (
                <div
                  key={asset.id}
                  onClick={() => toggleAssetSelection(asset)}
                  className={cn(
                    "group relative aspect-[9/13] overflow-hidden rounded-xl border transition-all cursor-pointer shadow-xs",
                    isSelected
                      ? "border-brand ring-2 ring-brand"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20",
                  )}
                >
                  {/* Thumbnail / Video */}
                  {isPlaying && videoSrc ? (
                    <div className="absolute inset-0 z-20 bg-black flex items-center justify-center">
                      <video
                        src={videoSrc}
                        controls
                        autoPlay
                        playsInline
                        className="h-full w-full object-cover rounded-xl"
                        onEnded={() => setPlayingVideoId(null)}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlayingVideoId(null);
                        }}
                        className="absolute top-2 right-2 z-30 flex size-6 items-center justify-center rounded-full bg-black/80 text-white hover:bg-black transition-colors"
                      >
                        <XIcon className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Image
                        src={asset.url}
                        alt={asset.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </>
                  )}

                  {/* Badges & Actions */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    {asset.type === "video" ? (
                      <span className="flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                        <VideoIcon className="size-3" />
                        {asset.duration}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                        <ImageIcon className="size-3" />
                        Image
                      </span>
                    )}
                  </div>

                  {/* Play Video Trigger Button */}
                  {asset.type === "video" && !isPlaying && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayingVideoId(asset.id);
                      }}
                      title={`Putar video ${asset.title}`}
                      aria-label={`Putar video ${asset.title}`}
                      className="absolute inset-0 m-auto flex size-9 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:scale-110 hover:bg-black group-hover:opacity-100"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 ml-0.5">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  )}

                  {/* Checkmark Selected Indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-brand text-white shadow-md">
                      <CheckIcon className="size-3.5" />
                    </div>
                  )}

                  {/* Asset Title at bottom */}
                  <div className="absolute inset-x-0 bottom-0 p-2.5">
                    <p className="line-clamp-2 text-xs font-semibold text-white leading-tight">
                      {asset.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {activeTab === "upload" && customUploads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400">
              <UploadIcon className="size-10 mb-2 opacity-50" />
              <p className="text-sm font-semibold">Belum ada berkas yang diunggah</p>
              <p className="text-xs text-zinc-500">Klik kartu di atas untuk memilih foto atau video dari perangkat</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-6 py-3 dark:border-white/5 dark:bg-zinc-900/60 text-xs text-zinc-500">
          <span>
            {multiSelect ? (
              selectedAssets.length > 0 ? (
                <span className="font-medium text-foreground">
                  Terpilih: <strong className="text-brand">{selectedAssets.length} Gambar Referensi</strong>
                </span>
              ) : (
                "Pilih satu atau lebih gambar referensi untuk panduan AI"
              )
            ) : selectedAsset ? (
              <span className="font-medium text-foreground">
                Terpilih: <strong className="text-brand">{selectedAsset.title}</strong> ({selectedAsset.type})
              </span>
            ) : (
              "Klik salah satu aset media di atas untuk memilih"
            )}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={multiSelect ? selectedAssets.length === 0 : !selectedAsset}
              className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {multiSelect
                ? selectedAssets.length > 0
                  ? `Gunakan (${selectedAssets.length}) Referensi`
                  : "Gunakan Referensi"
                : "Gunakan Media"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

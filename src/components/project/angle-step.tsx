"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Chip, toast } from "@heroui/react";
import { post } from "@/lib/client";
import { GlassCard } from "@/components/ui/primitives";
import {
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  ImageIcon,
  LayersIcon,
  PlusIcon,
  RectangleVerticalIcon,
  SparkIcon,
  TagIcon,
  VideoIcon,
  VolumeIcon,
  XIcon,
} from "@/components/ui/icons";
import {
  MultiTypeConfigModal,
  type AspectRatio,
  type MultiTypeConfig,
} from "./multi-type-config-modal";
import type { Angle, ContentType, RecommendedType } from "@/types";
import type { ProjectState } from "./project-flow";

// Initial visible options limited to 3; user can click to see 3 more options
const PAGE_SIZE = 3;
const MAX_ANGLES = 9;

export interface SingleMediaConfig {
  ratio: AspectRatio;
  persona: string;
  voiceOver?: string;
}

export interface AngleStepProps {
  project: ProjectState;
  onUpdate: (patch: Partial<ProjectState>) => void;
  onProceedToBrief?: (params: {
    angle: Angle;
    mediaTypes: ContentType[];
    promptContext: string;
    singleConfig?: SingleMediaConfig;
    multiTypeConfig?: MultiTypeConfig;
  }) => void;
}

export function AngleStep({
  project,
  onUpdate,
  onProceedToBrief,
}: AngleStepProps) {
  const [angles, setAngles] = useState<Angle[]>(project.angles);
  const [busy, setBusy] = useState(project.angles.length === 0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedAngle, setSelectedAngle] = useState<Angle | null>(null);
  const [promptContext, setPromptContext] = useState("");
  
  // Media selection: null = "Pilih Media" (Figma default state #1023:10395)
  const [selectedMediaMode, setSelectedMediaMode] = useState<
    "video" | "image" | "carousel" | "multiple" | null
  >(null);

  // Dynamic inline configurations (Figma #1023:10394)
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>("9:16");
  const [selectedPersona, setSelectedPersona] = useState<string>("investigatif");
  const [selectedVoiceOver, setSelectedVoiceOver] = useState<string>("Dalipin");

  // Dropdown popover controllers
  type ActiveDropdown = "media" | "ratio" | "persona" | "voiceOver" | null;
  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>(null);
  const [showMultiTypeModal, setShowMultiTypeModal] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const generatedRef = useRef(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
  }, [project.angles, project.id, onUpdate]);

  function handleSelectAngle(angle: Angle) {
    setSelectedAngle(angle);
    setPromptContext("");
  }

  function handleClearSelectedAngle() {
    setSelectedAngle(null);
  }

  function showMore() {
    setVisibleCount((prev) => Math.min(prev + 3, MAX_ANGLES));
  }

  async function resolveTargetAngle(): Promise<Angle | null> {
    if (selectedAngle) return selectedAngle;

    if (!promptContext.trim()) {
      toast.danger("Pilih salah satu angle atau ketik arahan konten terlebih dahulu.");
      return null;
    }

    // Auto-create custom angle from prompt if none selected
    setBusy(true);
    try {
      const customRes = await post<{ angles: Angle[] }>(`/api/projects/${project.id}/angles/custom`, {
        description: promptContext.trim(),
      });
      const created = customRes.angles[customRes.angles.length - 1];
      if (created) {
        setSelectedAngle(created);
        setAngles(customRes.angles);
        onUpdate({ angles: customRes.angles });
        return created;
      }
      return null;
    } catch (e: unknown) {
      toast.danger((e as Error).message ?? "Gagal membuat angle kustom.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function executeProceedToBrief(
    angleToUse: Angle,
    multiConfig?: MultiTypeConfig
  ) {
    setBusy(true);
    try {
      // 1. Select the angle in backend API
      const res = await post<{ recommendedTypes: RecommendedType[] }>(
        `/api/projects/${project.id}/select-angle`,
        { angleId: angleToUse.id },
      );

      // Determine media types based on selection (default to video if null)
      const mode = selectedMediaMode || "video";
      let mediaTypes: ContentType[] = ["video"];
      if (mode === "image") mediaTypes = ["image"];
      else if (mode === "carousel") mediaTypes = ["carousel"];
      else if (mode === "multiple") mediaTypes = ["image", "carousel", "video"];

      const primaryType = mediaTypes[0];

      // Update project contentType
      await post(`/api/projects/${project.id}/content-type`, { contentType: primaryType });

      onUpdate({
        selectedAngleId: angleToUse.id,
        angleTitle: angleToUse.title,
        contentType: primaryType,
        recommendedTypes: res.recommendedTypes,
      });

      toast.success("Angle dan tipe konten dipilih! Membuka Brief...");

      if (onProceedToBrief) {
        const singleConfig: SingleMediaConfig | undefined =
          mode !== "multiple"
            ? {
                ratio: selectedRatio,
                persona: selectedPersona,
                voiceOver: mode === "video" ? selectedVoiceOver : undefined,
              }
            : undefined;

        onProceedToBrief({
          angle: angleToUse,
          mediaTypes,
          promptContext,
          singleConfig,
          multiTypeConfig: multiConfig,
        });
      }
    } catch (e: unknown) {
      toast.danger((e as { message?: string }).message ?? "Gagal memproses angle.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateBrief() {
    const angleToUse = await resolveTargetAngle();
    if (!angleToUse) return;

    if (selectedMediaMode === "multiple") {
      setShowMultiTypeModal(true);
      return;
    }

    await executeProceedToBrief(angleToUse);
  }

  const hasMore = angles.length > visibleCount && visibleCount < MAX_ANGLES;

  // Split reason or synthesize bullet points for "Mengapa ini menarik?"
  const getBulletPoints = (angle: Angle): string[] => {
    if (angle.reason) {
      const parts = angle.reason
        .split(/(?:- |\n|; )/)
        .map((s) => s.trim())
        .filter((s) => s.length > 5);
      if (parts.length >= 2) return parts.slice(0, 3);
      return [
        angle.reason,
        `Sangat relevan untuk target: ${angle.audience || "Audiens umum"}`,
      ];
    }
    return [
      `Membahas topik dengan sudut pandang emosional dan praktis`,
      `Menarik interaksi dan komentar tinggi dari audiens`,
      `Cocok untuk didistribusikan ke berbagai kanal media sosial`,
    ];
  };

  const MEDIA_OPTIONS = [
    { id: "image", label: "Gambar", icon: ImageIcon, desc: "Single visual poster / feed" },
    { id: "carousel", label: "Multiple Gambar", icon: LayersIcon, desc: "Slide visual informatif" },
    { id: "video", label: "Video", icon: VideoIcon, desc: "Storyboard scene video" },
    { id: "multiple", label: "Multiple Type Content", icon: SparkIcon, desc: "Gambar & Video Storyboard" },
  ] as const;

  const RATIO_OPTIONS: AspectRatio[] = ["9:16", "16:9", "1:1", "4:3"];

  const PERSONA_OPTIONS = [
    "investigatif",
    "edukatif",
    "storyteller",
    "kasual",
    "formal",
  ] as const;

  const VOICEOVER_OPTIONS = [
    "Dalipin",
    "Investigatif & Tegas",
    "Narator Tenang",
    "Enerjik & Cepat",
  ] as const;

  const currentMediaOption = selectedMediaMode
    ? MEDIA_OPTIONS.find((m) => m.id === selectedMediaMode) ?? null
    : null;

  return (
    <div className="relative space-y-8 pb-80">
      {/* Header Halaman sesuai Figma #1024:11875 */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip size="sm" variant="soft" color="accent" className="font-medium text-xs">
            Versi 1.0
          </Chip>
          <Chip size="sm" variant="secondary" className="font-medium text-xs">
            Draft
          </Chip>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Pilih Angle Sesuai kebutuhanmu
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400">
          Template produksi video siap diisi untuk semua jenis konten.
        </p>
      </div>

      {/* Loading Skeletons */}
      {busy && angles.length === 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" role="status" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton skeleton--shimmer h-64 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Angle Cards Grid: default 3 opsi awal sesuai arahan revisi */}
      {angles.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {angles.slice(0, visibleCount).map((a) => {
            const isSelected = selectedAngle?.id === a.id;
            const bullets = getBulletPoints(a);

            return (
              <div
                key={a.id}
                className={`glass-card flex flex-col justify-between rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                  isSelected
                    ? "border-brand-strong bg-brand/5 shadow-lg ring-2 ring-brand-strong/60 dark:border-brand dark:bg-brand/10 dark:ring-brand/50"
                    : "border-zinc-200/80 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20"
                }`}
              >
                <div className="space-y-4">
                  {/* Title & Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold leading-snug text-zinc-900 dark:text-zinc-50">
                      {a.title}
                    </h3>
                    {isSelected && (
                      <Chip size="sm" color="accent" variant="soft" className="shrink-0 font-medium">
                        Dipilih
                      </Chip>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {a.description}
                  </p>

                  {/* Section: Mengapa ini menarik? */}
                  <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-white/5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Mengapa ini menarik?
                    </h4>
                    <ul className="space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand-strong dark:bg-brand" />
                          <span className="line-clamp-2">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Action */}
                <div className="mt-6 pt-2">
                  <Button
                    size="sm"
                    variant={isSelected ? "primary" : "secondary"}
                    onPress={() => handleSelectAngle(a)}
                    isDisabled={busy}
                    className="w-full font-medium"
                  >
                    {isSelected ? (
                      <>
                        <CheckIcon width={14} height={14} className="mr-1" /> Angle Terpilih
                      </>
                    ) : (
                      "Pilih Angle ini"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Button: 3 opsi lainnya (tambah 3 opsi lagi per klik) */}
      {hasMore && (
        <div className="flex justify-center py-6">
          <Button
            variant="secondary"
            size="md"
            onPress={showMore}
            isDisabled={busy}
            className="gap-2 px-6 py-2.5 font-semibold shadow-sm hover:border-brand/40"
          >
            <PlusIcon width={16} height={16} /> 3 opsi lainnya
          </Button>
        </div>
      )}

      {/* SELALU TAMPILKAN COMPOSER STICKY/FLOATING DI BAWAH (Termasuk Default Empty State) */}
      <div className="fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 pointer-events-none transition-all duration-300 md:pl-20 lg:pl-64">
        <div className="w-full max-w-4xl pointer-events-auto">
          <GlassCard className="flex flex-col gap-3.5 rounded-2xl border border-zinc-200/90 bg-white/95 p-5 shadow-2xl backdrop-blur-xl dark:border-white/15 dark:bg-zinc-900/95 sm:p-6">
          {/* Header Mode AI & Shortcut Info */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-white/5">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-brand/15 text-brand-strong dark:bg-brand/20 dark:text-brand">
                <SparkIcon width={14} height={14} />
              </span>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Mode AI · Buat Konten
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Shift + Enter untuk baris baru
            </span>
          </div>

          {/* Mention Tag Chip: Tampil saat angle dipilih, default tersembunyi */}
          {selectedAngle && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand-strong dark:bg-brand/20 dark:text-brand">
                <TagIcon width={13} height={13} />
                <span className="max-w-xs truncate sm:max-w-md">{selectedAngle.title}</span>
                <button
                  type="button"
                  onClick={handleClearSelectedAngle}
                  className="ml-1 rounded p-0.5 hover:bg-brand/20"
                  title="Batalkan angle"
                >
                  <XIcon width={12} height={12} />
                </button>
              </span>
            </div>
          )}

          {/* Textarea for context prompt */}
          <div className="relative">
            <textarea
              value={promptContext}
              onChange={(e) => setPromptContext(e.target.value)}
              placeholder={
                selectedAngle
                  ? "Tambahkan arahan konteks khusus untuk angle ini (opsional)..."
                  : "Tambahkan arahan konteks atau pilih angle di atas (opsional)..."
              }
              rows={2}
              className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-sm text-zinc-800 placeholder-zinc-400 focus:border-brand focus:bg-white focus:outline-none dark:border-white/10 dark:bg-zinc-800/40 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:bg-zinc-900"
            />
          </div>

          {/* Bottom Toolbar: Filter Produksi & Kirim Prompt (Figma #1023:10394) */}
          <div ref={toolbarRef} className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Filter Produksi: Media Selector & Inline Specific Configs */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Media Type Dropdown / Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "media" ? null : "media")}
                  className="flex h-9 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700/60"
                >
                  {currentMediaOption ? (
                    <currentMediaOption.icon width={14} height={14} className="text-brand-strong dark:text-brand" />
                  ) : (
                    <ImageIcon width={14} height={14} className="text-zinc-400" />
                  )}
                  <span>{currentMediaOption ? currentMediaOption.label : "Pilih Media"}</span>
                  <ChevronDownIcon width={12} height={12} className="text-zinc-400" />
                </button>

                {activeDropdown === "media" && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-800 z-50">
                    <span className="block px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Pilih Tipe Media
                    </span>
                    {MEDIA_OPTIONS.map((opt, idx) => (
                      <div key={opt.id}>
                        {opt.id === "multiple" && idx > 0 && (
                          <div className="my-1 border-t border-zinc-100 dark:border-white/10" />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMediaMode(opt.id);
                            setActiveDropdown(null);
                            if (opt.id === "multiple") {
                              setShowMultiTypeModal(true);
                            }
                          }}
                          className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                            selectedMediaMode === opt.id
                              ? "bg-brand/10 font-semibold text-brand-strong dark:bg-brand/20 dark:text-brand"
                              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
                          }`}
                        >
                          <opt.icon width={14} height={14} className="mt-0.5 shrink-0" />
                          <div>
                            <div>{opt.label}</div>
                            <div className="text-[10px] text-zinc-400">{opt.desc}</div>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Konfigurasi Button khusus Multiple Type Content */}
              {selectedMediaMode === "multiple" && (
                <button
                  type="button"
                  onClick={() => setShowMultiTypeModal(true)}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand-strong shadow-sm hover:bg-brand/20 dark:bg-brand/20 dark:text-brand"
                  title="Sesuaikan pengaturan Multiple Type Content"
                >
                  <SparkIcon width={13} height={13} />
                  <span>Konfigurasi (3 Format)</span>
                </button>
              )}

              {/* Dynamic inline configurations when a single media is selected */}
              {(selectedMediaMode === "image" ||
                selectedMediaMode === "carousel" ||
                selectedMediaMode === "video") && (
                <>
                  {/* Rasio Button & Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveDropdown(activeDropdown === "ratio" ? null : "ratio")}
                      className="flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700/60"
                    >
                      <RectangleVerticalIcon width={13} height={13} className="text-zinc-500 dark:text-zinc-400" />
                      <span>Rasio {selectedRatio}</span>
                      <ChevronDownIcon width={12} height={12} className="text-zinc-400" />
                    </button>

                    {activeDropdown === "ratio" && (
                      <div className="absolute bottom-full left-0 mb-2 w-32 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-800 z-50">
                        <span className="block px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                          Pilih Rasio
                        </span>
                        {RATIO_OPTIONS.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              setSelectedRatio(r);
                              setActiveDropdown(null);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                              selectedRatio === r
                                ? "bg-brand/10 font-semibold text-brand-strong dark:bg-brand/20 dark:text-brand"
                                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
                            }`}
                          >
                            <span>{r}</span>
                            {selectedRatio === r && <CheckIcon width={12} height={12} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Persona Button & Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveDropdown(activeDropdown === "persona" ? null : "persona")}
                      className="flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700/60"
                    >
                      <ClockIcon width={13} height={13} className="text-zinc-500 dark:text-zinc-400" />
                      <span className="capitalize">{selectedPersona}</span>
                      <ChevronDownIcon width={12} height={12} className="text-zinc-400" />
                    </button>

                    {activeDropdown === "persona" && (
                      <div className="absolute bottom-full left-0 mb-2 w-44 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-800 z-50">
                        <span className="block px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                          Persona Gaya
                        </span>
                        {PERSONA_OPTIONS.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              setSelectedPersona(p);
                              setActiveDropdown(null);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs capitalize transition-colors ${
                              selectedPersona === p
                                ? "bg-brand/10 font-semibold text-brand-strong dark:bg-brand/20 dark:text-brand"
                                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
                            }`}
                          >
                            <span>{p}</span>
                            {selectedPersona === p && <CheckIcon width={12} height={12} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Voice Over Button & Dropdown (HANYA untuk Video) */}
                  {selectedMediaMode === "video" && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveDropdown(activeDropdown === "voiceOver" ? null : "voiceOver")}
                        className="flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700/60"
                      >
                        <VolumeIcon width={13} height={13} className="text-zinc-500 dark:text-zinc-400" />
                        <span>{selectedVoiceOver}</span>
                        <ChevronDownIcon width={12} height={12} className="text-zinc-400" />
                      </button>

                      {activeDropdown === "voiceOver" && (
                        <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-800 z-50">
                          <span className="block px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                            Pilih Voice Over
                          </span>
                          {VOICEOVER_OPTIONS.map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => {
                                setSelectedVoiceOver(v);
                                setActiveDropdown(null);
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                                selectedVoiceOver === v
                                  ? "bg-brand/10 font-semibold text-brand-strong dark:bg-brand/20 dark:text-brand"
                                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
                              }`}
                            >
                              <span>{v}</span>
                              {selectedVoiceOver === v && <CheckIcon width={12} height={12} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Submit Button */}
            <Button
              variant="primary"
              size="md"
              onPress={handleGenerateBrief}
              isDisabled={busy}
              className="gap-2 font-semibold shadow-md"
            >
              <SparkIcon width={16} height={16} />
              Bikin Konten
            </Button>
          </div>
        </GlassCard>
        </div>
      </div>

      {/* Modal Popup Konfigurasi Multiple Type Content (Figma #1026:12468) */}
      <MultiTypeConfigModal
        isOpen={showMultiTypeModal}
        onClose={() => setShowMultiTypeModal(false)}
        onSwitchToSingleType={(type) => {
          setSelectedMediaMode(type);
          setShowMultiTypeModal(false);
          toast.info(
            `Beralih ke format ${type === "image" ? "Gambar" : type === "carousel" ? "Multiple Gambar" : "Video"}`,
          );
        }}
        onConfirm={async (config) => {
          setShowMultiTypeModal(false);
          const target = await resolveTargetAngle();
          if (target) {
            await executeProceedToBrief(target, config);
          }
        }}
      />
    </div>
  );
}

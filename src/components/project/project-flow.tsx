"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, toast } from "@heroui/react";
import { post } from "@/lib/client";
import { AngleStep, type SingleMediaConfig } from "./angle-step";
import { ProjectHeaderSummary } from "./project-header-summary";
import { BriefEditor } from "./brief-editor";
import { MultiTypeAccordion } from "./multi-type-accordion";
import { StoryboardPreviewModal } from "./storyboard-preview-modal";
import type { MultiTypeConfig } from "./multi-type-config-modal";
import { ArrowLeftIcon, SparkIcon } from "@/components/ui/icons";
import type { Angle, BriefDTO, BriefRow, ContentType, RecommendedType } from "@/types";

export interface ProjectState {
  id: string;
  topicTitle: string;
  topicSource: string;
  angles: Angle[];
  selectedAngleId: string | null;
  angleTitle: string | null;
  recommendedTypes: RecommendedType[];
  contentType: ContentType | null;
}

export function ProjectFlow({
  project,
  initialBrief,
}: {
  project: ProjectState;
  initialBrief: BriefDTO | null;
}) {
  const router = useRouter();
  const [state, setState] = useState<ProjectState>(project);
  const [brief, setBrief] = useState<BriefDTO | null>(initialBrief);
  
  // Phase can be "angle" or "brief"
  const [phase, setPhase] = useState<"angle" | "brief">(() => {
    if (initialBrief || (project.selectedAngleId && project.contentType)) {
      return "brief";
    }
    return "angle";
  });

  // Media types selection: single type or multiple types
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<ContentType[]>(() => {
    return project.contentType ? [project.contentType] : ["video"];
  });

  const [activeType, setActiveType] = useState<ContentType>(() => {
    return project.contentType || "video";
  });

  // Modal Preview Storyboard state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isGeneratingCreation, setIsGeneratingCreation] = useState(false);
  const [multiConfig, setMultiConfig] = useState<MultiTypeConfig | null>(null);
  const [singleConfig, setSingleConfig] = useState<SingleMediaConfig | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`singleConfig_${project.id}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      ratio: "9:16",
      persona: initialBrief?.summary?.tone || "investigatif",
      voiceOver: (project.contentType || "video") === "video" ? "Dalipin" : undefined,
    };
  });

  const isMultiType = selectedMediaTypes.length > 1;

  async function handleProceedFromAngle(params: {
    angle: Angle;
    mediaTypes: ContentType[];
    promptContext: string;
    singleConfig?: SingleMediaConfig;
    multiTypeConfig?: MultiTypeConfig;
  }) {
    setSelectedMediaTypes(params.mediaTypes);
    const primary = params.mediaTypes[0] || "video";
    setActiveType(primary);
    if (params.singleConfig) {
      setSingleConfig(params.singleConfig);
      try {
        localStorage.setItem(`singleConfig_${project.id}`, JSON.stringify(params.singleConfig));
      } catch {}
    }
    if (params.multiTypeConfig) {
      setMultiConfig(params.multiTypeConfig);
    }

    setState((prev) => ({
      ...prev,
      selectedAngleId: params.angle.id,
      angleTitle: params.angle.title,
      contentType: primary,
    }));

    setPhase("brief");
  }

  function derivedPrompt(type: ContentType, row: BriefRow): string {
    if (type === "carousel") return [row.visual, row.judul, row.isi].filter(Boolean).join(". ");
    if (type === "video") return row.visual || row.narasi || "";
    return [row.elemenVisual, row.gaya, row.teks, row.visual].filter(Boolean).join(". ");
  }

  async function handleExecuteGenerate() {
    if (!brief) return;
    setIsGeneratingCreation(true);
    try {
      const mediaSources = (brief.rows || []).map((row, i) => ({
        briefRow: i + 1,
        source: "ai_generated" as const,
        prompt: derivedPrompt(activeType, row),
      }));

      const res = await post<{ creationId: string }>("/api/creations", {
        projectId: state.id,
        mediaSources,
      });

      toast.success("Generate kreasi dimulai! Mengalihkan ke Canvas Editor...");
      setShowPreviewModal(false);
      router.push(`/studio/${res.creationId}`);
    } catch (e: unknown) {
      toast.danger((e as Error).message ?? "Gagal memproses pembuatan video.");
      setIsGeneratingCreation(false);
    }
  }

  return (
    <div className="space-y-6 py-4">
      {/* PHASE 1: PILIH ANGLE & FLOATING COMPOSER DRAWER */}
      {phase === "angle" && (
        <AngleStep
          project={state}
          onUpdate={(patch) => setState((prev) => ({ ...prev, ...patch }))}
          onProceedToBrief={handleProceedFromAngle}
        />
      )}

      {/* PHASE 2: BRIEF & STORYBOARD (SINGLE ATAU MULTI-MEDIA ACCORDIONS) */}
      {phase === "brief" && (
        <div className="space-y-6">
          {/* Header Bar dengan Judul Content Brief (Figma #1022:12094 / #1022:11913) */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Content Brief
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Template produksi video siap diisi untuk semua jenis konten.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setPhase("angle")}
                className="gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                <ArrowLeftIcon width={14} height={14} /> Ganti Angle
              </Button>

              {activeType === "video" && brief && (
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => setShowPreviewModal(true)}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <SparkIcon width={14} height={14} /> Preview Storyboard
                </Button>
              )}
            </div>
          </div>

          {/* 3-Column Header Summary (Figma #1022:12102) */}
          <ProjectHeaderSummary
            topicTitle={state.topicTitle}
            angleTitle={state.angleTitle || "Angle Terpilih"}
            selectedType={activeType}
            availableTypes={isMultiType ? selectedMediaTypes : [activeType]}
            isMultiType={isMultiType}
            singleConfig={singleConfig}
          />

          {/* Content Body: Multi-Media Accordions atau Single Brief Editor */}
          {isMultiType ? (
            <MultiTypeAccordion
              projectId={state.id}
              types={selectedMediaTypes}
              initialBriefs={brief ? { [activeType]: brief } : {}}
              config={multiConfig}
              onPreviewVideo={(b) => {
                setBrief(b);
                setShowPreviewModal(true);
              }}
              onAllCompleted={() => {
                setShowPreviewModal(true);
              }}
            />
          ) : (
            <BriefEditor
              projectId={state.id}
              contentType={activeType}
              brief={brief}
              onBrief={setBrief}
              onPreviewVideo={(b) => {
                setBrief(b);
                setShowPreviewModal(true);
              }}
              angleTitle={state.angleTitle || undefined}
              singleConfig={singleConfig}
            />
          )}

          {/* Modal Preview Storyboard (Figma #1022:12417) */}
          <StoryboardPreviewModal
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            onGenerate={handleExecuteGenerate}
            rows={brief?.rows || []}
            topicTitle={state.topicTitle}
            angleTitle={state.angleTitle || undefined}
            isGenerating={isGeneratingCreation}
          />
        </div>
      )}
    </div>
  );
}

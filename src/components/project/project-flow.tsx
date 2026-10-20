"use client";

import { Fragment, useState } from "react";
import { AngleStep } from "./angle-step";
import { ContentTypeStep } from "./content-type-step";
import { BriefEditor } from "./brief-editor";
import { GenerateStep } from "./generate-step";
import { CheckIcon, CopyIcon, FileTextIcon, LayersIcon, SparkIcon } from "@/components/ui/icons";
import type { Angle, BriefDTO, ContentType, RecommendedType } from "@/types";

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

const STEPS = [
  { id: "angle", label: "Angle", icon: LayersIcon },
  { id: "type", label: "Jenis Konten", icon: CopyIcon },
  { id: "brief", label: "Brief", icon: FileTextIcon },
  { id: "generate", label: "Generate", icon: SparkIcon },
] as const;

export function ProjectFlow({
  project,
  initialBrief,
}: {
  project: ProjectState;
  initialBrief: BriefDTO | null;
}) {
  const [state, setState] = useState<ProjectState>(project);
  const [brief, setBrief] = useState<BriefDTO | null>(initialBrief);
  const [step, setStep] = useState<string>(
    initialBrief ? "brief" : project.contentType ? "brief" : project.selectedAngleId ? "type" : "angle",
  );

  function disabledFor(id: string): boolean {
    if (id === "type") return !state.selectedAngleId;
    if (id === "brief") return !state.contentType;
    if (id === "generate") return !brief;
    return false;
  }

  const currentIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{state.topicTitle}</h1>
      </div>

      <div className="glass-card space-y-3 p-3">
        <div className="flex items-center justify-center gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = step === s.id;
            const done = i < currentIndex;
            const disabled = disabledFor(s.id);
            const node = (
              <button
                key={s.id}
                type="button"
                onClick={() => !disabled && setStep(s.id)}
                disabled={disabled}
                aria-current={active ? "step" : undefined}
                className={[
                  "flex min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-2 text-sm font-medium transition-colors sm:px-3",
                  active
                    ? "font-semibold text-brand-strong dark:text-brand"
                    : done
                      ? "text-brand-strong hover:bg-brand/10 dark:text-brand dark:hover:bg-brand/10"
                      : disabled
                        ? "cursor-not-allowed text-zinc-400 dark:text-zinc-600"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    active
                      ? "bg-brand/10 text-brand-strong dark:bg-brand/15 dark:text-brand"
                      : done
                        ? "bg-brand/10 text-brand-strong dark:bg-brand/15 dark:text-brand"
                        : "bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-400",
                  ].join(" ")}
                >
                  {done ? <CheckIcon width={14} height={14} /> : <Icon width={14} height={14} />}
                </span>
                <span className="hidden truncate sm:inline">
                  {i + 1}. {s.label}
                </span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            );
            const connector =
              i < STEPS.length - 1 ? (
                <div key={`connector-${s.id}`} className="flex h-6 w-10 shrink-0 items-center sm:w-16" aria-hidden>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-300"
                      style={{ width: currentIndex > i ? "100%" : "0%" }}
                    />
                  </div>
                </div>
              ) : null;
            return (
              <Fragment key={s.id}>
                {node}
                {connector}
              </Fragment>
            );
          })}
        </div>
      </div>

      {step === "angle" && (
        <AngleStep
          project={state}
          onUpdate={(patch) => {
            const updated = { ...state, ...patch };
            setState(updated);
            // Auto advance to content type step when angle is selected
            if (patch.selectedAngleId || updated.selectedAngleId) {
              setStep("type");
            }
          }}
        />
      )}

      {step === "type" && (
        <ContentTypeStep
          project={state}
          onUpdate={(patch) => setState((s) => ({ ...s, ...patch }))}
          onDone={() => setStep("brief")}
        />
      )}

      {step === "brief" && state.contentType && (
        <BriefEditor
          projectId={state.id}
          contentType={state.contentType}
          brief={brief}
          onBrief={setBrief}
        />
      )}

      {step === "generate" && state.contentType && brief && (
        <GenerateStep
          projectId={state.id}
          contentType={state.contentType}
          rows={brief.rows}
          briefReady={brief.status === "siap"}
        />
      )}
    </div>
  );
}

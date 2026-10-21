"use client";

import { useState } from "react";
import type { EditorUiState } from "./use-editor-ui";

export const DEFAULT_BRAND_LOGO = "/brand/kumparan-logo.png";
export const DEFAULT_PROGRAM_LOGO = "/brand/kumparan-logo.png";

export function WatermarkOverlay({
  ui,
  channelLogoUrl,
}: {
  ui: EditorUiState;
  channelLogoUrl?: string | null;
}) {
  if (!ui.watermarkProgramOn && !ui.watermarkChannelOn) return null;

  const programSrc = ui.watermarkProgramLogoUrl || DEFAULT_PROGRAM_LOGO;
  const channelSrc = ui.watermarkChannelLogoUrl || channelLogoUrl || DEFAULT_BRAND_LOGO;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-[4%] top-[4%] z-20 flex items-start justify-between gap-3 overflow-hidden select-none"
    >
      {/* Kiri Atas: Program Logo */}
      <div className="flex max-w-[35%] shrink-0 items-center justify-start">
        {ui.watermarkProgramOn ? (
          <ProgramBadge src={programSrc} />
        ) : (
          <span />
        )}
      </div>

      {/* Kanan Atas: Channel Logo */}
      <div className="flex max-w-[35%] shrink-0 items-center justify-end">
        {ui.watermarkChannelOn ? (
          <ChannelBadge src={channelSrc} />
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

function ProgramBadge({ src }: { src: string }) {
  const [error, setError] = useState(false);

  return (
    <span className="inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-[4px] bg-white/95 px-2 py-1 shadow-sm backdrop-blur-sm dark:bg-black/85">
      {!error ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Program Logo"
          onError={() => setError(true)}
          className="h-[clamp(12px,4.5cqw,22px)] max-w-full w-auto object-contain"
        />
      ) : (
        <span className="flex items-center gap-1 font-[family-name:var(--font-ed)] text-[clamp(9px,2.8cqw,12px)] font-bold tracking-wider text-zinc-900 uppercase dark:text-white">
          <span className="size-1.5 rounded-full bg-red-500" />
          PROGRAM
        </span>
      )}
    </span>
  );
}

function ChannelBadge({ src }: { src?: string | null }) {
  const [error, setError] = useState(false);

  return (
    <span className="inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-[4px] bg-white/95 px-2 py-1 shadow-sm backdrop-blur-sm dark:bg-black/85">
      {src && !error ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Channel Logo"
          onError={() => setError(true)}
          className="h-[clamp(12px,4.5cqw,22px)] max-w-full w-auto object-contain"
        />
      ) : (
        <span className="flex items-center gap-1 font-[family-name:var(--font-ed)] text-[clamp(9px,2.8cqw,12px)] font-bold tracking-wider text-zinc-800 uppercase dark:text-zinc-200">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-indigo-600 dark:text-indigo-400"
          >
            <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
            <polyline points="17 2 12 7 7 2" />
          </svg>
          CHANNEL
        </span>
      )}
    </span>
  );
}

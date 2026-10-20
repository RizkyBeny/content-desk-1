"use client";

import type { EditorUiState } from "./use-editor-ui";

export const DEFAULT_BRAND_LOGO = "/brand/kumparan-logo.png";

export function WatermarkOverlay({
  ui,
  channelLogoUrl,
}: {
  ui: EditorUiState;
  channelLogoUrl?: string | null;
}) {
  if (!ui.watermarkProgramOn && !ui.watermarkChannelOn) return null;
  return (
    <div className="pointer-events-none absolute inset-x-[3.5cqw] top-[3.5cqw] flex items-start justify-between gap-3">
      {ui.watermarkProgramOn ? <LogoBadge src={DEFAULT_BRAND_LOGO} /> : <span />}
      {ui.watermarkChannelOn ? <LogoBadge src={channelLogoUrl || DEFAULT_BRAND_LOGO} /> : <span />}
    </div>
  );
}

function LogoBadge({ src }: { src: string }) {
  return (
    <span className="inline-flex items-center rounded-[3px] bg-white/90 px-[1.2cqw] py-[0.8cqw]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="h-[clamp(14px,5.5cqw,26px)] w-auto max-w-[32cqw] object-contain"
      />
    </span>
  );
}

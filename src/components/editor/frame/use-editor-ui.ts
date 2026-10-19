"use client";

import { useCallback, useState } from "react";

/**
 * Kontrol UI-only dari desain Figma (typography, media config, watermark,
 * voice over, promo video, transisi). State ini TIDAK dipersist ke
 * editorState — hanya hidup selama sesi editing dan di-reset per creation.
 */
export type PanelTab = "properties" | "watermark" | "voiceover";
export type RailTab = "pustaka" | "upload";
export type Alignment = "left" | "center" | "right";
export type TextPlacement = "top" | "middle" | "bottom";
export type FitMode = "fill" | "fit";
export type OverlayMode = "none" | "gradient" | "blur" | "vignette";
export type WatermarkPos = "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right";

export interface EditorUiState {
  panelTab: PanelTab;
  railTab: RailTab;

  // Typography
  alignment: Alignment;
  textPlacement: TextPlacement;
  titleText: string;
  highlightOn: boolean;
  highlightColor: string;
  descOn: boolean;
  descText: string;

  // Media config
  fitMode: FitMode;
  overlay: OverlayMode;
  mediaDurationSec: number;

  // Video promo (UI-only)
  promoOn: boolean;
  promoSource: string;
  promoTransition: string;
  promoDurationSec: number;

  // Watermark tab (UI-only)
  watermarkOn: boolean;
  watermarkText: string;
  watermarkPos: WatermarkPos;
  watermarkOpacity: number;

  // Voice over tab (UI-only)
  voiceText: string;
  voiceVoice: string;
  voiceSpeed: number;

  // Timeline zoom
  zoom: number;
}

export const DEFAULT_UI: EditorUiState = {
  panelTab: "properties",
  railTab: "pustaka",

  alignment: "left",
  textPlacement: "bottom",
  titleText: "",
  highlightOn: false,
  highlightColor: "#00B1B0",
  descOn: false,
  descText: "",

  fitMode: "fill",
  overlay: "none",
  mediaDurationSec: 30,

  promoOn: false,
  promoSource: "",
  promoTransition: "fade",
  promoDurationSec: 5,

  watermarkOn: false,
  watermarkText: "",
  watermarkPos: "bottom-right",
  watermarkOpacity: 0.6,

  voiceText: "",
  voiceVoice: "",
  voiceSpeed: 1,

  zoom: 50,
};

export interface EditorUi {
  ui: EditorUiState;
  patchUi: (patch: Partial<EditorUiState>) => void;
  resetUi: () => void;
}

export function useEditorUi(): EditorUi {
  const [ui, setUi] = useState<EditorUiState>(DEFAULT_UI);

  const patchUi = useCallback((patch: Partial<EditorUiState>) => {
    setUi((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetUi = useCallback(() => setUi(DEFAULT_UI), []);

  return { ui, patchUi, resetUi };
}

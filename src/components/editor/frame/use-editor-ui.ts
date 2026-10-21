"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VideoEditorState, VideoSettings } from "@/types";

/**
 * Kontrol panel editor. Sebagian hanya hidup selama sesi (tab, zoom), tetapi
 * untuk video nilai yang relevan disalin ke `editorState.settings` lewat
 * callback `onChange` di EditorShell agar ikut autosave/undo.
 */
export type PanelTab = "properties" | "watermark" | "voiceover";
export type RailTab = "pustaka" | "upload";
export type Alignment = "left" | "center" | "right";
export type TextPlacement = "top" | "middle" | "bottom";
export type FitMode = "fill" | "fit";
export type OverlayMode = "none" | "gradient" | "blur" | "vignette";

export interface EditorUiState {
  panelTab: PanelTab;
  railTab: RailTab;

  // Typography
  alignment: Alignment;
  textPlacement: TextPlacement;
  titleText: string;
  highlightOn: boolean;
  highlightText: string;
  highlightColor: string;
  descOn: boolean;
  descText: string;

  // Media config
  fitMode: FitMode;
  overlay: OverlayMode;
  mediaDurationSec: number;

  // Video promo
  promoOn: boolean;
  promoSource: string;
  promoTransition: string;
  promoDurationSec: number;

  // Watermark tab — logo placement
  watermarkProgramOn: boolean;
  watermarkProgramLogoAssetId: string | null;
  watermarkProgramLogoUrl: string | null;
  watermarkChannelOn: boolean;
  watermarkChannelLogoAssetId: string | null;
  watermarkChannelLogoUrl: string | null;

  // Voice over tab — generated/uploaded audio
  voiceOverOn: boolean;
  voiceOverVolume: number;

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
  highlightText: "",
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

  watermarkProgramOn: false,
  watermarkProgramLogoAssetId: null,
  watermarkProgramLogoUrl: null,
  watermarkChannelOn: false,
  watermarkChannelLogoAssetId: null,
  watermarkChannelLogoUrl: null,

  voiceOverOn: false,
  voiceOverVolume: 1,

  zoom: 50,
};

export interface EditorUi {
  ui: EditorUiState;
  patchUi: (patch: Partial<EditorUiState>) => void;
  /** Sinkronkan nilai dari editorState (mis. setelah undo) tanpa memicu persist. */
  syncUi: (patch: Partial<EditorUiState>) => void;
  resetUi: () => void;
}

const VIDEO_SETTINGS_FROM_UI = (ui: EditorUiState): VideoSettings => ({
  alignment: ui.alignment,
  textPlacement: ui.textPlacement,
  highlightOn: ui.highlightOn,
  highlightText: ui.highlightText,
  highlightColor: ui.highlightColor,
  descOn: ui.descOn,
  descText: ui.descText,
  fitMode: ui.fitMode,
  overlay: ui.overlay,
  promoSource: ui.promoSource,
  promoTransition: ui.promoTransition,
  watermarkProgramOn: ui.watermarkProgramOn,
  watermarkChannelOn: ui.watermarkChannelOn,
  watermarkChannelLogoAssetId: ui.watermarkChannelLogoAssetId,
  voiceOverOn: ui.voiceOverOn,
  voiceOverVolume: ui.voiceOverVolume,
});

/** Ambil nilai panel yang tersimpan pada state video menjadi initial UI. */
export function videoUiFromState(state: VideoEditorState): Partial<EditorUiState> {
  const s = state.settings;
  if (!s) return {};
  const out: Partial<EditorUiState> = {
    alignment: s.alignment,
    textPlacement: s.textPlacement,
    highlightOn: s.highlightOn,
    highlightText: s.highlightText,
    highlightColor: s.highlightColor,
    descOn: s.descOn,
    descText: s.descText,
    fitMode: s.fitMode,
    overlay: s.overlay,
    promoSource: s.promoSource,
    promoTransition: s.promoTransition,
    watermarkProgramOn: s.watermarkProgramOn,
    watermarkChannelOn: s.watermarkChannelOn,
    watermarkChannelLogoAssetId: s.watermarkChannelLogoAssetId ?? null,
    voiceOverOn: s.voiceOverOn,
    voiceOverVolume: s.voiceOverVolume,
  };
  for (const key of Object.keys(out) as (keyof EditorUiState)[]) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

export function videoSettingsFromUi(ui: EditorUiState): VideoSettings {
  return VIDEO_SETTINGS_FROM_UI(ui);
}

export function useEditorUi(
  initial?: Partial<EditorUiState>,
  onChange?: (next: EditorUiState) => void,
): EditorUi {
  const [ui, setUi] = useState<EditorUiState>(() => ({ ...DEFAULT_UI, ...initial }));
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const patchUi = useCallback((patch: Partial<EditorUiState>) => {
    setUi((prev) => {
      const next = { ...prev, ...patch };
      onChangeRef.current?.(next);
      return next;
    });
  }, []);

  const syncUi = useCallback((patch: Partial<EditorUiState>) => {
    setUi((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetUi = useCallback(() => {
    const next = { ...DEFAULT_UI, ...initial };
    setUi(next);
    onChangeRef.current?.(next);
  }, [initial]);

  return { ui, patchUi, syncUi, resetUi };
}

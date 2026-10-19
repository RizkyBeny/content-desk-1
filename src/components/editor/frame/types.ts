/** Impor tipe bersama untuk komponen frame — re-export dari tipe aplikasi. */
import type { CreationDTO } from "@/types";
import type { EditorController } from "../use-editor-state";
import type { FrameChrome } from "./editor-frame";
import type { EditorUiState, EditorUi } from "./use-editor-ui";

export type { AssetDTO, CreationDTO, EditorState } from "@/types";
export type { RailTab as RailTabValue } from "./use-editor-ui";

/**
 * Props standar yang diterima setiap editor tipe (image, carousel, video,
 * audio, article). Setiap editor tipe merender `EditorFrame` sendiri dan
 * menyuplai slot `stage`/`panel`/`timeline` dari state lokalnya.
 */
export interface TypeEditorProps {
  creation: CreationDTO;
  controller: EditorController;
  assetUrls: Record<string, string>;
  chrome: FrameChrome;
  ui: EditorUiState;
  patchUi: EditorUi["patchUi"];
}

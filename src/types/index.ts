// Shared domain types across modules. Kept framework-agnostic.

export type Role = "admin" | "creator";

export type ThemePref = "light" | "dark" | "system";

export type ContentLang = "id" | "en";

export type ConnectionType =
  | "instagram"
  | "tiktok"
  | "x"
  | "facebook"
  | "youtube"
  | "internal";

export type ConnectionStatus = "connected" | "syncing" | "error" | "expired";

export type ContentType = "image" | "carousel" | "video" | "audio" | "article";

export type ProjectStatus = "brief" | "generating" | "editing" | "exported";

export type BriefStatus = "draft" | "siap";

export type MetricFormat =
  | "artikel"
  | "reels"
  | "image"
  | "carousel"
  | "video"
  | "thread"
  | "text"
  | "long_form"
  | "shorts"
  | "community_post";

/** Normalized core metric row (maps to ContentMetric). */
export interface ContentMetricDTO {
  id: string;
  source: ConnectionType;
  format: MetricFormat;
  title: string;
  thumbnailUrl: string | null;
  url: string | null;
  publishedAt: string;
  reach: number | null;
  impressions: number;
  engagement: number;
  engagementRate: number;
  formatMetrics: Record<string, unknown>;
  benchmark: {
    line: number;
    label?: string;
    status: "above" | "below" | "around";
  } | null;
}

export interface InsightKpi {
  totalReach: number;
  totalImpressions: number;
  totalEngagement: number;
  avgEngagementRate: number;
  previousPeriod: {
    totalReach: number;
    totalImpressions: number;
    totalEngagement: number;
    avgEngagementRate: number;
  };
}

export interface InsightItem {
  id: string;
  source: string;
  format: string;
  title: string;
  publishedAt: string;
  core: {
    reach: number | null;
    impressions: number;
    engagement: number;
    engagementRate: number;
  };
  formatMetrics: Record<string, unknown>;
  benchmark: { er: number; status: string } | null;
}

export interface InsightAIItem {
  id: string;
  text: string;
  evidence: string;
  suggestedTopic?: string;
}

export interface TopicRecommendation {
  id: string;
  title: string;
  summary: string;
  sources: string[];
  trendScore: number;
  nicheFit: number;
  category?: string;
}

export interface TopicInsight {
  summary: string;
  supporting: { label: string; value: string }[];
  audiences: string[];
  platforms: string[];
  hasTrendSignal: boolean;
  note?: string;
}

export interface Angle {
  id: string;
  title: string;
  description: string;
  audience: string;
  reason: string;
}

export interface RecommendedType {
  type: ContentType;
  reason: string;
}

export interface Caption {
  style?: string;
  text: string;
  hashtags: string[];
  platform?: string;
}

export interface BriefSummary {
  title: string;
  goal: string;
  audience: string;
  tone: string;
  size: string;
  platforms: string[];
}

/** A single brief row; keys depend on content type (see BRIEF_SCHEMAS). */
export type BriefRow = Record<string, string> & { __id?: string };

export interface BriefVersion {
  at: string;
  summary: BriefSummary;
  rows: BriefRow[];
  captions: Caption[];
}

export interface BriefDTO {
  id: string;
  projectId: string;
  summary: BriefSummary;
  rows: BriefRow[];
  captions: Caption[];
  status: BriefStatus;
  versions: BriefVersion[];
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// AST — Asset Management
// ─────────────────────────────────────────────────────────────

export type AssetType = "image" | "video" | "audio" | "text" | "reference";

export type AssetOrigin = "upload" | "generated" | "reference" | "export";

export type AssetVisibility = "private" | "workspace";

export interface AssetDTO {
  id: string;
  ownerId: string;
  ownerName?: string | null;
  type: AssetType;
  origin: AssetOrigin;
  name: string;
  fileUrl: string | null;
  mimeType: string | null;
  textContent: string | null;
  tags: string[];
  visibility: AssetVisibility;
  sizeBytes: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Three media sources for generated/edited items (FR-GEN-2). */
export type MediaSource = "creator_asset" | "asset_management" | "ai_generated";

// ─────────────────────────────────────────────────────────────
// GEN — Creations
// ─────────────────────────────────────────────────────────────

export type CreationStatus = "generating" | "ready" | "failed";

export type ItemStatus = "queued" | "processing" | "completed" | "failed";

export interface CreationItemDTO {
  id: string;
  briefRowRef: number;
  mediaSource: MediaSource;
  assetId: string | null;
  asset: AssetDTO | null;
  prompt: string | null;
  provider: string | null;
  status: ItemStatus;
  errorMessage: string | null;
  versions: string[];
}

export interface CreationDTO {
  id: string;
  projectId: string;
  briefId: string | null;
  type: ContentType;
  editorState: EditorState | null;
  status: CreationStatus;
  items: CreationItemDTO[];
  captions: Caption[];
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// EXP — Export jobs
// ─────────────────────────────────────────────────────────────

export type ExportFormat = "png" | "jpg" | "zip" | "pdf" | "mp4" | "mp3" | "wav" | "md" | "docx" | "txt";

export type ExportStatus = "queued" | "processing" | "completed" | "failed";

export interface ExportOptions {
  scale?: 1 | 2;
  resolution?: "720p" | "1080p";
  includeCaption?: boolean;
}

export interface ExportJobDTO {
  id: string;
  creationId: string;
  format: ExportFormat;
  options: ExportOptions;
  status: ExportStatus;
  assetId: string | null;
  downloadUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// ED — Editor state (stored on Creation.editorState)
// ─────────────────────────────────────────────────────────────

export type Ratio = "1:1" | "4:5" | "9:16" | "16:9";

export interface MediaRef {
  assetId: string;
  fit?: "cover" | "contain";
  src?: string | null;
}

export interface TextLayer {
  id: string;
  type: "text";
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: "left" | "center" | "right";
  shadow?: boolean;
  rotation?: number;
  /** Konva fontStyle: "normal" | "italic" | "bold" | "italic bold" */
  fontStyle?: string;
}

export interface ImageLayer {
  id: string;
  type: "image";
  assetId: string | null;
  src: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
}

export type CanvasLayer = TextLayer | ImageLayer;

/** Partial update to a canvas layer (union of text/image fields). */
export type LayerPatch = Partial<TextLayer> | Partial<ImageLayer>;

export interface CanvasFilters {
  brightness: number;
  contrast: number;
  saturation: number;
}

export interface SlideObject {
  id: string;
  background: MediaRef | null;
  background_color?: string;
  layers: CanvasLayer[];
  filters?: CanvasFilters;
  rotation?: number;
  scale?: number;
}

export interface ImageEditorState {
  type: "image";
  ratio: Ratio;
  slide: SlideObject;
}

export interface CarouselEditorState {
  type: "carousel";
  ratio: Ratio;
  slides: SlideObject[];
}

export interface SceneText {
  id: string;
  text: string;
  fromSec: number;
  toSec: number;
  x?: number;
  y?: number;
  color?: string;
  fontSize?: number;
}

export interface SceneObject {
  id: string;
  clipAssetId: string | null;
  clipSrc: string | null;
  startSec: number;
  endSec: number;
  texts: SceneText[];
}

export interface SubtitleCue {
  fromSec: number;
  toSec: number;
  text: string;
}

export interface AudioTrackRef {
  assetId: string | null;
  src: string | null;
  volume: number;
  /** Nama file asli — dipakai panel Audio Latar / Voice Over. */
  name?: string | null;
}

export type VideoAlignment = "left" | "center" | "right";
export type VideoTextPlacement = "top" | "middle" | "bottom";
export type VideoFitMode = "fill" | "fit";
export type VideoOverlayMode = "none" | "gradient" | "blur" | "vignette";

/** Konfigurasi panel video yang ikut tersimpan di editorState. */
export interface VideoSettings {
  alignment: VideoAlignment;
  textPlacement: VideoTextPlacement;
  highlightOn: boolean;
  highlightText: string;
  highlightColor: string;
  descOn: boolean;
  descText: string;
  fitMode: VideoFitMode;
  overlay: VideoOverlayMode;
  promoSource: string;
  promoTransition: string;
  watermarkProgramOn: boolean;
  watermarkChannelOn: boolean;
  watermarkChannelLogoAssetId: string | null;
  voiceOverOn: boolean;
  voiceOverVolume: number;
}

export interface VideoEditorState {
  type: "video";
  ratio: Ratio;
  resolution: "720p" | "1080p";
  scenes: SceneObject[];
  narration: AudioTrackRef | null;
  music: AudioTrackRef | null;
  subtitles: SubtitleCue[];
  settings?: Partial<VideoSettings>;
}

export interface AudioSegment {
  id: string;
  segRef: number;
  text: string;
  voice: string;
  speed: number;
  tone: string;
  assetId: string | null;
  src: string | null;
  durationSec: number;
}

export interface AudioEditorState {
  type: "audio";
  voice: string;
  segments: AudioSegment[];
  music: AudioTrackRef | null;
  trimStartSec: number;
  trimEndSec: number | null;
}

export type ArticleBlock =
  | { id: string; type: "heading"; level: 1 | 2 | 3; text: string }
  | { id: string; type: "paragraph"; html: string }
  | { id: string; type: "quote"; html: string }
  | { id: string; type: "list"; ordered: boolean; items: string[] }
  | { id: string; type: "image"; assetId: string | null; src: string | null; caption?: string };

export interface ArticleEditorState {
  type: "article";
  html: string;
  blocks?: ArticleBlock[];
}

export type EditorState =
  | ImageEditorState
  | CarouselEditorState
  | VideoEditorState
  | AudioEditorState
  | ArticleEditorState;

// ─────────────────────────────────────────────────────────────
// PHASE 2 — Create Image/Video/Audio/Brief, galeri bento, kuota harian
// ─────────────────────────────────────────────────────────────

export type GenerationType = "image" | "video" | "audio" | "brief";

export type GenerationStatus = "queued" | "processing" | "completed" | "failed";

export interface ImageParams {
  aspectRatio: string;
  quality: "low" | "medium" | "high";
  dimensionPreset: "small" | "medium" | "large" | null;
  width: number;
  height: number;
  referenceAssetId?: string | null;
  referenceMode?: "edit" | "reference";
}

export interface VideoParams {
  aspectRatio: string;
  durationSeconds: number;
  resolution: "720p" | "1080p";
  startFrameAssetId?: string | null;
  referenceAssetId?: string | null;
}

export interface AudioParams {
  voiceId: string;
  voiceName?: string;
  language: "id" | "en";
  speed: number;
  style: "natural" | "expressive" | "stable";
  format: "mp3" | "wav";
}

export interface BriefParams {
  contentType: ContentType;
  platform: string;
  tone: string;
  language: "id" | "en";
  audience: string;
  length: "short" | "standard" | "detailed";
}

export type GenerationParams = ImageParams | VideoParams | AudioParams | BriefParams;

export interface BriefResult {
  summary: BriefSummary;
  rows: BriefRow[];
  captions: Caption[];
}

export interface GenerationOwnerDTO {
  id: string;
  name: string;
  initials: string;
}

export interface GenerationDTO {
  id: string;
  type: GenerationType;
  status: GenerationStatus;
  prompt: string;
  params: GenerationParams;
  provider: string;
  modelId: string;
  modelName: string;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  waveform: number[] | null;
  result: BriefResult | null;
  errorMessage: string | null;
  owner: GenerationOwnerDTO | null;
  isOwner: boolean;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface GenerationListDTO {
  items: GenerationDTO[];
  nextCursor: string | null;
}

export interface QuotaDTO {
  type: GenerationType;
  used: number;
  limit: number;
  remaining: number;
  date: string;
  resetAt: string;
  running: number;
  maxConcurrent: number;
}

export interface VoiceDTO {
  id: string;
  name: string;
  label: string;
  previewUrl: string | null;
}

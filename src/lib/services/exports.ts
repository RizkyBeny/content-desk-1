import { buildExportFilename } from "@/lib/export/filename";
import type { CreationDTO } from "@/types";

export type ExportFormat = "png" | "jpg" | "zip" | "pdf" | "mp4" | "mp3" | "wav" | "md" | "docx";

export type ExportOptions = {
  includeCaption?: boolean;
  resolution?: "720p" | "1080p";
  quality?: 1 | 2;
};

export interface ExportResult {
  assetId: string | null;
  fileUrl: string | null;
  jobId: string | null;
}

/** Stub renderers – returns a placeholder result with a jobId. */
export function exportImage(_creation: CreationDTO, _options: ExportOptions): ExportResult {
  return { assetId: null, fileUrl: null, jobId: "job-image-" + Date.now() };
}
export function exportCarousel(_creation: CreationDTO, _options: ExportOptions): ExportResult {
  return { assetId: null, fileUrl: null, jobId: "job-carousel-" + Date.now() };
}
export function exportVideo(_creation: CreationDTO, _options: ExportOptions): ExportResult {
  return { assetId: null, fileUrl: null, jobId: "job-video-" + Date.now() };
}
export function exportAudio(_creation: CreationDTO, _options: ExportOptions): ExportResult {
  return { assetId: null, fileUrl: null, jobId: "job-audio-" + Date.now() };
}
export function exportArticle(_creation: CreationDTO, _options: ExportOptions): ExportResult {
  return { assetId: null, fileUrl: null, jobId: "job-article-" + Date.now() };
}

/** Dispatch format → renderer. */
const RENDERERS: Record<ExportFormat, (creation: CreationDTO, options: ExportOptions) => ExportResult> = {
  png: exportImage,
  jpg: exportImage,
  zip: exportCarousel,
  pdf: exportCarousel,
  mp4: exportVideo,
  mp3: exportAudio,
  wav: exportAudio,
  md: exportArticle,
  docx: exportArticle,
};

/** Start an export job (v1: synchronous, returns jobId). */
export function startExport(_creationId: string, _format: ExportFormat, _options: ExportOptions): { exportJobId: string; result: ExportResult } {
  const result = RENDERERS[_format]({ id: _creationId, projectId: "", briefId: null, type: "image" as const, editorState: null, status: "generating" as const, items: [], captions: [], updatedAt: new Date().toISOString() } as CreationDTO, _options);
  return { exportJobId: "job-" + Date.now(), result };
}

/** Filename helper. */
export function getExportFilename({ title, type, format }: { title: string; type: string; format: string }): string {
  return buildExportFilename({ title, type, format });
}
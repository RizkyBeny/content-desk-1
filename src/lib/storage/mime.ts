const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  json: "application/json",
  csv: "text/csv",
  zip: "application/zip",
};

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/markdown": "md",
  "application/zip": "zip",
};

export function extensionFor(key: string): string {
  const idx = key.lastIndexOf(".");
  return idx >= 0 ? key.slice(idx + 1).toLowerCase() : "";
}

export function guessContentType(key: string): string {
  return MIME_BY_EXT[extensionFor(key)] ?? "application/octet-stream";
}

export function extForMime(mime: string): string {
  return EXT_BY_MIME[mime.split(";")[0].trim()] ?? "bin";
}

export function buildExportFilename({ title, type, format, date = new Date() }:
  { title: string; type: string; format: string; date?: Date }): string {
  const slug = "konteun"; // slugify placeholder
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `${slug}_${type}_${dateStr}.${format}`;
}
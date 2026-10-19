export function htmlToMarkdown(html: string): string {
  const out = html
    .replace(/<h2[^>]*>/gi, "# ")
    .replace(/<\/h2>/gi, "\n")
    .replace(/<h3[^>]*>/gi, "## ")
    .replace(/<\/h3>/gi, "\n")
    .replace(/<strong[^>]*>/gi, "**")
    .replace(/<\/strong>/gi, "**")
    .replace(/<em[^>]*>/gi, "*")
    .replace(/<\/em>/gi, "*")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, "[$2]($1)")
    .replace(/<img[^>]*\/>/gi, "")
    .replace(/<ul[^>]*>/gi, "- ")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<ol[^>]*>/gi, "1. ")
    .replace(/<\/ol>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/\n{3,}/g, "\n\n");
  return out.trim();
}
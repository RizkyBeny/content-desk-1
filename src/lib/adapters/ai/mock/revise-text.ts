import type { TextRevisionInput } from "@/lib/adapters/ai/types";

/** Deterministic local text revision used by the mock AI provider (FR-ED-6). */
export function mockReviseText(input: TextRevisionInput): string {
  const text = input.text.trim();
  if (!text) return text;
  const words = text.split(/\s+/);

  if (input.action === "shorten") {
    const keep = Math.max(6, Math.ceil(words.length * 0.6));
    const cut = words.slice(0, keep).join(" ").replace(/[,;:.\s]+$/, "");
    return `${cut}.`;
  }

  if (input.action === "expand") {
    const first = words.slice(0, 12).join(" ");
    return `${text}\n\nDengan kata lain, ${first.toLowerCase()} menjadi lebih relevan untuk audiens yang mencari informasi terkini.`;
  }

  const tone = input.tone?.trim() || "hangat dan meyakinkan";
  const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
  return `${capitalized}. Nada ${tone}: mari bahas ini lebih dekat.`;
}

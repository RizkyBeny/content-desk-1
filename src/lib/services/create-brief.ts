import { getAIProvider } from "@/lib/adapters/ai";
import type { BriefInput } from "@/lib/adapters/ai/types";
import type { BriefParams, BriefResult } from "@/types";
import { BRIEF_PLATFORMS } from "../../../config/generation";

function platformLabel(value: string): string {
  return BRIEF_PLATFORMS.find((p) => p.value === value)?.label ?? value;
}

/**
 * Create Brief tidak terikat proyek: seluruh konteks datang dari prompt +
 * parameter (platform, tone, bahasa, audiens, panjang) — FR-BRF-1/2.
 */
export async function runStandaloneBrief(prompt: string, params: BriefParams): Promise<BriefResult> {
  const audience = params.audience.trim() || "Audiens umum media sosial";
  const input: BriefInput = {
    topic: prompt,
    angle: { title: prompt, description: prompt, audience },
    contentType: params.contentType,
    summaryContext: {
      niche: null,
      tone: params.tone,
      platforms: [platformLabel(params.platform)],
    },
    lang: params.language,
    length: params.length,
  };
  const result = await getAIProvider().generateBrief(input);
  return { summary: result.summary, rows: result.rows, captions: result.captions };
}

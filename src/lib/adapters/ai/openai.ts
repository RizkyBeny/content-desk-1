import type { AIProvider } from "@/lib/adapters/ai/types";
import { getEnv } from "@/lib/env";

/**
 * OpenAI-backed LLM adapter. All methods use a single JSON-mode chat helper.
 * Selected when AI_PROVIDER=openai. Requires OPENAI_API_KEY.
 */

const MODEL = "gpt-4o-mini";

async function chatJson<T>(system: string, user: unknown): Promise<T> {
  const { OPENAI_API_KEY } = getEnv();
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY belum diatur untuk AI_PROVIDER=openai.");
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content) as T;
}

const BASE = "Balas HANYA dengan JSON valid sesuai skema yang diminta. Bahasa Indonesia.";

const LENGTH_GUIDE = {
  short: "Buat 5 baris ringkas dan padat.",
  standard: "Buat 7 baris dengan kedalaman standar.",
  detailed: "Buat 10 baris yang detail dan menyeluruh.",
} as const;

function rowCountHint(input: { length?: keyof typeof LENGTH_GUIDE }): string {
  const guide = input.length ? LENGTH_GUIDE[input.length] : "";
  return ` Gunakan kolom sesuai jenis konten, isi "title" summary dari topik. ${guide} Sertakan 3 caption dengan gaya berbeda.`;
}

export const openAIProvider: AIProvider = {
  name: "openai",
  generateInsights: (input) =>
    chatJson(BASE + ' JSON: {"insights":[{"id","text","evidence","suggestedTopic?"}]}', input).then(
      (r) => (r as { insights: never[] }).insights,
    ),
  generateTopicRecommendations: (input) =>
    chatJson(BASE + ' JSON: {"items":[{"id","title","summary","sources":[],"trendScore","nicheFit","category"}]}', input).then(
      (r) => (r as { items: never[] }).items,
    ),
  generateTopicInsight: (input) =>
    chatJson(BASE + ' JSON: {"summary","supporting":[{"label","value"}],"audiences":[],"platforms":[],"hasTrendSignal","note?"}', input),
  generateAngles: (input) =>
    chatJson(BASE + ' JSON: {"angles":[{"id","title","description","audience","reason"}]}', input).then(
      (r) => (r as { angles: never[] }).angles,
    ),
  recommendContentTypes: (input) =>
    chatJson(BASE + ' JSON: {"types":[{"type","reason"}]} (max 3)', input).then(
      (r) => (r as { types: never[] }).types,
    ),
  generateBrief: (input) =>
    chatJson(
      BASE +
        ' JSON: {"summary":{"title","goal","audience","tone","size","platforms":[]},"rows":[{...}],"captions":[{"style","text","hashtags":[],"platform"}]}' +
        rowCountHint(input),
      input,
    ),
  reviseBrief: (input) =>
    chatJson(BASE + ' JSON: {"rows":[{...}]}', input).then(
      (r) => (r as { rows: never[] }).rows,
    ),
  generateCaptions: (input) =>
    chatJson(BASE + ' JSON: {"captions":[{"style","text","hashtags":[],"platform"}]}', input).then(
      (r) => (r as { captions: never[] }).captions,
    ),
  reviseText: (input) =>
    chatJson(
      BASE + ' JSON: {"text":"..."}. Terapkan aksi pada "text": "shorten" ringkas, "expand" perpanjang, "tone" sesuaikan nada.',
      input,
    ).then((r) => (r as { text?: string }).text ?? input.text),
};

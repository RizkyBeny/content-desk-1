import type { AIProvider } from "./types";
import { mockAIProvider } from "./mock";
import { openAIProvider } from "./openai";
import { getEnv } from "@/lib/env";

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const provider = getEnv().AI_PROVIDER;
  cached = provider === "openai" ? openAIProvider : mockAIProvider;
  return cached;
}

export type { AIProvider } from "./types";

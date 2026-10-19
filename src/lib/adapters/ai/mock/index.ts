import type { AIProvider } from "@/lib/adapters/ai/types";
import { mockInsights } from "./insights";
import { mockTopicInsight, mockTopicRecommendations } from "./topics";
import { mockAngles, mockRecommendContentTypes } from "./angles";
import { buildCaptions, mockBrief, mockReviseBrief } from "./briefs";
import { mockReviseText } from "./revise-text";

export const mockAIProvider: AIProvider = {
  name: "mock",
  generateInsights: async (input) => mockInsights(input),
  generateTopicRecommendations: async (input) => mockTopicRecommendations(input),
  generateTopicInsight: async (input) => mockTopicInsight(input),
  generateAngles: async (input) => mockAngles(input),
  recommendContentTypes: async (input) => mockRecommendContentTypes(input),
  generateBrief: async (input) => mockBrief(input),
  reviseBrief: async (input) => mockReviseBrief(input),
  generateCaptions: async (input) => buildCaptions(input),
  reviseText: async (input) => mockReviseText(input),
};

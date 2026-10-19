import type {
  Angle,
  BriefRow,
  BriefSummary,
  Caption,
  ContentType,
  InsightAIItem,
  RecommendedType,
  TopicInsight,
  TopicRecommendation,
} from "@/types";

export interface MetricSummaryForAI {
  source: string;
  format: string;
  title: string;
  engagementRate: number;
  reach: number | null;
  impressions: number;
  engagement: number;
  publishedAt: string;
}

export interface InsightInput {
  metrics: MetricSummaryForAI[];
  previousAvgEr: number;
  currentAvgEr: number;
  niche: string | null;
  lang: string;
  periodLabel: string;
}

export interface TopicInput {
  trendSignals: {
    provider: string;
    keyword: string;
    category: string | null;
    volumeScore: number;
  }[];
  niche: string | null;
  nicheCategories: string[];
  topFormats: { format: string; avgEr: number }[];
  lang: string;
  limit: number;
}

export interface TopicInsightInput {
  topic: string;
  source: "trending" | "custom";
  trendSignals: {
    provider: string;
    keyword: string;
    category: string | null;
    volumeScore: number;
  }[];
  niche: string | null;
  ownMetrics: MetricSummaryForAI[];
  lang: string;
  /** True when AI needs one clarification before generating angles. */
  needsClarification?: boolean;
}

export interface AngleInput {
  topic: string;
  niche: string | null;
  topFormats: { format: string; avgEr: number }[];
  count: number;
  existingTitles: string[];
  lang: string;
}

export interface ContentTypeInput {
  topic: string;
  angle: { title: string; description: string; audience: string };
  formatPerformance: { format: string; avgEr: number }[];
  lang: string;
}

export type BriefLength = "short" | "standard" | "detailed";

export interface BriefInput {
  topic: string;
  angle: { title: string; description: string; audience: string };
  contentType: ContentType;
  summaryContext: {
    niche: string | null;
    tone: string | null;
    platforms: string[];
  };
  lang: string;
  /** Target kedalaman brief (Create Brief, FR-BRF-2). */
  length?: BriefLength;
}

export interface BriefRevisionInput {
  contentType: ContentType;
  instruction: string;
  rowIndex: number | null;
  currentSummary: BriefSummary;
  currentRows: BriefRow[];
  lang: string;
}

export interface BriefGeneration {
  summary: BriefSummary;
  rows: BriefRow[];
  captions: Caption[];
}

export type TextRevisionAction = "tone" | "shorten" | "expand";

export interface TextRevisionInput {
  text: string;
  action: TextRevisionAction;
  tone?: string;
  lang: string;
}

export interface CurvePoint {
  pct: number;
  value: number;
}

/**
 * LLM adapter contract. Implementations: mock (default) and openai.
 * Every method is async so a real provider can be dropped in unchanged.
 */
export interface AIProvider {
  readonly name: string;
  generateInsights(input: InsightInput): Promise<InsightAIItem[]>;
  generateTopicRecommendations(input: TopicInput): Promise<TopicRecommendation[]>;
  generateTopicInsight(input: TopicInsightInput): Promise<TopicInsight>;
  generateAngles(input: AngleInput): Promise<Angle[]>;
  recommendContentTypes(input: ContentTypeInput): Promise<RecommendedType[]>;
  generateBrief(input: BriefInput): Promise<BriefGeneration>;
  reviseBrief(input: BriefRevisionInput): Promise<BriefRow[]>;
  generateCaptions(input: BriefInput): Promise<Caption[]>;
  reviseText(input: TextRevisionInput): Promise<string>;
}

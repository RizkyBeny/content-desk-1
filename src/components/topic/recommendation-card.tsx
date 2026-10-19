"use client";

import { Button } from "@heroui/react";
import { GlassCard } from "@/components/ui/primitives";
import type { TopicRecommendation } from "@/types";

export function topicScore(topic: TopicRecommendation) {
  return Math.round(topic.trendScore * 0.6 + topic.nicheFit * 0.4);
}

function scoreTone(score: number) {
  if (score >= 80) return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  if (score >= 70) return "bg-blue-500/15 text-blue-600 dark:text-blue-400";
  return "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400";
}

export function RecommendationCard({
  topic,
  onMake,
  disabled,
}: {
  topic: TopicRecommendation;
  onMake: () => void;
  disabled?: boolean;
}) {
  const score = topicScore(topic);
  return (
    <GlassCard className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-semibold ${scoreTone(score)}`}>
          {score}
        </span>
      </div>
      <div className="min-w-0 space-y-1">
        <p className="line-clamp-2 text-sm font-semibold">{topic.title}</p>
        <p className="line-clamp-3 text-xs text-zinc-500 dark:text-zinc-400">{topic.summary}</p>
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-1">
        <Button size="sm" variant="primary" onPress={onMake} isDisabled={disabled}>
          Buat konten
        </Button>
      </div>
    </GlassCard>
  );
}

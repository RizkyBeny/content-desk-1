"use client";

import { Button } from "@heroui/react";
import { GlassCard, SectionHeader } from "@/components/ui/primitives";
import { RefreshIcon, SparkIcon } from "@/components/ui/icons";
import type { InsightAIItem } from "@/types";

export function InsightAIPanel({
  insights,
  loading,
  error,
  onRefresh,
  onMakeTopic,
}: {
  insights: InsightAIItem[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onMakeTopic: (topic: string) => void;
}) {
  return (
    <GlassCard className="flex flex-col gap-4">
      <SectionHeader
        title={
          <span className="flex items-center gap-2">
            <SparkIcon width={18} height={18} /> Insight AI
          </span>
        }
        description="Analisis naratif berbasis data filter aktif."
        action={
          <Button variant="secondary" size="sm" onPress={onRefresh} isDisabled={loading}>
            <RefreshIcon width={16} height={16} /> Perbarui insight
          </Button>
        }
      />

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-200/60 dark:bg-white/5" />
          ))}
        </div>
      )}

      {error && !loading && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && insights.length === 0 && (
        <p className="text-sm text-zinc-500">Belum ada insight untuk filter ini.</p>
      )}

      {!loading && !error && insights.length > 0 && (
        <ul className="space-y-3">
          {insights.map((insight) => (
            <li
              key={insight.id}
              className="glass-panel flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium">{insight.text}</p>
                {insight.evidence && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Dasar: {insight.evidence}</p>
                )}
              </div>
              {insight.suggestedTopic && (
                <Button
                  size="sm"
                  variant="tertiary"
                  className="shrink-0"
                  onPress={() => onMakeTopic(insight.suggestedTopic as string)}
                >
                  Jadikan topik
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

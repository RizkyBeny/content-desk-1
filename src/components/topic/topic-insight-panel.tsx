"use client";

import { Button, Chip } from "@heroui/react";
import { GlassCard, SectionHeader } from "@/components/ui/primitives";
import { AlertIcon, SparkIcon } from "@/components/ui/icons";
import type { TopicInsight } from "@/types";

export function TopicInsightPanel({
  topic,
  insight,
  needClarification,
  loading,
  error,
  onProceed,
  onClose,
}: {
  topic: string;
  insight: TopicInsight | null;
  needClarification: boolean;
  loading: boolean;
  error: string | null;
  onProceed: () => void;
  onClose: () => void;
}) {
  return (
    <GlassCard className="flex flex-col gap-4">
      <SectionHeader
        title={
          <span className="flex items-center gap-2">
            <SparkIcon width={18} height={18} /> Insight Topik
          </span>
        }
        description={topic}
        action={
          <Button variant="ghost" size="sm" onPress={onClose}>
            Tutup
          </Button>
        }
      />

      {loading && (
        <div className="space-y-3">
          <div className="h-16 animate-pulse rounded-xl bg-zinc-200/60 dark:bg-white/5" />
          <div className="h-10 w-2/3 animate-pulse rounded-xl bg-zinc-200/60 dark:bg-white/5" />
        </div>
      )}

      {error && !loading && <p className="text-sm text-red-500">{error}</p>}

      {needClarification && !loading && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300/50 bg-amber-50/70 p-3 text-sm dark:border-amber-400/20 dark:bg-amber-500/10">
          <AlertIcon width={18} height={18} className="mt-0.5 shrink-0 text-amber-600" />
          <p>Topik ini masih sangat singkat/ambigu. Tambahkan sedikit detail agar angle yang dihasilkan lebih tepat.</p>
        </div>
      )}

      {insight && !loading && (
        <div className="space-y-4">
          <p className="text-sm">{insight.summary}</p>

          {insight.supporting.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {insight.supporting.map((s, i) => (
                <div key={i} className="glass-panel p-3">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.label}</p>
                  <p className="text-sm font-medium">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {insight.platforms.map((p) => (
              <Chip key={p} size="sm" variant="soft">
                {p}
              </Chip>
            ))}
            {insight.audiences.map((a) => (
              <Chip key={a} size="sm">
                {a}
              </Chip>
            ))}
          </div>

          {!insight.hasTrendSignal && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {insight.note ?? "Belum ada sinyal tren eksternal untuk topik ini."}
            </p>
          )}

          <div>
            <Button variant="primary" onPress={onProceed}>
              Lanjut buat proyek
            </Button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

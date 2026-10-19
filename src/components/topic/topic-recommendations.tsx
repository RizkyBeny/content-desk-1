"use client";

import { useEffect, useRef, useState } from "react";
import { Button, toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { apiFetch, post } from "@/lib/client";
import { GlassCard, SectionHeader } from "@/components/ui/primitives";
import { EmptyBlock, ErrorState, LoadingState } from "@/components/ui/states";
import { RefreshIcon, SparkIcon } from "@/components/ui/icons";
import { TopicFilters, type TopicFilterState } from "@/components/topic/topic-filters";
import { RecommendationCard } from "@/components/topic/recommendation-card";
import { TopicInsightPanel } from "@/components/topic/topic-insight-panel";
import type { TopicInsight, TopicRecommendation } from "@/types";

interface RecsResponse {
  items: TopicRecommendation[];
  cached: boolean;
  lastTrendAt: string | null;
  hasTrendData: boolean;
}

interface SelectedTopic {
  title: string;
  source: "trending" | "custom";
}

export function TopicRecommendations({ prefill }: { prefill?: { topic: string; nonce: number } }) {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [items, setItems] = useState<TopicRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasTrend, setHasTrend] = useState(true);
  const [lastTrendAt, setLastTrendAt] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  const [customTopic, setCustomTopic] = useState("");
  const [selected, setSelected] = useState<SelectedTopic | null>(null);
  const [insight, setInsight] = useState<TopicInsight | null>(null);
  const [needClarification, setNeedClarification] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const refreshRef = useRef(false);
  const [prefillSeen, setPrefillSeen] = useState<number | undefined>(undefined);

  if (prefill && prefill.nonce !== prefillSeen) {
    setPrefillSeen(prefill.nonce);
    setCustomTopic(prefill.topic);
    setSelected({ title: prefill.topic, source: "custom" });
  }

  useEffect(() => {
    let aborted = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const p = new URLSearchParams({ limit: "5" });
        if (category) p.set("category", category);
        if (refreshRef.current) p.set("refresh", "1");
        const res = await apiFetch<RecsResponse>(`/api/topics/recommendations?${p}`);
        if (aborted) return;
        setItems(res.items);
        setHasTrend(res.hasTrendData);
        setLastTrendAt(res.lastTrendAt);
      } catch (e: unknown) {
        if (aborted) return;
        const message = (e as { message?: string }).message ?? "Gagal memuat rekomendasi topik.";
        if (refreshRef.current) toast.danger(message);
        else setError(message);
      } finally {
        refreshRef.current = false;
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [category, reload]);

  useEffect(() => {
    if (!selected) return;
    let aborted = false;
    (async () => {
      setInsightLoading(true);
      setInsightError(null);
      setInsight(null);
      setNeedClarification(false);
      try {
        const res = await post<{ insight: TopicInsight; needClarification: boolean }>(
          "/api/topics/insight",
          { topic: selected.title, source: selected.source },
        );
        if (aborted) return;
        setInsight(res.insight);
        setNeedClarification(res.needClarification);
      } catch (e: unknown) {
        if (!aborted) setInsightError((e as { message?: string }).message ?? "Gagal memuat insight topik.");
      } finally {
        if (!aborted) setInsightLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [selected]);

  async function createProject(title: string, source: SelectedTopic["source"], ins: TopicInsight | null) {
    setCreating(true);
    try {
      const res = await post<{ projectId: string }>("/api/projects", {
        origin: "flow",
        topicTitle: title,
        topicSource: source,
        topicInsight: ins ?? {},
      });
      router.push(`/proyek/${res.projectId}`);
    } catch (e: unknown) {
      toast.danger((e as { message?: string }).message ?? "Gagal membuat proyek.");
    } finally {
      setCreating(false);
    }
  }

  function useCustomTopic() {
    const t = customTopic.trim();
    if (t.length < 3) {
      toast.danger("Topik minimal 3 karakter.");
      return;
    }
    if (t.length > 200) {
      toast.danger("Topik maksimal 200 karakter.");
      return;
    }
    setSelected({ title: t, source: "custom" });
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Rekomendasi Topik"
        description={
          lastTrendAt
            ? `Tren terakhir diperbarui ${new Date(lastTrendAt).toLocaleString("id-ID")}`
            : "Berdasarkan sinyal tren & performa Anda."
        }
        action={
          <></>
        }
      />

      {/* <TopicFilters value={{ category }} onChange={(next: TopicFilterState) => setCategory(next.category)} /> */}

      {!hasTrend && !loading && (
        <EmptyBlock
          icon={<SparkIcon />}
          title="Belum ada data tren"
          description="Trend signals akan terisi saat worker/trends di-refresh. Coba perbarui atau jalankan seed."
        />
      )}

      {loading && <LoadingState rows={2} />}
      {error && !loading && <ErrorState message={error} onRetry={() => setReload((n) => n + 1)} />}

      {!loading && !error && (
        <>
          {items.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {items.map((t) => (
                <RecommendationCard
                  key={t.id}
                  topic={t}
                  disabled={creating}
                  onMake={() => createProject(t.title, "trending", null)}
                />
              ))}
            </div>
          )}
          {items.length === 0 && hasTrend && (
            <EmptyBlock title="Belum ada rekomendasi" description="Coba ubah filter atau segarkan rekomendasi." />
          )}
        </>
      )}

      <GlassCard className="flex flex-col gap-3">
        <SectionHeader title="Buat topik sendiri" description="Tulis topik 3–200 karakter, lalu lihat Insight Topik." />
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            maxLength={200}
            placeholder="Contoh: tips WFH hemat listrik"
            className="w-full rounded-xl border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900/70"
          />
          <Button variant="primary" onPress={useCustomTopic} className="shrink-0">
            <SparkIcon width={16} height={16} /> Gunakan topik ini
          </Button>
        </div>
      </GlassCard>

      {selected && (
        <TopicInsightPanel
          topic={selected.title}
          insight={insight}
          needClarification={needClarification}
          loading={insightLoading}
          error={insightError}
          onProceed={() => createProject(selected.title, selected.source, insight)}
          onClose={() => setSelected(null)}
        />
      )}

      {creating && <p className="text-sm text-zinc-500">Membuat proyek…</p>}
    </div>
  );
}

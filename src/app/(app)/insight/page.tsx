"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Chip } from "@heroui/react";
import { useRouter } from "next/navigation";
import { apiFetch, post } from "@/lib/client";
import { SectionHeader } from "@/components/ui/primitives";
import { EmptyBlock, ErrorState, LoadingState } from "@/components/ui/states";
import { RefreshIcon } from "@/components/ui/icons";
import {
  InsightFilters,
  computeRange,
  type InsightFilterState,
} from "@/components/insight/insight-filters";
import { InsightItemCard } from "@/components/insight/insight-item-card";
import { InsightAIPanel } from "@/components/insight/insight-ai-panel";
import { TopicRecommendations } from "@/components/topic/topic-recommendations";
import type { InsightAIItem, InsightItem, InsightKpi } from "@/types";

interface InsightsResponse {
  kpi: InsightKpi;
  items: InsightItem[];
  hasMore: boolean;
  hasAnyConnection: boolean;
  lastSyncedAt: string | null;
}

const PAGE_SIZE = 20;

function insightParams(opt: {
  sortBy: string;
  offset: number;
  sources: string;
  from: string;
  to: string;
}) {
  const p = new URLSearchParams({
    sortBy: opt.sortBy,
    limit: String(PAGE_SIZE),
    offset: String(opt.offset),
    from: opt.from,
    to: opt.to,
  });
  if (opt.sources) p.set("sources", opt.sources);
  return p;
}

export default function InsightPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<InsightFilterState>({
    period: "30",
    from: "",
    to: "",
    sources: [],
  });
  const [sortBy, setSortBy] = useState("engagementRate");
  const [reload, setReload] = useState(0);

  const [kpi, setKpi] = useState<InsightKpi | null>(null);
  const [items, setItems] = useState<InsightItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [hasAnyConnection, setHasAnyConnection] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [role, setRole] = useState("creator");
  const [aiInsights, setAiInsights] = useState<InsightAIItem[]>([]);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiForce = useRef(false);
  const [aiNonce, setAiNonce] = useState(0);
  const [prefill, setPrefill] = useState<{ topic: string; nonce: number } | undefined>();

  const { fromISO, toISO, sourcesParam } = useMemo(() => {
    const { from, to } = computeRange(filters);
    return {
      fromISO: from.toISOString().slice(0, 10),
      toISO: to.toISOString().slice(0, 10),
      sourcesParam: filters.sources.join(","),
    };
  }, [filters]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const query = insightParams({ sortBy, offset: 0, sources: sourcesParam, from: fromISO, to: toISO });
        const res = await apiFetch<InsightsResponse>(`/api/insights?${query}`);
        if (aborted) return;
        setKpi(res.kpi);
        setItems(res.items);
        setHasMore(res.hasMore);
        setHasAnyConnection(res.hasAnyConnection);
      } catch (e: unknown) {
        if (!aborted) setError((e as { message?: string }).message ?? "Gagal memuat insight.");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [fromISO, toISO, sourcesParam, sortBy, reload]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      setAiLoading(true);
      setAiError(null);
      try {
        const res = await post<{ insights: InsightAIItem[]; cached: boolean }>("/api/insights/ai", {
          from: fromISO,
          to: toISO,
          sources: sourcesParam ? sourcesParam.split(",") : [],
          refresh: aiForce.current,
        });
        if (aborted) return;
        setAiInsights(res.insights);
      } catch (e: unknown) {
        if (!aborted) setAiError((e as { message?: string }).message ?? "Gagal memuat insight AI.");
      } finally {
        aiForce.current = false;
        if (!aborted) setAiLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [fromISO, toISO, sourcesParam, aiNonce]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await apiFetch<{ user: { role: string } }>("/api/me");
        if (!aborted) setRole(res.user.role);
      } catch {
        setRole("creator");
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const query = insightParams({ sortBy, offset: items.length, sources: sourcesParam, from: fromISO, to: toISO });
      const res = await apiFetch<InsightsResponse>(`/api/insights?${query}`);
      setItems((prev) => [...prev, ...res.items]);
      setHasMore(res.hasMore);
    } catch (e: unknown) {
      setError((e as { message?: string }).message ?? "Gagal memuat lebih banyak.");
    } finally {
      setLoadingMore(false);
    }
  }

  const isAdmin = role === "admin";

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        title="Overview"
        description="Ringkasan KPI dan performa konten teratas."
        action={
          <Button variant="secondary" size="sm" onPress={() => setReload((n) => n + 1)} isDisabled={loading}>
            <RefreshIcon width={16} height={16} /> Muat ulang
          </Button>
        }
      />

      <TopicRecommendations prefill={prefill} />

      <InsightFilters value={filters} onChange={setFilters} />

      {loading && <LoadingState rows={3} />}
      {error && !loading && <ErrorState message={error} onRetry={() => setReload((n) => n + 1)} />}

      {!loading && !error && kpi && (
        <div className="space-y-6">
          {!hasAnyConnection && (
            <EmptyBlock
              title="Belum ada koneksi data"
              description={
                isAdmin
                  ? "Tambahkan koneksi di Pengaturan → Koneksi untuk melihat metrik."
                  : "Hubungi Admin untuk menghubungkan sumber data."
              }
              action={
                isAdmin ? (
                  <Button variant="primary" size="sm" onPress={() => router.push("/pengaturan/koneksi")}>
                    Hubungkan sumber data
                  </Button>
                ) : undefined
              }
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Reach total" value={fmtNum(kpi.totalReach)} delta={deltaPct(kpi.totalReach, kpi.previousPeriod.totalReach)} />
            <StatCard label="Impressions" value={fmtNum(kpi.totalImpressions)} delta={deltaPct(kpi.totalImpressions, kpi.previousPeriod.totalImpressions)} />
            <StatCard label="Engagement" value={fmtNum(kpi.totalEngagement)} delta={deltaPct(kpi.totalEngagement, kpi.previousPeriod.totalEngagement)} />
            <StatCard label="Avg ER" value={`${kpi.avgEngagementRate.toFixed(2)}%`} delta={deltaPct(kpi.avgEngagementRate, kpi.previousPeriod.avgEngagementRate)} />
          </div>

          <InsightAIPanel
            insights={aiInsights}
            loading={aiLoading}
            error={aiError}
            onRefresh={() => {
              aiForce.current = true;
              setAiNonce((n) => n + 1);
            }}
            onMakeTopic={(topic) => setPrefill({ topic, nonce: Date.now() })}
          />

          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Konten teratas</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-500">Urutkan</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-zinc-200/70 bg-white/80 px-2 py-1 text-sm dark:border-white/10 dark:bg-zinc-900/70"
              >
                <option value="engagementRate">Engagement Rate</option>
                <option value="engagement">Engagement</option>
                <option value="reach">Reach</option>
                <option value="impressions">Impressions</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <InsightItemCard key={item.id} item={item} />
            ))}
            {items.length === 0 && (
              <EmptyBlock title="Tidak ada data di periode ini" description="Coba ubah rentang waktu atau filter sumber." />
            )}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button variant="secondary" onPress={loadMore} isDisabled={loadingMore}>
                  {loadingMore ? "Memuat..." : "Muat lebih banyak"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, delta }: { label: string; value: string; delta: number }) {
  const pos = delta > 0;
  const neg = delta < 0;
  return (
    <div className="glass-card flex flex-col gap-2 p-5">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-semibold">{value}</p>
        {delta !== 0 && (
          <Chip size="sm" color={pos ? "success" : neg ? "danger" : "default"} variant="soft">
            {pos ? "+" : ""}
            {delta.toFixed(1)}%
          </Chip>
        )}
      </div>
    </div>
  );
}

function deltaPct(current: number, previous: number) {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

function fmtNum(n: number | null) {
  if (n === null) return "—";
  return n.toLocaleString("id-ID");
}

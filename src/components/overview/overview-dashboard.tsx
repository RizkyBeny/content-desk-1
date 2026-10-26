"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { post } from "@/lib/client";
import {
  OVERVIEW_TABS,
  IMPRESSION_PER_CONTENT_DATA,
  ENGAGEMENT_PER_CONTENT_DATA,
  type TopicRecommendationItem,
} from "../../../config/overview";
import { PendingDraftBanner } from "./pending-draft-banner";
import { TopicRecommendationSection } from "./topic-recommendation-section";
import { KeyTakeawaysSection } from "./key-takeaways-section";
import { SocialExecutiveSummary } from "./social-executive-summary";
import { ChannelPerformanceTable } from "./channel-performance-table";
import { DataPlatformTab } from "./tabs/data-platform-tab";
import { ContentTypeTab } from "./tabs/content-type-tab";
import { PublishingTimeTab } from "./tabs/publishing-time-tab";
import { BuildingBlockTab } from "./tabs/building-block-tab";
import { ContentHighlightTab } from "./tabs/content-highlight-tab";

export function OverviewDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("executive-summary");
  const [selectedCluster, setSelectedCluster] = useState("news");
  const [loadingRank, setLoadingRank] = useState<number | null>(null);

  async function handleMakeContent(item: TopicRecommendationItem) {
    try {
      setLoadingRank(item.rank);
      const res = await post<{ projectId: string }>("/api/projects", {
        origin: "flow",
        topicTitle: item.title,
        topicSource: "trending",
        topicInsight: {
          summary: item.description,
          score: item.score,
        },
      });
      // Arahkan langsung ke halaman alur proyek (Step 1: Pilih Angle)
      router.push(`/proyek/${res.projectId}`);
    } catch {
      // Fallback ke proyek demo angle jika offline/mock
      router.push("/proyek/demo-angle");
    } finally {
      setLoadingRank(null);
    }
  }

  return (
    <div className="space-y-6 pb-12 pt-2">
      {/* 1. Pending Draft Notification Banner */}
      <PendingDraftBanner />

      {/* 2. Page Header with Title, Description, and Cluster Dropdown */}
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-200/80 pb-5 sm:flex-row sm:items-center dark:border-white/10">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl dark:text-white">
            Overview · News
          </h1>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
            7 hari terakhir (6 Okt 2026 – 12 Okt 2026) · perubahan dibanding 7 hari sebelumnya (29 Sep–5 Okt) · data ilustrasi
          </p>
        </div>

        {/* Cluster Selector Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="relative">
            <select
              id="cluster-select"
              value={selectedCluster}
              onChange={(e) => setSelectedCluster(e.target.value)}
              className="h-9 rounded-lg border border-zinc-200 bg-white pl-3 pr-8 text-xs font-semibold text-zinc-800 shadow-sm focus:border-brand focus:outline-none dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200"
            >
              <option value="news">News</option>
              <option value="bisnis">Bisnis</option>
              <option value="oto">Otomotif</option>
              <option value="mom">Mom</option>
              <option value="hits">Hits</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. 6 Analytical Tabs (Figma List-tab 349:18834) */}
      <div className="overflow-x-auto no-scrollbar border-b border-zinc-200/80 dark:border-white/10">
        <div className="flex min-w-max items-center gap-6">
          {OVERVIEW_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative pb-3 pt-1 text-xs sm:text-sm font-semibold transition-colors",
                  isActive
                    ? "text-brand-strong dark:text-brand"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-strong dark:bg-brand" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Tab Views */}
      {activeTab === "executive-summary" && (
        <div className="space-y-6">
          {/* Executive Summary Media Sosial */}
          <SocialExecutiveSummary />

          {/* Topic Recommendation Section */}
          <TopicRecommendationSection
            onMakeContent={handleMakeContent}
            loadingRank={loadingRank}
          />

          {/* Key Takeaways Section (Highlights, Lowlights, Actions) */}
          <KeyTakeawaysSection />

          {/* Impression per Konten Table */}
          <ChannelPerformanceTable
            title="Impression per konten"
            metricHeader="Rata-rata Impression"
            description="Insight utama dari performa media sosial cluster news"
            data={IMPRESSION_PER_CONTENT_DATA}
          />

          {/* Engagement per Konten Table */}
          <ChannelPerformanceTable
            title="Engagement per konten"
            metricHeader="Rata-rata Engagement"
            description="Insight utama dari performa media sosial cluster news"
            data={ENGAGEMENT_PER_CONTENT_DATA}
          />
        </div>
      )}

      {activeTab === "data-platform" && <DataPlatformTab />}

      {activeTab === "content-type" && <ContentTypeTab />}

      {activeTab === "publishing-time" && <PublishingTimeTab />}

      {activeTab === "building-block" && <BuildingBlockTab />}

      {activeTab === "content-highlight" && <ContentHighlightTab />}

      {/* Footer text note across all views */}
      <div className="pt-2 text-xs text-zinc-400 dark:text-zinc-500">
        Sumber: data mart internal (D-1) · data ilustrasi
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { OverviewDashboard } from "@/components/overview/overview-dashboard";

export const metadata: Metadata = {
  title: "Overview — Ringkasan Performa",
  description: "Pantau performa konten, topik rekomendasi, dan metrik kunci di seluruh channel.",
};

export default function OverviewPage() {
  return <OverviewDashboard />;
}

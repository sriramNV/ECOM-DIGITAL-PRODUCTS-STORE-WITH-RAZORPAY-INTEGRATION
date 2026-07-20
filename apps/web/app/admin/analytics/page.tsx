"use client";

import { AnalyticsOverview } from "@/components/admin/analytics/analytics-overview";
import { RevenueChart } from "@/components/admin/analytics/revenue-chart";
import { ConversionFunnel } from "@/components/admin/analytics/conversion-funnel";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
      <AnalyticsOverview />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <ConversionFunnel />
      </div>
    </div>
  );
}

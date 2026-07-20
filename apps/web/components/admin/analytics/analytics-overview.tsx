"use client";

import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/admin/dashboard/stat-card";
import { formatCurrency } from "@/lib/utils";

export function AnalyticsOverview() {
  const { data } = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => fetch("/api/analytics/overview").then((r) => r.json()),
    staleTime: 120_000,
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard label="Total Revenue" value={data?.totalRevenue ? formatCurrency(data.totalRevenue) : "₹0"} />
      <StatCard label="Month Revenue" value={data?.monthRevenue ? formatCurrency(data.monthRevenue) : "₹0"} />
      <StatCard label="Total Orders" value={data?.totalOrders ?? 0} />
      <StatCard label="Avg Order Value" value={data?.aov ? formatCurrency(data.aov) : "₹0"} />
      <StatCard label="Total Customers" value={data?.totalCustomers ?? 0} />
      <StatCard label="Total Products" value={data?.totalProducts ?? 0} />
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/admin/dashboard/stat-card";
import { RecentOrders } from "@/components/admin/dashboard/recent-orders";

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetch("/api/admin/stats").then(r => r.json()),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={data?.totalOrders ?? 0} />
        <StatCard label="Today's Orders" value={data?.todayOrders ?? 0} />
        <StatCard label="Total Revenue" value={data?.totalRevenue ? `₹${data.totalRevenue.toLocaleString("en-IN")}` : "₹0"} />
        <StatCard label="Today's Revenue" value={data?.todayRevenue ? `₹${data.todayRevenue.toLocaleString("en-IN")}` : "₹0"} />
        <StatCard label="Total Customers" value={data?.totalCustomers ?? 0} />
      </div>
      <RecentOrders />
    </div>
  );
}

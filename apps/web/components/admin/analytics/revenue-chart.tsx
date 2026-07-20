"use client";

import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function RevenueChart() {
  const { data } = useQuery({
    queryKey: ["analytics", "revenue"],
    queryFn: () => fetch("/api/analytics/revenue?days=30").then((r) => r.json()),
    staleTime: 120_000,
  });

  if (!data) {
    return <div className="h-64 bg-surface rounded animate-pulse" />;
  }

  return (
    <div className="bg-surface-raised border border-border rounded-lg p-6">
      <h3 className="text-sm font-medium text-foreground mb-4">Revenue (30 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--fg-muted)" />
          <YAxis tick={{ fontSize: 12 }} stroke="var(--fg-muted)" />
          <Tooltip />
          <Line type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

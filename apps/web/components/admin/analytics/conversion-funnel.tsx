"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function ConversionFunnel() {
  const { data } = useQuery({
    queryKey: ["analytics", "conversion-funnel"],
    queryFn: () => fetch("/api/analytics/conversion-funnel").then((r) => r.json()),
    staleTime: 120_000,
  });

  if (!data) {
    return <div className="h-64 bg-surface rounded animate-pulse" />;
  }

  return (
    <div className="bg-surface-raised border border-border rounded-lg p-6">
      <h3 className="text-sm font-medium text-foreground mb-4">Conversion Funnel</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="stage" tick={{ fontSize: 12 }} stroke="var(--fg-muted)" />
          <YAxis tick={{ fontSize: 12 }} stroke="var(--fg-muted)" />
          <Tooltip />
          <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

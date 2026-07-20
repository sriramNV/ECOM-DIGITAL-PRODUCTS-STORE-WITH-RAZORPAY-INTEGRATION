"use client";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/admin/orders/order-status-badge";

export function RecentOrders() {
  const { data } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: () => fetch("/api/admin/orders?limit=5").then(r => r.json()),
  });
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">Recent Orders</h2>
      <DataTable
        columns={[
          { header: "Order", accessorKey: "orderNumber" },
          { header: "Customer", accessorKey: "customerName" },
          { header: "Total", accessorKey: "totalAmount", cell: (v: number) => formatCurrency(v) },
          { header: "Status", accessorKey: "status", cell: (v: string) => <OrderStatusBadge status={v} /> },
          { header: "Date", accessorKey: "createdAt", cell: (v: string) => formatDate(v) },
        ]}
        data={data?.items ?? []}
      />
    </div>
  );
}

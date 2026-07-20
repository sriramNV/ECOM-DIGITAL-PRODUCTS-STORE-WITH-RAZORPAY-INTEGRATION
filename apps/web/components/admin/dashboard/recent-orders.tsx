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
    <div className="rounded-xl border border-border bg-surface-raised p-5">
      <h2 className="text-base font-semibold text-foreground mb-4">Recent Orders</h2>
      <DataTable
        columns={[
          { header: "Order", accessorKey: "orderNumber" },
          { header: "Customer", accessorKey: "customerName" },
          { header: "Total", accessorKey: "totalAmount", cell: (v: unknown) => formatCurrency(v as number) },
          { header: "Status", accessorKey: "status", cell: (v: unknown) => <OrderStatusBadge status={v as string} /> },
          { header: "Date", accessorKey: "createdAt", cell: (v: unknown) => formatDate(v as string) },
        ]}
        data={data?.items ?? []}
      />
    </div>
  );
}

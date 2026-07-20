# Task 6.2: Create admin dashboard with stats API

**Plan:** Plan 06 lines 209-256
**Files:**
- `apps/web/app/api/admin/stats/route.ts`
- `apps/web/app/admin/dashboard/page.tsx`
- `apps/web/components/admin/dashboard/stat-card.tsx`
- `apps/web/components/admin/dashboard/recent-orders.tsx`

Full code in plan for the stats API route.

For components:
- **stat-card.tsx:**
```typescript
type Props = { label: string; value: string | number; trend?: string };
export function StatCard({ label, value, trend }: Props) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-sm text-foreground-muted">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      {trend && <p className="text-xs text-success mt-1">{trend}</p>}
    </div>
  );
}
```

- **recent-orders.tsx:**
```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/admin/orders/order-status-badge";

export function RecentOrders() {
  const { data } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: () => fetch("/api/admin/orders?limit=5&status=PAID").then(r => r.json()),
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
```

Note: `OrderStatusBadge` is created in Task 6.3. The import will resolve after that task. This is fine.

- **dashboard/page.tsx:** Create a client component "use client" that fetches /api/admin/stats and renders 4 StatCards + RecentOrders.

Commit:
```bash
git add apps/web/app/api/admin/stats apps/web/app/admin/dashboard apps/web/components/admin/dashboard
git commit -m "feat: add admin dashboard with stats API and KPI cards"
```

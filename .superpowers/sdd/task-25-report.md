# Task 6.2 Report: Admin dashboard with stats API

**Commit:** `7233a1c` - feat: add admin dashboard with stats API and KPI cards

## Files created

| File | Purpose |
|------|---------|
| `apps/web/app/api/admin/stats/route.ts` | GET endpoint returning totalOrders, todayOrders, totalRevenue, todayRevenue, totalCustomers via Prisma aggregate queries |
| `apps/web/app/admin/dashboard/page.tsx` | Client component fetching `/api/admin/stats` with TanStack Query, rendering 5 StatCards + RecentOrders |
| `apps/web/components/admin/dashboard/stat-card.tsx` | Reusable KPI card with label, value, optional trend indicator |
| `apps/web/components/admin/dashboard/recent-orders.tsx` | Client component fetching recent paid orders via `/api/admin/orders`, rendered in a DataTable |

## Notes

- `recent-orders.tsx` imports `OrderStatusBadge` from `@/components/admin/orders/order-status-badge` — that component will be created in Task 6.3. Import will resolve after that task.
- Dashboard page shows 5 stat cards (total/today orders, total/today revenue, total customers).
- Stats route uses `Promise.all` for parallel Prisma queries.
- Revenue formatting uses `en-IN` locale for Indian numbering.

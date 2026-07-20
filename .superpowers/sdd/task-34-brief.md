# Task 8.2: Create analytics dashboard UI

**Plan:** Plan 08 lines 156-211
**Files:**
- `apps/web/components/admin/analytics/revenue-chart.tsx`
- `apps/web/components/admin/analytics/conversion-funnel.tsx`
- `apps/web/components/admin/analytics/analytics-overview.tsx`
- `apps/web/app/admin/analytics/page.tsx`

Full code for revenue-chart.tsx in plan lines 172-203.

For conversion-funnel.tsx: Create a client component with BarChart from Recharts showing funnel stages (visitors → productsViewed → addedToCart → checkoutStarted → paid).

For analytics-overview.tsx: Client component fetching /api/analytics/overview with StatCards for totalRevenue, monthRevenue, totalOrders, aov, totalCustomers, totalProducts.

For analytics/page.tsx: Render AnalyticsOverview + RevenueChart + ConversionFunnel in a grid.

All components use @tanstack/react-query with staleTime: 120_000 (cached 2 min).

Commit:
```bash
git add apps/web/components/admin/analytics apps/web/app/admin/analytics
git commit -m "feat: add analytics dashboard with Recharts"
```

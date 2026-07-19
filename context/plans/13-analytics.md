# Phase 6a — Analytics Dashboard

## Objective

Build the analytics dashboard showing key business metrics — revenue, orders, conversion, margins, customer cohorts — with interactive charts and data tables. Integrate PostHog for event tracking and product analytics.

---

## System Design

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Dashboard                                                     [Date ▼] │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│ │ Revenue   │ │ Orders   │ │  AOV     │ │ Conversion│                   │
│ │ ₹45,299  │ │ 128      │ │ ₹354     │ │ 3.2%     │                   │
│ │ ↑12% mo  │ │ ↑8% mo   │ │ ↑3% mo   │ │ ↓0.5% mo │                   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────┐       │
│ │ Revenue Over Time                                      [📈] │       │
│ │  ┌───────────────────────────────────────────────┐         │       │
│ │  │  ▁▃▅▇▆▅▇▆▅▇█▆▅▇▆▅▇█▇▆▅▇▆▅▇▆▅▇                │         │       │
│ │  │  ├─────┬─────┬─────┬─────┬─────┬─────┤        │         │       │
│ │  │  Jul 1  Jul 5  Jul 10 Jul 15 Jul 20 Jul 25   │         │       │
│ │  └───────────────────────────────────────────────┘         │       │
│ └─────────────────────────────────────────────────────────────┘       │
│                                                                         │
│ ┌──────────────────────────┐ ┌──────────────────────────────────────┐  │
│ │ Top Products             │ │ Conversion Funnel                    │  │
│ │ ────────────             │ │ ──────────────────                   │  │
│ │ 1. Classic Tee   ₹12K   │ │ Product View: 10,000 ━━━━━━━━━━━━━  │  │
│ │ 2. Premium Mug   ₹8K    │ │ Add to Cart:  1,200 ━━━━              │  │
│ │ 3. Canvas Poster ₹5K    │ │ Checkout:       600 ━━                │  │
│ │ 4. Hoodie        ₹3K    │ │ Payment:        480 ━                 │  │
│ │ 5. Phone Case    ₹2K    │ │                                        │  │
│ └──────────────────────────┘ └──────────────────────────────────────┘  │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────┐       │
│ │ Margin Analysis                                            │       │
│ │ Product │ Printify Cost │ Selling Price │ Margin │ %        │       │
│ │ ────────┼───────────────┼───────────────┼────────┼─────────│       │
│ │ Tee     │ ₹350          │ ₹699          │ ₹349   │ 49.9%   │       │
│ │ Mug     │ ₹250          │ ₹499          │ ₹249   │ 49.9%   │       │
│ │ Poster  │ ₹150          │ ₹299          │ ₹149   │ 49.8%   │       │
│ └─────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Analytics Service

```typescript
// lib/services/analytics-service.ts
export const analyticsService = {
  async getRevenue(dateRange: { start: Date; end: Date }, granularity: "day" | "week" | "month") {
    // Aggregate order totals by time period
    // Return time series data for charts
  },

  async getTopProducts(dateRange: { start: Date; end: Date }, limit = 10) {
    // Join OrderItem with Product, aggregate revenue + quantity
  },

  async getConversionFunnel(dateRange: { start: Date; end: Date }) {
    // Count: product views → add to cart → checkout → payment
    // Source: PostHog events for views/carts, DB for checkout/payment
  },

  async getMarginAnalysis() {
    // Group by product, calculate (sellingPrice - baseCost) / sellingPrice
  },

  async getCustomerCohorts() {
    // Group customers by signup month
    // Track cumulative revenue/orders per cohort
  },

  async getOrderStats(dateRange: { start: Date; end: Date }) {
    // Total orders, by status, average value, etc.
  },

  async getDashboardSummary(dateRange: { start: Date; end: Date }) {
    // Aggregate all stats for the KPI cards
    return {
      revenue: { total, change },
      orders: { total, change },
      aov: { value, change },
      conversion: { rate, change },
    };
  },
};
```

### Analytics API Routes

```
GET /api/admin/analytics/summary?start=2026-07-01&end=2026-07-19   → KPI cards
GET /api/admin/analytics/revenue?start=...&end=...&by=day           → Revenue chart data
GET /api/admin/analytics/products?start=...&end=...&limit=10       → Top products
GET /api/admin/analytics/funnel?start=...&end=...                  → Conversion funnel
GET /api/admin/analytics/margins                                   → Margin analysis
GET /api/admin/analytics/cohorts                                   → Cohort table
```

### Analytics Repository

```typescript
// lib/repositories/analytics-repo.ts
export const analyticsRepo = {
  revenueByDay(start: Date, end: Date) {
    return prisma.$queryRaw`
      SELECT DATE(created_at) as date,
             SUM(total_amount) as revenue,
             COUNT(*) as orders
      FROM orders
      WHERE status IN ('PAID', 'PROCESSING', 'PRINTING', 'SHIPPED', 'DELIVERED')
        AND created_at >= ${start}
        AND created_at <= ${end}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;
  },

  topProducts(start: Date, end: Date, limit: number) {
    return prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { totalPrice: true, quantity: true },
      where: { order: { createdAt: { gte: start, lte: end }, status: { not: "CANCELLED" } } },
      orderBy: { _sum: { totalPrice: "desc" } },
      take: limit,
    });
  },
};
```

### PostHog Event Tracking

```typescript
// Track key business events via PostHog
// lib/analytics.ts (server-side)
posthogServer.capture({
  distinctId: user.id,
  event: "order_completed",
  properties: {
    orderId: order.id,
    totalAmount: order.totalAmount,
    itemCount: order.items.length,
    couponCode: order.coupon?.code,
    paymentMethod: "razorpay",
  },
});

// Frontend events (via posthog-js)
// In add-to-cart-button.tsx
posthog.capture("product_added_to_cart", {
  productId: product.id,
  variantId: variant.id,
  price,
  quantity,
});
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Chart library | Recharts | React-native, composable, good default styling |
| Data source | PostgreSQL for orders, PostHog for events | Orders are source of truth for revenue; PostHog for funnels |
| Date range picker | Predefined: 7d, 30d, 90d, 1y, custom | Covers common analysis periods |
| Margin calculation | (sellPrice - printifyCost) / sellPrice | Net of Printify production cost (excl. platform fees) |
| Refresh interval | On page load + manual refresh | Real-time not needed; dashboard is for planning |
| CSV export | Future feature | Add when users request it |

---

## Steps

1. Create `lib/repositories/analytics-repo.ts` (aggregation queries)
2. Create `lib/services/analytics-service.ts` (business logic)
3. Create `app/api/admin/analytics/summary/route.ts`
4. Create `app/api/admin/analytics/revenue/route.ts`
5. Create `app/api/admin/analytics/products/route.ts`
6. Create `app/api/admin/analytics/funnel/route.ts`
7. Create `app/api/admin/analytics/margins/route.ts`
8. Create `app/api/admin/analytics/cohorts/route.ts`
9. Create `components/admin/dashboard/stat-card.tsx`
10. Create `components/admin/analytics/revenue-chart.tsx`
11. Create `components/admin/analytics/conversion-funnel.tsx`
12. Create `components/admin/analytics/margin-analysis.tsx`
13. Create `components/admin/analytics/cohort-table.tsx`
14. Create `app/admin/dashboard/page.tsx` (compose dashboard)
15. Create `app/admin/analytics/page.tsx` (full analytics page)
16. Configure PostHog event capture in key user flows
17. Verify: dashboard shows real data, charts render, filters work

---

## Files Created

| File | Content |
|------|---------|
| `lib/repositories/analytics-repo.ts` | Aggregation queries |
| `lib/services/analytics-service.ts` | Analytics business logic |
| `app/api/admin/analytics/summary/route.ts` | KPI data |
| `app/api/admin/analytics/revenue/route.ts` | Revenue time series |
| `app/api/admin/analytics/products/route.ts` | Top products |
| `app/api/admin/analytics/funnel/route.ts` | Funnel data |
| `app/api/admin/analytics/margins/route.ts` | Margin data |
| `app/api/admin/analytics/cohorts/route.ts` | Cohort data |
| `components/admin/dashboard/stat-card.tsx` | KPI card |
| `components/admin/analytics/revenue-chart.tsx` | Revenue line chart |
| `components/admin/analytics/conversion-funnel.tsx` | Funnel visualization |
| `components/admin/analytics/margin-analysis.tsx` | Margin table |
| `components/admin/analytics/cohort-table.tsx` | Cohort table |
| `app/admin/dashboard/page.tsx` | Dashboard page |
| `app/admin/analytics/page.tsx` | Full analytics page |

# Plan 08: Analytics & Operations

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use `- [ ]` syntax.

**Goal:** Build analytics dashboards (Recharts), audit logging, webhook log viewer, admin settings, and health monitoring

**Architecture:** Server-side aggregation queries via Prisma for business metrics. Recharts for frontend charts. PostHog for event tracking (page views, product views, checkout events). Pino structured logs shipped to Loki.

**Tech Stack:** Recharts, PostHog, Pino, Prisma, TanStack Query

---

## Global Constraints

- Analytics data aggregated server-side — no raw DB queries from client
- PostHog events: page_viewed, product_viewed, product_added_to_cart, checkout_started, payment_completed
- AuditLog records every admin action
- TanStack Query stale time for analytics: 120s
- Admin settings stored in environment variables (never in DB)

---

## File Structure

```
apps/web/
├── app/api/
│   ├── analytics/
│   │   ├── overview/route.ts
│   │   ├── revenue/route.ts
│   │   ├── funnel/route.ts
│   │   └── margin/route.ts
│   ├── admin/
│   │   └── settings/route.ts
│   └── logs/
│       ├── audit/route.ts
│       └── webhooks/route.ts
├── app/admin/
│   ├── analytics/page.tsx
│   ├── logs/page.tsx
│   └── settings/page.tsx
├── components/admin/
│   ├── analytics/
│   │   ├── analytics-overview.tsx
│   │   ├── revenue-chart.tsx
│   │   ├── conversion-funnel.tsx
│   │   ├── margin-analysis.tsx
│   │   └── cohort-table.tsx
│   └── logs/
│       ├── audit-log-viewer.tsx
│       └── webhook-log-viewer.tsx
├── lib/
│   ├── analytics.ts               # PostHog server client
│   ├── services/
│   │   └── analytics-service.ts   # Aggregation queries
│   └── repositories/
│       └── analytics-repo.ts
└── providers/
    └── posthog-provider.tsx       # PostHog client provider
```

---

### Task 8.1: Create analytics repository and API

**Files:**
- Create: `apps/web/lib/repositories/analytics-repo.ts`
- Create: `apps/web/lib/services/analytics-service.ts`
- Create: `apps/web/app/api/analytics/overview/route.ts`
- Create: `apps/web/app/api/analytics/revenue/route.ts`
- Create: `apps/web/app/api/analytics/funnel/route.ts`

**Interfaces:**
- Consumes: `prisma` aggregate queries
- Produces: analytics data endpoints for charts

- [ ] **Step 1: Create analytics-repo.ts**

```typescript
import { prisma } from "@/lib/prisma";

export const analyticsRepo = {
  async getOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalRevenue, todayRevenue, monthRevenue, totalOrders, todayOrders, totalCustomers, totalProducts] =
      await Promise.all([
        prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: { in: ["PAID", "PROCESSING", "PRINTING", "SHIPPED", "DELIVERED"] } } }),
        prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: startOfDay }, status: { not: "PENDING_PAYMENT" } } }),
        prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: startOfMonth }, status: { not: "PENDING_PAYMENT" } } }),
        prisma.order.count({ where: { status: { not: "PENDING_PAYMENT" } } }),
        prisma.order.count({ where: { createdAt: { gte: startOfDay }, status: { not: "PENDING_PAYMENT" } } }),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.product.count({ where: { isActive: true } }),
      ]);

    return {
      totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
      todayRevenue: Number(todayRevenue._sum.totalAmount ?? 0),
      monthRevenue: Number(monthRevenue._sum.totalAmount ?? 0),
      totalOrders,
      todayOrders,
      totalCustomers,
      totalProducts,
      aov: totalOrders > 0 ? Math.round(Number(totalRevenue._sum.totalAmount ?? 0) / totalOrders) : 0,
    };
  },

  async getRevenueHistory(days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { not: "PENDING_PAYMENT" } },
      select: { totalAmount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Group by date
    const dailyMap = new Map<string, number>();
    for (const order of orders) {
      const date = order.createdAt.toISOString().slice(0, 10);
      dailyMap.set(date, (dailyMap.get(date) ?? 0) + Number(order.totalAmount));
    }

    return Array.from(dailyMap.entries()).map(([date, revenue]) => ({ date, revenue }));
  },

  async getFunnel() {
    const totalVisitors = 0; // From PostHog
    const totalProducts = await prisma.product.count({ where: { isActive: true } });
    const addedToCart = await prisma.cartItem.groupBy({ by: ["cartId"], _count: true });
    const checkoutStarted = await prisma.order.count({ where: { status: { not: "PENDING_PAYMENT" } } });
    const paid = await prisma.payment.count({ where: { status: "COMPLETED" } });

    return {
      visitors: totalVisitors,
      productsViewed: totalProducts,
      addedToCart: addedToCart.length,
      checkoutStarted,
      paid,
    };
  },
};
```

- [ ] **Step 2: Create analytics API routes. Commit.**

```bash
git add apps/web/lib/repositories/analytics-repo.ts apps/web/app/api/analytics
git commit -m "feat: add analytics repository and API endpoints"
```

---

### Task 8.2: Create analytics dashboard UI

**Files:**
- Create: `apps/web/components/admin/analytics/revenue-chart.tsx`
- Create: `apps/web/components/admin/analytics/conversion-funnel.tsx`
- Create: `apps/web/components/admin/analytics/analytics-overview.tsx`
- Create: `apps/web/app/admin/analytics/page.tsx`

**Interfaces:**
- Consumes: analytics API from Task 8.1
- Produces: charts and KPI dashboard

- [ ] **Step 1: Create apps/web/components/admin/analytics/revenue-chart.tsx**

```typescript
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
```

- [ ] **Step 2: Create funnel, overview components. Commit.**

```bash
git add apps/web/components/admin/analytics apps/web/app/admin/analytics
git commit -m "feat: add analytics dashboard with Recharts"
```

---

### Task 8.3: Set up PostHog analytics

**Files:**
- Create: `apps/web/lib/analytics.ts`
- Create: `apps/web/providers/posthog-provider.tsx`
- Modify: `apps/web/app/layout.tsx` (wrap with PostHogProvider)

**Interfaces:**
- Consumes: PostHog API key env vars
- Produces: automatic page views + custom event tracking

- [ ] **Step 1: Create apps/web/lib/analytics.ts**

```typescript
import { PostHog } from "posthog-node";

export const posthogServer = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
  { host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com" },
);
```

- [ ] **Step 2: Create PostHog provider and wire into layout. Commit.**

```bash
git add apps/web/lib/analytics.ts apps/web/providers/posthog-provider.tsx
git commit -m "feat: add PostHog analytics integration"
```

---

### Task 8.4: Create audit log and settings pages

**Files:**
- Create: `apps/web/app/api/logs/audit/route.ts`
- Create: `apps/web/app/api/admin/settings/route.ts`
- Create: `apps/web/app/admin/logs/page.tsx`
- Create: `apps/web/app/admin/settings/page.tsx`
- Create: `apps/web/components/admin/logs/audit-log-viewer.tsx`

**Interfaces:**
- Consumes: `prisma` AuditLog model
- Produces: searchable audit log and settings page

- [ ] **Step 1: Create audit log API. Commit.**

```bash
git add apps/web/app/api/logs apps/web/app/api/admin/settings apps/web/app/admin/logs apps/web/app/admin/settings apps/web/components/admin/logs
git commit -m "feat: add audit log viewer and admin settings pages"
```

---

## Spec Coverage Check

| Requirement | Task |
|-------------|------|
| Overview KPI cards (revenue, orders, AOV, conversion) | 8.1 |
| Revenue line chart (daily/weekly/monthly) | 8.2 |
| Conversion funnel (view→cart→checkout→payment) | 8.1 |
| Per-product margin analysis | 8.1 |
| PostHog event tracking | 8.3 |
| Audit log viewer with search/filter | 8.4 |
| Admin settings page | 8.4 |
| TanStack Query caching (120s stale) | 8.2 |

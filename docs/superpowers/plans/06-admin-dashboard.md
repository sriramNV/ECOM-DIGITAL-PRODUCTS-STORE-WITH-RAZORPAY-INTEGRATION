# Plan 06: Admin Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use `- [ ]` syntax.

**Goal:** Build the admin dashboard shell and order/product/customer management interfaces

**Architecture:** Dark sidebar + topbar layout with responsive collapse. Data tables with sorting/filtering/pagination for orders, products, and customers. TanStack Query for server state. shadcn/ui DataTable component for consistent table UX.

**Tech Stack:** TanStack Query, shadcn/ui (DataTable, Dialog), Recharts, lucide-react

---

## Global Constraints

- Admin routes protected by middleware (Plan 02) — only ADMIN role
- Sidebar: dark background (`bg-surface-inverse`), active item highlighted, collapsed on mobile
- Every admin action audited via AuditLog
- DataTable: sortable columns, search/filter, pagination, row selection
- Admin is a single merchant — no multi-tenant

---

## File Structure

```
apps/web/
├── app/admin/
│   ├── layout.tsx                  # Admin shell layout
│   ├── page.tsx                    # Redirect to /admin/dashboard
│   ├── dashboard/page.tsx          # Analytics overview
│   ├── orders/
│   │   ├── page.tsx                # Order list (data table)
│   │   └── [id]/page.tsx           # Order detail + actions
│   ├── products/
│   │   ├── page.tsx                # Product list
│   │   ├── new/page.tsx            # Create product
│   │   └── [id]/page.tsx           # Edit product
│   └── customers/
│       ├── page.tsx                # Customer list
│       └── [id]/page.tsx           # Customer detail
├── components/admin/
│   ├── layout/
│   │   ├── admin-shell.tsx         # Shell wrapper
│   │   ├── sidebar.tsx             # Navigation
│   │   ├── topbar.tsx              # Top bar
│   │   └── nav-items.ts            # Nav item config
│   ├── dashboard/
│   │   ├── stat-card.tsx
│   │   ├── revenue-chart.tsx
│   │   ├── recent-orders.tsx
│   │   └── top-products.tsx
│   ├── orders/
│   │   ├── order-table.tsx
│   │   ├── order-detail.tsx
│   │   ├── order-status-badge.tsx
│   │   └── order-actions.tsx
│   ├── products/
│   │   ├── product-table.tsx
│   │   ├── product-form.tsx
│   │   ├── variant-manager.tsx
│   │   └── blueprint-browser.tsx
│   ├── crm/
│   │   ├── customer-table.tsx
│   │   ├── customer-detail.tsx
│   │   └── customer-notes.tsx
│   └── shared/
│       ├── page-header.tsx
│       └── status-badge.tsx
```

---

### Task 6.1: Create admin shell layout

**Files:**
- Create: `apps/web/components/admin/layout/admin-shell.tsx`
- Create: `apps/web/components/admin/layout/sidebar.tsx`
- Create: `apps/web/components/admin/layout/topbar.tsx`
- Create: `apps/web/components/admin/layout/nav-items.ts`
- Create: `apps/web/app/admin/layout.tsx`
- Create: `apps/web/app/admin/page.tsx`

**Interfaces:**
- Consumes: `auth()` from Plan 02 for user info
- Produces: navigable admin shell with sidebar + topbar

- [ ] **Step 1: Create apps/web/components/admin/layout/nav-items.ts**

```typescript
import {
  LayoutDashboard, ShoppingBag, Tags, Users, FileText, Percent,
  BarChart3, ClipboardList, Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Products", href: "/admin/products", icon: Tags },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Content", href: "/admin/cms", icon: FileText },
  { label: "Promotions", href: "/admin/promotions", icon: Percent },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Logs", href: "/admin/logs", icon: ClipboardList },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];
```

- [ ] **Step 2: Create apps/web/components/admin/layout/sidebar.tsx**

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block bg-surface-inverse text-foreground-inverse">
      <div className="p-4">
        <Link href="/admin/dashboard" className="text-lg font-bold block mb-6">
          POD Store
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white/80",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Create apps/web/components/admin/layout/admin-shell.tsx**

```typescript
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create apps/web/app/admin/layout.tsx**

```typescript
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/layout/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  return <AdminShell>{children}</AdminShell>;
}
```

- [ ] **Step 5: Create apps/web/app/admin/page.tsx**

```typescript
import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect("/admin/dashboard");
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/admin/layout apps/web/app/admin/layout.tsx apps/web/app/admin/page.tsx
git commit -m "feat: add admin shell with sidebar navigation"
```

---

### Task 6.2: Create admin stats API and dashboard page

**Files:**
- Create: `apps/web/app/api/admin/stats/route.ts`
- Create: `apps/web/app/admin/dashboard/page.tsx`
- Create: `apps/web/components/admin/dashboard/stat-card.tsx`
- Create: `apps/web/components/admin/dashboard/recent-orders.tsx`

**Interfaces:**
- Consumes: `prisma` aggregate queries, `orderRepo`
- Produces: dashboard with KPI cards and recent orders

- [ ] **Step 1: Create apps/web/app/api/admin/stats/route.ts**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalOrders, todayOrders, totalRevenue, todayRevenue, totalCustomers] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);

  return NextResponse.json({
    totalOrders,
    todayOrders,
    totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
    todayRevenue: Number(todayRevenue._sum.totalAmount ?? 0),
    totalCustomers,
  });
}
```

- [ ] **Step 2: Create stat-card.tsx and dashboard page. Commit.**

```bash
git add apps/web/app/api/admin/stats apps/web/app/admin/dashboard apps/web/components/admin/dashboard
git commit -m "feat: add admin dashboard with stats API and KPI cards"
```

---

### Task 6.3: Create order management pages

**Files:**
- Create: `apps/web/app/admin/orders/page.tsx`
- Create: `apps/web/app/admin/orders/[id]/page.tsx`
- Create: `apps/web/components/admin/orders/order-table.tsx`
- Create: `apps/web/components/admin/orders/order-detail.tsx`
- Create: `apps/web/components/admin/orders/order-status-badge.tsx`
- Create: `apps/web/components/admin/orders/order-actions.tsx`

**Interfaces:**
- Consumes: `orderRepo.list()` and `orderRepo.getById()` from Plan 04
- Produces: searchable/filterable order list and detail with action buttons

- [ ] **Step 1: Create order management components and pages**

Key components:

```typescript
// components/admin/orders/order-status-badge.tsx
type Props = { status: string };

const statusStyles: Record<string, string> = {
  PAID: "bg-success-background text-success",
  PROCESSING: "bg-warning-background text-warning",
  PRINTING: "bg-info-background text-info",
  SHIPPED: "bg-success-background text-success",
  DELIVERED: "bg-success-background text-success",
  CANCELLED: "bg-error-background text-error",
  REFUNDED: "bg-error-background text-error",
  PENDING_PAYMENT: "bg-surface text-foreground-muted",
};

export function OrderStatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status] ?? "bg-surface text-foreground-muted"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
```

```typescript
// components/admin/orders/order-actions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Props = {
  orderId: string;
  status: string;
};

export function OrderActions({ orderId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(action: string) {
    setLoading(action);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {status === "PAID" && (
        <Button size="sm" onClick={() => handleAction("submit_to_printify")} disabled={loading !== null}>
          Submit to Printify
        </Button>
      )}
      {["PAID", "PROCESSING", "PRINTING"].includes(status) && (
        <Button size="sm" variant="destructive" onClick={() => handleAction("cancel")} disabled={loading !== null}>
          Cancel
        </Button>
      )}
      {status === "SHIPPED" && (
        <Button size="sm" onClick={() => handleAction("mark_delivered")} disabled={loading !== null}>
          Mark Delivered
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create order pages. Commit.**

```bash
git add apps/web/app/admin/orders apps/web/components/admin/orders
git commit -m "feat: add order management pages with actions"
```

---

### Task 6.4: Create product management pages

**Files:**
- Create: `apps/web/app/admin/products/page.tsx`
- Create: `apps/web/app/admin/products/new/page.tsx`
- Create: `apps/web/app/admin/products/[id]/page.tsx`
- Create: `apps/web/components/admin/products/product-table.tsx`
- Create: `apps/web/components/admin/products/product-form.tsx`
- Create: `apps/web/components/admin/products/variant-manager.tsx`

**Interfaces:**
- Consumes: `productRepo` from Plan 03, `printifyProducts`, `printifyCatalog` from Plan 05
- Produces: product CRUD pages with Printify blueprint integration

- [ ] **Step 1: Create product-table.tsx**

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";

export function ProductTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => fetch("/api/products?limit=100").then((r) => r.json()),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <Link href="/admin/products/new">
          <Button>+ New Product</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-surface rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={[
            { header: "Title", accessorKey: "title" },
            { header: "Price", accessorKey: "basePrice", cell: (v: number) => formatCurrency(v) },
            { header: "Status", accessorKey: "isActive", cell: (v: boolean) => v ? "Active" : "Draft" },
            { header: "Created", accessorKey: "createdAt", cell: (v: string) => formatDate(v) },
          ]}
          data={data?.items ?? []}
          onRowClick={(row: { slug: string }) => `/admin/products/${row.slug}`}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create product form, variant manager. Commit.**

```bash
git add apps/web/app/admin/products apps/web/components/admin/products
git commit -m "feat: add product management pages with Printify integration"
```

---

### Task 6.5: Create customer CRM pages

**Files:**
- Create: `apps/web/app/admin/customers/page.tsx`
- Create: `apps/web/app/admin/customers/[id]/page.tsx`
- Create: `apps/web/components/admin/crm/customer-table.tsx`
- Create: `apps/web/components/admin/crm/customer-detail.tsx`

**Interfaces:**
- Consumes: `prisma` for user queries, `orderRepo` for order history
- Produces: customer list with search and detail with order history

```typescript
// API endpoint: apps/web/app/api/admin/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      OR: search
        ? [
            { email: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
    },
    include: {
      _count: { select: { orders: true } },
      orders: { take: 1, orderBy: { createdAt: "desc" }, select: { totalAmount: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(customers);
}
```

- [ ] **Step 1: Create customer components and commit**

```bash
git add apps/web/app/admin/customers apps/web/components/admin/crm
git commit -m "feat: add customer CRM pages with order history"
```

---

## Spec Coverage Check

| Requirement | Task |
|-------------|------|
| Admin shell with sidebar + topbar | 6.1 |
| Responsive sidebar (collapsed on mobile) | 6.1 |
| Dashboard with KPI cards | 6.2 |
| Order list with datatable (sortable, filterable) | 6.3 |
| Order detail with status history | 6.3 |
| Order actions (submit to Printify, cancel) | 6.3 |
| Product list + create/edit | 6.4 |
| Variant manager | 6.4 |
| Customer list with search | 6.5 |
| Customer detail with order history | 6.5 |
| Admin navigation icons + active state | 6.1 |
| Audit logging for admin actions | 6.3 |

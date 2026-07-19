# Phase 4a — Admin Shell

## Objective

Build the layout and navigation infrastructure for the entire admin dashboard — sidebar, topbar, responsive behavior, and route scaffolding. All subsequent admin features depend on this shell.

---

## System Design

### Admin Layout

```
┌────────────────────────────────────────────────┐
│  ┌──────────┐  ┌─────────────────────────────┐ │
│  │          │  │  Topbar                     │ │
│  │          │  │  Search | Notifications | 👤│ │
│  │  Sidebar │  ├─────────────────────────────┤ │
│  │          │  │                             │ │
│  │  Nav     │  │  Content Area               │ │
│  │  Links   │  │  (Page-specific content)    │ │
│  │          │  │                             │ │
│  │          │  │                             │ │
│  │          │  │                             │ │
│  └──────────┘  └─────────────────────────────┘ │
└────────────────────────────────────────────────┘
     w-64             flex-1
```

### Navigation Items

```typescript
// components/admin/layout/nav-items.ts
export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number; // optional count (e.g., pending orders)
};

export const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag, badge: 3 },
  { label: "Products", href: "/admin/products", icon: Shirt },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Content", href: "/admin/cms/pages", icon: FileText },
  { label: "Promotions", href: "/admin/promotions", icon: Percent },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Logs", href: "/admin/logs", icon: ScrollText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];
```

---

## Architecture

### Sidebar Component

```tsx
// components/admin/layout/sidebar.tsx
"use client";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-surface-inverse text-foreground-inverse hidden lg:flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <Link href="/admin" className="text-xl font-bold text-white">
          POD Admin
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {adminNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/70 hover:bg-white/5 hover:text-white/90"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-accent text-accent-foreground text-xs rounded-full px-2 py-0.5">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <Link href="/" className="text-sm text-white/50 hover:text-white/80">
          ← Back to Store
        </Link>
      </div>
    </aside>
  );
}
```

### Topbar Component

```tsx
// components/admin/layout/topbar.tsx
"use client";

export function Topbar() {
  const { data: session } = useSession();

  return (
    <header className="h-16 bg-surface-raised border-b border-border flex items-center justify-between px-6">
      {/* Mobile menu toggle */}
      <button className="lg:hidden text-foreground-muted hover:text-foreground">
        <Menu className="w-5 h-5" />
      </button>

      {/* Search (future) */}
      <div className="flex-1 max-w-md ml-4">
        <input
          type="search"
          placeholder="Search anything..."
          className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-foreground-faint"
        />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        <button className="relative text-foreground-muted hover:text-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground text-sm font-medium">
            {session?.user?.name?.[0] ?? "A"}
          </div>
          <span className="text-sm text-foreground-muted hidden md:block">
            {session?.user?.name ?? "Admin"}
          </span>
        </div>
      </div>
    </header>
  );
}
```

### Mobile Sidebar

On mobile (< 1024px), the sidebar becomes a slide-out drawer triggered by the hamburger menu in the topbar. Same navigation, but overlaid on top of content with a backdrop.

### Admin Route Scaffold

```
app/admin/
├── layout.tsx          → AdminShell (sidebar + topbar + content)
├── page.tsx            → Redirect to /admin/dashboard
├── dashboard/page.tsx  → Dashboard (empty, wired in Phase 6)
├── orders/page.tsx     → Orders list (empty, wired in Phase 4b)
├── products/page.tsx   → Products list (empty, wired in Phase 4c)
├── customers/page.tsx  → Customers list (empty, wired in Phase 4d)
├── cms/pages/page.tsx  → CMS pages (empty, wired in Phase 5)
├── promotions/page.tsx → Promotions (empty, wired in Phase 5)
├── analytics/page.tsx  → Analytics (empty, wired in Phase 6)
├── logs/page.tsx       → Audit logs (empty, wired in Phase 6)
└── settings/page.tsx   → Settings (empty, wired in Phase 6)
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Sidebar vs header nav | Sidebar (dark) | Industry standard for admin dashboards, lots of navigation items |
| Sidebar width | 256px (w-64) | Standard width, comfortable for nav labels + icons |
| Mobile sidebar | Slide-out drawer | Preserves content space, standard pattern |
| Active state | Starts-with path matching | Sub-routes (e.g., /admin/orders/123) highlight "Orders" |
| Badges | Pending order count | At-a-glance awareness for operations |

---

## Steps

1. Create `components/admin/layout/nav-items.ts` (navigation data)
2. Create `components/admin/layout/sidebar.tsx`
3. Create `components/admin/layout/topbar.tsx`
4. Create `components/admin/layout/admin-shell.tsx` (composes sidebar + topbar + content)
5. Create `app/admin/layout.tsx` (wraps with AdminShell, checks auth)
6. Create scaffold admin pages (empty placeholders for each route)
7. Verify: navigate all sidebar links, mobile sidebar opens/closes, active state highlights

---

## Files Created

| File | Content |
|------|---------|
| `components/admin/layout/nav-items.ts` | Navigation items data |
| `components/admin/layout/sidebar.tsx` | Admin sidebar |
| `components/admin/layout/topbar.tsx` | Admin topbar |
| `components/admin/layout/admin-shell.tsx` | Admin layout wrapper |
| `app/admin/layout.tsx` | Admin route layout |
| `app/admin/page.tsx` | Redirect to dashboard |
| `app/admin/dashboard/page.tsx` | Dashboard scaffold |
| `app/admin/orders/page.tsx` | Orders scaffold |
| `app/admin/orders/[id]/page.tsx` | Order detail scaffold |
| `app/admin/products/page.tsx` | Products scaffold |
| `app/admin/products/new/page.tsx` | New product scaffold |
| `app/admin/products/[id]/page.tsx` | Edit product scaffold |
| `app/admin/customers/page.tsx` | Customers scaffold |
| `app/admin/customers/[id]/page.tsx` | Customer detail scaffold |
| `app/admin/cms/pages/page.tsx` | CMS scaffold |
| `app/admin/cms/banners/page.tsx` | Banners scaffold |
| `app/admin/cms/collections/page.tsx` | Collections scaffold |
| `app/admin/promotions/page.tsx` | Promotions scaffold |
| `app/admin/analytics/page.tsx` | Analytics scaffold |
| `app/admin/logs/page.tsx` | Logs scaffold |
| `app/admin/settings/page.tsx` | Settings scaffold |

# Component Architecture Guide

## 1. Component Architecture Overview

The project uses a layered component architecture with a clear separation of concerns:

```
components/
├── ui/             # Base primitives (shadcn/ui-style)
├── storefront/     # Customer-facing components
├── admin/          # Admin panel components
└── auth/           # Authentication components
```

**Separation principles:**
- `ui/` — framework-agnostic primitives (Button, Input, Dialog, Table, Card). These have no business logic and no API calls. They are the design system's atoms.
- `storefront/` — page sections, product displays, cart/checkout flows, CMS renderers. All customer-facing UI.
- `admin/` — CRUD interfaces, dashboards, analytics, CMS management. Staff-facing UI.
- `auth/` — login and register forms. Thin wrappers around NextAuth + UI primitives.

Each directory exports named function components (no default exports). Shared utilities (`cn`, `formatCurrency`, `formatDate`) live in `@/lib/utils`.

---

## 2. UI Base (shadcn/ui)

Base components live in `components/ui/`. They are built on top of [Base UI](https://base-ui.com/) with [class-variance-authority](https://cva.style/) for variants and Tailwind v4 for styling.

### Available Components

| Component | File | Base | Notes |
|-----------|------|------|-------|
| Button | `button.tsx` | `@base-ui/react/button` | CVA variants: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`. Sizes: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`. |
| Input | `input.tsx` | `@base-ui/react/input` | Base input with consistent border, focus ring, disabled, and dark-mode styling. |
| Badge | `badge.tsx` | `useRender` from Base UI | Variants: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`. |
| Card | `card.tsx` | Native `div` | Compound: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`. Supports `size="sm"`. |
| Dialog | `dialog.tsx` | Base UI Dialog | Compound with `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`. |
| Table | `table.tsx` | Native elements | Primitive: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`. |
| DataTable | `data-table.tsx` | Custom | Generic client component built on Table. Accepts typed columns with optional custom cell renderers and row clicks. |
| DropdownMenu | `dropdown-menu.tsx` | Base UI | Compound menu primitive. |
| Skeleton | `skeleton.tsx` | Native `div` | Loading placeholder with animate-pulse. |
| Sonner | `sonner.tsx` | `sonner` | Toast provider wrapper. |

### Conventions

**`cn()` utility** — all components use `cn()` from `@/lib/utils` for class merging. It wraps `clsx` + `tailwind-merge`:

```ts
import { cn } from "@/lib/utils"
```

**CVA variants** — components with multiple visual states use `class-variance-authority`:

```ts
const buttonVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", outline: "..." },
    size: { default: "...", sm: "..." },
  },
  defaultVariants: { variant: "default", size: "default" },
})
```

**Tailwind v4** — the project uses Tailwind v4's CSS-first configuration via `@import "tailwindcss"`. No `tailwind.config.ts`. Dark mode uses the `dark` variant. Custom tokens are defined in the main CSS file as `@theme` directives.

**Customization** — to customize a base component, pass `className` which gets merged via `cn()`. For variant overrides, wrap the component and pass different `variant` or `size` props. Do not edit base UI files for one-off changes — compose them in feature components.

---

## 3. Storefront Components

Organized by feature under `components/storefront/`. Public-facing UI.

### Layout (`layout/`)

| Component | File | Type | Notes |
|-----------|------|------|-------|
| Navbar | `navbar.tsx` | Client | Cart badge, mobile menu toggle, nav links. |
| Footer | `footer.tsx` | Server | Static footer with links. |
| MobileMenu | `mobile-menu.tsx` | Client | Slide-out mobile nav. |
| AnnouncementBar | `announcement-bar.tsx` | Server | Top-of-page banner. |

### Product (`product/`)

| Component | File | Type | Notes |
|-----------|------|------|-------|
| ProductCard | `product-card.tsx` | Server | Link wrapper with image, title, price. Used in grids. |
| ProductGrid | `product-grid.tsx` | Server | Responsive CSS grid of ProductCards. |
| ProductGallery | `product-gallery.tsx` | Client | Image carousel/lightbox for product detail. |
| VariantSelector | `variant-selector.tsx` | Client | Size/color pickers, updates selected variant. |
| AddToCartButton | `add-to-cart-button.tsx` | Client | Writes to Zustand cart store. |
| PriceDisplay | `price-display.tsx` | Server | Formats price, shows compare-at for sales. |

### Cart (`cart/`)

| Component | File | Type | Notes |
|-----------|------|------|-------|
| CartDrawer | `cart-drawer.tsx` | Client | Slide-in overlay, empty state, linked to cart store. |
| CartItemRow | `cart-item-row.tsx` | Client | Single item with qty controls. |
| CartSummary | `cart-summary.tsx` | Client | Subtotal, discount, total. |
| CouponInput | `coupon-input.tsx` | Client | Apply discount code via API. |

### Checkout (`checkout/`)

| Component | File | Type | Notes |
|-----------|------|------|-------|
| CheckoutForm | `checkout-form.tsx` | Client | Address + shipping form, controlled inputs. |
| RazorpayButton | `razorpay-button.tsx` | Client | Payment gateway integration. |

### Blocks (`blocks/`)

CMS content block renderers. Used by `CmsPage` to render dynamic page layouts.

| Component | File | Type | Notes |
|-----------|------|------|-------|
| HeroBlock | `hero-block.tsx` | Client | Full-width hero with image, heading, CTA. |
| TextBlock | `text-block.tsx` | Server | Rich text content block. |
| ProductGridBlock | `product-grid-block.tsx` | Client | Fetches products from a collection, renders grid. |
| CtaBanner | `cta-banner-block.tsx` | Server | Call-to-action banner with button. |
| NewsletterBlock | `newsletter-block.tsx` | Client | Email signup form. |

### Shared (`shared/`)

| Component | File | Type | Notes |
|-----------|------|------|-------|
| Breadcrumbs | `breadcrumbs.tsx` | Server | SEO breadcrumb nav. |
| Pagination | `pagination.tsx` | Client | Page navigation for product listings. |
| EmptyState | `empty-state.tsx` | Server | Generic empty state placeholder. |

### CMS Page Renderer

`cms-page.tsx` — a server component that takes an array of `{ type, content }` blocks and dispatches to the correct block renderer via a switch statement. The block registry is maintained here — adding a new block type requires adding a case here and a new renderer in `blocks/`.

---

## 4. Admin Components

Organized by section under `components/admin/`. All data-fetching admin components are client components using React Query.

### Layout (`layout/`)

| Component | File | Type | Notes |
|-----------|------|------|-------|
| AdminShell | `admin-shell.tsx` | Server | Page shell: Sidebar + Topbar + `<main>`. |
| Sidebar | `sidebar.tsx` | Client | Navigation menu, active state from `usePathname()`. |
| Topbar | `topbar.tsx` | Server | User info, global search, notifications. |
| NavItems | `nav-items.ts` | Module | Static nav config array with labels, hrefs, lucide icons. |

### Dashboard (`dashboard/`)

| Component | File | Type | Notes |
|-----------|------|------|-------|
| StatCard | `stat-card.tsx` | Server | Single metric card with label, value, optional trend. |
| RecentOrders | `recent-orders.tsx` | Client | Fetches from `/api/admin/orders?limit=5`, renders DataTable. |

### Products (`products/`)

| Component | File | Type | Notes |
|-----------|------|------|-------|
| ProductForm | `product-form.tsx` | Client | Create/Edit form. Uses React Query for save + invalidation. |
| ProductTable | `product-table.tsx` | Client | Lists products via DataTable, row links to edit. |
| VariantManager | `variant-manager.tsx` | Client | Inline variant CRUD within ProductForm. Controlled via `onChange`. |

### Orders (`orders/`)

| Component | File | Type | Notes |
|-----------|------|------|-------|
| OrderTable | `order-table.tsx` | Client | Orders list with status badge, row click to detail. |
| OrderDetail | `order-detail.tsx` | Client | Full order view: customer, items, payments, status history, address. Loading/error states. |
| OrderActions | `order-actions.tsx` | Client | Status transition buttons (ship, deliver, cancel). |
| OrderStatusBadge | `order-status-badge.tsx` | Server | Color-coded badge by status string. |

### CRM (`crm/`)

| Component | File | Type | Notes |
|-----------|------|------|-------|
| CustomerTable | `customer-table.tsx` | Client | Lists customers via DataTable with computed cells. |
| CustomerDetail | `customer-detail.tsx` | Client | Customer profile with order history. |
| Types | `types.ts` | Module | `Customer` and `CustomerOrder` TypeScript types. |

### CMS (`cms/`)

| Component | File | Type | Notes |
|-----------|------|------|-------|
| PageEditor | `page-editor.tsx` | Client | Full CRUD: list pages, edit dialog with metadata + block palette. Tabbed UI. |
| BlockPalette | `block-palette.tsx` | Client | Buttons to add block types to a page. |
| BannerManager | `banner-manager.tsx` | Client | CRUD for homepage/collection banners. |
| CollectionManager | `collection-manager.tsx` | Client | Manage product collections/groups. |

### Promotions (`promotions/`)

| Component | File | Type | Notes |
|-----------|------|------|-------|
| CouponForm | `coupon-form.tsx` | Client | Create/Edit discount code form. |
| CouponTable | `coupon-table.tsx` | Client | Lists coupons via DataTable. |

### Analytics (`analytics/`)

| Component | File | Type | Notes |
|-----------|------|------|-------|
| RevenueChart | `revenue-chart.tsx` | Client | Time-series revenue data (chart library). |
| ConversionFunnel | `conversion-funnel.tsx` | Client | Funnel stages (visit → cart → checkout → purchase). |
| AnalyticsOverview | `analytics-overview.tsx` | Client | Summary KPIs + chart grid. |

### Logs (`logs/`)

| Component | File | Type | Notes |
|-----------|------|------|-------|
| AuditLogViewer | `audit-log-viewer.tsx` | Client | Paginated log table with filters. |

---

## 5. State Management Patterns

The project uses a tiered approach to state:

### Server State: TanStack React Query

All data from the database is fetched via `@tanstack/react-query`. Every admin feature component follows this pattern:

```tsx
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function Widget() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["resource", id],
    queryFn: () => fetch(`/api/resource/${id}`).then(r => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (payload) =>
      fetch("/api/resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource"] });
      toast.success("Saved");
    },
    onError: () => toast.error("Failed"),
  });
}
```

**Key conventions:**
- Query key arrays are scoped: `["admin-products"]`, `["admin-order", orderId]`, `["cms-pages"]`
- Mutations always call `invalidateQueries` on success to refresh the list
- `useMutation` controls button `disabled` state via `mutation.isPending`
- Error handling per component: toast on error, `error` variable for conditional rendering

### Client State: Zustand

Global client state uses Zustand with the `persist` middleware:

```ts
// stores/cart-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => { /* ... */ },
      // ...
    }),
    { name: "pod-cart", version: 2, migrate: /* ... */ },
  ),
);
```

The cart store is the only Zustand store. It persists to `localStorage`.

### Auth State: NextAuth

Authentication state comes from `next-auth/react`:

```tsx
import { signIn, signOut, useSession } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
```

The `SessionProvider` wraps the app in the root layout. `useSession` provides user info and login status in client components. The `login-form.tsx` uses `signIn("credentials", ...)` directly rather than wrapping in a store.

### UI State: Local

Ephemeral UI state (open/close dialogs, active tabs, form input values, loading flags) uses React `useState` and `useReducer` at the component level. No global store for UI concerns.

```tsx
const [dialogOpen, setDialogOpen] = useState(false);
const [activeTab, setActiveTab] = useState<"edit" | "blocks">("edit");
```

---

## 6. Data Flow Patterns

### Server Components

Pages and layouts that do not require interactivity remain server components. They access Prisma directly:

```tsx
// app/products/page.tsx (Server Component)
import { prisma } from "@/lib/db";
import { ProductGrid } from "@/components/storefront/product/product-grid";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({ /* ... */ });
  return <ProductGrid products={products} />;
}
```

Server components pass data down as props. They never use `useQuery`, `useEffect`, or browser APIs.

### Client Components

Interactive features (cart, forms, admin CRUD, galleries) use `"use client"` and fetch from API routes:

```tsx
"use client";
const { data } = useQuery({
  queryKey: ["products"],
  queryFn: () => fetch("/api/products").then(r => r.json()),
});
```

API routes (`app/api/`) are thin wrappers around Prisma with auth/session checks. Client components never import `prisma` directly.

### Forms

Forms use controlled inputs with `useState` for field values. Submission is handled via `useMutation`:

```tsx
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  mutation.mutate({ title, description, /* ... */ });
}
```

Form validation is handled via HTML attributes (`required`, `type="email"`, `min`, `max`) and API-side validation. No form library is used — forms are small enough for manual control. The `mutation.isPending` flag disables the submit button during save.

### Loading & Error States

- **Server components**: use React Suspense boundaries or `loading.tsx` files
- **Client components**: check `isLoading` / `error` from `useQuery`, render Skeleton or empty state
- **Mutations**: use `mutation.isPending` for button state, `toast` for success/error feedback
- **Empty states**: DataTable shows "No results found."; individual components render contextual empty messages

---

## 7. Creating a New Component

### File Placement

```
components/
  ui/           → Add here only if it's a generic primitive used across storefront + admin
  storefront/   → Add in the appropriate feature subdirectory (layout/, product/, cart/, checkout/, blocks/, shared/)
  admin/        → Add in the appropriate section subdirectory (layout/, dashboard/, products/, orders/, crm/, cms/, promotions/, analytics/, logs/)
  auth/         → Add here if it's login/register related
```

### Naming

- File names: `kebab-case.tsx` — e.g., `variant-selector.tsx`, `order-status-badge.tsx`
- Component names: `PascalCase` — e.g., `VariantSelector`, `OrderStatusBadge`
- Export: always named export, never default

### Imports

Use the `@/` alias for all project imports:

```tsx
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
```

Relative imports (`../../`) are discouraged.

### Props Typing

Define a `Props` type (or inline interface) at the top of the file:

```tsx
type Props = {
  title: string;
  slug: string;
  imageUrl: string;
  minPrice: number;
};

export function ProductCard({ title, slug, imageUrl, minPrice }: Props) {
```

For polymorphic or advanced props, extend `React.ComponentProps<"element">`.

### Server vs Client Decision

| Need | Use |
|------|-----|
| No interactivity, no hooks, no browser APIs | **Server component** (no directive) |
| `useState`, `useEffect`, `useQuery` | `"use client"` |
| Zustand store access | `"use client"` |
| `usePathname`, `useRouter` | `"use client"` |
| Any browser-only API (`localStorage`, `IntersectionObserver`) | `"use client"` |

### Checklist

1. Place file in correct feature directory
2. Add `"use client"` if needed (interactivity, hooks, browser APIs)
3. Define a `Props` type
4. Export as a named function
5. Import from `@/` aliases
6. Use `cn()` for conditional classes
7. Use UI primitives (`Button`, `Input`, `Card`, `DataTable`) instead of raw HTML where possible
8. Handle loading, error, and empty states
9. Add the new component to this document if it's a reusable piece

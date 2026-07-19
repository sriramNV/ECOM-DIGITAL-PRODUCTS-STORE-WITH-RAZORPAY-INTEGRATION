# UI Rules

Concise rules for building the POD e-commerce UI. These cover layout, component, and interaction patterns needed to maintain a clean, conversion-optimized e-commerce experience.

---

## Font

Import the primary sans font via `next/font/google` in the root layout.

```typescript
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
```

Apply the font variable class to the `<html>` tag in root layout. Never use system fonts as the primary font.

---

## Layout

- **Page max-width**: `max-w-7xl mx-auto` — centered, constrained width for content pages
- **Full-bleed sections**: Hero banners, announcement bars, and CTA sections may span full viewport width, but inner content remains constrained
- **Page horizontal padding**: `px-4 md:px-6 lg:px-8`
- **Section vertical padding**: `py-12 md:py-16 lg:py-24`
- **Navbar height**: 64px (h-16), sticky, solid background `bg-background/95 backdrop-blur-sm`
- **No sidebar on storefront** — top navbar only. Admin has sidebar.

---

## Navbar

- Sticky at top, solid background with slight transparency + backdrop blur
- Logo left, nav links center, cart icon + account/login right
- Cart icon shows item count badge
- On scroll: no state change needed (always solid)
- Mobile: hamburger menu expands slide-out drawer

---

## Product Cards

```
┌─────────────────┐
│   [Image]       │  ← aspect-square, object-cover
│                 │
│  Product Title  │  ← text-sm font-medium text-foreground
│  From ₹999      │  ← text-sm text-foreground-muted
│                 │
│  Colors: ● ● ●  │  ← color swatches row
└─────────────────┘
```

- Image aspect ratio: `aspect-square` (1:1) for apparel, `aspect-[4/3]` for mugs/phone cases
- Image uses `next/image` with `fill` and a sized parent container
- Hover: subtle scale (1.02) + shadow elevation
- Quick add-to-cart button appears on hover (desktop only)
- On mobile: always visible, no hover-dependent content
- Price shows sale price with strikethrough original if on sale

---

## Product Detail Page

```
┌─────────────────────┬──────────────────────────┐
│                     │  Product Title            │
│  [Image Gallery]    │  Price                    │
│                     │  Rating / Reviews         │
│  Thumbnails: □ □ □  │                          │
│                     │  Color: [swatches]        │
│                     │  Size: [selector]         │
│                     │  Quantity: [-] 1 [+]      │
│                     │                          │
│                     │  [Add to Cart]            │
│                     │  [Buy Now]                │
│                     │                          │
│                     │  Size Guide link          │
│                     │  Shipping info            │
│                     │  Product description      │
└─────────────────────┴──────────────────────────┘
```

- Image gallery: main image + clickable thumbnails below
- Variant selection (color, size) updates the mockup image immediately
- Price updates dynamically based on selected variant
- "Add to Cart" is the primary CTA, "Buy Now" is secondary (goes directly to checkout)
- Product description below the fold, in a tabbed or accordion layout (details, shipping, care)

---

## Cart

- Two layouts: **Cart page** (full page) and **Cart drawer** (slide-out overlay)
- Cart page: used for primary cart experience, shows all items with quantity controls
- Cart drawer: used for quick-add confirmation, accessible from navbar
- Each cart row: image thumbnail, title, variant info, quantity selector, line price, remove button
- Cart summary: subtotal, shipping estimate, coupon input, total
- Empty cart state: illustration + "Start Shopping" CTA
- Guest cart uses Zustand + localStorage. On login, merges to DB.

---

## Checkout

- Single-page checkout (not multi-step wizard)
- Sections: Shipping Address, Shipping Method, Order Summary, Payment
- Shipping address form: full name, street, city, state, pincode, country, phone
- Shipping method: radio list with prices fetched from Printify API
- Payment section: Razorpay button — clicking opens Razorpay Checkout modal
- Order summary sidebar (desktop) or accordion (mobile): shows items, pricing, coupon
- No place order until Razorpay modal completes

---

## Razorpay Checkout Button

```tsx
// components/storefront/checkout/razorpay-button.tsx
"use client";

// On click:
// 1. POST /api/razorpay/create-order → get razorpay_order_id
// 2. Open Razorpay modal with options
// 3. On success: POST /api/razorpay/verify
// 4. Redirect to /checkout/success
```

- Button shows "Pay ₹XXX" with the total amount
- Disabled state while order is being created
- Loading spinner while Razorpay modal is processing
- Error state: if Razorpay order creation fails, show inline error

---

## Admin Dashboard

- **Layout**: Sidebar (dark) + Topbar + Content area
- **Sidebar**: Navigation links with icons, active state highlighted, collapsed on mobile
- **Topbar**: Search, notifications bell, user avatar dropdown
- **Data tables everywhere** — reusable `DataTable` component with:
  - Sortable columns
  - Search/filter per table
  - Pagination
  - Row selection for batch actions
  - Configurable column visibility
- **Forms**: Consistent form layout with sections, inline validation, save/cancel buttons
- **Charts**: Recharts for all analytics — line charts for revenue, bar charts for orders, pie for distribution

---

## Admin Sidebar Navigation

```
📊 Dashboard
📦 Orders
🏷️ Products
👥 Customers
📝 Content (CMS)
🎯 Promotions
📈 Analytics
📋 Logs
⚙️ Settings
```

Each item has an SVG icon + label. Active route shows highlighted background.

---

## Forms

- Clear label above each input (not placeholder-only)
- Inline validation errors below the field in `text-sm text-error`
- Required fields marked with `*`
- Submit buttons show loading state during API calls
- Success: toast notification or redirect
- Error: inline error banner at top of form

---

## Empty States

Every data list must handle the empty case:

```tsx
<EmptyState
  icon={PackageIcon}
  title="No orders yet"
  description="Orders will appear here once customers start purchasing."
  action={isAdmin ? { label: "Browse Products", href: "/admin/products" } : undefined}
/>
```

- Never show an empty table with just headers
- Include a helpful message and CTA when appropriate

---

## Loading States

- **Page loads**: Skeleton components matching the content dimensions
- **Data fetches (admin)**: TanStack Query loading state → skeleton rows
- **Actions**: Button loading spinner, disabled state during mutation
- **Images**: `next/image` `placeholder="blur"` or a `bg-surface` block matching aspect ratio

---

## Error States

- **API errors**: Toast notification (top-right), auto-dismiss after 5s
- **Form errors**: Inline per-field error messages
- **Page load errors**: Full-page error state with retry button
- **Network errors**: Offline banner at top of page

---

## Responsiveness

| Breakpoint | Width    | Behavior |
|------------|----------|----------|
| Mobile     | < 768px  | Single column, stacked layout, hamburger menu, bottom nav or sticky cart |
| Tablet     | 768-1024px | 2-column product grid, sidebar collapses |
| Desktop    | 1024+px  | Full layout, 3-4 column product grid, persistent sidebar in admin |

- Product grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Admin tables: horizontal scroll on mobile with sticky first column
- Cart page: stacked on mobile, side-by-side on desktop

---

## Theme

- Light theme only for this project (no dark mode requirement)
- Clean white backgrounds, clear content hierarchy
- Consistent use of semantic color tokens from ui-tokens.md

---

## Do Nots

- Never use Tailwind's built-in color classes (`bg-blue-500`, `text-gray-600`) — use project tokens only
- Never define colors in a `tailwind.config.ts` file — use `@theme inline` in globals.css
- Never ship a component without an empty/loading/error state where applicable
- Never use `<img>` tag — always use `next/image` for optimization
- Never use raw `fetch()` in components — always use API routes or TanStack Query
- Never hardcode copy strings in JSX — import from data files or CMS
- Never store secrets in the client bundle — API calls go through server routes
- Never expose Razorpay secret key in frontend code — only use key_id
- Never skip input validation — Zod schema on every API route
- Never use `<div onClick>` — use `<button>` for interactive elements (a11y)

# Architecture

## Layered Design

```
┌──────────────────────────────────────────────────┐
│                  Presentation                     │
│  Server Components   Client Components   CSS      │
│  (React Server)     (React + Zustand)   (Tailwind)│
├──────────────────────────────────────────────────┤
│                   API Routes                      │
│  39 endpoints under app/api/                      │
│  Auth: public | session | adminGuard              │
├──────────────────────────────────────────────────┤
│               Service Layer                       │
│  payments (simulated)  │  orders                  │
│  files (MinIO/S3)      │  rate-limit (Redis)      │
├──────────────────────────────────────────────────┤
│        Infrastructure                             │
│  Prisma/PostgreSQL  │  Redis (rate limit/cache)   │
│  MinIO (S3 storage) │  NextAuth (JWT)             │
└──────────────────────────────────────────────────┘
```

## Data Flow

### Checkout Flow
```
Cart (Zustand) → POST /api/cart (sync to server) → POST /api/orders → createOrderFromCart() → Order (PAID) → Clear cart → Redirect to order page
```

### File Download Flow
```
User clicks Download → POST /api/orders/[id]/download/[itemId] → rateLimit check (3/hr) → generateDownloadUrl() → MinIO signed URL → Redirect / open
```

### Account Deletion Flow
```
User confirms delete → DELETE /api/account/delete → $transaction() → Delete downloads → Delete payments → Delete order history → Delete orders → Clear cart → Delete cart → Delete sessions → Delete account → Delete user
```

## Auth Architecture

NextAuth v5 with JWT strategy. Credentials provider (email + bcrypt password) + optional Google OAuth.

- **Session check**: `auth()` from `lib/auth.ts` in API routes and server components
- **Admin guard**: `adminGuard()` returns 401/403 if not admin
- **User guard**: `userGuard()` returns user or 401
- **Middleware**: Guards `/account`, `/admin`, `/auth` routes; sets security headers
- **Roles**: `ADMIN`, `CUSTOMER` (Prisma enum)

## Key Decisions

### Why Simulated Payments?
The platform uses simulated payments for development and self-hosted deployment. `POST /api/orders` creates an order with `PAID` status directly — no real payment gateway needed. Rate limiting (5 orders/hr per user) prevents abuse. Razorpay integration code exists but is deprecated.

### Why Zustand for Cart?
Cart state needs to persist across page navigations and survive React re-renders without server roundtrips. Zustand with `persist` middleware provides client-side cart backed by localStorage, synced to the server at checkout.

### Why Server Components + Client Components?
- **Server Components** for data-fetching pages (products, account, admin) — direct Prisma access, no API call overhead, fresh data every request
- **Client Components** for interactive features (cart, checkout, theme toggle) — client-side state, event handlers, animations

### Why MinIO?
MinIO provides an S3-compatible API for file storage. Works with the AWS SDK v3 for generating signed download URLs. Can be swapped for AWS S3, Backblaze B2, or Cloudflare R2 with zero code changes.

## Directory Structure

```
apps/web/
├── app/
│   ├── (storefront)/        # Public pages (home, products)
│   ├── account/             # User account pages
│   ├── admin/               # Admin panel pages
│   ├── api/                 # API routes (file-based)
│   │   ├── account/         # User account management
│   │   ├── admin/           # Admin CRUD endpoints
│   │   ├── auth/            # Register + NextAuth
│   │   ├── cart/            # Cart sync + merge
│   │   ├── categories/      # Category listing
│   │   ├── health/          # Health check
│   │   ├── orders/          # Order + download
│   │   └── products/        # Product listing
│   ├── auth/                # Login/register pages
│   ├── cart/                # Cart page
│   └── checkout/            # Checkout page
├── components/
│   ├── ui/                  # shadcn base components
│   ├── layout/              # Navbar, Footer
│   ├── landing/             # Hero, CTA, featured grid
│   ├── products/            # Product cards, detail, forms
│   └── account/             # Download button, delete account
├── lib/
│   ├── services/            # Business logic
│   │   ├── files/           # MinIO file operations
│   │   ├── orders/          # Order queries + download URLs
│   │   └── payments/        # Order creation (simulated)
│   ├── auth.ts              # NextAuth configuration
│   ├── db.ts                # Prisma client singleton
│   ├── guard.ts             # adminGuard() + userGuard()
│   ├── rate-limit.ts        # Redis-backed rate limiter
│   ├── utils.ts             # Formatters, slugify, etc.
│   └── button-variants.ts   # CVA button styles (shared)
├── stores/
│   ├── cart-store.ts        # Zustand cart with persist
│   └── theme-store.ts       # Zustand theme with persist
└── middleware.ts            # Auth protection + security headers
```

## State Management

| State | Tool | Location |
|-------|------|----------|
| Server data (products, orders) | Server Components | Direct Prisma queries |
| Client cart | Zustand + localStorage | `stores/cart-store.ts` |
| Theme preference | Zustand + localStorage | `stores/theme-store.ts` |
| Auth session | NextAuth SessionProvider | `app/layout.tsx` |
| UI state | React useState/useReducer | Component-local |

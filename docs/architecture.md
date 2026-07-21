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
│  Auth: public | session | adminGuard | HMAC       │
├──────────────────────────────────────────────────┤
│               Service Layer                       │
│  checkout-service   │  pricing-service            │
│  coupon-service     │  fulfillment-service        │
│  email-service      │  queue (Bull jobs)          │
├──────────────────────────────────────────────────┤
│              Repository Layer                     │
│  product-repo  order-repo  cart-repo              │
│  category-repo coupon-repo  cms-repo              │
│  analytics-repo  dead-letter-repo                 │
├──────────────────────────────────────────────────┤
│        External Integrations / Infrastructure     │
│  Prisma/PostgreSQL  │  Printify API               │
│  Redis (cache/queue)│  Razorpay                   │
│  MinIO (S3 storage) │  Nodemailer (SMTP)          │
│  PostHog (analytics)│  Pino (logging)             │
└──────────────────────────────────────────────────┘
```

## Data Flow

### Checkout Flow
```
Cart → Create Razorpay Order → Payment (Razorpay SDK) → Verify Signature → Create DB Order → Clear Cart → Email Confirmation → Submit to Printify
```

### Product Management
```
Admin Form → POST/PUT /api/products → productRepo → Prisma → PostgreSQL
Storefront → GET /api/products → productRepo.list() → Prisma
```

### Fulfillment Flow
```
Admin marks order → submitOrder(orderId) → Printify API → status update → webhook → email notification
```

## Auth Architecture

NextAuth v5 with JWT strategy. Credentials provider (email + bcrypt password).

- **Session check**: `auth()` from `lib/auth.ts` in API routes and server components
- **Admin guard**: `adminGuard()` returns 401/403 if not admin
- **Middleware** (`proxy.ts`): rate limits API, guards admin/account routes, sets security headers
- **Roles**: `ADMIN`, `CUSTOMER` (enum in Prisma)

## Key Decisions

### Why Server Components + Client Components?
- **Server Components** for data-fetching pages (products list, account, CMS pages) — direct DB access, no API call overhead
- **Client Components** for interactive features (cart, checkout, product detail with variant selection) — state management, real-time UI

### Why Zustand for Cart?
Cart state needs to persist across page navigations and survive React re-renders without server roundtrips. Zustand provides client-side cart with localStorage persistence, synced to the server on login/checkout.

### Why Separate Repositories?
Each repository encapsulates all Prisma queries for one entity. This keeps API routes thin (parse input → call repo → return response) and makes data access testable independent of HTTP.

### Printify Integration Design
The Printify client wraps the REST API with retry logic (429 rate limits), typed request/response interfaces, and separate modules for products, orders, catalog, uploads, and webhooks.

## Directory Structure

```
apps/web/
├── app/
│   ├── api/                     # Next.js API routes (file-based routing)
│   │   ├── auth/                # Authentication endpoints
│   │   ├── products/            # Product CRUD + listing
│   │   ├── cart/                # Cart management
│   │   ├── orders/              # Order queries
│   │   ├── razorpay/            # Payment gateway
│   │   ├── printify/            # Fulfillment webhooks
│   │   ├── admin/               # Admin-only endpoints
│   │   ├── analytics/           # Dashboard data
│   │   ├── cms/                 # Content management
│   │   ├── promotions/          # Coupons
│   │   └── health/              # Health check
│   ├── (storefront)/            # Public pages
│   ├── (marketing)/             # Marketing pages (about, contact, FAQ)
│   ├── (auth)/                  # Login/register
│   └── admin/                   # Admin panel
├── components/
│   ├── ui/                      # shadcn base components
│   ├── storefront/              # Public UI components
│   │   ├── layout/              # Navbar, footer, mobile menu
│   │   ├── product/             # Cards, gallery, selector
│   │   ├── cart/                # Cart drawer, item, summary
│   │   ├── checkout/            # Checkout form, payment button
│   │   ├── blocks/              # CMS content blocks
│   │   └── shared/              # Breadcrumbs, pagination
│   └── admin/                   # Admin UI components
│       ├── layout/              # Shell, sidebar, topbar
│       ├── dashboard/           # Stats, recent orders
│       ├── products/            # Product form, table, variant manager
│       ├── orders/              # Order detail, actions
│       ├── crm/                 # Customer list, detail
│       ├── cms/                 # Page editor, banners, collections
│       ├── promotions/          # Coupons
│       ├── analytics/           # Charts, funnel
│       └── logs/                # Audit log viewer
├── lib/
│   ├── repositories/            # Data access layer
│   ├── services/                # Business logic
│   ├── printify/                # Printify API client
│   ├── email/templates/         # Email HTML templates
│   └── jobs/                    # Bull queue processors
└── stores/                      # Zustand stores
```

## State Management

| State | Tool | Location |
|-------|------|----------|
| Server data (products, orders, etc.) | TanStack React Query | `useQuery` / `useMutation` hooks |
| Client cart | Zustand + localStorage | `stores/cart-store.ts` |
| Auth session | NextAuth `SessionProvider` | `providers/session-provider.tsx` |
| UI state | React `useState` / `useReducer` | Component-local |

## Security

- **API routes**: `adminGuard` for admin endpoints, session check for user data
- **Rate limiting**: Upstash Ratelimit via Redis (100 requests per 60s per IP)
- **Webhook verification**: HMAC-SHA256 timing-safe comparison for Razorpay and Printify
- **Payment verification**: HMAC signature check before order creation
- **Amount tampering**: Order amount re-calculated server-side and compared with Razorpay order notes
- **Health check**: IP-restricted to private network ranges
- **Headers**: X-Content-Type-Options, X-Frame-Options, Referrer-Policy via middleware
- **Production**: CSP headers via Nginx (Razorpay allowed), HSTS, TLS 1.2/1.3

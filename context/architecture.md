# Architecture

## Stack

| Layer              | Tool                                           | Purpose                                     |
| ------------------ | ---------------------------------------------- | ------------------------------------------- |
| Framework          | Next.js 16 (App Router)                        | Full stack, SSR, RSC, API routes            |
| Language           | TypeScript strict                              | Type safety throughout                      |
| Styling            | Tailwind CSS v4                                | Utility-first, design tokens via `@theme`   |
| UI Library         | shadcn/ui (adapted for TW v4)                  | Accessible component primitives             |
| Job Queue          | Bull (Redis-backed)                            | Background jobs: cart recovery, retries, backups |
| State (client)     | Zustand                                        | Cart, UI, filters                           |
| Server State       | TanStack Query                                 | Server cache, mutations, invalidation       |
| Database           | PostgreSQL 16                                  | Source of truth                             |
| ORM                | Prisma                                         | Type-safe queries, migrations               |
| Cache              | Redis 7 (Docker container)                     | Sessions, rate limiting, query cache        |
| Payments           | Razorpay (Orders API + Checkout + Webhooks)    | Indian payment gateway, UPI/CC/NB/Wallet    |
| POD Fulfillment    | Printify API (v1 primary, v2 for catalog)      | Direct provider integration                 |
| File Storage       | MinIO (self-hosted S3-compatible)              | Artwork, mockups, assets                    |
| Auth               | NextAuth.js v5 (Auth.js)                       | Credentials + JWT session                   |
| Email              | Nodemailer (open-source, SMTP)                 | Transactional emails                        |
| Analytics          | PostHog (self-hosted, open-source)             | Events, funnels, dashboards                 |
| Logging            | Pino + Grafana Loki + Promtail                 | Structured logging (all open-source)        |
| Error Tracking     | Sentry (self-hosted) or GlitchTip (open-source)| Runtime error aggregation                   |
| Validation         | Zod                                            | Schema validation (shared client/server)    |
| Charts             | Recharts (React) + Grafana (infra)             | Admin analytics charts + infra dashboards   |
| Containerization   | Docker Compose                                 | Dev + production environment                |
| Reverse Proxy      | Nginx or Caddy (Docker sidecar)                | TLS termination, reverse proxy              |
| Deployment         | Docker (self-hosted VPS)                       | Full control production deployment          |

---

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          Docker Host (VPS)                                    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────┐             │
│  │                    Nginx / Caddy (Reverse Proxy)              │             │
│  │  TLS termination, rate limiting, static asset caching         │             │
│  └──────────────────────────┬──────────────────────────────────┘             │
│                             │                                                 │
│  ┌─────────────────────────────────────────────────────────────┐             │
│  │                   Next.js App Container                       │             │
│  │                                                               │             │
│  │  ┌───────────────────────────────────────────────────────┐   │             │
│  │  │              Storefront (RSC by default)               │   │             │
│  │  │  Landing | Products | Cart | Checkout | Account        │   │             │
│  │  └───────────────────────────────────────────────────────┘   │             │
│  │  ┌───────────────────────────────────────────────────────┐   │             │
│  │  │              Admin Dashboard (Client-heavy)            │   │             │
│  │  │  Dashboard | Orders | Products | CRM | CMS | Analytics│   │             │
│  │  └───────────────────────────────────────────────────────┘   │             │
│  │                           │                                   │             │
│  │                    API Routes (Next.js)                       │             │
│  │                           │                                   │             │
│  ├─────────────────────────────────────────────────────────────┤             │
│  │                    Service Adapters                           │             │
│  │  ┌────────┐ ┌──────────┐ ┌──────┐ ┌─────────┐ ┌─────────┐  │             │
│  │  │Printify│ │ Razorpay │ │Redis │ │Nodemail │ │PostHog  │  │             │
│  │  │Adapter │ │ Adapter  │ │Client│ │er       │ │Client   │  │             │
│  │  └────────┘ └──────────┘ └──────┘ └─────────┘ └─────────┘  │             │
│  └─────────────────────────────────────────────────────────────┘             │
│                           │                                                  │
│  ┌─────────────────────────────────────────────────────────────┐             │
│  │               PostgreSQL 16 (Prisma ORM)                     │             │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌───────┐  │             │
│  │  │Users │ │Prod  │ │Orders│ │Cart  │ │CMS   │ │Analyt-│  │             │
│  │  │      │ │ucts  │ │      │ │      │ │      │ │ics    │  │             │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └───────┘  │             │
│  └─────────────────────────────────────────────────────────────┘             │
│                           │                                                  │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────┐     │
│  │    Redis 7                    │  │  MinIO (S3-compatible)           │     │
│  │  Sessions, Cache, Locks      │  │  Artwork, Mockups, Assets        │     │
│  │  Rate Limiting, Job Queue    │  └──────────────────────────────────┘     │
│  └──────────────────────────────┘                                          │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────┐             │
│  │  PostHog (self-hosted) | Grafana + Loki | Sentry (self-host)│             │
│  └─────────────────────────────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────┐     ┌──────────────────┐
│   Printify API   │     │   Razorpay API   │
│   (External)     │     │   (External)     │
│   + Webhooks ◄───┤     │   + Webhooks ◄───┤
└──────────────────┘     └──────────────────┘
```

---

## Folder Structure

```
/
├── context/                               # Project context files (this folder)
├── apps/
│   └── web/                               # Next.js application
│       ├── app/
│       │   ├── layout.tsx                 # Root layout, fonts, providers
│       │   ├── page.tsx                   # Landing page
│       │   ├── (storefront)/              # Route group — customer-facing
│       │   │   ├── layout.tsx             # Storefront layout (Navbar, Footer)
│       │   │   ├── products/
│       │   │   │   ├── page.tsx           # Catalog listing
│       │   │   │   └── [slug]/
│       │   │   │       └── page.tsx       # Product detail
│       │   │   ├── cart/
│       │   │   │   └── page.tsx           # Cart page
│       │   │   ├── checkout/
│       │   │   │   ├── page.tsx           # Checkout page
│       │   │   │   └── success/
│       │   │   │       └── page.tsx       # Post-payment confirmation
│       │   │   └── account/
│       │   │       ├── orders/
│       │   │       │   ├── page.tsx       # Order list
│       │   │       │   └── [id]/
│       │   │       │       └── page.tsx   # Order detail
│       │   │       ├── saved-designs/
│       │   │       │   └── page.tsx
│       │   │       └── settings/
│       │   │           └── page.tsx
│       │   ├── (marketing)/               # Route group — static pages
│       │   │   ├── layout.tsx             # Shared marketing layout
│       │   │   ├── about/
│       │   │   │   └── page.tsx
│       │   │   ├── contact/
│       │   │   │   └── page.tsx
│       │   │   └── faq/
│       │   │       └── page.tsx
│       │   ├── admin/                     # Route group — admin dashboard
│       │   │   ├── layout.tsx             # Admin shell (sidebar, topbar)
│       │   │   ├── page.tsx               # Redirect to /admin/dashboard
│       │   │   ├── dashboard/
│       │   │   │   └── page.tsx
│       │   │   ├── orders/
│       │   │   │   ├── page.tsx           # Order list (datatable)
│       │   │   │   └── [id]/
│       │   │   │       └── page.tsx       # Order detail + actions
│       │   │   ├── products/
│       │   │   │   ├── page.tsx           # Product list
│       │   │   │   ├── new/
│       │   │   │   │   └── page.tsx       # Create product (Printify blueprint browser)
│       │   │   │   └── [id]/
│       │   │   │       └── page.tsx       # Edit product
│       │   │   ├── customers/
│       │   │   │   ├── page.tsx           # Customer list
│       │   │   │   └── [id]/
│       │   │   │       └── page.tsx       # Customer detail + order history
│       │   │   ├── cms/
│       │   │   │   ├── pages/
│       │   │   │   │   └── page.tsx       # CMS page editor
│       │   │   │   ├── banners/
│       │   │   │   │   └── page.tsx
│       │   │   │   └── collections/
│       │   │   │       └── page.tsx
│       │   │   ├── promotions/
│       │   │   │   └── page.tsx
│       │   │   ├── analytics/
│       │   │   │   └── page.tsx
│       │   │   ├── logs/
│       │   │   │   └── page.tsx
│       │   │   └── settings/
│       │   │       └── page.tsx
│       │   └── api/                       # API routes
│       │       ├── auth/
│       │       │   └── [...nextauth]/
│       │       │       └── route.ts       # NextAuth handler
│       │       ├── razorpay/
│       │       │   ├── create-order/
│       │       │   │   └── route.ts       # Create Razorpay order
│       │       │   ├── verify/
│       │       │   │   └── route.ts       # Verify payment signature
│       │       │   └── webhooks/
│       │       │       └── route.ts       # Razorpay webhook receiver
│       │       ├── printify/
│       │       │   └── webhooks/
│       │       │       └── route.ts       # Printify webhook receiver
│       │       ├── products/
│       │       │   ├── route.ts           # GET (list), POST (create)
│       │       │   └── [id]/
│       │       │       └── route.ts       # GET, PUT, DELETE
│       │       ├── orders/
│       │       │   ├── route.ts
│       │       │   └── [id]/
│       │       │       └── route.ts
│       │       ├── cart/
│       │       │   └── route.ts
│       │       ├── customers/
│       │       │   ├── route.ts
│       │       │   └── [id]/
│       │       │       └── route.ts
│       │       ├── cms/
│       │       │   ├── pages/
│       │       │   │   └── route.ts
│       │       │   ├── banners/
│       │       │   │   └── route.ts
│       │       │   └── collections/
│       │       │       └── route.ts
│       │       ├── promotions/
│       │       │   └── route.ts
│       │       ├── analytics/
│       │       │   └── route.ts
│       │       └── admin/
│       │           └── stats/
│       │               └── route.ts       # Dashboard aggregate data
│       ├── components/
│       │   ├── ui/                        # shadcn/ui primitives
│       │   │   ├── button.tsx
│       │   │   ├── input.tsx
│       │   │   ├── select.tsx
│       │   │   ├── table.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── badge.tsx
│       │   │   ├── card.tsx
│       │   │   ├── dropdown-menu.tsx
│       │   │   ├── skeleton.tsx
│       │   │   ├── toast.tsx
│       │   │   └── data-table.tsx
│       │   ├── storefront/                # Customer-facing components
│       │   │   ├── layout/
│       │   │   │   ├── navbar.tsx
│       │   │   │   ├── footer.tsx
│       │   │   │   ├── mobile-menu.tsx
│       │   │   │   └── announcement-bar.tsx
│       │   │   ├── home/
│       │   │   │   ├── hero-banner.tsx
│       │   │   │   ├── featured-collections.tsx
│       │   │   │   ├── hot-items.tsx
│       │   │   │   ├── newsletter-cta.tsx
│       │   │   │   └── brand-strip.tsx
│       │   │   ├── product/
│       │   │   │   ├── product-card.tsx
│       │   │   │   ├── product-grid.tsx
│       │   │   │   ├── product-gallery.tsx
│       │   │   │   ├── variant-selector.tsx
│       │   │   │   ├── size-guide.tsx
│       │   │   │   ├── price-display.tsx
│       │   │   │   └── add-to-cart-button.tsx
│       │   │   ├── cart/
│       │   │   │   ├── cart-drawer.tsx
│       │   │   │   ├── cart-item-row.tsx
│       │   │   │   ├── cart-summary.tsx
│       │   │   │   └── coupon-input.tsx
│       │   │   ├── checkout/
│       │   │   │   ├── checkout-form.tsx
│       │   │   │   ├── shipping-address-form.tsx
│       │   │   │   ├── shipping-method-selector.tsx
│       │   │   │   ├── order-summary.tsx
│       │   │   │   └── razorpay-button.tsx    # Razorpay Checkout trigger
│       │   │   ├── account/
│       │   │   │   ├── order-table.tsx
│       │   │   │   ├── order-detail.tsx
│       │   │   │   └── address-book.tsx
│       │   │   └── shared/
│       │   │       ├── search-bar.tsx
│       │   │       ├── filter-panel.tsx
│       │   │       ├── pagination.tsx
│       │   │       ├── breadcrumbs.tsx
│       │   │       └── empty-state.tsx
│       │   ├── admin/                     # Admin dashboard components
│       │   │   ├── layout/
│       │   │   │   ├── admin-shell.tsx    # Main admin layout wrapper
│       │   │   │   ├── sidebar.tsx
│       │   │   │   ├── topbar.tsx
│       │   │   │   └── nav-items.ts
│       │   │   ├── dashboard/
│       │   │   │   ├── stat-card.tsx
│       │   │   │   ├── revenue-chart.tsx
│       │   │   │   ├── recent-orders.tsx
│       │   │   │   └── top-products.tsx
│       │   │   ├── orders/
│       │   │   │   ├── order-table.tsx
│       │   │   │   ├── order-detail.tsx
│       │   │   │   ├── order-status-badge.tsx
│       │   │   │   └── order-actions.tsx
│       │   │   ├── products/
│       │   │   │   ├── product-table.tsx
│       │   │   │   ├── product-form.tsx
│       │   │   │   ├── blueprint-browser.tsx
│       │   │   │   ├── variant-manager.tsx
│       │   │   │   └── mockup-upload.tsx
│       │   │   ├── crm/
│       │   │   │   ├── customer-table.tsx
│       │   │   │   ├── customer-detail.tsx
│       │   │   │   └── customer-notes.tsx
│       │   │   ├── cms/
│       │   │   │   ├── page-editor.tsx
│       │   │   │   ├── block-palette.tsx
│       │   │   │   ├── banner-manager.tsx
│       │   │   │   └── collection-manager.tsx
│       │   │   ├── promotions/
│       │   │   │   ├── coupon-form.tsx
│       │   │   │   ├── coupon-table.tsx
│       │   │   │   └── flash-sale-scheduler.tsx
│       │   │   ├── analytics/
│       │   │   │   ├── analytics-overview.tsx
│       │   │   │   ├── revenue-chart.tsx
│       │   │   │   ├── conversion-funnel.tsx
│       │   │   │   ├── margin-analysis.tsx
│       │   │   │   └── cohort-table.tsx
│       │   │   └── logs/
│       │   │       ├── audit-log-viewer.tsx
│       │   │       └── webhook-log-viewer.tsx
│       │   └── shared/                    # Cross-cutting components
│       │       ├── loading-spinner.tsx
│       │       ├── error-boundary.tsx
│       │       ├── confirm-dialog.tsx
│       │       └── status-badge.tsx
│       ├── lib/
│       │   ├── prisma.ts                  # Prisma client singleton
│       │   ├── razorpay.ts                # Razorpay SDK config
│       │   ├── printify/                  # Printify API client package
│       │   │   ├── client.ts              # HTTP client with auth + rate limiting
│       │   │   ├── types.ts               # Printify API types
│       │   │   ├── catalog.ts             # Blueprint/print provider queries
│       │   │   ├── products.ts            # Product CRUD + publish
│       │   │   ├── orders.ts              # Order submission + status
│       │   │   ├── uploads.ts             # Artwork upload
│       │   │   └── webhooks.ts            # Webhook registration
│       │   ├── repositories/              # Data access layer
│       │   │   ├── product-repo.ts
│       │   │   ├── order-repo.ts
│       │   │   ├── customer-repo.ts
│       │   │   ├── cart-repo.ts
│       │   │   ├── coupon-repo.ts
│       │   │   ├── cms-repo.ts
│       │   │   └── analytics-repo.ts
│       │   ├── services/                  # Business logic layer
│       │   │   ├── checkout-service.ts    # Orchestrates Razorpay + order creation
│       │   │   ├── fulfillment-service.ts # Printify order submission + tracking
│       │   │   ├── pricing-service.ts     # Price calculation (base + margin + coupon)
│       │   │   ├── email-service.ts       # Transactional email orchestration
│       │   │   └── analytics-service.ts   # Aggregation queries
│       │   ├── minio.ts                   # MinIO/S3 client
│       │   ├── redis.ts                   # Redis client
│       │   ├── auth.ts                    # NextAuth config
│       │   ├── email.ts                   # Nodemailer transport
│       │   ├── analytics.ts               # PostHog client
│       │   ├── logger.ts                  # Pino logger setup
│       │   └── utils.ts                   # cn(), formatCurrency(), formatDate()
│       ├── hooks/                         # Shared React hooks
│       │   ├── use-cart.ts
│       │   ├── use-debounce.ts
│       │   ├── use-media-query.ts
│       │   └── use-intersection.ts
│       ├── stores/                        # Zustand stores
│       │   ├── cart-store.ts
│       │   ├── ui-store.ts
│       │   └── filter-store.ts
│       ├── data/                          # Placeholder/sample data
│       │   ├── products.ts
│       │   ├── collections.ts
│       │   ├── site.ts
│       │   └── admin.ts
│       └── types/                         # Shared types
│           ├── index.ts
│           ├── product.ts
│           ├── order.ts
│           ├── cart.ts
│           ├── customer.ts
│           └── cms.ts
├── packages/
│   └── shared/                            # Shared across packages
│       ├── types/
│       └── validation/
│           ├── coupon-schema.ts
│           ├── checkout-schema.ts
│           └── product-schema.ts
├── docker-compose.yml                     # PostgreSQL 16 + Redis 7 + MinIO + PostHog + App
├── Dockerfile                             # Production Docker image
├── .env.example
├── turbo.json
└── package.json
```

---

## System Boundaries

| Folder/Path                    | Owns |
| ------------------------------ | ---- |
| `app/` (pages)                 | Routes and composition only. No business logic inline |
| `app/api/`                     | HTTP API endpoints — thin handlers, delegate to services |
| `components/storefront/`       | Customer-facing UI sections |
| `components/admin/`            | Admin dashboard UI sections |
| `components/ui/`               | Generic shadcn/ui primitives |
| `lib/printify/`                | All Printify API interaction — single source of truth |
| `lib/repositories/`            | All database access — nothing touches Prisma outside repos |
| `lib/services/`                | Business logic — orchestrates repos + external adapters |
| `lib/`                         | Third-party client setup, utilities |
| `stores/`                      | Zustand state management |
| `data/`                        | Placeholder content for development |

---

## Data Flow: Checkout (Razorpay)

```
1. Customer fills checkout form (address, shipping method)
2. POST /api/razorpay/create-order
     { amount, currency, receipt_id, items }
     → Server creates Razorpay Order via Razorpay API
     ← Returns { razorpay_order_id, amount, currency }
3. Frontend opens Razorpay Checkout modal:
     var options = {
       key: RAZORPAY_KEY_ID,
       order_id: razorpay_order_id,
       prefill: { name, email, contact },
       handler: function(response) {
         // response: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
         POST /api/razorpay/verify { payment_id, order_id, signature }
       }
     }
     var rzp = new Razorpay(options);
     rzp.open();
4. On success → frontend calls /api/razorpay/verify
     → Server verifies HMAC SHA256 signature
     → Creates Order in DB (status: paid)
     → Submits to Printify (idempotent with external_id = order.id)
     → Sends confirmation email
     → Redirects to /checkout/success
5. Razorpay sends payment.captured webhook to /api/razorpay/webhooks
     → Server verifies webhook signature
     → Idempotency check (event ID)
     → If order not already processed, process it
     → Return 200
```

---

## Data Flow: Admin

```
1. Admin opens /admin/orders
2. Page fetches via API route /api/admin/orders
3. API route calls order-repo.ts → Prisma query
4. Response sent as JSON
5. TanStack Query caches the result (stale time: 30s)
6. Admin performs action (e.g. cancel order)
7. API route mutates DB + logs audit entry
8. TanStack Query invalidates → re-fetches updated list
```

---

## Key Design Patterns

### Printify Adapter Pattern
All Printify API calls go through `lib/printify/` — never raw fetch calls in components or API routes.
- Authentication: Bearer token injection (from env)
- Rate limiting: client-side backoff on 429
- Logging: every request/response at debug level
- Error normalization: Printify errors → typed AppError
- Idempotency: order creation uses `external_id` from system order ID

### Razorpay Integration Pattern
- Razorpay **Orders API** creates an order server-side (`POST /api/razorpay/create-order`)
- **Razorpay Checkout** opens on frontend using the order ID (modal-based, no redirect)
- **Signature verification** happens server-side after payment (HMAC SHA256 of `order_id + payment_id`)
- **Webhooks** are secondary — used for reconciliation, not primary order creation
- Two-phase verification: frontend handler verifies immediately, webhook confirms async

### Webhook Handler Pattern
Both Razorpay and Printify webhooks follow the same structure:
1. **Verify signature** — crypto validation (Razorpay: HMAC SHA256, Printify: HMAC SHA256)
2. **Idempotency check** — deduplicate via event ID (Redis set with TTL + DB unique constraint)
3. **Process** — write to DB, trigger side effects
4. **Return 200** — acknowledge receipt; any non-2xx triggers retry

### Repository Pattern
Database access is abstracted behind repository functions in `lib/repositories/`. API routes and services never use Prisma directly — they call repository functions. This makes testing easier and centralizes query logic.

### Service Layer Pattern
Business logic lives in `lib/services/`. Services compose repositories and external adapters. API routes are thin:
```
API route → validates input (Zod) → calls service → returns response
```

### Cart Merge Pattern
Guest carts are stored in Zustand (localStorage persisted). On login, the guest cart merges into the DB-backed user cart. Duplicate items increment quantities; new items are appended.

---

## Resource Notes

**PostHog resource requirements**: Self-hosted PostHog is resource-intensive (~2GB RAM minimum, requires its own PostgreSQL + Redis). The minimum VPS spec for production is **8GB RAM** (not 4GB). If this is too heavy, alternatives:
- Use PostHog Cloud (free tier: 1M events/month)
- Use Plausible (lighter: 1GB RAM)
- Defer analytics to a later phase

**MinIO bucket initialization**: The `pod-assets` bucket must be created on first startup. This is handled by a startup script (`scripts/init-buckets.sh`) that runs against the MinIO API with `mc` (MinIO Client) or via the Node.js SDK on app boot.

## Docker Compose Services

```yaml
services:
  postgres:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine

  minio:
    image: minio/minio
    volumes: [miniodata:/data]

  posthog:
    image: posthog/posthog:latest  # self-hosted analytics, ~2GB RAM
    depends_on: [postgres, redis]

  nginx:
    image: nginx:alpine
    ports: [80:80, 443:443]
    volumes: [./nginx:/etc/nginx/conf.d]

  app:
    build: .
    depends_on: [postgres, redis, minio]
    env_file: .env
```

---

## Key Invariants

- Every Printify API call is wrapped in the adapter — never call Printify directly
- Every webhook handler is idempotent — replaying the same event is safe
- Every database mutation goes through a repository — never raw Prisma in API routes
- Every API route validates input with Zod before processing
- Every admin mutation that changes order/product/user state is audited
- Payments are handled by Razorpay — the app never touches raw card data
- Razorpay signature verification always happens server-side (never trust the client)
- Secrets live in environment variables, never in code or config files
- The Printify adapter respects rate limits (global 600/min, catalog 100/min, publish 200/30min)
- MinIO replaces S3 for self-hosted storage; S3-compatible SDK is used so migration is trivial
- Nodemailer handles all email; SMTP credentials configurable via environment
- PostHog is self-hosted alongside the application stack

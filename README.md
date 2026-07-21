# POD Store — Print-on-Demand E-Commerce Platform

<p>
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?logo=prisma" alt="Prisma PostgreSQL">
  <img src="https://img.shields.io/badge/Razorpay-Payments-02042B?logo=razorpay" alt="Razorpay">
  <img src="https://img.shields.io/badge/Printify-Fulfillment-FF6B35" alt="Printify">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker" alt="Docker Compose">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License">
</p>

A full-stack print-on-demand e-commerce platform built with Next.js. Features product management, Razorpay payments, Printify fulfillment integration, admin dashboard, and CMS.

> **Documentation**: [`docs/`](docs/) — [Architecture](docs/architecture.md) · [API Reference](docs/api.md) · [Database](docs/database.md) · [Development Guide](docs/development.md) · [Operations](docs/operations.md) · [Security](docs/security.md) · [Testing](docs/testing.md) · [Components](docs/components.md)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router), React 19 |
| **Styling** | Tailwind CSS v4, shadcn/ui, Lucide icons |
| **State** | Zustand (client cart), TanStack React Query (server state) |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | NextAuth v5 (credentials, JWT strategy) |
| **Payments** | Razorpay |
| **Fulfillment** | Printify API |
| **Storage** | MinIO (S3-compatible) |
| **Cache/Queue** | Redis (ioredis, Bull queues) |
| **Email** | Nodemailer (SMTP) |
| **Analytics** | PostHog (client + server) |
| **Logging** | Pino |
| **Monorepo** | Turborepo + pnpm workspaces |
| **Testing** | Vitest (unit), Playwright (E2E) |
| **Infrastructure** | Docker, Nginx, GitHub Actions |

## Architecture

```
apps/web          → Next.js app (API routes + frontend)
packages/shared   → Shared types and validation
prisma/           → Schema, migrations, seed
```

The app follows a layered architecture:

```
API Routes → Services → Repositories → Prisma/External APIs
```

- **API Routes** — Handle HTTP, auth guards, validation
- **Services** — Business logic (checkout, pricing, fulfillment, coupons, email)
- **Repositories** — Data access (products, orders, cart, categories, CMS, analytics)
- **External** — Printify client, Razorpay, Redis, Bull queues, Nodemailer

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop (for PostgreSQL, Redis, MinIO)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start infrastructure (PostgreSQL, Redis, MinIO)
docker compose up -d postgres redis minio

# Run database migrations
cd apps/web
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
cd ../..

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Docker Dev (All-in-One)

```bash
docker compose up --build -d
```

Runs web, PostgreSQL, Redis, and MinIO in containers. Hot-reload enabled via volume mounts.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all dev servers (Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:e2e` | Run E2E tests (Playwright) |
| `pnpm format` | Format code with Prettier |

### Admin Panel

Access the admin panel at `/admin` after logging in with an admin account.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `AUTH_SECRET` | Yes | NextAuth.js encryption secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Payments | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Payments | Razorpay secret key |
| `RAZORPAY_WEBHOOK_SECRET` | Payments | Razorpay webhook signature secret |
| `PRINTIFY_API_TOKEN` | Fulfillment | Printify API access token |
| `PRINTIFY_SHOP_ID` | Fulfillment | Printify shop ID |
| `PRINTIFY_WEBHOOK_SECRET` | Fulfillment | Printify webhook secret |
| `SMTP_HOST` | Email | SMTP server hostname |
| `SMTP_USER` | Email | SMTP username |
| `SMTP_PASS` | Email | SMTP password |
| `SMTP_FROM` | Email | Sender email address |
| `MINIO_ENDPOINT` | Storage | MinIO server endpoint |
| `MINIO_ACCESS_KEY` | Storage | MinIO access key |
| `MINIO_SECRET_KEY` | Storage | MinIO secret key |
| `NEXT_PUBLIC_POSTHOG_KEY` | Analytics | PostHog project API key |

## Features

### Storefront
- **Product catalog** — Grid layout with category filtering, search, sort, pagination
- **Product detail** — Image gallery, variant selector (size × color), add to cart
- **Shopping cart** — Persistent cart (localStorage for guests, DB for logged-in users), guest cart merge on login
- **Checkout** — Address form, Razorpay payment, coupon codes
- **CMS pages** — Dynamic pages with block-based content (hero, product grid, text, CTA, newsletter)

### Admin Panel
- **Dashboard** — Stats cards (orders, revenue), recent orders list
- **Products** — Create/edit, variant manager (size, color, price, stock), image management
- **Orders** — Order listing, detail view, status management, submit to Printify
- **Customers** — Searchable customer list with order history and notes
- **CMS** — Page editor with blocks, banner management, collection management
- **Promotions** — Coupon CRUD (percentage, fixed, free shipping)
- **Analytics** — Revenue charts, conversion funnel
- **Settings** — App name, currency, support email
- **Audit Logs** — Searchable activity log

### Backend
- **Authentication** — Email/password with bcrypt, role-based access (admin/customer)
- **Rate limiting** — Per-IP rate limiting on API routes (100 req/60s)
- **Idempotency** — Duplicate payment detection via webhook dedup
- **Fulfillment** — Automatic Printify order submission, webhook-based status updates
- **Email notifications** — Order confirmation, shipping, delivery, cancellation
- **Abandoned cart** — Bull queue for recovery emails
- **Health checks** — Database + Redis connectivity check

## Key Integrations

### Razorpay
- Frontend: Razorpay checkout SDK
- Backend: Order creation, payment verification (HMAC), webhook handler with dedup
- Orders created only after successful payment verification

### Printify
- Product sync, order submission, webhook status updates
- Fulfillment failures captured in dead letter queue (audit log)

## Project Structure

```
├── apps/web/                  # Next.js application
│   ├── app/api/               # API routes (39 endpoints)
│   ├── app/(storefront)/      # Public pages
│   ├── app/admin/             # Admin pages
│   ├── components/            # React components
│   │   ├── ui/                # Base UI (shadcn)
│   │   ├── storefront/        # Public components
│   │   ├── admin/             # Admin components
│   │   └── auth/              # Auth components
│   ├── lib/                   # Business logic
│   │   ├── repositories/      # Data access layer
│   │   ├── services/          # Service layer
│   │   ├── printify/          # Printify API client
│   │   └── email/templates/   # HTML email templates
│   ├── stores/                # Zustand stores
│   ├── providers/             # React context providers
│   ├── types/                 # TypeScript types
│   └── proxy.ts               # Next.js middleware
├── packages/shared/           # Shared types and validation
├── prisma/                    # Database schema and migrations
├── nginx/                     # Production Nginx config
├── tests/                     # Test files
└── docker-compose*.yml        # Docker Compose configs
```

## Database

Schema managed via Prisma. Key models: User, Product, ProductVariant, ProductImage, Category, Cart, CartItem, Order, OrderItem, Payment, Coupon, Collection, Page, Banner, AuditLog.

Run migrations:

```bash
npx prisma migrate dev    # Development (creates + applies)
npx prisma migrate deploy # Production (applies pending)
npx prisma db seed        # Seed data
```

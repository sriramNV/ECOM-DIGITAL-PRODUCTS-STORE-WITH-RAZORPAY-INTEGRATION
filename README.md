# Pod — Digital Products Platform

A full-stack platform to sell digital products (ebooks, software, templates, etc.) with simulated payments, file downloads, and an admin panel.

Built with Next.js 15, PostgreSQL, Redis, MinIO (S3 storage), and Docker.

## Quick Start

```bash
# Prerequisites: Docker, Node.js 20+
git clone <repo> pod && cd pod

# Start everything
docker compose up -d --build

# Open http://localhost:3000
```

Default admin: `admin@example.com` / `admin123` (created by seed).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router), React 19 |
| Styling | Tailwind CSS v3, shadcn/ui, Lucide icons |
| State | Zustand (client cart + theme) |
| Database | PostgreSQL 16 + Prisma ORM |
| Auth | NextAuth v5 (credentials, Google OAuth) |
| Storage | MinIO (S3-compatible) |
| Cache | Redis (rate limiting, sessions) |
| Payments | Simulated (no real gateway needed) |
| Infrastructure | Docker Compose (4 services) |

## Architecture

```
┌────────────────────────────────────────────┐
│           Next.js App (Server Components)   │
│  Storefront  │  Account  │  Admin  │  Auth  │
├────────────────────────────────────────────┤
│              Client Components              │
│  Cart (Zustand)  │  Theme  │  Auth Provider │
├────────────────────────────────────────────┤
│              API Routes (39)                │
│  Products  │  Orders  │  Cart  │  Admin     │
├────────────────────────────────────────────┤
│              Service Layer                  │
│  Payments (simulated)  │  Orders  │  Files  │
├────────────────────────────────────────────┤
│  PostgreSQL  │  Redis  │  MinIO (S3)        │
└────────────────────────────────────────────┘
```

## Features

### Storefront
- Product catalog with category filtering, search, sorting
- Product detail pages with image gallery
- Shopping cart (persisted in localStorage, synced on checkout)
- Checkout with simulated payment (creates order as PAID)
- Dark/light theme with localStorage persistence

### Account
- Order history with status tracking
- Per-file download with signed URLs (rate-limited: 3/hr)
- Bulk "Download All" for all purchased files
- Delete account with full data cascade

### Admin Panel
- Dashboard with stats (orders, revenue, recent orders)
- Product CRUD with image URL management, file upload
- Category management
- Order management with status transitions
- User management

## Project Structure

```
├── apps/web/
│   ├── app/
│   │   ├── (storefront)/   # Public pages (home, products)
│   │   ├── account/        # Account pages
│   │   ├── admin/          # Admin panel
│   │   ├── api/            # 39 API endpoints
│   │   ├── auth/           # Login/register
│   │   ├── cart/           # Cart page
│   │   └── checkout/       # Checkout page
│   ├── components/
│   │   ├── ui/             # Base components (shadcn)
│   │   ├── layout/         # Navbar, Footer
│   │   ├── landing/        # Landing page components
│   │   ├── products/       # Product components
│   │   └── account/        # Account components
│   ├── lib/
│   │   ├── services/       # Business logic
│   │   ├── auth.ts         # NextAuth config
│   │   ├── db.ts           # Prisma client
│   │   ├── guard.ts        # Auth guards
│   │   └── rate-limit.ts   # Redis rate limiter
│   ├── stores/             # Zustand stores
│   └── middleware.ts       # Route protection + security headers
├── prisma/
│   └── schema.prisma       # Database schema (11 models)
├── docker-compose.yml      # All 4 services
├── Dockerfile              # Production build
└── render.yaml             # Render Blueprint
```

## Documentation

| Document | Contents |
|----------|----------|
| [Architecture](docs/architecture.md) | Layered design, data flow, decisions |
| [API Reference](docs/api.md) | All 39 endpoints with schemas |
| [Database](docs/database.md) | Schema, models, queries |
| [Development](docs/development.md) | Setup, commands, troubleshooting |
| [Deployment](docs/deployment-guide.md) | Render, VPS, AWS guides |
| [Security](docs/security.md) | Auth, rate limiting, threat model |
| [Operations](docs/operations.md) | Backup, monitoring, scaling |
| [Components](docs/components.md) | UI component catalog |

## Environment Variables

Set via `.env` (project root for docker-compose) or Render dashboard.

| Variable | Required | Default (dev) | Description |
|----------|----------|---------------|-------------|
| `POSTGRES_PASSWORD` | Yes | `password` | PostgreSQL password |
| `REDIS_PASSWORD` | Yes | `password` | Redis password |
| `MINIO_ROOT_PASSWORD` | Yes | `minioadmin` | MinIO admin password |
| `AUTH_SECRET` | Yes | — | NextAuth signing secret |
| `AUTH_URL` | Yes | `http://localhost:3000` | Public app URL |
| `AUTH_TRUST_HOST` | For Render | `false` | Trust host header |
| `DATABASE_URL` | Auto | — | Postgres connection string |
| `REDIS_URL` | Auto | — | Redis connection string |
| `MINIO_ACCESS_KEY` | — | `minioadmin` | MinIO access key |
| `MINIO_SECRET_KEY` | — | — | MinIO secret key |
| `MINIO_ENDPOINT` | — | `localhost` | MinIO hostname |
| `MINIO_BUCKET` | — | `digital-products` | S3 bucket name |
| `MINIO_USE_SSL` | — | `false` | MinIO SSL toggle |

## Docker Services

| Service | Image | Purpose |
|---------|-------|---------|
| `web` | Custom Dockerfile | Next.js production server (port 3000) |
| `postgres` | postgres:16-alpine | Database (port 5432) |
| `redis` | redis:7-alpine | Rate limiting, caching (port 6379) |
| `minio` | minio/minio | S3-compatible file storage (port 9000) |

## License

MIT

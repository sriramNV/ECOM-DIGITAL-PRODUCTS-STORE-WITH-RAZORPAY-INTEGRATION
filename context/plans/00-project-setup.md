# Phase 0 — Project Setup & Infra

## Objective

Scaffold the entire monorepo, configure Docker infrastructure, establish coding conventions, and initialize all core libraries before any feature code is written.

---

## System Design

### Monorepo Structure

```
pod/
├── apps/
│   └── web/              # Next.js 16 application
├── packages/
│   └── shared/           # Shared types, validation schemas
├── docker-compose.yml    # All infrastructure services
├── Dockerfile            # Production app image
├── .env.example
└── package.json          # Workspace root
```

### Infrastructure Services (Docker Compose)

| Service     | Image                     | Purpose                         | Port   |
|-------------|---------------------------|---------------------------------|--------|
| PostgreSQL  | `postgres:16-alpine`      | Primary database                | 5432   |
| Redis       | `redis:7-alpine`          | Cache, sessions, rate limiting  | 6379   |
| MinIO       | `minio/minio`             | S3-compatible file storage      | 9000   |
| PostHog     | `posthog/posthog:latest`  | Self-hosted analytics           | 8000   |
| Nginx       | `nginx:alpine`            | Reverse proxy, TLS, caching     | 80/443 |

### Dev Workflow

```
Host machine → Docker Desktop
  → docker compose up -d (PostgreSQL, Redis, MinIO)
  → pnpm dev (Next.js runs on host, connects to Docker services)
```

---

## Architecture

### Directory Structure Created

```
apps/web/
├── app/
│   ├── layout.tsx            # Root layout (minimal, just html/body)
│   └── page.tsx              # Placeholder landing page
├── components/
│   └── ui/                   # shadcn/ui primitives (installed via CLI)
├── lib/
│   ├── prisma.ts             # Prisma client singleton
│   ├── redis.ts              # ioredis client
│   ├── logger.ts             # Pino logger
│   └── utils.ts              # cn(), formatCurrency(), formatDate()
├── types/
│   └── index.ts              # Base shared types
├── data/
│   └── site.ts               # Site-wide constants (placeholder)
├── .env.local                # Local environment variables
└── tailwind.config.ts        # (not used — tokens in globals.css)
```

### Initial Prisma Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String?  // hashed, null for OAuth users
  role      Role     @default(CUSTOMER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  CUSTOMER
}
```

### Tailwind v4 Token Structure

Defined in `app/globals.css`:

```css
@import "tailwindcss";

:root {
  --bg: #ffffff;
  --fg: #1a1a2e;
  --accent: #2563eb;
  /* ... all tokens from ui-tokens.md */
}

@theme inline {
  --color-background: var(--bg);
  --color-foreground: var(--fg);
  --color-accent: var(--accent);
  /* ... mapped tokens */
}
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo tool | pnpm workspaces + Turborepo | Fast, disk-efficient, built-in workspace support |
| Prisma vs Drizzle | Prisma | Mature ORM, excellent migration tools, type generation |
| Redis client | ioredis | Battle-tested, cluster support, promise-based |
| Logger | Pino | Fastest Node.js logger, structured JSON output |
| MinIO vs S3 | MinIO (S3-compatible) | Self-hosted, no vendor lock-in, same SDK as S3 |
| shadcn/ui install | Component-by-component via CLI (`--tailwind-v4` flag) | Only install what we use, full source control. TW v4 compatible init. |
| Hot reload | Turbopack (Next.js built-in) | Fastest dev experience with Next.js 16 |
| Test runner | Vitest + React Testing Library + Playwright | Fast, native TypeScript, compatible with Next.js 16 |
| Job queue | Bull (Redis-backed) | Background jobs: abandoned cart, retries, scheduled tasks |
| MinIO buckets | Init script on first boot | `pod-assets` bucket created automatically |

---

## Steps

1. Initialize Next.js 16 with `create-next-app` (TypeScript strict, App Router, Tailwind)
2. Set up pnpm workspace with Turborepo
3. Install core dependencies: `prisma`, `@prisma/client`, `ioredis`, `pino`, `clsx`, `tailwind-merge`, `lucide-react`, `recharts`, `zod`, `bull`, `vitest`, `@testing-library/react`, `@playwright/test`
4. Create `docker-compose.yml` with PostgreSQL, Redis, MinIO
5. Create `apps/web/prisma/schema.prisma` with `User` model
6. Run `pnpm prisma:migrate dev --name init`
7. Create `lib/prisma.ts` (singleton pattern)
8. Create `lib/redis.ts` (ioredis client)
9. Create `lib/logger.ts` (pino with dev transport)
10. Create `lib/utils.ts` (cn, formatCurrency, formatDate)
11. Set up Tailwind v4 tokens in `globals.css`
12. Install shadcn/ui base: `npx shadcn@latest init`
13. Install initial shadcn/ui components with `--tailwind-v4` flag: `button`, `input`, `badge`, `card`, `skeleton`
14. Create `types/index.ts` with base types
15. Create `lib/queue.ts` (Bull queue setup for background jobs)
16. Create `scripts/init-buckets.sh` (MinIO bucket initialization)
17. Create `.env.example` with all required variables
18. Create test config: `vitest.config.ts`, `playwright.config.ts`
19. Create `apps/web/app/api/health/route.ts` (health check endpoint)
20. Verify: `docker compose up -d`, `pnpm dev`, site loads on localhost, health check passes

---

## Files Created

| File | Content |
|------|---------|
| `docker-compose.yml` | PostgreSQL, Redis, MinIO, PostHog, Nginx services |
| `apps/web/prisma/schema.prisma` | Initial User model |
| `apps/web/lib/prisma.ts` | Prisma singleton |
| `apps/web/lib/redis.ts` | Redis client |
| `apps/web/lib/logger.ts` | Pino logger |
| `apps/web/lib/utils.ts` | Utility functions |
| `apps/web/app/globals.css` | Tailwind v4 tokens |
| `apps/web/app/layout.tsx` | Root layout shell |
| `.env.example` | All env variables documented |

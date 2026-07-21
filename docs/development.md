# Development Guide

## Prerequisites

- **Node.js** 20+ (with corepack enabled for pnpm)
- **pnpm** 9+ (`corepack enable && corepack prepare pnpm@9 --activate`)
- **Docker Desktop** (for PostgreSQL, Redis, MinIO in containers)
- **Git**

## Getting Started

### 1. Clone and Install

```bash
git clone <repo-url> pod
cd pod
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration. Key defaults for local development:

| Variable | Default (local) |
|----------|----------------|
| `DATABASE_URL` | `postgresql://pod:password@localhost:5432/pod` |
| `REDIS_URL` | `redis://localhost:6379` |
| `AUTH_SECRET` | Auto-generated random hex string |
| `MINIO_ENDPOINT` | `localhost` |
| `MINIO_ACCESS_KEY` | `minioadmin` |
| `MINIO_SECRET_KEY` | `minioadmin` |

### 3. Start Infrastructure

```bash
docker compose up -d postgres redis minio
```

This starts PostgreSQL (port 5432), Redis (6379), and MinIO (9000 API, 9001 Console).

### 4. Initialize Database

```bash
cd apps/web
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
cd ../..
```

The seed script creates an admin user:

- **Email**: `admin@example.com`
- **Password**: `admin123`

And sample categories (T-Shirts, Hoodies, Accessories) and products.

### 5. Start Dev Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker Development

For a fully containerized environment (no local Node.js needed):

```bash
docker compose up --build -d
```

This builds the web image and starts all 4 services. Hot-reload is enabled via volume mounts for source files. Changes to `apps/web/app/`, `apps/web/components/`, etc. trigger Turbopack rebuilds inside the container.

**Important**: Only source subdirectories are mounted (not `node_modules`) to preserve the Linux symlinks for pnpm workspace packages inside the container.

### View logs

```bash
docker compose logs web -f
```

### Rebuild

```bash
docker compose up --build -d
```

### Stop

```bash
docker compose down
```

## Project Commands

### Root (pnpm workspace)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Production build all apps |
| `pnpm lint` | Lint all apps |
| `pnpm test` | Run Vitest unit tests |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm format` | Format with Prettier |

### apps/web

| Command | Description |
|---------|-------------|
| `pnpm --filter web prisma:seed` | Run database seed |
| `cd apps/web && npx prisma studio` | Open Prisma Studio (DB GUI) |
| `cd apps/web && npx prisma generate` | Regenerate Prisma client after schema change |
| `cd apps/web && npx prisma migrate dev` | Create + apply migration |
| `cd apps/web && npx prisma migrate deploy` | Apply pending migrations |

## Codebase Walkthrough

### Adding a New API Route

1. Create file at `apps/web/app/api/<route>/route.ts`
2. Export `GET`, `POST`, `PUT`, `PATCH`, or `DELETE` functions
3. Add Zod schema validation for request bodies
4. Add `adminGuard()` for admin-only routes
5. Use repositories for data access

### Adding a New Page

1. Create file at `apps/web/app/(storefront)/<path>/page.tsx` (or `apps/web/app/admin/<path>/page.tsx`)
2. Use `async` Server Component for data fetching
3. Use `"use client"` Client Component for interactivity
4. Add to admin sidebar nav in `components/admin/layout/nav-items.ts`

### Adding a New Component

- Base UI components go in `components/ui/`
- Storefront components in `components/storefront/<section>/`
- Admin components in `components/admin/<section>/`

### Adding a New Database Model

1. Add model to `prisma/schema.prisma`
2. Run `cd apps/web && npx prisma migrate dev --name <name>`
3. Create or update the corresponding repository in `lib/repositories/`

## Testing

### Unit Tests (Vitest)

```bash
pnpm test                          # Run all tests
pnpm test -- --reporter=verbose    # Verbose output
pnpm test:watch                    # Watch mode
```

Tests live in `__tests__` directories next to source files.

### E2E Tests (Playwright)

```bash
pnpm test:e2e                      # Run all E2E tests
pnpm test:e2e -- --ui              # UI mode
pnpm test:e2e -- --debug           # Debug mode
```

## Code Style

- **Formatting**: Prettier (semicolons, double quotes, trailing commas, 100 print width)
- **Linting**: ESLint via Next.js
- **Types**: Strict TypeScript, path alias `@/` maps to `apps/web/`
- **Components**: shadcn/ui conventions, CVA for variants, cn() for class merging
- **API Routes**: Zod for validation, try/catch with logger.error, adminGuard for protected routes

## Troubleshooting

### Docker volume mounts break on restart
If `node_modules` symlinks break after container restart, rebuild:
```bash
docker compose down -v && docker compose up --build -d
```

### Prisma migration errors
If a migration fails, reset the database (dev only):
```bash
cd apps/web
npx prisma migrate reset
```

### Port conflicts
If ports 3000, 5432, 6379, or 9000 are already in use, change the host port mapping in `docker-compose.yml` or stop the conflicting service.

### Next.js Turbopack errors
Clear caches and restart:
```bash
rm -rf apps/web/.next
pnpm dev
```

### Redis connection refused
Ensure Redis container is running:
```bash
docker compose ps redis
docker compose logs redis
```

### MinIO connection errors
Ensure MinIO is running and buckets are initialized:
```bash
docker compose ps minio
bash scripts/init-buckets.sh
```

### Printify API rate limits
The Printify client has built-in retry logic for 429 responses. If you see persistent rate limit errors, reduce batch operation sizes.

## Deployment

See `DEPLOYMENT.md` for production deployment with Docker, Nginx, and Let's Encrypt.

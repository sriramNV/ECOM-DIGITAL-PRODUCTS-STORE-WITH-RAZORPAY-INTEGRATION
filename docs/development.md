# Development Guide

## Prerequisites

- **Node.js** 20+ (v22+ recommended for AWS SDK compatibility)
- **pnpm** 9.x (`npm install -g pnpm@9`)
- **Docker Desktop** (required for PostgreSQL, Redis, MinIO)
- **Git**

## Getting Started

### 1. Clone and Install

```bash
git clone <repo-url> pod
cd pod
pnpm install
```

### 2. Configure Environment

Create `.env` in the project root:

```bash
POSTGRES_PASSWORD=password
REDIS_PASSWORD=password
MINIO_ROOT_PASSWORD=minioadmin
AUTH_SECRET=my-local-dev-secret-change-in-prod
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
```

### 3. Start Infrastructure

```bash
docker compose up -d
```

This starts all 4 services: PostgreSQL (5432), Redis (6379), MinIO (9000), and the Next.js app (3000).

### 4. Initialize Database

```bash
docker compose exec web npx prisma db push
docker compose exec web npx prisma db seed
```

The seed creates an admin user:
- **Email**: `admin@example.com`
- **Password**: `admin123`

### 5. Open the App

Visit [http://localhost:3000](http://localhost:3000).

## Development Workflow

### Adding a new API route

1. Create `apps/web/app/api/<route>/route.ts`
2. Export `GET`, `POST`, `PUT`, `PATCH`, or `DELETE`
3. Add Zod schema validation for request bodies
4. Use `adminGuard()` or `userGuard()` for protected routes
5. Use Prisma directly for data access

### Adding a new page

1. Create file at `apps/web/app/<path>/page.tsx`
2. Use `async` Server Component for data fetching with Prisma
3. Use `"use client"` Client Component for interactivity
4. Add links in the navbar or admin sidebar

### Making database changes

1. Edit `prisma/schema.prisma`
2. Run `docker compose exec web npx prisma migrate dev --name <name>`
3. Regenerate client: `docker compose exec web npx prisma generate`

## Project Commands

### Root

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` | Lint (Next.js ESLint) |

### Docker

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start all services |
| `docker compose build web` | Rebuild web image |
| `docker compose logs web -f` | Follow web logs |
| `docker compose down` | Stop all services |
| `docker compose exec web <cmd>` | Run command in web container |

### Database

```bash
docker compose exec web npx prisma studio       # DB GUI
docker compose exec web npx prisma generate      # Regenerate client
docker compose exec web npx prisma migrate dev   # Create migration
docker compose exec web npx prisma db push       # Push schema (dev)
docker compose exec web npx prisma db seed       # Seed data
```

## Code Style

- **Formatting**: Prettier (semicolons, double quotes, trailing commas)
- **Linting**: ESLint via Next.js
- **Types**: Strict TypeScript, path alias `@/` maps to `apps/web/`
- **Components**: shadcn/ui conventions, CVA for variants, `cn()` for class merging
- **API Routes**: Zod for validation, try/catch error handling, guards for auth
- **Server Components**: Default — async, direct Prisma access
- **Client Components**: Opt-in with `"use client"` — Zustand for shared state

## Troubleshooting

### Docker container restarts in a loop
The pnpm version is incompatible with Node.js. Fix:
```bash
docker compose build --no-cache web
docker compose up -d
```

### Prisma migration errors
```bash
docker compose exec web npx prisma migrate reset
```

### Port conflicts
Change host ports in `docker-compose.yml` if 3000, 5432, 6379, or 9000 are in use.

### MinIO connection refused
```bash
docker compose logs minio
# Ensure MINIO_ROOT_PASSWORD env var is set
```

### Redis connection errors
```bash
docker compose logs redis
# Ensure REDIS_PASSWORD env var matches between redis and web services
```

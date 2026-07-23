# Docker Service Split: Web + Worker

**Date:** 2026-07-22
**Status:** Draft

## Problem

The current Docker setup builds a single image containing the entire Next.js application (frontend, API routes, background job processing, email services). This has several drawbacks:

- **Large image size** — Every deploy includes Next.js compiler, all dev dependencies, and code for processes that don't need them
- **No independent scaling** — Background job processing scales with web traffic, not job queue depth
- **Single point of failure** — A crash in job processing takes down the web frontend and vice versa
- **Slow builds** — Every change to any part of the app triggers a full rebuild of the entire image

## Goals

1. Separate Docker images for web serving and background job processing
2. Smaller, faster builds per service
3. Independent deployment and scaling
4. Zero changes to existing business logic or API routes
5. Shared monorepo — both images built from `apps/web/` source

## Architecture

```
┌──────────────────────┐     ┌───────────────────────┐     ┌─────────────────┐
│   Dockerfile.web     │     │   Dockerfile.worker   │     │  Infra Services │
│  (Next.js prod)      │     │   (Bull queue proc)   │     │                 │
│                      │     │                       │     │  postgres:5432  │
│  - SSR + Frontend    │     │  - Abandoned cart     │     │  redis:6379     │
│  - API routes        │     │  - Future: email      │     │  minio:9000     │
│  - Webhooks          │     │  - Future: fulfillment │     │                 │
│                      │     │                       │     │                 │
│  PORT 3000           │     │  (no HTTP)            │     │                 │
│  Scale: traffic      │     │  Scale: queue depth   │     │                 │
└──────────────────────┘     └───────────────────────┘     └─────────────────┘
```

## Service Boundaries

### Web Service (Dockerfile.web)

- Next.js 16 production server (`output: standalone`)
- Handles all HTTP traffic: SSR, API routes, webhooks
- Exposes port 3000
- Does NOT run background job processors

### Worker Service (Dockerfile.worker)

- Long-lived Node.js process
- Runs Bull queue processors (abandoned cart, future workers)
- No HTTP server — pure background processing
- Connects to same PostgreSQL and Redis instances
- Shares Prisma client, logger, email service, and all repository code with web service

## Files

### Create: `apps/web/lib/jobs/worker.ts`

Standalone entry point for the worker container:

- Imports `ensureAbandonedCartWorker` from `./abandoned-cart`
- Calls it to register the Bull processor
- Keeps process alive (Bull uses Redis polling internally — no timer needed)
- Handles SIGTERM/SIGINT for graceful shutdown
- Room to add more workers: `ensureFulfillmentWorker()`, `ensureEmailWorker()`

### Create: `apps/web/Dockerfile` (renamed from previous scratch `Dockerfile`)

Multi-stage production build:

| Stage | Base | Actions |
|-------|------|---------|
| `deps` | `node:22-alpine` | Install pnpm, copy package files, `pnpm install --frozen-lockfile` |
| `prisma` | `deps` | Copy Prisma schema, `prisma generate` |
| `build` | `prisma` | Copy app source, `next build` |
| `runner` | `node:22-alpine` | Copy `.next/standalone` + `public/` + `.next/static`, run `node server.js` |

- Requires `next.config.js` to have `output: "standalone"`
- .dockerignore excludes node_modules, .next, .git, tests

### Create: `apps/web/Dockerfile.worker`

Two-stage build:

| Stage | Base | Actions |
|-------|------|---------|
| `deps` | `node:22-alpine` | Install pnpm, copy package files, `pnpm install --frozen-lockfile`, `prisma generate` |
| `runner` | `node:22-alpine` | Copy `node_modules`, `prisma/`, `lib/` (source), run `node lib/jobs/worker.js` |

The worker runs the TypeScript source directly via `tsx` or is pre-compiled. Since `apps/web/` uses Turbopack/Next.js compilation, the simplest approach is to use `tsx` as the runtime for the worker entry point (no build step needed).

### Modify: `docker-compose.yml`

Add `worker` service:

```yaml
worker:
  build:
    context: ./apps/web
    dockerfile: Dockerfile.worker
  environment:
    - NODE_ENV=production
    - DATABASE_URL=${DATABASE_URL}
    - REDIS_URL=${REDIS_URL}
    - SMTP_HOST=${SMTP_HOST}
    - SMTP_PORT=${SMTP_PORT}
    - SMTP_USER=${SMTP_USER}
    - SMTP_PASS=${SMTP_PASS}
    - SMTP_FROM=${SMTP_FROM}
    - RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
    - RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
    - PRINTIFY_API_TOKEN=${PRINTIFY_API_TOKEN}
    - PRINTIFY_SHOP_ID=${PRINTIFY_SHOP_ID}
    - PRINTIFY_WEBHOOK_SECRET=${PRINTIFY_WEBHOOK_SECRET}
    - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    - NEXTAUTH_URL=${NEXTAUTH_URL}
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_started
  restart: unless-stopped
```

Rename existing web service from `web` to `web` (keep name), update its build to use `Dockerfile` (no `.dev`).

### Modify: `apps/web/package.json`

Add script:
```json
"start:worker": "tsx lib/jobs/worker.ts"
```

## Environment Variables

Both services share the same environment variables. No new env vars needed.

## What Does NOT Change

- All existing business logic (services, repositories, API routes) — zero modifications
- Prisma schema — untouched
- Test files — unchanged (tests run outside Docker)
- `.env` file — same format
- Postgres, Redis, Minio services — unchanged

## Future Extensibility

The worker entry point is designed to accept additional workers:

```ts
// worker.ts
import { ensureAbandonedCartWorker } from "./abandoned-cart";
import { ensureFulfillmentWorker } from "./fulfillment-worker";
import { ensureEmailWorker } from "./email-worker";

ensureAbandonedCartWorker();
ensureFulfillmentWorker();
ensureEmailWorker();
// ...
```

Each worker is a separate module with a consistent `ensure*Worker()` signature, making them easy to add, remove, or test independently.

## Rollout Strategy

1. Create `worker.ts` entry point
2. Create `Dockerfile` (web) — production multi-stage build
3. Create `Dockerfile.worker` — worker build
4. Update `docker-compose.yml` with worker service
5. Build and test both images
6. Deploy web first, then worker

## Testing

- Worker container can be tested by sending a Bull job to Redis and verifying processing
- Web container tested by hitting health endpoint
- Integration tests in CI should run against both services

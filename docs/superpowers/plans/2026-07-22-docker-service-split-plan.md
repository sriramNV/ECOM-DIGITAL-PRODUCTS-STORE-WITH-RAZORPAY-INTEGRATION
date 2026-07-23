# Docker Service Split: Web + Worker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the monolithic Docker image into two independently deployable services — a web server (Next.js) and a background worker (Bull queue processor) — with smaller, faster builds per service.

**Architecture:** Monorepo with two Dockerfiles under `apps/web/`. Web uses multi-stage Next.js standalone output. Worker uses `tsx` to run a TypeScript entry point that registers Bull queue processors. Both share the same codebase, Prisma schema, and dependencies.

**Tech Stack:** Docker multi-stage builds, Next.js 16 standalone output, tsx, Bull, Prisma, pnpm workspaces

## Global Constraints

- All existing business logic, API routes, and tests must remain untouched
- Both images built from `apps/web/` context using the same monorepo
- Worker entry point must resolve `@/*` TypeScript path aliases at runtime — tsx v4+ handles this natively from `tsconfig.json`
- Prisma client must be generated during Docker build
- `next.config.ts` already has `output: "standalone"` when `NODE_ENV=production`
- `tsx` is in devDependencies — worker image must install devDeps

---

### Task 1: Create worker entry point + package.json script

**Files:**
- Create: `apps/web/lib/jobs/worker.ts`
- Modify: `apps/web/package.json` (add script)

**Interfaces:**
- Consumes: `ensureAbandonedCartWorker()` from `./abandoned-cart` (existing — signature: `() => Queue`)
- Produces: Runable entry point at `lib/jobs/worker.ts`

- [ ] **Step 1: Create worker entry point**

```ts
// apps/web/lib/jobs/worker.ts
import { ensureAbandonedCartWorker } from "./abandoned-cart";
import { logger } from "@/lib/logger";

ensureAbandonedCartWorker();
logger.info("Worker process ready — abandoned cart processor registered");

process.on("SIGTERM", () => {
  logger.info("Worker received SIGTERM, shutting down");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("Worker received SIGINT, shutting down");
  process.exit(0);
});
```

- [ ] **Step 2: Add start:worker script to package.json**

Add to `apps/web/package.json` scripts:
```json
"start:worker": "tsx lib/jobs/worker.ts"
```

- [ ] **Step 3: Verify worker starts locally (non-Docker)**

```bash
Set-Location apps/web
npx tsx lib/jobs/worker.ts
```

Expected: Logs "Worker process ready — abandoned cart processor registered", process stays alive. Press Ctrl+C to stop.

Note: Will likely fail if Redis isn't running locally. That's OK for now — the file creation and import resolution is the goal.

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/jobs/worker.ts apps/web/package.json
git commit -m "feat: add standalone worker entry point for background job processing"
```

---

### Task 2: Fix .dockerignore + create production Dockerfile for web

**Files:**
- Modify: `.dockerignore`
- Create: `apps/web/Dockerfile.web`

**Interfaces:**
- Consumes: `apps/web/next.config.ts` (already has `output: "standalone"`), root `prisma/schema.prisma`
- Produces: Production Docker image for Next.js web service

- [ ] **Step 0: Fix `.dockerignore` to not exclude `apps/web/Dockerfile.web`**

Current `.dockerignore` has a `Dockerfile` pattern that matches any file named exactly `Dockerfile` at any depth. Since our new file is named `Dockerfile.web`, it won't match — but the pattern is confusing. Tighten it to only match at the repo root:

Change `Dockerfile` in `.dockerignore` to `/Dockerfile`

This ensures only a `Dockerfile` at the repo root is excluded, not future Dockerfiles in subdirectories.

- [ ] **Step 1: Create `apps/web/Dockerfile.web`**

```dockerfile
# Stage 1: Base
FROM node:22-alpine AS base
RUN apk add --no-cache openssl libcrypto3 libssl3 && corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install

# Stage 3: Prisma client
FROM deps AS prisma
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npx prisma generate --schema=./prisma/schema.prisma

# Stage 4: Build Next.js
FROM prisma AS builder
WORKDIR /app/apps/web
COPY apps/web/ ./
RUN mkdir -p .next && chown -R node:node .next
USER node
ENV NODE_ENV=production
RUN pnpm exec next build

# Stage 5: Runner
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl libcrypto3 libssl3
WORKDIR /app

ENV NODE_ENV=production

# Copy standalone output (includes server.js entry point + traced deps)
COPY --from=builder /app/apps/web/.next/standalone ./
# Static chunks must be copied separately (not traced by standalone)
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

# server.js at standalone root does process.chdir(__dirname) then loads the app
CMD ["node", "server.js"]
```

- [ ] **Step 2: Build the image**

```bash
Set-Location D:\Projects\web\pod
docker build -t pod-web:latest -f apps/web/Dockerfile.web .
```

Expected: Build completes successfully. Image contains standalone Next.js output.

If build fails because a page uses `generateStaticParams` that queries Postgres/Redis at build time, skip those pages or mock the DB connection in the build env. For now, note the failure and proceed — the Dockerfile structure is correct.

- [ ] **Step 3: Commit**

```bash
git add .dockerignore apps/web/Dockerfile.web
git commit -m "feat: add production Dockerfile for Next.js web service"
```

---

### Task 3: Create Dockerfile for worker

**Files:**
- Create: `apps/web/Dockerfile.worker`

**Interfaces:**
- Consumes: `apps/web/lib/jobs/worker.ts` from Task 1, root `prisma/schema.prisma`
- Produces: Production Docker image for worker service

- [ ] **Step 1: Create `apps/web/Dockerfile.worker`**

```dockerfile
# Stage 1: Dependencies + build
FROM node:22-alpine AS builder
RUN apk add --no-cache openssl libcrypto3 libssl3 && corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install

# Prisma client (schema is at repo root)
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy worker source
COPY apps/web/lib/ ./apps/web/lib/
COPY apps/web/tsconfig.json ./apps/web/tsconfig.json
COPY apps/web/next-env.d.ts ./apps/web/next-env.d.ts

# Stage 2: Runner
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl libcrypto3 libssl3
WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/apps/web/lib ./apps/web/lib
COPY --from=builder /app/apps/web/tsconfig.json ./apps/web/tsconfig.json
COPY --from=builder /app/apps/web/next-env.d.ts ./apps/web/next-env.d.ts
COPY --from=builder /app/prisma ./prisma

CMD ["npx", "tsx", "apps/web/lib/jobs/worker.ts"]
```

- [ ] **Step 2: Build the image**

```bash
Set-Location D:\Projects\web\pod
docker build -t pod-worker:latest -f apps/web/Dockerfile.worker .
```

Expected: Build completes. Image is smaller than web image (no Next.js build output). Contains only worker-relevant code.

- [ ] **Step 3: Commit**

```bash
git add apps/web/Dockerfile.worker
git commit -m "feat: add Dockerfile for background worker service"
```

---

### Task 4: Update docker-compose.yml with worker service

**Files:**
- Modify: `docker-compose.yml`

**Interfaces:**
- Consumes: worker Docker image from Task 3
- Produces: Runnable worker service alongside existing infra

- [ ] **Step 1: Add worker service to docker-compose.yml**

Add after the `web` service block (before `postgres`):

```yaml
  worker:
    build:
      context: .
      dockerfile: apps/web/Dockerfile.worker
    container_name: pod-worker
    env_file: .env
    environment:
      - DATABASE_URL=postgresql://pod:password@postgres:5432/pod
      - REDIS_URL=redis://redis:6379
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - SMTP_FROM=${SMTP_FROM}
      - RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
      - RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
      - RAZORPAY_WEBHOOK_SECRET=${RAZORPAY_WEBHOOK_SECRET}
      - PRINTIFY_API_TOKEN=${PRINTIFY_API_TOKEN}
      - PRINTIFY_SHOP_ID=${PRINTIFY_SHOP_ID}
      - PRINTIFY_WEBHOOK_SECRET=${PRINTIFY_WEBHOOK_SECRET}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - LOG_LEVEL=${LOG_LEVEL:-info}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
```

- [ ] **Step 2: Verify docker-compose config is valid**

```bash
Set-Location D:\Projects\web\pod
docker compose config
```

Expected: Output shows parsed compose file with `web`, `worker`, `postgres`, `redis`, `minio` services — no errors.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add worker service to docker-compose.yml"
```

---

### Task 5: Full integration test — build and run both services

**Files:**
- All files from Tasks 1-4

- [ ] **Step 1: Build both images**

```bash
Set-Location D:\Projects\web\pod
docker compose build
```

- [ ] **Step 2: Start all services**

```bash
docker compose up -d
```

- [ ] **Step 3: Verify web service is healthy**

```bash
docker compose ps
curl -s -o NUL -w "%{http_code}" http://localhost:3000
```

Expected: HTTP 200 from web service.

- [ ] **Step 4: Verify worker service logs show successful startup**

```bash
docker compose logs worker
```

Expected: Worker logs show "Worker process ready — abandoned cart processor registered" (or similar). Process stays alive.

- [ ] **Step 5: Tear down**

```bash
docker compose down
```

- [ ] **Step 6: Commit any final adjustments**

```bash
git add -A
git commit -m "fix: adjust Docker configurations after integration test"
```

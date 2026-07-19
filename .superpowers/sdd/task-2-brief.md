# Task 1.2: Set up Docker infrastructure

**Plan:** Plan 01 — Foundation & Project Setup
**Depends on:** Monorepo scaffold from Task 1.1
**Produces:** Running PostgreSQL 16, Redis 7, MinIO containers

## Files to Create

- `docker-compose.yml`
- `Dockerfile`
- `scripts/init-buckets.sh`

## Steps

### Step 1: Create docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: pod-postgres
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: pod
      POSTGRES_USER: pod
      POSTGRES_PASSWORD: password
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pod"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: pod-redis
    ports: ["6379:6379"]
    volumes: [redisdata:/data]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  minio:
    image: minio/minio
    container_name: pod-minio
    ports: ["9000:9000", "9001:9001"]
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes: [miniodata:/data]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  pgdata:
  redisdata:
  miniodata:
```

### Step 2: Create Dockerfile (multi-stage)

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN corepack enable && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
```

### Step 3: Create scripts/init-buckets.sh

```bash
#!/bin/bash
# MinIO bucket initialization — runs on first app boot
mc alias set podminio http://minio:9000 minioadmin minioadmin
mc mb podminio/pod-assets --ignore-existing
mc policy set public podminio/pod-assets
echo "MinIO buckets initialized"
```

### Step 4: Start Docker services

```bash
docker compose up -d
```

Expected: `docker compose ps` shows postgres, redis, minio all healthy.

## Notes

- This is production-adjacent Docker infrastructure — PostgreSQL for the database, Redis for caching/jobs, MinIO for file storage
- The Dockerfile is for production deployment (multi-stage)
- MinIO init script assumes mc (MinIO client) is installed
- No need to run Docker if it's not available — the files just need to be created

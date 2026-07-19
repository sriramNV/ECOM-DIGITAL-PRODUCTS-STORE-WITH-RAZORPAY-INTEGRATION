# Phase 7c — Deployment & Documentation

## Objective

Set up production deployment — multi-stage Docker build, Docker Compose production config, Nginx reverse proxy with TLS, database backup strategy, monitoring, and comprehensive documentation.

---

## System Design

### Production Architecture

```
┌────────────────────────────────────────────────────────────┐
│                        VPS (Ubuntu 24.04)                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Docker Compose (production)             │   │
│  │                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │   │
│  │  │  Nginx    │ │  App     │ │  Postgres │ │ Redis  │ │   │
│  │  │ :443/80  │ │ :3000    │ │  :5432   │ │ :6379  │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │  MinIO   │ │ PostHog  │ │  Loki    │            │   │
│  │  │  :9000   │ │ :8000    │ │ :3100    │            │   │
│  │  └──────────┘ └──────────┘ └──────────┘            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Backup Volumes                          │   │
│  │  /data/postgres → pg_dump → S3/MinIO (daily)        │   │
│  │  /data/minio    → rclone sync → S3 (daily)          │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Multi-Stage Dockerfile

```dockerfile
# Dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN corepack enable && pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
```

### Docker Compose (Production)

```yaml
# docker-compose.prod.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./certbot/www:/var/www/certbot
      - ./certbot/conf:/etc/letsencrypt
    depends_on: [app]
    restart: unless-stopped

  app:
    build: .
    env_file: .env.production
    environment:
      - DATABASE_URL=postgresql://pod:${DB_PASSWORD}@postgres:5432/pod
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - POSTHOG_HOST=http://posthog:8000
    depends_on: [postgres, redis, minio]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  postgres:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=pod
      - POSTGRES_USER=pod
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pod"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    volumes:
      - miniodata:/data
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 5

  posthog:
    image: posthog/posthog:latest
    depends_on: [postgres, redis]
    env_file: .env.production
    environment:
      - DATABASE_URL=postgresql://pod:${DB_PASSWORD}@postgres:5432/pod?sslmode=disable
      - REDIS_URL=redis://redis:6379/
    volumes:
      - posthogdata:/var/lib/postgresql/data
    restart: unless-stopped

  loki:
    image: grafana/loki:latest
    ports: [3100:3100]
    volumes: [lokidata:/data]

volumes:
  pgdata:
  redisdata:
  miniodata:
  posthogdata:
  lokidata:
```

### Nginx Configuration

```nginx
# nginx/conf.d/pod.conf
upstream app {
    server app:3000;
}

server {
    listen 80;
    server_name podstore.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name podstore.example.com;

    ssl_certificate /etc/letsencrypt/live/podstore.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/podstore.example.com/privkey.pem;

    include /etc/nginx/conf.d/security-headers.conf;
    include /etc/nginx/conf.d/ssl-params.conf;

    # Static asset caching
    location /_next/static {
        proxy_pass http://app;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /images {
        proxy_pass http://app;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API routes (no caching)
    location /api {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Everything else
    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    }
}
```

### Backup Strategy

```bash
#!/bin/bash
# scripts/backup.sh

# PostgreSQL backup
pg_dump -h localhost -U pod -d pod > /tmp/pod-db-$(date +%Y%m%d).sql
gzip /tmp/pod-db-$(date +%Y%m%d).sql
aws s3 cp /tmp/pod-db-$(date +%Y%m%d).sql.gz s3://pod-backups/database/

# MinIO backup (via rclone)
rclone sync minio:/pod-assets s3://pod-backups/assets/

# Keep only last 30 days
find /tmp -name "pod-db-*.sql.gz" -mtime +30 -delete

# Retention: daily backups for 30 days, then weekly for 6 months
# Implemented via S3 lifecycle policies or cron logic
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Deployment mode | Docker Compose on single VPS | Simple, all services in one place, easy to manage |
| Next.js output | `output: "standalone"` | Self-contained, no Next.js server needed |
| TLS | Let's Encrypt (certbot) | Free, automated renewal |
| Database backup | pg_dump + S3 sync | Simple, reliable, off-server |
| MinIO backup | rclone sync | Incremental, supports S3 as target |
| Monitoring | Grafana + Loki (logs) + Docker healthcheck | Self-hosted, open-source |
| CI/CD | GitHub Actions → SSH deploy | Automate build + deploy |

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with: { node-version: 20 }

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - name: Deploy to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          source: ".,!node_modules,!apps/web/.next/cache"
          target: /opt/pod

      - name: Restart services
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/pod
            docker compose -f docker-compose.prod.yml up --build -d
            docker system prune -f
```

---

## Steps

1. Create multi-stage `Dockerfile` for Next.js
2. Create `docker-compose.prod.yml` with all services
3. Create Nginx config with security headers + TLS
4. Set up Let's Encrypt (certbot) for SSL
5. Create `.env.production.example` with all variables
6. Create `scripts/backup.sh` with database + file backup
7. Configure `output: "standalone"` in next.config.js
8. Set up GitHub Actions deploy workflow
9. Provision VPS (Ubuntu, Docker, Docker Compose)
10. Initial deploy: clone repo, set env, `docker compose up -d`
11. Run Prisma migrations on production: `docker compose exec app npx prisma migrate deploy`
12. Verify: HTTPS works, all features functional, health check passes
13. Set up monitoring (Grafana dashboard for Loki logs)
14. Document deployment in `DEPLOYMENT.md`

---

## Files Created

| File | Content |
|------|---------|
| `Dockerfile` | Multi-stage Docker build |
| `docker-compose.prod.yml` | Production Compose config |
| `nginx/conf.d/pod.conf` | Nginx reverse proxy config |
| `nginx/conf.d/security-headers.conf` | CSP + security headers |
| `nginx/conf.d/ssl-params.conf` | SSL/TLS parameters |
| `scripts/backup.sh` | Database + file backup script |
| `.env.production.example` | All required env variables |
| `.github/workflows/deploy.yml` | CI/CD pipeline |
| `DEPLOYMENT.md` | Deployment documentation |

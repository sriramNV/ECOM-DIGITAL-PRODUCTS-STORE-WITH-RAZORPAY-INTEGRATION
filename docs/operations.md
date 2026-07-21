# POD E-Commerce — Operations Runbook

## 1. Infrastructure Overview

The application runs via Docker Compose with five services:

| Service | Image/Base | Role | Exposed Ports |
|---|---|---|---|
| `web` / `app` | Node.js 20 (Next.js standalone) | Next.js application server (SSR, API routes) | 3000 |
| `postgres` | postgres:16-alpine | Primary database (orders, users, products, carts) | 5432 |
| `redis` | redis:7-alpine | Job queues (Bull), session cache | 6379 |
| `minio` | minio/minio | S3-compatible object storage (product images, assets) | 9000 (API), 9001 (Console) |
| `nginx` | nginx:alpine | Reverse proxy, SSL termination, static asset caching (production only) | 80, 443 |

**Volumes:** `pgdata`, `redisdata`, `miniodata` — all Docker-managed named volumes.

---

## 2. Deployment

### 2.1 Production Setup

```bash
# Clone the repository
git clone https://github.com/your-org/pod.git /opt/pod
cd /opt/pod

# Configure environment
cp .env.production.example .env.production
# Edit .env.production with real secrets

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Set up SSL with Certbot
docker run --rm -v ./certbot/www:/var/www/certbot \
  -v ./certbot/conf:/etc/letsencrypt certbot/certbot \
  certonly --webroot -w /var/www/certbot -d podstore.example.com

# Reload nginx to pick up certs
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### 2.2 Docker Compose Production Config (`docker-compose.prod.yml`)

- **`app`**: Built from `Dockerfile` (multi-stage: deps → builder → runner). Runs as `nextjs` user (UID 1001). Uses `.env.production` for configuration. Health check hits `GET /api/health` every 30s.
- **`postgres`**: Configurable password via `${DB_PASSWORD}`. Named volume `pgdata` for persistence.
- **`redis`**: Named volume `redisdata`. Default config.
- **`minio`**: Credentials from `${MINIO_ACCESS_KEY}` / `${MINIO_SECRET_KEY}`. Named volume `miniodata`.
- **`nginx`**: Mounts `./nginx/conf.d/` and Certbot directories. Depends on `app`.

### 2.3 Nginx Configuration

Located in `nginx/conf.d/`:

- **`pod.conf`** — Reverse proxy to upstream `app:3000`:
  - Port 80 → permanent redirect to HTTPS
  - Port 443 with SSL + HTTP/2
  - `/_next/static` → proxy + 365-day immutable cache
  - `/api` and `/` → proxy with `X-Forwarded-*` headers
- **`security-headers.conf`** — CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS
- **`ssl-params.conf`** — TLS protocols (v1.2–1.3), ciphers, OCSP stapling, session cache

Key CSP directives: allows `checkout.razorpay.com` for scripts/frames, `api.razorpay.com` for connections.

### 2.4 Required Environment Variables (production)

Variables marked with `*` require real values for production:

| Variable | Purpose |
|---|---|
| `DB_PASSWORD` | PostgreSQL password |
| `AUTH_SECRET` | NextAuth secret (64-char random) |
| `RAZORPAY_KEY_ID` * | Razorpay API key |
| `RAZORPAY_KEY_SECRET` * | Razorpay secret key |
| `RAZORPAY_WEBHOOK_SECRET` * | Webhook verification key |
| `PRINTIFY_API_TOKEN` * | Printify API token |
| `PRINTIFY_SHOP_ID` * | Printify shop ID |
| `PRINTIFY_WEBHOOK_SECRET` * | Webhook verification key |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` * | Email (SMTP) |
| `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` * | MinIO credentials |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` * | PostHog analytics |

### 2.5 Dockerfile Build Stages

1. **`deps`** — Install pnpm dependencies with `--frozen-lockfile`
2. **`builder`** — Run `pnpm build` (Next.js build)
3. **`runner`** — Minimal runtime image with standalone Next.js output (`apps/web/.next/standalone`), non-root `nextjs` user, `NODE_ENV=production`, telemetry disabled

---

## 3. Monitoring

### 3.1 Health Check Endpoint

`GET /api/health` — Internal-only (blocked to non-private IPs). Checks:

- **Database**: `SELECT 1` via Prisma
- **Redis**: `PING` via ioredis

Returns `200 {"status":"healthy","checks":{"database":"ok","redis":"ok"}}` or `503` with error details.

Used by Docker Compose health checks and can be integrated with external uptime monitors.

### 3.2 Logging

**Pino** structured JSON logging configured in `apps/web/lib/logger.ts`:

- **Level**: `LOG_LEVEL` env var (default: `info` in production, `debug` in development)
- **Format**: JSON in production; formatted with `pino-pretty` in development
- **Redacted fields**: `req.headers.authorization`, `req.headers.cookie`, `body.password`
- **Usage**: `logger.info({ key: "value" }, "message")` throughout the codebase

View logs:
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Single service
docker compose -f docker-compose.prod.yml logs -f app

# Tail with timestamps
docker compose -f docker-compose.prod.yml logs -f --tail=100 -t
```

### 3.3 Analytics

**PostHog** is configured both client-side and server-side:

- **Client**: `posthog-js` initialized in `<PostHogProvider>` at the app layout level. Captures page views automatically via route change handler.
- **Server**: `posthog-node` instance in `apps/web/lib/analytics.ts`. Used for server-side event capture (order completions, signups, etc.).

Configure via `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`.

---

## 4. Backup and Restore

### 4.1 Database Backup

`scripts/backup.sh` performs:

1. `pg_dump $DATABASE_URL | gzip` → `/tmp/pod-pg-{timestamp}.sql.gz`
2. `rclone copy` to object storage remote `pod-backups:postgres/{timestamp}/`
3. Cleans up local temp file

**Setup:**
```bash
# Configure rclone remote
rclone config
# Add remote named "pod-backups" pointing to your S3/Backblaze/etc.

# Schedule via cron (runs daily at 3 AM)
0 3 * * * cd /opt/pod && DATABASE_URL=postgresql://... ./scripts/backup.sh >> /var/log/pod-backup.log 2>&1
```

### 4.2 MinIO Bucket Initialization

`scripts/init-buckets.sh` runs on first boot:

```bash
mc alias set podminio http://minio:9000 "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}"
mc mb podminio/pod-assets --ignore-existing
mc policy set public podminio/pod-assets
```

Creates the `pod-assets` bucket with public read access for serving product images.

### 4.3 Restore Procedure

```bash
# 1. Download the latest backup from object storage
rclone copy pod-backups:postgres/20250101-030000/ /tmp/

# 2. Decompress
gunzip -c /tmp/pod-pg-20250101-030000.sql.gz > /tmp/restore.sql

# 3. Restore to database
# Get the Postgres container name
docker compose -f docker-compose.prod.yml ps
# Copy dump into container
docker compose -f docker-compose.prod.yml cp /tmp/restore.sql postgres:/tmp/
# Restore
docker compose -f docker-compose.prod.yml exec postgres psql -U pod -d pod -f /tmp/restore.sql

# 4. Restart app to clear any stale cache
docker compose -f docker-compose.prod.yml restart app
```

---

## 5. Queue Management (Bull)

### 5.1 Queues

Defined in `apps/web/lib/queue.ts`:

| Queue | Redis Key | Purpose |
|---|---|---|
| `abandoned-cart` | `bull:abandoned-cart:*` | Finds carts >24h old with items and no orders, sends recovery emails |
| `email` | `bull:email:*` | Transactional email sending (orders, shipping notifications, etc.) |
| `fulfillment` | `bull:fulfillment:*` | Printify order submission, webhook processing |

All queues connect via `REDIS_URL` environment variable.

### 5.2 Queue Processing

**Abandoned cart** (`apps/web/lib/jobs/abandoned-cart.ts`):
- Processes every 24h by default
- Finds carts where `updatedAt > 24h`, has items, user has no orders
- Sends recovery email via `emailService.sendAbandonedCart()`
- Logs success/failure per cart

**Fulfillment** (`apps/web/lib/services/fulfillment-service.ts`):
- Submits paid orders to Printify API
- Handles webhook events: `sent-to-production` → `PRINTING`, `shipment:created` → `SHIPPED`, `shipment:delivered` → `DELIVERED`
- Sends shipment/delivery notifications via email

### 5.3 Dead Letter Queue

Fulfillment failures are recorded to the **dead letter store** (PostgreSQL `audit_log` table with `action = "fulfillment_failed"`):

```sql
-- View dead letter entries
SELECT * FROM audit_log WHERE action = 'fulfillment_failed' ORDER BY created_at DESC LIMIT 50;
```

Dead letters are written when:
- Order is missing a shipping address
- Printify API call fails (network error, invalid variant, etc.)

### 5.4 Monitoring Queues

```bash
# Check queue job counts via Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli \
  --scan --pattern 'bull:*' | while read k; do \
    echo "$k: $(redis-cli llen "$k")"; done

# View stalled jobs (keys starting with bull:{queue}:*
# Specifically check the "failed" and "waiting" lists)
```

You can also use a tool like **Bull Board** for a web UI. To add it, install `bull-board` and mount it under a protected admin route.

---

## 6. Common Operations

### 6.1 Viewing Logs

```bash
# Follow all logs
docker compose -f docker-compose.prod.yml logs -f

# Filter a specific service
docker compose -f docker-compose.prod.yml logs -f app

# Last 200 lines with timestamps
docker compose -f docker-compose.prod.yml logs --tail=200 -t app

# Search within logs (since pino outputs JSON, pipe to jq)
docker compose -f docker-compose.prod.yml logs app | grep "error"
docker compose -f docker-compose.prod.yml logs app | jq 'select(.level >= 40)'
```

### 6.2 Restarting Services

```bash
# Restart a single service
docker compose -f docker-compose.prod.yml restart app

# Restart all services
docker compose -f docker-compose.prod.yml restart

# Graceful restart (avoid dropping connections — nginx will buffer)
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### 6.3 Running Migrations

The project likely uses Prisma. Run migrations against the production database:

```bash
# Run pending migrations
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# If you need to generate the Prisma client
docker compose -f docker-compose.prod.yml exec app npx prisma generate
```

### 6.4 Scaling Considerations

- **Next.js (app)**: Horizontally scale by adding replicas in `docker-compose.prod.yml`. Nginx upstream will load-balance.
- **Postgres**: For read-heavy workloads, add read replicas. For write-heavy, consider connection pooling (PgBouncer sidecar).
- **Redis**: Single instance sufficient for queue + session use case. For HA, use Redis Sentinel or Redis Cluster.
- **MinIO**: Runs in standalone mode. For production HA, deploy MinIO in distributed mode across multiple nodes.
- **Nginx**: Single instance. Behind a cloud load balancer for multi-region setups.

### 6.5 SSL Certificate Renewal

Certbot certificates expire after 90 days. Set up a cron job for automatic renewal:

```bash
# Manual renewal
docker run --rm \
  -v ./certbot/www:/var/www/certbot \
  -v ./certbot/conf:/etc/letsencrypt \
  certbot/certbot renew

docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

# Cron: runs twice daily (Certbot checks expiry internally)
0 0,12 * * * docker run --rm -v /opt/pod/certbot/www:/var/www/certbot -v /opt/pod/certbot/conf:/etc/letsencrypt certbot/certbot renew && docker compose -f /opt/pod/docker-compose.prod.yml exec nginx nginx -s reload >> /var/log/certbot-renew.log 2>&1
```

---

## 7. Troubleshooting

### 7.1 Database Connection Issues

**Symptoms**: `docker compose logs app` shows `Can't reach database server` or Prisma connection errors. Health check returns `database: "error"`.

**Steps:**
```bash
# 1. Check if Postgres is running
docker compose -f docker-compose.prod.yml ps postgres

# 2. Test direct connectivity
docker compose -f docker-compose.prod.yml exec app \
  npx prisma db execute --stdin <<< "SELECT 1"

# 3. Check Postgres logs
docker compose -f docker-compose.prod.yml logs postgres

# 4. Verify DATABASE_URL in .env.production
#    Format: postgresql://pod:${DB_PASSWORD}@postgres:5432/pod
#    Note: hostname is "postgres" (Docker service name), not "localhost"

# 5. Restart Postgres if needed
docker compose -f docker-compose.prod.yml restart postgres
```

### 7.2 MinIO Connection Issues

**Symptoms**: Image uploads fail. `MINIO_ENDPOINT` errors in logs.

**Steps:**
```bash
# 1. Verify MinIO is running
docker compose -f docker-compose.prod.yml ps minio

# 2. Check MinIO console at http://host:9001
#    Credentials from MINIO_ACCESS_KEY / MINIO_SECRET_KEY

# 3. Check the pod-assets bucket exists
docker compose -f docker-compose.prod.yml exec minio \
  mc ls podminio/pod-assets

# 4. Verify MINIO_ENDPOINT is set to "minio" (Docker service name)
#    Not "localhost" — containers resolve each other by service name

# 5. For the Next.js client (browser), MINIO_PUBLIC_URL must be
#    externally accessible (e.g., https://assets.podstore.example.com)
```

### 7.3 Printify API Failures

**Symptoms**: Orders stuck in `PAID` status. `fulfillment_failed` entries in audit log.

**Steps:**
```bash
# 1. Check dead letter queue
docker compose -f docker-compose.prod.yml exec app \
  npx prisma db execute --stdin <<< "SELECT entity_id, metadata FROM audit_log WHERE action = 'fulfillment_failed' ORDER BY created_at DESC LIMIT 20;"

# 2. Verify Printify credentials
#    PRINTIFY_API_TOKEN, PRINTIFY_SHOP_ID must be valid

# 3. Check product variants have printifyVariantId set
#    Missing variant IDs cause submission failures

# 4. Manually retry a failed fulfillment
#    Re-submit the order by updating its status back to PAID
#    or triggering the fulfillment queue job again
```

### 7.4 Razorpay Webhook Failures

**Symptoms**: Orders not transitioning to `PAID` after payment. Payment confirmed in Razorpay dashboard but not in POD.

**Steps:**
```bash
# 1. Verify webhook secret matches between Razorpay dashboard and .env.production
#    RAZORPAY_WEBHOOK_SECRET

# 2. Check the webhook endpoint URL
#    Must be https://podstore.example.com/api/webhooks/razorpay
#    (publicly accessible from Razorpay's servers)

# 3. Check nginx logs for incoming webhook requests
docker compose -f docker-compose.prod.yml logs nginx | grep webhook

# 4. Check app logs for webhook processing errors
docker compose -f docker-compose.prod.yml logs app | grep -i razorpay

# 5. Verify the webhook payload signature matches
#    Signature verification failure = credential mismatch
```

### 7.5 Redis Connection Issues

**Symptoms**: Bull queues not processing. `abandoned-cart` emails not sending. Session errors.

**Steps:**
```bash
# 1. Check Redis is running
docker compose -f docker-compose.prod.yml ps redis

# 2. Test connectivity
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
# Expected response: PONG

# 3. Verify REDIS_URL
#    Format: redis://redis:6379 (Docker service name, not localhost)

# 4. Check memory usage
docker compose -f docker-compose.prod.yml exec redis redis-cli info memory

# 5. Flush queues (destructive — only if queues are stuck)
# docker compose -f docker-compose.prod.yml exec redis redis-cli FLUSHALL
```

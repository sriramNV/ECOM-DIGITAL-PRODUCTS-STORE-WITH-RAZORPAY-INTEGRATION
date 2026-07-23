# Deployment Guide

## Architecture

```
Browser ──HTTPS──► Reverse Proxy ──► Web (Next.js) ──┬── PostgreSQL
                                                      ├── Redis
                                                      └── MinIO (S3 storage)
```

All internal services communicate over a private network. Only the web service (port 3000) is exposed.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Docker | 24+ | Container runtime |
| Docker Compose | 2.20+ | Service orchestration |
| Domain | — | DNS pointed to server IP |

## Environment Variables

Required variables (create `.env.production` from `.env.example`):

| Variable | Purpose |
|----------|---------|
| `POSTGRES_PASSWORD` | Database password |
| `REDIS_PASSWORD` | Redis password |
| `MINIO_ROOT_PASSWORD` | MinIO admin password |
| `AUTH_SECRET` | NextAuth JWT signing key (`openssl rand -hex 32`) |
| `AUTH_URL` | Public URL (e.g. `https://shop.example.com`) |
| `AUTH_TRUST_HOST` | Set to `true` on Render/fly.io |

## Provider Guides

---

### Render (Easiest — Docker + Managed Services)

Render doesn't run `docker compose`, so you deploy each service individually:

| Your docker-compose service | On Render |
|-----------------------------|-----------|
| `postgres` | Render Managed PostgreSQL |
| `redis` | Render Managed Redis |
| `minio` | Background Worker + Render Disk |
| `web` | Web Service from your Dockerfile |

#### Option A: Blueprint (render.yaml — already included)

Push the repo to GitHub, connect to Render. `render.yaml` auto-detects.

#### Option B: Manual Dashboard

1. **PostgreSQL**: New → PostgreSQL → name: `pod-db`. Copy internal connection string.
2. **Redis**: New → Redis → name: `pod-redis`. Copy internal connection string.
3. **MinIO Worker**: New → Background Worker → Docker → `minio/minio` → command: `minio server /data --console-address ":9001"` → attach 10GB Disk at `/data` → set `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`.
4. **Web Service**: New → Web Service → connect GitHub repo → Dockerfile path: `./Dockerfile` → set env vars:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Internal Postgres connection string |
| `REDIS_URL` | Internal Redis connection string |
| `MINIO_ENDPOINT` | `pod-minio` (Render internal hostname) |
| `MINIO_PORT` | `9000` |
| `MINIO_ACCESS_KEY` | `minioadmin` |
| `MINIO_SECRET_KEY` | same as step 3 |
| `MINIO_BUCKET` | `digital-products` |
| `MINIO_USE_SSL` | `false` |
| `AUTH_SECRET` | `openssl rand -hex 32` output |
| `AUTH_URL` | `https://<your-app>.onrender.com` |
| `AUTH_TRUST_HOST` | `true` |

5. **Migrations**: Open web service Shell → `npx prisma db push`

Cost: ~$28/mo (Starter web + worker + Postgres + Redis)

---

### VPS (DigitalOcean Droplet, Hetzner, Linode)

#### 1. Provision Server
2 vCPU, 2GB RAM, 50GB SSD. Ubuntu 24.04 LTS.

#### 2. Install Docker
```bash
curl -fsSL https://get.docker.com | bash
apt-get install -y docker-compose-plugin
```

#### 3. Clone and Deploy
```bash
git clone <repo> /opt/pod && cd /opt/pod
set -a; source .env.production; set +a
docker compose up -d --build
```

#### 4. Nginx Reverse Proxy
```nginx
server {
    listen 443 ssl http2;
    server_name shop.example.com;

    ssl_certificate /etc/letsencrypt/live/shop.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shop.example.com/privkey.pem;

    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    client_max_body_size 100M;
}
```

---

### Railway

1. Push to GitHub
2. New Project → Deploy from GitHub
3. Add PostgreSQL plugin (auto-provides `DATABASE_URL`)
4. Add Redis plugin (auto-provides `REDIS_URL`)
5. Set env vars: `AUTH_SECRET`, `AUTH_URL`, MinIO settings
6. For file storage, deploy `minio/minio` as another service + volume

---

### AWS ECS Fargate

1. Build and push Docker image to ECR
2. Create ECS task definition with the web image
3. Use RDS for PostgreSQL, ElastiCache for Redis, S3 for file storage
4. Set up ALB with HTTPS in front of the ECS service

## Post-Deployment Tasks

1. **Run migrations**: `npx prisma db push` or `npx prisma migrate deploy`
2. **Verify HTTPS**: Visit your domain
3. **Test auth**: Register → Login → Session persists
4. **Create a product**: Admin panel → New product with file upload
5. **Test purchase**: Add to cart → Checkout → Order appears in account
6. **Test download**: Paid order shows download button
7. **Test account deletion**: Account page → Delete account

## Updating

```bash
git pull
docker compose up -d --build web
```

## Database Backups

```bash
docker compose exec postgres pg_dump -U pod digital-products > backup.sql
```

## Monitoring

- Set up uptime monitoring on `https://yourdomain.com/api/health`
- For production: add Sentry (`npm install @sentry/nextjs`)

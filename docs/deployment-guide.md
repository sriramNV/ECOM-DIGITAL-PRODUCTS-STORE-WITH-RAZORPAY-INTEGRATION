# Deployment Guide — Pod (Digital Products Platform)

## Architecture Overview

```
                          ┌──────────────┐
                          │   Browser    │
                          └──────┬───────┘
                                 │ HTTPS
                          ┌──────▼───────┐
                          │  Reverse     │
                          │  Proxy       │  (Cloudflare, Nginx, ALB)
                          │  (TLS term)  │
                          └──────┬───────┘
                                 │
                          ┌──────▼───────┐
                          │   Web (Next) │  :3000
                          │   pod-web    │
                          └──┬───┬───┬───┘
                             │   │   │
                    ┌────────┘   │   └────────┐
                    ▼            ▼            ▼
             ┌──────────┐ ┌──────────┐ ┌──────────┐
             │ Postgres │ │  Redis   │ │  MinIO   │
             │  :5432   │ │  :6379   │ │ :9000    │
             └──────────┘ └──────────┘ └──────────┘
```

All internal services communicate over a private Docker network. Only the web service (port 3000) is exposed to the reverse proxy.

---

## Prerequisites

| Tool     | Version | Purpose                    |
|----------|---------|----------------------------|
| Docker   | 24+     | Container runtime          |
| Docker Compose | 2.20+ | Service orchestration   |
| Domain   | —       | DNS pointed to server IP   |

---

## Pre-Deployment: Fix Critical Issues

Before deploying to any cloud provider, fix these in your local repo:

### 1. Rotate all default credentials

Edit `docker-compose.yml`:
```yaml
services:
  postgres:
    environment:
      POSTGRES_USER: pod
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}         # no hardcoded value
  minio:
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
  web:
    environment:
      DATABASE_URL: postgresql://pod:${POSTGRES_PASSWORD}@postgres:5432/digital-products
      MINIO_ACCESS_KEY: ${MINIO_ROOT_USER}
      MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:?must be set}  # no default
      NEXTAUTH_URL: ${NEXTAUTH_URL}
```

### 2. Close internal service ports

Remove host port mappings for Postgres, Redis, and MinIO:
```yaml
# postgres: remove → ports: ["5432:5432"]
# minio: remove → ports: ["9001:9001"]  (keep 9000 if needed for external SDK access)
# redis: remove → ports: ["6379:6379"]
```

### 3. Run container as non-root

Add to `Dockerfile` before `EXPOSE`:
```dockerfile
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs
```

### 4. Generate a strong AUTH_SECRET

```bash
openssl rand -hex 32
# Copy the output — this will be your NEXTAUTH_SECRET / AUTH_SECRET
```

### 5. Secure Redis

In `docker-compose.yml`:
```yaml
redis:
  command: redis-server --requirepass ${REDIS_PASSWORD}
  environment:
    REDIS_PASSWORD: ${REDIS_PASSWORD}
```

---

## Environment Variables

Create a `.env.production` file in the project root (DO NOT commit it):

```bash
# PostgreSQL
POSTGRES_PASSWORD=<random-20-chars>

# Redis
REDIS_PASSWORD=<random-20-chars>

# Auth
NEXTAUTH_SECRET=<openssl rand -hex 32 output>
NEXTAUTH_URL=https://yourdomain.com
AUTH_GOOGLE_ID=<from Google Cloud Console>
AUTH_GOOGLE_SECRET=<from Google Cloud Console>

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=<random-20-chars>

# Razorpay (optional — simulated payment works without it)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Load it before deploying: `export $(grep -v '^#' .env.production | xargs)`

---

## Provider-Specific Guides

---

### Option A: DigitalOcean App Platform (Simplest)

1. Push code to GitHub
2. In DO App Platform → Create App → GitHub
3. Select repo, branch
4. **No Dockerfile needed** — use these settings:
   - **Type:** Web Service
   - **Run Command:** `npm run build && npm run start`
   - **HTTP Port:** 3000
   - **Build Command:** leave blank (uses package.json scripts)
5. Add these services via DO Managed Databases:
   - PostgreSQL (managed)
   - Redis (managed)
6. Add Spaces (S3-compatible object storage) for MinIO replacement
7. Set environment variables from the table above
8. Enable HTTPS (auto)
9. Deploy

**Cost:** ~$15-25/mo (app) + $15/mo (Postgres) + $15/mo (Redis) + $5/mo (Spaces)

---

### Option B: VPS (DigitalOcean Droplet, AWS EC2, Linode, Hetzner)

#### 1. Provision Server

Minimum spec: 2 vCPU, 2GB RAM, 50GB SSD
Ubuntu 22.04 / 24.04 LTS recommended

#### 2. Install Dependencies

```bash
ssh root@<server-ip>

# Install Docker
curl -fsSL https://get.docker.com | bash

# Install Docker Compose plugin
apt-get update && apt-get install -y docker-compose-plugin

# Verify
docker --version && docker compose version
```

#### 3. Clone & Configure

```bash
git clone <your-repo-url> /opt/pod
cd /opt/pod

# Create production env file
cat > .env.production << 'EOF'
POSTGRES_PASSWORD=<random>
REDIS_PASSWORD=<random>
NEXTAUTH_SECRET=<random-64-hex>
NEXTAUTH_URL=https://yourdomain.com
MINIO_ROOT_PASSWORD=<random>
EOF

# Create docker-compose.override.yml with secure settings
cat > docker-compose.override.yml << 'EOF'
services:
  postgres:
    ports: []                                    # no host exposure
  redis:
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports: []
  minio:
    ports: ["9000:9000"]                         # only API port
  web:
    ports: ["127.0.0.1:3000:3000"]              # only localhost
EOF
```

#### 4. Deploy

```bash
set -a; source .env.production; set +a
docker compose pull
docker compose up -d --build
```

#### 5. Set Up Reverse Proxy (Nginx)

```bash
apt-get install -y nginx certbot python3-certbot-nginx

cat > /etc/nginx/sites-available/pod << 'EOF'
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL — certbot fills these
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header Referrer-Policy strict-origin-when-cross-origin;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    client_max_body_size 100M;
}
EOF

ln -s /etc/nginx/sites-available/pod /etc/nginx/sites-enabled/
certbot --nginx -d yourdomain.com
nginx -t && systemctl reload nginx
```

---

### Option C: AWS ECS with Fargate

#### 1. Create ECR Repositories

```bash
aws ecr create-repository --repository-name pod-web
aws ecr create-repository --repository-name pod-postgres
aws ecr create-repository --repository-name pod-redis
aws ecr create-repository --repository-name pod-minio
```

#### 2. Build & Push Images

```bash
docker build -t pod-web .
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker tag pod-web:latest <account>.dkr.ecr.<region>.amazonaws.com/pod-web:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/pod-web:latest
```

For Postgres, Redis, MinIO — use AWS-managed alternatives instead of self-hosting:
- **Postgres** → AWS RDS PostgreSQL
- **Redis** → AWS ElastiCache Redis
- **MinIO** → AWS S3 (update `lib/services/files/index.ts` to use S3 client directly)

#### 3. Create ECS Task Definition

```json
{
  "family": "pod-web",
  "networkMode": "awsvpc",
  "executionRoleArn": "arn:aws:iam::<account>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<account>:role/ecsTaskRole",
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [{
    "name": "web",
    "image": "<account>.dkr.ecr.<region>.amazonaws.com/pod-web:latest",
    "portMappings": [{ "containerPort": 3000, "protocol": "tcp" }],
    "environment": [
      { "name": "NODE_ENV", "value": "production" },
      { "name": "DATABASE_URL", "value": "postgresql://..." },
      { "name": "REDIS_URL", "value": "redis://..." },
      { "name": "NEXTAUTH_SECRET", "value": "..." },
      { "name": "NEXTAUTH_URL", "value": "https://pod.yourdomain.com" }
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/pod-web",
        "awslogs-region": "<region>",
        "awslogs-stream-prefix": "web"
      }
    }
  }]
}
```

#### 4. Deploy with Service

```bash
aws ecs create-service \
  --cluster pod \
  --service-name web \
  --task-definition pod-web:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[...],securityGroups=[...],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=...,containerName=web,containerPort=3000"
```

#### 5. ALB + HTTPS

- Create an Application Load Balancer in front of the ECS service
- Add TLS certificate via AWS Certificate Manager
- Point your domain's CNAME to the ALB DNS name

---

### Option D: Render (Docker — Deploy the Image Directly)

Render supports deploying from a Dockerfile as a **Web Service**. Since Render doesn't run `docker compose`, you deploy each component separately and connect them via Render's internal networking.

#### Architecture on Render

```
Browser ──► pod-web (Web Service, Docker) ──┬── Render Managed Postgres
                                             ├── Render Managed Redis
                                             └── pod-minio (Worker, Docker) + Render Disk
```

#### Step 1: Fork & Prepare Repo

A `render.yaml` (Blueprint) is already included in the repo — it defines all services. But you can also set up manually:

#### Step 2: Set Up Manually via Dashboard

**A. Create Managed PostgreSQL**
- Render Dashboard → New → PostgreSQL
- Name: `pod-db`, Database: `digital-products`, User: `pod`
- After creation, copy the **Internal Connection String** — it looks like: `postgresql://pod:...@pod-db.internal:5432/digital-products`

**B. Create Managed Redis**
- Render Dashboard → New → Redis
- Name: `pod-redis`
- After creation, copy the **Internal Connection String**: `rediss://red-...:6379`

**C. Create MinIO Background Worker**
- Render Dashboard → New → Background Worker
- Name: `pod-minio`
- **Environment:** Docker
- **Docker Command:** `minio server /data --console-address ":9001"`
- **Docker Context:** `.` (repo root)
- **Plan:** Starter (512 MB RAM — MinIO is lightweight)
- **Disk:** Name: `minio-data`, Mount Path: `/data`, Size: 10 GB
- **Environment Variables:**
  - `MINIO_ROOT_USER`: `minioadmin`
  - `MINIO_ROOT_PASSWORD`: `<generate a strong password>`
  - `MINIO_BROWSER`: `off`
- Deploy. After it starts, note its internal hostname: `pod-minio` (Render uses service names as internal DNS)

**D. Create Web Service (Next.js)**
- Render Dashboard → New → Web Service
- Connect your GitHub repo
- **Name:** `pod-web`
- **Environment:** Docker
- **Dockerfile Path:** `./Dockerfile`
- **Plan:** Starter
- **Health Check Path:** `/api/health`
- **Environment Variables:**

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `<internal Postgres connection string from step A>` |
| `REDIS_URL` | `<internal Redis connection string from step B>` |
| `MINIO_ENDPOINT` | `pod-minio` (internal hostname) |
| `MINIO_PORT` | `9000` |
| `MINIO_ACCESS_KEY` | `minioadmin` |
| `MINIO_SECRET_KEY` | `<same password from step C>` |
| `MINIO_BUCKET` | `digital-products` |
| `MINIO_USE_SSL` | `false` |
| `NEXTAUTH_SECRET` | `<openssl rand -hex 32>` |
| `NEXTAUTH_URL` | `https://pod-web.onrender.com` |
| `AUTH_TRUST_HOST` | `true` |
| `RAZORPAY_KEY_ID` | `dummy` |
| `RAZORPAY_KEY_SECRET` | `dummy` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `dummy` |

- Deploy

#### Step 3: Run Database Migrations

After the web service deploys, open its **Shell** tab in Render Dashboard and run:
```bash
npx prisma db push
```

#### Step 4: Configure Custom Domain (Optional)

- In your web service → Settings → Domains
- Add your domain (e.g., `shop.yourdomain.com`)
- Point your domain's CNAME to `pod-web.onrender.com`
- Render provisions a TLS certificate automatically

#### Step 5: Verify

- Visit `https://pod-web.onrender.com`
- Register an account
- Create a product (check the database seed or admin panel)
- Purchase and download
- Check MinIO files are being stored on the disk

#### Updating

Render auto-deploys when you push to the connected branch. Or manually:
```bash
git push
# Render picks it up automatically
```

To re-run migrations after an update:
```bash
# In Render web service Shell:
npx prisma db push
```

#### MinIO on Render — Important Notes

- MinIO runs as a **Background Worker** (not a Web Service) because it needs a persistent Disk
- The Disk retains data across deploys but NOT across service deletion
- If you need S3 compatibility without self-hosting MinIO, swap to:
  - **AWS S3** (update `lib/services/files/index.ts`)
  - **Backblaze B2** (S3-compatible, cheaper)
  - **Cloudflare R2** (S3-compatible, no egress fees)

#### Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "UntrustedHost" error | `AUTH_TRUST_HOST` not set | Add env var with value `true` |
| 500 on file download | MinIO not reachable | Verify `pod-minio` hostname resolves in Render internal network |
| White screen on login | `NEXTAUTH_URL` mismatch | Ensure it matches the Render URL exactly (trailing slash matters) |
| "ECONNREFUSED" on build | DB not ready during build | This is normal — build doesn't need DB. The build logs show it but the site works |

Cost: ~$7/mo (Starter web) + $7/mo (Starter worker) + $7/mo (Postgres) + $7/mo (Redis) = ~$28/mo total. Upgrade plans for production traffic.

---

### Option E: Railway.app (Easiest for Small Deployments)

1. Push to GitHub
2. In Railway → New Project → Deploy from GitHub repo
3. Add these plugins (click "New" → "Plugin"):
   - **PostgreSQL plugin** (auto-provides `DATABASE_URL`)
   - **Redis plugin** (auto-provides `REDIS_URL`)
4. Set environment variables in Railway dashboard:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`
5. For file storage, use Railway Volumes or MinIO (deploy as separate service)
6. Railway auto-generates a `*.railway.app` domain; set `NEXTAUTH_URL` to it
7. Add a custom domain in Railway settings if needed

**Cost:** ~$5-20/mo depending on resource usage

---

### Option E: Fly.io

1. Install flyctl: `curl -fsSL https://fly.io/install.sh | bash`
2. Create `fly.toml`:

```toml
app = "pod"
primary_region = "iad"
kill_signal = "SIGTERM"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

[[services]]
  protocol = "tcp"
  internal_port = 3000
  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true
  [[services.ports]]
    port = 443
    handlers = ["tls"]
```

3. Create Fly Postgres, Redis, and Minio apps:
```bash
fly postgres create --name pod-db
fly redis create --name pod-redis
# For storage, use Fly Volumes for MinIO
```

4. Deploy:
```bash
fly secrets set NEXTAUTH_SECRET=<value> NEXTAUTH_URL=https://pod.fly.dev ...
fly deploy
```

---

## Database Migrations

On first deploy, run migrations:

```bash
# VPS / self-managed
docker compose exec web npx prisma db push

# Railway / Fly / App Platform
# Add a one-off task:
npx prisma db push
```

If deploying with zero downtime, use:
```bash
docker compose exec web npx prisma migrate deploy
```

---

## Post-Deployment Checklist

- [ ] HTTPS working (visit https://yourdomain.com)
- [ ] Auth flow: register → login → session persists
- [ ] Admin: create a product with file upload
- [ ] Purchase flow: add to cart → checkout → order appears in account
- [ ] Download: paid order shows download button
- [ ] Account: delete account works
- [ ] Security headers present (use `curl -I https://yourdomain.com`)
- [ ] No internal ports exposed (use `nmap -p- <server-ip>`)
- [ ] Redis port not accessible externally
- [ ] Postgres not accessible externally
- [ ] Rate limiting works (rapid login attempts blocked)
- [ ] Monitoring set up (uptime check on /api/health)

---

## Database Backups

### Option 1: Automatic via dedicated container

Add to `docker-compose.yml`:
```yaml
pgbackup:
  image: prodrigestivill/postgres-backup-local:16-alpine
  environment:
    POSTGRES_HOST: postgres
    POSTGRES_DB: digital-products
    POSTGRES_USER: pod
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    SCHEDULE: "@daily"
    BACKUP_DIR: /backups
  volumes:
    - ./backups:/backups
```

### Option 2: Manual

```bash
docker compose exec postgres pg_dump -U pod digital-products > backup_$(date +%Y%m%d).sql
```

---

## Monitoring & Alerts

### Health endpoint

The app exposes `GET /api/health`. Set up external monitoring (e.g., UptimeRobot, BetterStack) to check it every minute.

### Application logs

```bash
docker compose logs -f web
```

For production, configure log shipping (CloudWatch, Papertrail, Loki) by adding a logging driver to `docker-compose.yml`:
```yaml
logging:
  driver: awslogs
  options:
    awslogs-group: /pod/web
    awslogs-region: us-east-1
```

### Error tracking

Add Sentry:
```bash
npm install @sentry/nextjs
npx sentry-wizard -i nextjs
```

---

## Scaling

### Vertical (simplest)
Increase server resources (CPU/RAM). The app handles ~500 concurrent users on 2 vCPU / 2GB RAM.

### Horizontal (multi-instance)
The app is stateless (sessions in JWT, cart in zustand/localStorage). Scale by:
1. Running multiple web containers behind a reverse proxy
2. Ensuring `REDIS_URL` points to a shared Redis instance
3. Using a shared Postgres (already externalized)
4. Using S3-compatible storage (already externalized via MinIO)

**Important for multi-instance**: Ensure `NEXTAUTH_URL` matches the public-facing URL, not the container hostname.

---

## Updating

```bash
cd /opt/pod
git pull
set -a; source .env.production; set +a
docker compose up -d --build web
```

For zero-downtime: run two instances and use rolling updates via your reverse proxy.

---

## Security Checklist

| Check | Status |
|-------|--------|
| All default passwords changed | ☐ |
| `NEXTAUTH_SECRET` has no fallback default | ☐ |
| Internal ports not exposed to host | ☐ |
| Container runs as non-root user | ☐ |
| HTTPS enforced (redirect HTTP → HTTPS) | ☐ |
| CSP, HSTS, X-Frame-Options headers set | ☐ |
| Redis requires password | ☐ |
| `.env.production` NOT in git | ☐ |
| Rate limiting on login/register | ☐ |
| File upload size limits configured | ☐ |
| Database backups configured | ☐ |
| Monitoring/Uptime check configured | ☐ |
| Node.js updated to v22 (AWS SDK warning) | ☐ |

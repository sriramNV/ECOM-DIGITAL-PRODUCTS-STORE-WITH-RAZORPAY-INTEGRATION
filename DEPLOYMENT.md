# Deployment

## Prerequisites

- Docker and Docker Compose v2+ installed on the VPS
- A domain (e.g. podstore.example.com) pointing to the VPS IP
- Ports 80 and 443 open in the firewall
- Git

## Production Architecture

```
                         ┌─────────────┐
                         │   Internet   │
                         └──────┬──────┘
                                │ 443 (HTTPS)
                         ┌──────┴──────┐
                         │    Nginx    │
                         │  (reverse   │
                         │   proxy)    │
                         └──────┬──────┘
                                │ 3000
                         ┌──────┴──────┐
                         │   Web app   │
                         │  (Next.js)  │
                         └──────┬──────┘
                ┌───────────────┼───────────────┐
                │               │               │
         ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐
         │ PostgreSQL  │ │    Redis    │ │    MinIO    │
         │   (data)    │ │ (cache/q)   │ │  (storage)  │
         └─────────────┘ └─────────────┘ └─────────────┘
```

## Steps

### 1. Clone the repo

```bash
git clone https://github.com/your-org/pod.git /opt/pod
cd /opt/pod
```

### 2. Configure environment

```bash
cp .env.production.example .env.production
```

Edit `.env.production` with your production values. Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `AUTH_SECRET` | NextAuth encryption secret (generate with `openssl rand -hex 32`) |
| `RAZORPAY_KEY_ID` | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret |
| `PRINTIFY_API_TOKEN` | Printify API access token |
| `PRINTIFY_SHOP_ID` | Printify shop ID |
| `PRINTIFY_WEBHOOK_SECRET` | Printify webhook secret |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Email SMTP |
| `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | Object storage |

### 3. Initialize MinIO buckets (first deployment only)

```bash
docker compose -f docker-compose.prod.yml run --rm web bash /app/scripts/init-buckets.sh
```

### 4. Start services

```bash
docker compose -f docker-compose.prod.yml up -d
```

This starts: postgres, redis, minio, web (Next.js), nginx.

### 5. Run database migrations

```bash
docker compose -f docker-compose.prod.yml exec web npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec web npx prisma db seed
```

### 6. Set up SSL with Certbot

```bash
# Initial certificate
docker run --rm -v ./certbot/www:/var/www/certbot \
  -v ./certbot/conf:/etc/letsencrypt certbot/certbot \
  certonly --webroot -w /var/www/certbot -d podstore.example.com

# Reload nginx to pick up the certificate
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### 7. Verify

Visit `https://podstore.example.com` — the storefront should load, and `https://podstore.example.com/api/health` should return `{"status":"healthy"}`.

## SSL Renewal

Certbot certificates expire after 90 days. Set up a cron job for automatic renewal:

```bash
# Edit crontab: sudo crontab -e
0 3 * * * cd /opt/pod && docker run --rm -v ./certbot/www:/var/www/certbot -v ./certbot/conf:/etc/letsencrypt certbot/certbot renew && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## Updates

```bash
cd /opt/pod
git pull
docker compose -f docker-compose.prod.yml build web
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec web npx prisma migrate deploy
```

## Backups

### Database

A backup script is provided at `scripts/backup.sh`:

```bash
# Configure rclone remote first, then:
bash scripts/backup.sh
```

The script uses `pg_dump` to create a compressed SQL dump and pushes it to object storage via `rclone`.

### Automated backup (cron)

```bash
# Edit crontab: crontab -e
0 2 * * * cd /opt/pod && bash scripts/backup.sh >> /var/log/pod-backup.log 2>&1
```

## Monitoring

### Health check

```bash
curl https://podstore.example.com/api/health
# {"status":"healthy","checks":{"database":"ok","redis":"ok"}}
```

### Logs

```bash
docker compose -f docker-compose.prod.yml logs -f web     # App logs
docker compose -f docker-compose.prod.yml logs -f nginx    # Nginx access/error
docker compose -f docker-compose.prod.yml logs -f postgres # Database logs
```

### Resource usage

```bash
docker stats                                   # Container resource usage
docker compose -f docker-compose.prod.yml top  # Container processes
```

## Nginx Configuration

Nginx serves as a reverse proxy with:
- TLS 1.2/1.3 with strong ciphers
- CSP headers allowing Razorpay scripts
- HSTS (31536000s)
- Static asset caching
- Gzip compression
- 10MB max body size for image uploads

Configuration files are in `nginx/`.

## Production Environment Variables

See `.env.production.example` for the complete list. Key production differences from dev:
- `NODE_ENV=production`
- Strong `AUTH_SECRET`
- Real SMTP credentials
- Production Razorpay keys (not test keys)
- Domain-appropriate `NEXTAUTH_URL`

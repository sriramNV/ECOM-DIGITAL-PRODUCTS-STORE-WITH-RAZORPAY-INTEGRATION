# Operations Guide

## Docker Management

### Health Checks

All services have health checks configured. Check status:

```bash
docker compose ps
# All services should show "(healthy)"
```

### View Logs

```bash
docker compose logs web -f       # Follow web logs
docker compose logs postgres     # Database logs
docker compose logs redis        # Cache logs
docker compose logs minio        # Storage logs
```

### Restart a Service

```bash
docker compose restart web
```

### Rebuild and Redeploy

```bash
git pull
docker compose build web
docker compose up -d web
```

### Full Reset

```bash
docker compose down -v           # Stops all + deletes volumes
docker compose up -d             # Fresh start
docker compose exec web npx prisma db push
docker compose exec web npx prisma db seed
```

## Database Backups

### Automatic (Docker)

Add a backup container to `docker-compose.yml`:

```yaml
pgbackup:
  image: prodrigestivill/postgres-backup-local:16-alpine
  environment:
    POSTGRES_HOST: postgres
    POSTGRES_DB: digital_estore
    POSTGRES_USER: pod
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    SCHEDULE: "@daily"
    BACKUP_DIR: /backups
  volumes:
    - ./backups:/backups
```

### Manual

```bash
docker compose exec postgres pg_dump -U pod digital_estore > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
cat backup_20260101.sql | docker compose exec -T postgres psql -U pod digital_estore
```

## File Storage Backups

MinIO data lives in the `minio_data` Docker volume. Backup options:

### Docker Volume Backup

```bash
docker run --rm -v minio_data:/source -v ./backups:/backup alpine \
  tar czf /backup/minio-$(date +%Y%m%d).tar.gz -C /source .
```

### S3 Sync (if using AWS S3/Backblaze/Cloudflare)

Use `rclone` or `aws s3 sync` to mirror the bucket.

## Monitoring

### Health Endpoint

The app exposes `GET /api/health`. Set up external monitoring (UptimeRobot, BetterStack, Pingdom) to check it every minute.

### Application Logs

For production, configure log shipping (CloudWatch, Papertrail, Loki):

```yaml
# In docker-compose.yml web service
logging:
  driver: awslogs
  options:
    awslogs-group: /pod/web
    awslogs-region: us-east-1
```

### Error Tracking

Add Sentry for production error monitoring:

```bash
npm install @sentry/nextjs
npx sentry-wizard -i nextjs
```

## Scaling

### Vertical (Simplest)
Increase server resources (CPU/RAM). The app handles ~500 concurrent users on 2 vCPU / 2GB RAM.

### Horizontal (Multi-instance)
The app is stateless (sessions in JWT, cart in zustand/localStorage, no server-side render cache for user-specific pages).

To scale:
1. Run multiple web containers behind a reverse proxy (Nginx, ALB, Traefik)
2. Ensure `REDIS_URL` points to a shared Redis instance
3. Use a shared PostgreSQL (already externalized)
4. Use S3-compatible storage (already externalized via MinIO)

**Important**: `AUTH_URL` must match the public-facing URL, not the container hostname.

## Updating

```bash
cd /opt/pod
git pull
set -a; source .env.production; set +a
docker compose up -d --build web
```

For zero-downtime updates: run two instances behind a load balancer, update one at a time.

## Deployment Options

See [Deployment Guide](deployment-guide.md) for:
- **Render** (Docker, easiest)
- **VPS + Nginx** (DigitalOcean, Hetzner, Linode)
- **AWS ECS Fargate** (scalable, managed)
- **Railway** (simple, good for small deployments)
- **Fly.io** (edge-deployed)

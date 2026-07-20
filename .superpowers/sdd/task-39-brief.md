# Task 9.3: Production deployment setup

**Plan:** Plan 09 lines 265-401
**Files:**
- `docker-compose.prod.yml`
- `nginx/conf.d/pod.conf`
- `scripts/backup.sh`
- `scripts/init-buckets.sh`
- `.env.production.example`
- `.github/workflows/deploy.yml`
- `DEPLOYMENT.md`

Note: `Dockerfile` already exists from Plan 01. Don't recreate it.

Full code for docker-compose, nginx config, CI/CD in plan lines 277-397.

For DEPLOYMENT.md: Write a concise deployment guide covering:
1. Prerequisites (Docker, domain)
2. Clone repo
3. Copy .env.production.example to .env.production and fill values
4. Run docker-compose.prod.yml
5. Set up SSL with Certbot
6. Monitor with docker logs

For backup.sh: pg_dump + rclone to object storage.
For init-buckets.sh: MinIO bucket creation using mc client.

Commit:
```bash
git add docker-compose.prod.yml nginx/conf.d/pod.conf scripts/ .env.production.example .github/ DEPLOYMENT.md
git commit -m "feat: add production deployment configuration with CI/CD and backup strategy"
```

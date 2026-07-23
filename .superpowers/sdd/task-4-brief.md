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


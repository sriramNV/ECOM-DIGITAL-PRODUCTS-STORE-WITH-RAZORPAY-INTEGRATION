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


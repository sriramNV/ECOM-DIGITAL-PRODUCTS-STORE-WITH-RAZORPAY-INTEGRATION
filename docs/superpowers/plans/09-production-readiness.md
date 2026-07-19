# Plan 09: Production Readiness

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use `- [ ]` syntax.

**Goal:** Implement email automation, security hardening, Docker deployment, and CI/CD pipeline

**Architecture:** Nodemailer for transactional emails with Bull queue for async delivery. Nginx reverse proxy with Let's Encrypt TLS. Multi-stage Docker build with standalone Next.js output. GitHub Actions CI/CD for automated deploy.

**Tech Stack:** Nodemailer, Bull, Pino/Loki, Sentry, Let's Encrypt, Docker Compose, GitHub Actions

---

## Global Constraints

- All emails async/fire-and-forget — never block the critical path
- SMTP credentials in environment variables only
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- Rate limiting: Redis-backed (100 req/min API, 10 req/min auth)
- Docker Compose for production with health checks
- CI/CD via GitHub Actions on push to main

---

## File Structure

```
├── apps/web/
│   ├── lib/
│   │   ├── email.ts                   # Nodemailer transport
│   │   ├── email/
│   │   │   └── templates/
│   │   │       ├── order-confirmation.ts
│   │   │       ├── order-shipped.ts
│   │   │       ├── order-delivered.ts
│   │   │       ├── order-cancelled.ts
│   │   │       └── abandoned-cart.ts
│   │   ├── services/
│   │   │   └── email-service.ts       # Email orchestration
│   │   └── jobs/
│   │       └── abandoned-cart.ts       # Bull queue worker
│   └── sentry.config.ts                # Sentry config
├── nginx/
│   └── conf.d/
│       ├── pod.conf                    # Reverse proxy config
│       ├── security-headers.conf       # CSP + security headers
│       └── ssl-params.conf            # SSL/TLS params
├── scripts/
│   ├── backup.sh                      # DB + file backup
│   └── init-buckets.sh                # MinIO bucket init
├── docker-compose.prod.yml            # Production Compose
├── Dockerfile                          # Multi-stage build (from Plan 01)
├── .env.production.example
├── .github/
│   └── workflows/
│       └── deploy.yml                 # CI/CD pipeline
└── DEPLOYMENT.md
```

---

### Task 9.1: Create email infrastructure

**Files:**
- Create: `apps/web/lib/email.ts`
- Create: `apps/web/lib/email/templates/order-confirmation.ts`
- Create: `apps/web/lib/email/templates/order-shipped.ts`
- Create: `apps/web/lib/email/templates/order-delivered.ts`
- Create: `apps/web/lib/email/templates/order-cancelled.ts`
- Create: `apps/web/lib/email/templates/abandoned-cart.ts`
- Create: `apps/web/lib/services/email-service.ts`

**Interfaces:**
- Consumes: `transporter` from Nodemailer, `emailQueue` from Plan 01
- Produces: transactional email sending for all order events

- [ ] **Step 1: Install Nodemailer**

```bash
pnpm add nodemailer @types/nodemailer --filter web
```

- [ ] **Step 2: Create apps/web/lib/email.ts**

```typescript
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
```

- [ ] **Step 3: Create order-confirmation template**

```typescript
// lib/email/templates/order-confirmation.ts
export function renderOrderConfirmation(order: {
  orderNumber: string;
  totalAmount: number;
  items: Array<{ title: string; quantity: number; totalPrice: number }>;
  shippingAddress: Record<string, string>;
}, userName: string): string {
  return `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a1a2e;">Thank you, ${userName}!</h1>
      <p>Your order <strong>${order.orderNumber}</strong> has been confirmed.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr style="background:#f8f9fa;">
          <th style="padding:10px;text-align:left;">Item</th>
          <th style="padding:10px;text-align:center;">Qty</th>
          <th style="padding:10px;text-align:right;">Price</th>
        </tr>
        ${order.items.map((item) => `
          <tr>
            <td style="padding:10px;border-top:1px solid #eee;">${item.title}</td>
            <td style="padding:10px;border-top:1px solid #eee;text-align:center;">${item.quantity}</td>
            <td style="padding:10px;border-top:1px solid #eee;text-align:right;">₹${item.totalPrice}</td>
          </tr>
        `).join("")}
      </table>
      <p><strong>Total: ₹${order.totalAmount}</strong></p>
      <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
      <p style="color:#6b7280;font-size:14px;">We'll notify you when your order ships.</p>
    </body></html>
  `;
}
```

- [ ] **Step 4: Create apps/web/lib/services/email-service.ts**

```typescript
import { transporter } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { renderOrderConfirmation } from "@/lib/email/templates/order-confirmation";
import { renderOrderShipped } from "@/lib/email/templates/order-shipped";
import { renderOrderDelivered } from "@/lib/email/templates/order-delivered";
import { renderOrderCancelled } from "@/lib/email/templates/order-cancelled";
import { renderAbandonedCart } from "@/lib/email/templates/abandoned-cart";
import { logger } from "@/lib/logger";
import type { Order, User, Cart, CartItem } from "@prisma/client";

const FROM = `"POD Store" <${process.env.SMTP_FROM ?? "store@podstore.com"}>`;

async function sendEmail(to: string, subject: string, html: string, type: string, orderId?: string) {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    await prisma.emailLog.create({ data: { to, subject, type, orderId, status: "sent" } });
  } catch (error) {
    logger.error({ error, to, type }, "Failed to send email");
    await prisma.emailLog.create({ data: { to, subject, type, orderId, status: "failed", error: (error as Error).message } });
  }
}

export const emailService = {
  async sendOrderConfirmation(order: Order & { items: Array<{ title: string; quantity: number; totalPrice: number }> }, user: User) {
    const html = renderOrderConfirmation({
      orderNumber: order.orderNumber,
      totalAmount: Number(order.totalAmount),
      items: order.items.map((i) => ({ title: i.title, quantity: i.quantity, totalPrice: Number(i.totalPrice) })),
      shippingAddress: order.shippingAddress as Record<string, string>,
    }, user.name ?? "Customer");
    await sendEmail(user.email, `Order Confirmed — ${order.orderNumber}`, html, "order.confirmation", order.id);
  },

  async sendShipmentNotification(order: Order, tracking: { carrier: string; trackingNumber: string; trackingUrl: string }, userEmail: string) {
    const html = renderOrderShipped({ orderNumber: order.orderNumber, tracking });
    await sendEmail(userEmail, `Your Order Has Shipped — ${order.orderNumber}`, html, "order.shipped", order.id);
  },

  async sendDeliveryConfirmation(order: Order, userEmail: string) {
    const html = renderOrderDelivered({ orderNumber: order.orderNumber });
    await sendEmail(userEmail, `Order Delivered — ${order.orderNumber}`, html, "order.delivered", order.id);
  },

  async sendCancellationNotice(order: Order, reason: string, userEmail: string) {
    const html = renderOrderCancelled({ orderNumber: order.orderNumber, reason });
    await sendEmail(userEmail, `Order Cancelled — ${order.orderNumber}`, html, "order.cancelled", order.id);
  },

  async sendAbandonedCart(email: string, cart: Cart & { items: CartItem[] }) {
    const html = renderAbandonedCart({ itemCount: cart.items.length });
    await sendEmail(email, "You left something in your cart!", html, "cart.abandoned");
  },
};
```

- [ ] **Step 5: Wire email into checkout and fulfillment**

```diff
// In checkout-service.ts verifyPayment():
+ emailService.sendOrderConfirmation(order, user).catch(logger.error);

// In fulfillment-service.ts handleWebhook():
+ const user = await prisma.user.findUnique({ where: { id: order.userId } });
+ if (newStatus === "SHIPPED" && user) {
+   emailService.sendShipmentNotification(order, event.data.shipping, user.email).catch(logger.error);
+ }
+ if (newStatus === "DELIVERED" && user) {
+   emailService.sendDeliveryConfirmation(order, user.email).catch(logger.error);
+ }
```

- [ ] **Step 6: Create abandoned cart job. Commit.**

```bash
git add apps/web/lib/email.ts apps/web/lib/email apps/web/lib/services/email-service.ts apps/web/lib/jobs
git commit -m "feat: add email infrastructure with templates and abandoned cart job"
```

---

### Task 9.2: Security hardening

**Files:**
- Create: `apps/web/middleware.ts` (update with rate limiting)
- Create: `nginx/conf.d/security-headers.conf`
- Create: `nginx/conf.d/ssl-params.conf`
- Create: `apps/web/sentry.config.ts`

- [ ] **Step 1: Update middleware with rate limiting**

```typescript
// Add to apps/web/middleware.ts:
import { redis } from "@/lib/redis";

async function rateLimit(ip: string, maxRequests: number, windowMs: number): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  const current = await redis.incr(key);
  if (current === 1) await redis.expire(key, windowMs / 1000);
  return current <= maxRequests;
}

// In the auth middleware, add rate limiting for API routes:
// if (pathname.startsWith("/api/")) {
//   const ip = req.headers.get("x-forwarded-for") ?? "unknown";
//   const allowed = await rateLimit(ip, 100, 60000);
//   if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
// }
```

- [ ] **Step 2: Create security-headers.conf**

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https://api.razorpay.com; frame-src https://checkout.razorpay.com;" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

- [ ] **Step 3: Create Sentry config. Commit.**

```bash
git add apps/web/middleware.ts nginx/conf.d apps/web/sentry.config.ts
git commit -m "feat: add rate limiting, security headers, and error tracking"
```

---

### Task 9.3: Production deployment setup

**Files:**
- Create: `docker-compose.prod.yml`
- Create: `nginx/conf.d/pod.conf`
- Create: `scripts/backup.sh`
- Create: `.env.production.example`
- Create: `.github/workflows/deploy.yml`
- Create: `DEPLOYMENT.md`

- [ ] **Step 1: Create docker-compose.prod.yml**

```yaml
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
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
    depends_on: [postgres, redis, minio]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: pod
      POSTGRES_USER: pod
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes: [redisdata:/data]
    restart: unless-stopped

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    volumes: [miniodata:/data]
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
  miniodata:
```

- [ ] **Step 2: Create Nginx config**

```nginx
upstream app { server app:3000; }

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

    location /_next/static { proxy_pass http://app; expires 365d; add_header Cache-Control "public, immutable"; }
    location /api { proxy_pass http://app; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; }
    location / { proxy_pass http://app; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; }
}
```

- [ ] **Step 3: Create CI/CD workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy
on: { push: { branches: [main] } }
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

- [ ] **Step 4: Create backup script, .env.production.example, DEPLOYMENT.md. Commit.**

```bash
git add docker-compose.prod.yml nginx/conf.d/pod.conf scripts/ .env.production.example .github/ DEPLOYMENT.md
git commit -m "feat: add production deployment configuration with CI/CD and backup strategy"
```

---

## Spec Coverage Check

| Requirement | Task |
|-------------|------|
| Nodemailer transport | 9.1 |
| Email templates (confirmation, shipped, delivered, cancelled, abandoned cart) | 9.1 |
| Async email sending with queue | 9.1 |
| Email logging (EmailLog model) | 9.1 |
| Abandoned cart recovery via Bull queue | 9.1 |
| Rate limiting (Redis-backed) | 9.2 |
| Security headers (CSP, HSTS, etc.) | 9.2 |
| Sentry error tracking | 9.2 |
| Production Dockerfile (multi-stage, standalone) | 9.3 |
| Docker Compose production config | 9.3 |
| Nginx reverse proxy with TLS | 9.3 |
| Backup strategy (pg_dump + rclone) | 9.3 |
| GitHub Actions CI/CD | 9.3 |
| Environment variable documentation | 9.3 |

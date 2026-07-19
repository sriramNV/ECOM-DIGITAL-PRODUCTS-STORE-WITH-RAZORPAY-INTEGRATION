# Phase 6b — Operations & Monitoring

## Objective

Build operations tooling — audit log viewer, webhook delivery monitor, system settings, and health check endpoint for monitoring platform health.

---

## System Design

### Audit Log Viewer

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Audit Log                         [Date ▼] [Action ▼] [User ▼] [Search] │
├─────────────────────────────────────────────────────────────────────────┤
│ Timestamp     │ Admin         │ Action            │ Entity │ Details    │
│ ─────────────┼───────────────┼───────────────────┼────────┼────────────│
│ 19 Jul 2:30pm│ admin@pod.com │ order.cancel      │ Order  │ Reason:... │
│ 19 Jul 2:15pm│ admin@pod.com │ product.create    │ Prod   │ Tee v2     │
│ 19 Jul 1:00pm│ admin@pod.com │ coupon.create     │ Coupon │ SAVE20     │
│ 19 Jul 12:30pm│ system       │ webhook.received  │ Webhook│ Printify   │
│ 19 Jul 11:00am│ admin@pod.com │ settings.update   │ Config │ Tax rate   │
├─────────────────────────────────────────────────────────────────────────┤
│                                          Page 1 of 12  [1] [2] [...]    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Webhook Delivery Log

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Webhook Log                        [Source ▼] [Status ▼] [Date ▼]       │
├─────────────────────────────────────────────────────────────────────────┤
│ Time         │ Source    │ Event                     │ Status  │ Latency│
│ ────────────┼───────────┼───────────────────────────┼─────────┼────────│
│ 19 Jul 2:30pm│ Printify  │ order:shipment:created    │ ✓ 200   │ 340ms  │
│ 19 Jul 2:29pm│ Razorpay  │ payment.captured          │ ✓ 200   │ 280ms  │
│ 19 Jul 2:28pm│ Printify  │ order:sent-to-production  │ ✓ 200   │ 310ms  │
│ 19 Jul 12:00pm│ Printify │ order:shipment:delivered  │ ✕ 500   │ 0ms    │
│ 19 Jul 11:00am│ Razorpay │ payment.failed            │ ✓ 200   │ 260ms  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Webhook Health: 98.5% success rate (last 24h)      [Retry Failed]      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Settings Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Settings                                                       [Save]   │
├─────────────────────────────────────────────────────────────────────────┤
│ General                                                               │
│ ───────                                                                │
│ Store Name: [My POD Store......................................]       │
│ Store Email: [hello@mystore.com................................]       │
│ Currency: [INR.................................................]       │
│                                                                         │
│ Shipping                                                               │
│ ────────                                                               │
│ Default Shipping Method: [Standard.............................]       │
│ Free Shipping Threshold: [₹500................................]       │
│                                                                         │
│ Printify                                                               │
│ ────────                                                               │
│ API Token: [••••••••••••••••••••••••••••••••••••] [Test Connection]   │
│ Shop ID: [12345................................................]       │
│ Default Margin %: [40........................................]       │
│                                                                         │
│ Email (SMTP)                                                            │
│ ────────────                                                           │
│ SMTP Host: [smtp.sendgrid.net...............................]          │
│ SMTP Port: [587................................................]       │
│ SMTP User: [apikey...........................................]       │
│ SMTP Pass: [••••••••••••••••••••••••••••••••••••]                   │
│ From Email: [store@mystore.com..............................]          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Audit Log Model

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String                     // "order.cancel", "product.create", etc.
  entity    String                     // "order", "product", "coupon", "settings"
  entityId  String?
  metadata  Json?                      // { reason, oldValue, newValue, ip }
  createdAt DateTime @default(now())

  user User? @relation(fields: [userId], references: [id])
}

// Index for query performance
@@index([createdAt])
@@index([entity, entityId])
@@index([userId])
```

### Webhook Log Model

```prisma
model WebhookLog {
  id         String   @id @default(cuid())
  source     String                     // "razorpay" or "printify"
  eventType  String                     // "payment.captured", "order:shipment:created"
  eventId    String?
  payload    Json
  statusCode Int?
  response   String?                    // response body or error
  success    Boolean
  latencyMs  Int?
  createdAt  DateTime @default(now())

  @@index([createdAt])
  @@index([source, success])
}
```

### Settings Model

```prisma
model Setting {
  id    String @id @default(cuid())
  key   String @unique
  value String @db.Text
}
```

Settings are stored as key-value pairs. Common settings:

| Key | Default | Description |
|-----|---------|-------------|
| `store.name` | `"My POD Store"` | Store name (email from, page title) |
| `store.email` | `""` | Store contact email |
| `store.currency` | `"INR"` | Currency code |
| `shipping.free_threshold` | `"0"` | Free shipping minimum order value |
| `printify.default_margin` | `"40"` | Default margin percentage for new products |
| `email.smtp_host` | `""` | SMTP server |
| `email.smtp_port` | `"587"` | SMTP port |
| `email.smtp_user` | `""` | SMTP username |
| `email.smtp_pass` | `""` | SMTP password |
| `email.from` | `""` | From email address |

### Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: false,
    redis: false,
    printify: false,
    minio: false,
  };

  // Check PostgreSQL
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch { /* false */ }

  // Check Redis
  try {
    await redis.ping();
    checks.redis = true;
  } catch { /* false */ }

  // Check Printify API
  try {
    await printifyClient.shops.list();
    checks.printify = true;
  } catch { /* false */ }

  // Check MinIO
  try {
    await minioClient.listBuckets();
    checks.minio = true;
  } catch { /* false */ }

  const allHealthy = Object.values(checks).every(Boolean);

  return NextResponse.json(
    { status: allHealthy ? "healthy" : "degraded", checks },
    { status: allHealthy ? 200 : 503 }
  );
}
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Settings storage | Key-value in PostgreSQL | Simple, no separate config service needed |
| Audit log retention | 90 days (configurable) | Balance between compliance and storage |
| Webhook log retention | 30 days | Debugging recent issues |
| Settings encryption | SMTP password encrypted at rest | Using AES-256-GCM with app secret |
| Health check auth | No auth (internal endpoint) | Used by Docker health check + monitoring |
| Failed webhook retry | Manual button in admin | Prevents automated retry loops |

---

## Steps

1. Update Prisma schema with AuditLog, WebhookLog, Setting models
2. Run `pnpm prisma:migrate dev --name add-ops`
3. Create `lib/repositories/settings-repo.ts` (get/set key-value)
4. Create `lib/repositories/audit-repo.ts` (queries + insert)
5. Create `lib/repositories/webhook-log-repo.ts`
6. Create `app/api/health/route.ts`
7. Create `app/api/admin/logs/audit/route.ts`
8. Create `app/api/admin/logs/webhooks/route.ts`
9. Create `app/api/admin/settings/route.ts` (get all)
10. Create `app/api/admin/settings/[key]/route.ts` (update single)
11. Create `components/admin/logs/audit-log-viewer.tsx`
12. Create `components/admin/logs/webhook-log-viewer.tsx`
13. Create `app/admin/logs/page.tsx` (tabs: Audit / Webhooks)
14. Create `app/admin/settings/page.tsx`
15. Wire audit logging into existing mutation APIs
16. Wire webhook logging into webhook receivers
17. Verify: audit log shows actions, webhook log shows deliveries, health check passes

---

## Files Created

| File | Content |
|------|---------|
| `prisma/schema.prisma` (updated) | AuditLog, WebhookLog, Setting |
| `lib/repositories/settings-repo.ts` | Settings queries |
| `lib/repositories/audit-repo.ts` | Audit log queries |
| `lib/repositories/webhook-log-repo.ts` | Webhook log queries |
| `app/api/health/route.ts` | Health check endpoint |
| `app/api/admin/logs/audit/route.ts` | Audit log API |
| `app/api/admin/logs/webhooks/route.ts` | Webhook log API |
| `app/api/admin/settings/route.ts` | Settings API |
| `components/admin/logs/audit-log-viewer.tsx` | Audit log table |
| `components/admin/logs/webhook-log-viewer.tsx` | Webhook log table |
| `app/admin/logs/page.tsx` | Logs page |
| `app/admin/settings/page.tsx` | Settings page |

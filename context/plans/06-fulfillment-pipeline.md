# Phase 3b — Fulfillment Pipeline

## Objective

Build the automated order fulfillment pipeline that submits paid orders to Printify, tracks their status through webhooks, handles failures with a dead letter queue, and notifies customers at each status transition.

---

## System Design

### Fulfillment Flow

```
Payment verified → Order: PAID
    │
    ▼
Submit to Printify ─────────────────────┐
    │                                    │
    ├── Success → update printifyOrderId │
    │   → status: PROCESSING             │
    │                                    │
    └── Failure → retry (3x) ───────────┤
        │                                │
        ├── Success → same as above      │
        └── All fail → Dead Letter Queue │
            → status: PAYMENT_FAILED     │
            → admin notification         │
            → manual review              │
                │                        
                ▼                        
         Cancel order + refund           
```

### Printify Order Lifecycle

```
Order submitted → status: PROCESSING
    ← Webhook: order:sent-to-production → status: PRINTING
    ← Webhook: order:shipment:created   → status: SHIPPED
        → Save tracking number + carrier
        → Send shipment email to customer
    ← Webhook: order:shipment:delivered → status: DELIVERED
        → Send delivery email to customer
```

---

## Architecture

### Fulfillment Service

```typescript
// lib/services/fulfillment-service.ts
export const fulfillmentService = {
  async submitOrder(orderId: string): Promise<void> {
    const order = await orderRepo.getWithItems(orderId);
    if (!order || order.status !== "PAID") return;

    const payload: PrintifyOrderCreate = {
      external_id: order.id,              // idempotency key
      label: `Order ${order.orderNumber}`,
      line_items: order.items.map((item) => ({
        product_id: item.product.printifyProductId!,
        variant_id: item.variant.printifyVariantId,
        quantity: item.quantity,
      })),
      shipping_method: parseInt(order.shippingMethod!),
      address_to: {
        first_name: order.shippingAddress.first_name,
        last_name: order.shippingAddress.last_name,
        address1: order.shippingAddress.address1,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        zip: order.shippingAddress.zip,
        country: order.shippingAddress.country,
        phone: order.shippingAddress.phone,
      },
    };

    try {
      const result = await printifyClient.orders.create(shopId, payload);
      await orderRepo.updatePrintifyId(orderId, result.id);
      await orderRepo.updateStatus(orderId, "PROCESSING");
      logger.info({ orderId, printifyOrderId: result.id }, "Order submitted to Printify");
    } catch (error) {
      logger.error({ orderId, error }, "Failed to submit order to Printify");
      await deadLetterQueue.enqueue({ orderId, error: String(error), attempt: 1 });
    }
  },

  async handleWebhook(payload: PrintifyWebhookPayload): Promise<void> {
    const { topic, data } = payload;

    switch (topic) {
      case "order:sent-to-production":
        await orderRepo.updateStatusByPrintifyId(data.order_id, "PRINTING");
        break;

      case "order:shipment:created": {
        const { order_id, carrier, tracking_number, tracking_url } = data;
        await orderRepo.updateShipment(order_id, { carrier, trackingNumber: tracking_number, trackingUrl: tracking_url });
        await orderRepo.updateStatusByPrintifyId(order_id, "SHIPPED");
        const order = await orderRepo.getByPrintifyId(order_id);
        if (order) {
          await emailService.sendShipmentNotification(order);
        }
        break;
      }

      case "order:shipment:delivered":
        await orderRepo.updateStatusByPrintifyId(data.order_id, "DELIVERED");
        break;
    }
  },
};
```

### Dead Letter Queue

```typescript
// lib/services/dead-letter-queue.ts
type DLEntry = {
  id: string;
  orderId: string;
  error: string;
  attempt: number;
  createdAt: Date;
};

// Stored in PostgreSQL (DLQ table) for admin review
model DeadLetterEntry {
  id        String   @id @default(cuid())
  orderId   String    @unique
  error     String   @db.Text
  attempt   Int      @default(1)
  resolved  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  order Order @relation(fields: [orderId], references: [id])
}

// Retry worker (runs every 5 minutes)
async function processDeadLetterQueue() {
  const entries = await prisma.deadLetterEntry.findMany({
    where: { resolved: false, attempt: { lt: 5 } },
  });

  for (const entry of entries) {
    try {
      await fulfillmentService.submitOrder(entry.orderId);
      await prisma.deadLetterEntry.update({
        where: { id: entry.id },
        data: { resolved: true },
      });
    } catch {
      await prisma.deadLetterEntry.update({
        where: { id: entry.id },
        data: { attempt: { increment: 1 } },
      });
    }
  }
}
```

### Webhook Receiver

```typescript
// app/api/printify/webhooks/route.ts
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-printify-signature");

  // Verify HMAC SHA256
  const expected = crypto
    .createHmac("sha256", process.env.PRINTIFY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  // Idempotency check
  const processed = await redis.get(`printify:webhook:${event.id}`);
  if (processed) {
    return NextResponse.json({ status: "already_processed" });
  }

  await fulfillmentService.handleWebhook(event);

  await redis.set(`printify:webhook:${event.id}`, "1", { EX: 86400 });

  return NextResponse.json({ status: "ok" });
}
```

### Webhook Registration

```typescript
// Called during setup or deploy
const WEBHOOK_TOPICS = [
  "order:created",
  "order:updated",
  "order:sent-to-production",
  "order:shipment:created",
  "order:shipment:delivered",
  "product:publish:started",
  "product:publish:succeeded",
  "product:publish:failed",
];

async function registerWebhooks() {
  const existing = await printifyClient.webhooks.list(shopId);
  const existingTopics = existing.map((w) => w.topic);

  for (const topic of WEBHOOK_TOPICS) {
    if (!existingTopics.includes(topic)) {
      await printifyClient.webhooks.create(shopId, {
        topic,
        url: `${process.env.APP_URL}/api/printify/webhooks`,
      });
    }
  }
}
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Order submission timing | Immediate on payment verify | Customer gets instant confirmation |
| Idempotency | `external_id` in Printify order | Prevents duplicate orders on retry |
| Webhook as primary source | Yes, with DB as source of truth | Don't poll; webhooks are reliable enough |
| DLQ mechanism | PostgreSQL table + cron retry | Simple, visible in admin, no need for extra queue system |
| Max retries | 5 attempts, then manual | Prevents infinite loops, requires human review |
| Email on shipment | Triggered by webhook | Real-time, automatic |
| Webhook secret | Configured in Printify dashboard | HMAC SHA256 verification |

---

## Steps

1. Register Printify webhooks (setup script or admin UI)
2. Create Prisma `DeadLetterEntry` model
3. Run `pnpm prisma:migrate dev --name add-dlq`
4. Create `lib/services/fulfillment-service.ts`
5. Create `lib/services/dead-letter-queue.ts`
6. Create `app/api/printify/webhooks/route.ts`
7. Create `lib/repositories/order-repo.ts` (add: updatePrintifyId, updateStatus, updateShipment, getByPrintifyId)
8. Register webhooks via seed script or setup endpoint
9. Test with Printify sandbox: submit test order, verify webhook flow
10. Verify: pay for order → auto-submits → webhooks update status

---

## Files Created

| File | Content |
|------|---------|
| `prisma/schema.prisma` (updated) | DeadLetterEntry model |
| `lib/services/fulfillment-service.ts` | Order submission + webhook handling |
| `lib/services/dead-letter-queue.ts` | DLQ management + retry worker |
| `app/api/printify/webhooks/route.ts` | Webhook receiver |
| `lib/repositories/order-repo.ts` (updated) | Printify-related order queries |
| `prisma/seed.ts` (updated) | Webhook registration |

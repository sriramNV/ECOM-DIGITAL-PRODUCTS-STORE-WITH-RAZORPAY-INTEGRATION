# Plan 05: Printify Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use `- [ ]` syntax.

**Goal:** Build the Printify API adapter layer and automated fulfillment pipeline

**Architecture:** All Printify API calls go through `lib/printify/` — never raw fetch calls elsewhere. Rate limiting with Retry-After backoff, idempotent order submission via `external_id`, webhook signature verification. Failed submissions go to a dead letter queue (DB-based for admin review).

**Tech Stack:** Printify API v1, Zod, Prisma, Bull (retry queue), crypto (webhook verification)

---

## Global Constraints

- All Printify calls wrapped in `lib/printify/` — never call Printify directly
- Rate limit: 600/min global, 100/min catalog, 200/30min publish — backoff on 429
- Order submission idempotent via `external_id` = system order ID
- Webhook signature verified via HMAC SHA256
- Failed submissions stored in DB dead letter queue

---

## File Structure

```
apps/web/
├── app/api/printify/
│   └── webhooks/route.ts         # POST webhook receiver
├── lib/printify/
│   ├── client.ts                 # Base HTTP client + rate limiting
│   ├── types.ts                  # Printify API types
│   ├── catalog.ts                # Blueprint/provider queries
│   ├── products.ts               # Product CRUD + publish
│   ├── orders.ts                 # Order submission + status
│   ├── uploads.ts                # Artwork upload
│   └── webhooks.ts              # Webhook registration
├── lib/services/
│   ├── fulfillment-service.ts    # Order submission + tracking
│   └── printify-sync-service.ts  # Catalog sync
└── lib/repositories/
    └── dead-letter-repo.ts       # Failed submission storage
```

---

### Task 5.1: Create Printify API client

**Files:**
- Create: `apps/web/lib/printify/client.ts`
- Create: `apps/web/lib/printify/types.ts`

**Interfaces:**
- Consumes: `logger` from Plan 01, `PRINTIFY_API_TOKEN` env var
- Produces: `printifyClient.request<T>()` used by all Printify modules

- [ ] **Step 1: Create apps/web/lib/printify/client.ts**

```typescript
import { logger } from "@/lib/logger";

const BASE_URL = "https://api.printify.com/v1";
const TOKEN = process.env.PRINTIFY_API_TOKEN;

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type RequestOptions = {
  method: HttpMethod;
  path: string;
  body?: unknown;
};

export class PrintifyError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = "PrintifyError";
  }
}

async function request<T>({ method, path, body }: RequestOptions, retries = 2): Promise<T> {
  const url = `${BASE_URL}${path}`;

  logger.debug({ method, url }, "Printify API request");

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "PODApp/1.0",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 429 && retries > 0) {
    const retryAfter = Number(response.headers.get("Retry-After")) || 5;
    logger.warn({ retryAfter }, "Printify rate limited, retrying");
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return request<T>({ method, path, body }, retries - 1);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new PrintifyError(response.status, `Printify API error: ${response.status}`, errorBody);
  }

  return response.json();
}

export const printifyClient = { request };
```

- [ ] **Step 2: Create apps/web/lib/printify/types.ts**

```typescript
export type PrintifyShop = {
  id: number;
  title: string;
  sales_channel: string;
};

export type PrintifyBlueprint = {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: Array<{ src: string }>;
};

export type PrintifyPrintProvider = {
  id: number;
  title: string;
  location: { country: string };
  shipping: Array<{ type: string; min: number; max: number }>;
};

export type PrintifyVariant = {
  id: number;
  title: string;
  price: number;
  is_enabled: boolean;
};

export type PrintifyProduct = {
  id: string;
  title: string;
  description: string;
  variants: Array<{ id: number; price: number; is_enabled: boolean }>;
  images: Array<{ src: string }>;
};

export type PrintifyOrderInput = {
  external_id: string;
  line_items: Array<{
    product_id: string;
    variant_id: number;
    quantity: number;
  }>;
  shipping_method: number;
  address_to: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };
};

export type PrintifyOrder = {
  id: string;
  external_id: string;
  status: string;
  shipping: { carrier: string; tracking_number: string; tracking_url: string };
  created_at: string;
};
```

- [ ] **Step 3: Write client test**

```typescript
// lib/printify/__tests__/client.test.ts
import { describe, it, expect } from "vitest";
import { PrintifyError } from "../client";

describe("PrintifyError", () => {
  it("creates error with status and message", () => {
    const err = new PrintifyError(401, "Unauthorized");
    expect(err.status).toBe(401);
    expect(err.message).toBe("Unauthorized");
    expect(err.name).toBe("PrintifyError");
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/printify/client.ts apps/web/lib/printify/types.ts
git commit -m "feat: add Printify API client with rate limiting"
```

---

### Task 5.2: Create Printify catalog and product modules

**Files:**
- Create: `apps/web/lib/printify/catalog.ts`
- Create: `apps/web/lib/printify/products.ts`
- Create: `apps/web/lib/printify/uploads.ts`
- Create: `apps/web/lib/printify/webhooks.ts`

**Interfaces:**
- Consumes: `printifyClient` from Task 5.1
- Produces: typed Printify catalog/product/upload/webhook operations

- [ ] **Step 1: Create apps/web/lib/printify/catalog.ts**

```typescript
import { printifyClient } from "./client";
import type { PrintifyBlueprint, PrintifyPrintProvider, PrintifyVariant } from "./types";

export const printifyCatalog = {
  async listBlueprints() {
    return printifyClient.request<PrintifyBlueprint[]>({
      method: "GET",
      path: "/catalog/blueprints.json",
    });
  },

  async getBlueprint(id: number) {
    return printifyClient.request<PrintifyBlueprint>({
      method: "GET",
      path: `/catalog/blueprints/${id}.json`,
    });
  },

  async listPrintProviders(blueprintId: number) {
    return printifyClient.request<PrintifyPrintProvider[]>({
      method: "GET",
      path: `/catalog/blueprints/${blueprintId}/print_providers.json`,
    });
  },

  async listVariants(blueprintId: number, providerId: number) {
    return printifyClient.request<PrintifyVariant[]>({
      method: "GET",
      path: `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`,
    });
  },

  async getShipping(blueprintId: number, providerId: number) {
    return printifyClient.request({
      method: "GET",
      path: `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/shipping.json`,
    });
  },
};
```

- [ ] **Step 2: Create apps/web/lib/printify/products.ts**

```typescript
import { printifyClient } from "./client";
import type { PrintifyProduct } from "./types";

const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

export const printifyProducts = {
  async list() {
    return printifyClient.request<{ data: PrintifyProduct[] }>({
      method: "GET",
      path: `/shops/${SHOP_ID}/products.json`,
    });
  },

  async create(data: {
    blueprint_id: number;
    print_provider_id: number;
    title: string;
    description: string;
    variants: Array<{ id: number; price: number }>;
    images: Array<{ src: string; position: string }>;
  }) {
    return printifyClient.request<PrintifyProduct>({
      method: "POST",
      path: `/shops/${SHOP_ID}/products.json`,
      body: data,
    });
  },

  async update(productId: string, data: Partial<{ title: string; description: string; variants: Array<{ id: number; price: number }> }>) {
    return printifyClient.request<PrintifyProduct>({
      method: "PUT",
      path: `/shops/${SHOP_ID}/products/${productId}.json`,
      body: data,
    });
  },

  async publish(productId: string) {
    return printifyClient.request({
      method: "POST",
      path: `/shops/${SHOP_ID}/products/${productId}/publish.json`,
    });
  },

  async delete(productId: string) {
    return printifyClient.request({
      method: "DELETE",
      path: `/shops/${SHOP_ID}/products/${productId}.json`,
    });
  },
};
```

- [ ] **Step 3: Create apps/web/lib/printify/uploads.ts**

```typescript
import { printifyClient } from "./client";

export const printifyUploads = {
  async uploadImage(url: string, filename: string) {
    return printifyClient.request<{ id: string; url: string }>({
      method: "POST",
      path: "/uploads/images.json",
      body: { url, filename },
    });
  },
};
```

- [ ] **Step 4: Create apps/web/lib/printify/webhooks.ts**

```typescript
import { printifyClient } from "./client";
import type { PrintifyShop } from "./types";

const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

export const printifyWebhooks = {
  async list() {
    return printifyClient.request<Array<{ id: string; topic: string; url: string }>>({
      method: "GET",
      path: `/shops/${SHOP_ID}/webhooks.json`,
    });
  },

  async create(topic: string, url: string) {
    return printifyClient.request<{ id: string }>({
      method: "POST",
      path: `/shops/${SHOP_ID}/webhooks.json`,
      body: { topic, url },
    });
  },

  async remove(webhookId: string) {
    return printifyClient.request({
      method: "DELETE",
      path: `/shops/${SHOP_ID}/webhooks/${webhookId}.json`,
    });
  },
};
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/printify/catalog.ts apps/web/lib/printify/products.ts apps/web/lib/printify/uploads.ts apps/web/lib/printify/webhooks.ts
git commit -m "feat: add Printify catalog, product, upload, and webhook modules"
```

---

### Task 5.3: Create Printify order submission module

**Files:**
- Create: `apps/web/lib/printify/orders.ts`

**Interfaces:**
- Consumes: `printifyClient` from Task 5.1, `PrintifyOrderInput` type
- Produces: `printifyOrders.submit()`, `printifyOrders.getStatus()`, `printifyOrders.calculateShipping()`

- [ ] **Step 1: Create apps/web/lib/printify/orders.ts**

```typescript
import { printifyClient } from "./client";
import type { PrintifyOrderInput, PrintifyOrder } from "./types";

const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

export const printifyOrders = {
  async submit(data: PrintifyOrderInput) {
    return printifyClient.request<PrintifyOrder>({
      method: "POST",
      path: `/shops/${SHOP_ID}/orders.json`,
      body: data,
    });
  },

  async getStatus(orderId: string) {
    return printifyClient.request<PrintifyOrder>({
      method: "GET",
      path: `/shops/${SHOP_ID}/orders/${orderId}.json`,
    });
  },

  async calculateShipping(lineItems: Array<{ product_id: string; variant_id: number; quantity: number }>, address: { country: string }) {
    return printifyClient.request<{ standard: number; express: number }>({
      method: "POST",
      path: `/shops/${SHOP_ID}/orders/shipping.json`,
      body: { line_items: lineItems, address_to: address },
    }),
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/printify/orders.ts
git commit -m "feat: add Printify order submission module"
```

---

### Task 5.4: Create fulfillment service and webhook handler

**Files:**
- Create: `apps/web/lib/services/fulfillment-service.ts`
- Create: `apps/web/lib/services/printify-sync-service.ts`
- Create: `apps/web/lib/repositories/dead-letter-repo.ts`
- Create: `apps/web/app/api/printify/webhooks/route.ts`

**Interfaces:**
- Consumes: `printifyOrders` from Task 5.3, `orderRepo` from Plan 04, `emailService` (to be wired in Plan 09)
- Produces: automatic Printify order submission on payment, webhook status updates

- [ ] **Step 1: Create apps/web/lib/repositories/dead-letter-repo.ts**

```typescript
import { prisma } from "@/lib/prisma";

export const deadLetterRepo = {
  async add(orderId: string, error: string, context: Record<string, unknown>) {
    // Stored in a dedicated table or as a log entry
    await prisma.auditLog.create({
      data: {
        action: "fulfillment_failed",
        entity: "order",
        entityId: orderId,
        metadata: { error, context },
      },
    });
  },

  async list() {
    return prisma.auditLog.findMany({
      where: { action: "fulfillment_failed" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },
};
```

- [ ] **Step 2: Create apps/web/lib/services/fulfillment-service.ts**

```typescript
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { printifyOrders } from "@/lib/printify/orders";
import { orderRepo } from "@/lib/repositories/order-repo";
import { deadLetterRepo } from "@/lib/repositories/dead-letter-repo";
import { logger } from "@/lib/logger";

const PRINTIFY_WEBHOOK_SECRET = process.env.PRINTIFY_WEBHOOK_SECRET!;

export const fulfillmentService = {
  async submitOrder(orderId: string) {
    const order = await orderRepo.getById(orderId);
    if (!order || order.status !== "PAID") return;

    if (order.printifyOrderId) {
      logger.info({ orderId }, "Order already submitted to Printify");
      return;
    }

    const address = order.shippingAddress as Record<string, string> | null;
    if (!address) {
      await deadLetterRepo.add(orderId, "Missing shipping address", {});
      return;
    }

    try {
      const result = await printifyOrders.submit({
        external_id: order.id,
        line_items: order.items.map((item) => ({
          product_id: item.productId,
          variant_id: Number(item.variantId),
          quantity: item.quantity,
        })),
        shipping_method: 1,
        address_to: {
          first_name: (address.name ?? "").split(" ")[0] || "Customer",
          last_name: (address.name ?? "").split(" ").slice(1).join(" ") || "",
          address1: address.street ?? "",
          city: address.city ?? "",
          state: address.state ?? "",
          zip: address.pincode ?? "",
          country: address.country ?? "IN",
          phone: address.phone ?? "",
        },
      });

      await prisma.order.update({
        where: { id: orderId },
        data: {
          printifyOrderId: result.id,
          status: "PROCESSING",
        },
      });

      await prisma.orderStatusHistory.create({
        data: { orderId, status: "PROCESSING", note: "Submitted to Printify" },
      });

      logger.info({ orderId, printifyOrderId: result.id }, "Order submitted to Printify");
    } catch (error) {
      logger.error({ error, orderId }, "Failed to submit order to Printify");
      await deadLetterRepo.add(orderId, (error as Error).message, {});
    }
  },

  async handleWebhook(payload: unknown, signature: string, rawBody: string) {
    const expected = crypto
      .createHmac("sha256", PRINTIFY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (signature !== expected) {
      throw new Error("Invalid Printify webhook signature");
    }

    const event = payload as { event: string; data?: { order_id?: string; external_id?: string; shipping?: { carrier: string; tracking_number: string; tracking_url: string } } };
    const orderId = event.data?.external_id;
    if (!orderId) return;

    const statusMap: Record<string, string> = {
      "order:sent-to-production": "PRINTING",
      "order:shipment:created": "SHIPPED",
      "order:shipment:delivered": "DELIVERED",
    };

    const newStatus = statusMap[event.event];
    if (newStatus) {
      await orderRepo.updateStatus(orderId, newStatus);

      if (newStatus === "SHIPPED" && event.data?.shipping) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            shippingMethod: `${event.data.shipping.carrier} - ${event.data.shipping.tracking_number}`,
          },
        });
      }

      logger.info({ orderId, status: newStatus, event: event.event }, "Order status updated via Printify webhook");
    }
  },
};
```

- [ ] **Step 3: Create apps/web/app/api/printify/webhooks/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { fulfillmentService } from "@/lib/services/fulfillment-service";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-printify-signature") ?? "";

  try {
    const event = JSON.parse(body);
    const eventId = `${event.event}:${event.data?.order_id ?? Date.now()}`;

    const processed = await redis.get(`printify-webhook:${eventId}`);
    if (processed) {
      return NextResponse.json({ status: "already_processed" });
    }

    await fulfillmentService.handleWebhook(event, signature, body);

    await redis.set(`printify-webhook:${eventId}`, "1", { EX: 86400 });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    logger.error({ error }, "Printify webhook processing failed");
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Wire fulfillment into checkout service**

```diff
// In checkout-service.ts verifyPayment(), add after order creation:
+ fulfillmentService.submitOrder(order.id).catch(logger.error);
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/services/fulfillment-service.ts apps/web/lib/repositories/dead-letter-repo.ts apps/web/app/api/printify
git commit -m "feat: add fulfillment service and Printify webhook handler"
```

---

## Spec Coverage Check

| Requirement | Task |
|-------------|------|
| Printify base HTTP client with auth + rate limiting | 5.1 |
| Typed API types | 5.1 |
| Blueprint/print provider queries | 5.2 |
| Product CRUD + publish | 5.2 |
| Artwork upload | 5.2 |
| Webhook registration | 5.2 |
| Order submission + status queries | 5.3 |
| Auto-fulfillment after payment | 5.4 |
| Dead letter queue (DB) | 5.4 |
| Webhook signature verification | 5.4 |
| Order status management via webhooks | 5.4 |
| Idempotent submission via external_id | 5.3, 5.4 |

# Library Docs

Project-specific usage patterns for every third party library in this project. This file only covers how we use each library in this specific project — rules, patterns, and constraints specific to this POD e-commerce platform.

Read the relevant section before implementing any feature that touches these libraries.

---

## Before Using Any Library

Before implementing any feature that uses a third party library:

1. **Check code-standards.md** for the approved dependency list
2. **Read this file** for project-specific patterns that override general library knowledge

The order of authority is:

```
This file (project rules) → Package documentation → General training knowledge
```

---

## Prisma ORM

### Client Singleton

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Rules:**

- The singleton pattern is required to prevent multiple instances during hot reload in development
- Prisma is only imported in `lib/repositories/` — never in components, API routes, or services directly
- Migrations: `pnpm prisma:migrate dev` for development, `pnpm prisma:migrate deploy` for production
- Always use `select` or `include` to fetch only needed fields — never fetch entire row when a subset is sufficient
- Use transactions for operations that must be atomic (order creation + inventory update)

### Naming Conventions

```prisma
model Order {
  id        String   @id @default(cuid())
  orderNumber String @unique  // human-readable: POD-1001
  status    OrderStatus @default(PENDING)
  userId    String
  user      User     @relation(fields: [userId], references: [id])

  // timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // relations
  items     OrderItem[]
  payments  Payment[]
}

enum OrderStatus {
  PENDING_PAYMENT
  PAID
  PROCESSING
  PRINTING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}
```

**Rules:**
- Table names: PascalCase, singular (`Order`, not `Orders`)
- Fields: camelCase (`createdAt`, not `created_at`)
- Enums: PascalCase, stored as strings in PostgreSQL
- IDs: CUID by default, UUID only when externally referenced
- Index on every foreign key and every field used in `where`/`orderBy` clauses

---

## Razorpay

### Server-Side Setup

```typescript
// lib/razorpay.ts
import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});
```

### Order Creation

```typescript
// Used in checkout-service.ts
const order = await razorpay.orders.create({
  amount: totalAmountInPaise, // ₹499 → 49900 (paise)
  currency: "INR",
  receipt: `order_${cartId}`, // unique receipt for idempotency
  notes: {
    userId: user.id,
    cartId: cartId,
  },
});
```

### Signature Verification

```typescript
// Used in checkout-service.ts verifyPayment()
import crypto from "crypto";

const generatedSignature = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
  .update(`${orderId}|${paymentId}`)
  .digest("hex");

if (generatedSignature !== signature) {
  throw new Error("Invalid payment signature");
}
```

### Webhook Verification

```typescript
// Used in webhook handler
const expectedSignature = crypto
  .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
  .update(body)
  .digest("hex");

if (signature !== expectedSignature) {
  return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
}
```

### Client-Side Checkout

```typescript
// razorpay-button.tsx (client component)
"use client";

function openRazorpayCheckout(orderId: string, amount: number) {
  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    amount: amount, // in paise
    currency: "INR",
    name: "Store Name",
    description: "Product Purchase",
    order_id: orderId,
    handler: async function (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) {
      // verify on server
      const result = await fetch("/api/razorpay/verify", {
        method: "POST",
        body: JSON.stringify(response),
      });

      if (result.ok) {
        window.location.href = "/checkout/success";
      }
    },
    prefill: {
      name: customerName,
      email: customerEmail,
      contact: customerPhone,
    },
    theme: {
      color: "#2563eb", // matches accent color
    },
    modal: {
      ondismiss: function () {
        // user closed modal without paying
        toast.info("Payment cancelled. You can try again.");
      },
    },
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.open();
}
```

**Rules:**
- Amount is always in **paise** (lowest currency unit) — ₹499 = 49900
- Razorpay Checkout opens as a modal on the same page (no redirect)
- Signature verification is **always server-side** — never trust the client
- `key_id` is public, `key_secret` is server-only
- Webhook secret is separate from API secret — configure in Razorpay dashboard
- Subscribe to webhook events: `payment.captured`, `payment.failed`, `order.paid`

---

## Printify API

See `lib/printify/client.ts` for the base client. Key patterns:

### Rate Limit Handling

```typescript
// lib/printify/client.ts
if (response.status === 429) {
  const retryAfter = response.headers.get("Retry-After") ?? "5";
  await new Promise((resolve) => setTimeout(resolve, parseInt(retryAfter) * 1000));
  return request<T>({ method, path, body }); // retry once
}
```

### Idempotent Order Creation

```typescript
// lib/printify/orders.ts
// Use external_id to prevent duplicate orders on retry
const orderPayload = {
  external_id: order.id, // our internal order ID
  // ... other fields
};
```

### Endpoints Used

| Operation | Endpoint | Method |
|-----------|----------|--------|
| List shops | `/v1/shops.json` | GET |
| List blueprints | `/v1/catalog/blueprints.json` | GET |
| Get blueprint | `/v1/catalog/blueprints/{id}.json` | GET |
| List print providers | `/v1/catalog/blueprints/{id}/print_providers.json` | GET |
| List variants | `/v1/catalog/blueprints/{id}/print_providers/{pid}/variants.json` | GET |
| Get shipping info | `/v1/catalog/blueprints/{id}/print_providers/{pid}/shipping.json` | GET |
| Upload image | `/v1/uploads/images.json` | POST |
| List products | `/v1/shops/{id}/products.json` | GET |
| Create product | `/v1/shops/{id}/products.json` | POST |
| Update product | `/v1/shops/{id}/products/{pid}.json` | PUT |
| Delete product | `/v1/shops/{id}/products/{pid}.json` | DELETE |
| Publish product | `/v1/shops/{id}/products/{pid}/publish.json` | POST |
| Submit order | `/v1/shops/{id}/orders.json` | POST |
| Get order | `/v1/shops/{id}/orders/{oid}.json` | GET |
| Calculate shipping | `/v1/shops/{id}/orders/shipping.json` | POST |
| List webhooks | `/v1/shops/{id}/webhooks.json` | GET |
| Create webhook | `/v1/shops/{id}/webhooks.json` | POST |

---

## Nodemailer

```typescript
// lib/email.ts
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// lib/services/email-service.ts
export const emailService = {
  async sendOrderConfirmation(order: Order, user: User) {
    await transporter.sendMail({
      from: `"Store" <${process.env.SMTP_FROM}>`,
      to: user.email,
      subject: `Order Confirmed — ${order.orderNumber}`,
      html: `<h1>Thank you for your order!</h1>...`,
    });
  },

  async sendShipmentNotification(order: Order, trackingUrl: string) {
    await transporter.sendMail({
      from: `"Store" <${process.env.SMTP_FROM}>`,
      to: order.user.email,
      subject: `Your order has shipped — ${order.orderNumber}`,
      html: `<h1>Your order is on the way!</h1>...`,
    });
  },
};
```

**Rules:**
- All email templates are HTML strings (consider using a template library later)
- Email sending is async and non-blocking — use Promise, not await in critical path
- SMTP credentials are environment variables
- Never expose SMTP credentials client-side

---

## PostHog (Self-Hosted)

```typescript
// lib/analytics.ts
import { PostHog } from "posthog-node";
import { PostHog as PostHogClient } from "posthog-js";

// Server-side client
export const posthogServer = new PostHog(process.env.POSTHOG_API_KEY!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
});

// Client-side provider (in layout)
// <PostHogProvider> wraps the app for client-side events
```

**Events to track:**
- `page_viewed` — automatic via PostHog
- `product_viewed` — product ID, category
- `product_added_to_cart` — product ID, variant
- `checkout_started` — cart value, item count
- `payment_completed` — order value, payment method
- `order_shipped` — order ID
- `coupon_applied` — coupon code, discount amount

---

## Zustand (Cart Store)

```typescript
// stores/cart-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type CartItem = {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalAmount: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((i) => i.id === item.id);
        if (existing) {
          set({ items: get().items.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) });
        } else {
          set({ items: [...get().items, item] });
        }
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      updateQuantity: (id, quantity) => set({ items: get().items.map((i) => i.id === id ? { ...i, quantity } : i) }),
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalAmount: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "cart-storage" }
  )
);
```

**Rules:**
- Guest cart persists to localStorage via `persist` middleware
- On login, merge guest cart into DB cart (API route handles this)
- Cart store is the single source of truth for cart state on the client
- Server renders initial cart state from DB for authenticated users
- Quantity updates are optimistic — sync to DB in background via API

---

## TanStack Query

```typescript
// Example usage in a component
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetch(`/api/products/${slug}`).then((r) => r.json()),
    staleTime: 60_000, // 1 minute
  });
}

function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductInput) =>
      fetch("/api/products", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
```

**Rules:**
- Stale time defaults:
  - Product catalog: 60s
  - Product detail: 60s
  - Orders: 30s (admin), 10s (customer checkout)
  - Admin dashboard stats: 120s
  - CMS content: 300s (5 minutes)
- Invalidate queries on mutations, not on refetch
- Use query key arrays consistently: `["products", { filters }]`

---

## MinIO (S3-Compatible Storage)

```typescript
// lib/minio.ts
import { Client as MinioClient } from "minio";

export const minioClient = new MinioClient({
  endPoint: process.env.MINIO_ENDPOINT ?? "minio",
  port: parseInt(process.env.MINIO_PORT ?? "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});

export const BUCKET_NAME = "pod-assets";

// Upload artwork
export async function uploadArtwork(file: Buffer, filename: string) {
  await minioClient.putObject(BUCKET_NAME, `artwork/${filename}`, file);
  return `https://${process.env.MINIO_PUBLIC_URL}/artwork/${filename}`;
}
```

**Rules:**
- Buckets: `pod-assets` (artwork, mockups, product images)
- Path convention: `artwork/{uuid}-{original-name}`
- All uploads go through API routes — never direct client-to-S3 uploads (for now)
- Public URLs served through Nginx reverse proxy to MinIO

---

## Order Number Generation

```typescript
// lib/order-number.ts
// Sequential order numbers formatted as POD-{6-digit}
// Uses Redis INCR for atomic increment, falls back to timestamp

import { redis } from "@/lib/redis";

const COUNTER_KEY = "order:counter";

export async function generateOrderNumber(): Promise<string> {
  try {
    const count = await redis.incr(COUNTER_KEY);
    return `POD-${String(count).padStart(6, "0")}`;
  } catch {
    // Fallback: timestamp-based if Redis is unavailable
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `POD-${ts}${rand}`;
  }
}
```

**Rules:**
- The Redis counter is initialized to 100000 on first deploy (seed in setup script)
- Counter persists across app restarts (Redis data is persistent)
- Format `POD-100001`, `POD-100002`, etc.
- Fallback only triggers if Redis connection fails — logs a warning
- Order number is unique per DB constraint (`@unique` in Prisma)

---

## Pino (Logging)

```typescript
// lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "body.password"],
    censor: "[REDACTED]",
  },
});
```

**Rules:**
- Use structured logging: `logger.info({ orderId, status }, "Order status updated")`
- Never log: passwords, tokens, payment details, personal data
- Error level for handled errors with context, fatal for unhandled
- Include correlation IDs (request ID) in webhook handlers
- Log levels: trace (debugging), info (business events), warn (expected errors), error (unexpected), fatal (crash)

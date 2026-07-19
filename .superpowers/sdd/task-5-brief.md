# Task 1.5: Create base libraries and types

**Plan:** Plan 01 — Foundation & Project Setup
**Depends on:** Task 1.3 (prisma, redis clients), Task 1.4 (Tailwind)
**Produces:** Utility functions used by all subsequent plans

## Files to Create

- `apps/web/lib/logger.ts`
- `apps/web/lib/utils.ts`
- `apps/web/lib/order-number.ts`
- `apps/web/types/index.ts`
- `apps/web/data/site.ts`
- `apps/web/app/api/health/route.ts`

## Steps

### Step 1: Create apps/web/lib/logger.ts
```typescript
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

### Step 2: Create apps/web/lib/utils.ts
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "INR"): string {
  const value = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
```

### Step 3: Create apps/web/lib/order-number.ts
```typescript
import { redis } from "./redis";
import { logger } from "./logger";

const COUNTER_KEY = "order:counter";

export async function generateOrderNumber(): Promise<string> {
  try {
    const exists = await redis.exists(COUNTER_KEY);
    if (!exists) {
      await redis.set(COUNTER_KEY, 100000);
    }
    const count = await redis.incr(COUNTER_KEY);
    return `POD-${String(count).padStart(6, "0")}`;
  } catch (error) {
    logger.warn({ error }, "Redis unavailable for order counter, using fallback");
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `POD-${ts}${rand}`;
  }
}
```

### Step 4: Create apps/web/types/index.ts
```typescript
export type Role = "ADMIN" | "CUSTOMER";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "PRINTING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export type CartItem = {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  slug: string;
};

export type Address = {
  name: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
};
```

### Step 5: Create apps/web/data/site.ts
```typescript
export const siteConfig = {
  name: "POD Store",
  description: "Premium print-on-demand products",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  currency: "INR",
  taxRate: 18,
  shipping: {
    freeThreshold: 999,
    standard: 99,
    express: 199,
  },
  email: {
    from: process.env.SMTP_FROM ?? "store@podstore.com",
  },
  social: {
    instagram: "#",
    twitter: "#",
  },
  navbar: {
    links: [
      { label: "Products", href: "/products" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
};
```

### Step 6: Create apps/web/app/api/health/route.ts
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

export async function GET() {
  const checks: Record<string, string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  try {
    await redis.ping();
    checks.redis = "ok";
  } catch {
    checks.redis = "error";
  }

  const healthy = Object.values(checks).every((v) => v === "ok");

  if (!healthy) {
    logger.error({ checks }, "Health check failed");
    return NextResponse.json({ status: "unhealthy", checks }, { status: 503 });
  }

  return NextResponse.json({ status: "healthy", checks });
}
```

## Notes

- Need to install deps: `pnpm add pino pino-pretty clsx tailwind-merge --filter web`
- The health route imports `@/lib/prisma` and `@/lib/redis` which exist from Task 1.3
- The `@/*` path alias is configured in tsconfig (Task 1.1)
- All files will be under `apps/web/`

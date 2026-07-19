# Code Standards

Implementation rules and conventions for the entire project. The AI agent must follow these in every session without exception. These rules prevent pattern drift across sessions.

---

## Engineering Mindset

- **Think before implementing** — understand what is being built and why before writing a single line
- **Read context files first** — never assume, always verify against architecture.md and project-overview.md
- **Scope is sacred** — only build what the current feature requires. Never go beyond scope even if it seems helpful
- **Every feature must be testable** — if it cannot be verified immediately after implementation, it is incomplete
- **Clean over clever** — simple readable code that a junior developer can understand is always preferred over clever abstractions
- **One thing at a time** — complete one section/component fully before touching the next

---

## TypeScript

- Strict mode enabled in tsconfig.json — no exceptions
- Never use `any` — use `unknown` and narrow the type
- Never use type assertions (`as SomeType`) unless absolutely necessary and commented why
- All function parameters and return types must be explicitly typed
- Use `type` for object shapes and unions — use `interface` only for extendable component props
- Use `const` by default — only use `let` when reassignment is necessary

---

## Next.js 16 Conventions

- App Router only — no Pages Router
- React 19 — use React 19 APIs throughout
- Components are Server Components by default
- Only add `"use client"` when the component requires:
  - `useState`, `useReducer`, `useRef`
  - `useEffect` or browser APIs
  - Event handlers (`onClick`, `onSubmit`, etc.)
  - Zustand stores
  - Razorpay Checkout (requires `window.Razorpay`)
- Route handlers (`app/api/`) return `NextResponse` — never `Response`
- All API routes are authenticated (except webhooks and public product/catalog queries)
- Static placeholder content is read from `data/*.ts` in Server Components and passed down as props

---

## File and Folder Naming

| Type | Convention | Example |
|------|-----------|---------|
| Component files | PascalCase | `ProductCard.tsx` |
| Utility/lib files | camelCase | `prisma.ts`, `razorpay.ts` |
| Data files | camelCase | `products.ts`, `site.ts` |
| API routes | kebab-case | `create-order/route.ts` |
| Type files | camelCase | `product.ts` |
| Hooks | kebab-case | `use-cart.ts` |
| Stores | kebab-case | `cart-store.ts` |

- One component per file — never export multiple components from one file
- Index files in `components/ui/` for barrel exports where genuinely useful

---

## Component Structure

Every component follows this exact order:

```typescript
"use client"; // only if needed

// 1. External imports (npm packages)
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";

// 2. Internal imports (project files)
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// 3. Type definitions
type Props = {
  product: Product;
  onAddToCart: (variantId: string) => void;
};

// 4. Component
export function ProductCard({ product, onAddToCart }: Props) {
  // hooks
  // handlers
  // return JSX
}
```

- Never use default exports — always named exports
- Props type defined directly above the component
- No inline styles except where computed at runtime (document why)
- Every interactive element (`<button>`, `<a>`) must have accessible text or `aria-label`

---

## API Route Structure

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { productRepo } from "@/lib/repositories/product-repo";
import { logger } from "@/lib/logger";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const products = await productRepo.list(query);

    return NextResponse.json(products);
  } catch (error) {
    logger.error({ error, path: "/api/products" }, "Failed to list products");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createProductSchema.parse(body);
    const product = await productRepo.create(data);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    throw error;
  }
}
```

**Rules:**
- Every API route validates input with Zod
- Every mutation checks authentication
- Every API route catches and logs errors
- Throwing re-throws to Next.js error handler (don't catch everything)
- Return appropriate HTTP status codes (200, 201, 400, 401, 404, 422, 500)

---

## Service Layer Structure

```typescript
// lib/services/checkout-service.ts
import { razorpay } from "@/lib/razorpay";
import { orderRepo } from "@/lib/repositories/order-repo";
import { fulfillmentService } from "./fulfillment-service";
import { emailService } from "./email-service";
import { logger } from "@/lib/logger";

type CreateOrderResult = {
  razorpayOrderId: string;
  amount: number;
  currency: string;
};

export const checkoutService = {
  async createRazorpayOrder(userId: string, cartId: string): Promise<CreateOrderResult> {
    // validate cart
    // calculate pricing
    // create Razorpay order
    // return order details
  },

  async verifyPayment(paymentId: string, orderId: string, signature: string): Promise<void> {
    // verify HMAC SHA256 signature
    // update order status in DB
    // submit to Printify
    // send confirmation email
  },

  async handleWebhook(event: RazorpayWebhookEvent): Promise<void> {
    // verify webhook signature
    // check idempotency
    // update order status
  },
};
```

**Rules:**
- Services are plain objects with methods, not classes
- Services compose repositories and external adapters
- Services never import from `next` — they're pure business logic
- Services are the only place business logic lives

---

## Printify Adapter Structure

```typescript
// lib/printify/client.ts
import { logger } from "@/lib/logger";

const BASE_URL = "https://api.printify.com/v1";
const TOKEN = process.env.PRINTIFY_API_TOKEN;

type RequestOptions = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
};

async function request<T>({ method, path, body }: RequestOptions): Promise<T> {
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

  if (!response.ok) {
    if (response.status === 429) {
      // handle rate limit — retry after backoff
    }
    throw new Error(`Printify API error: ${response.status}`);
  }

  return response.json();
}

export const printifyClient = { request };
```

---

## Webhook Handler Structure

```typescript
// app/api/razorpay/webhooks/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { redis } from "@/lib/redis";
import { checkoutService } from "@/lib/services/checkout-service";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  // 1. Verify signature
  const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  // 2. Idempotency check
  const processed = await redis.get(`webhook:${event.event_id}`);
  if (processed) {
    return NextResponse.json({ status: "already_processed" });
  }

  // 3. Process
  await checkoutService.handleWebhook(event);

  // 4. Mark as processed
  await redis.set(`webhook:${event.event_id}`, "1", { EX: 86400 });

  return NextResponse.json({ status: "ok" });
}
```

---

## File Sizes & Organization

- Files should be readable without scrolling — typically under 300 lines
- If a component exceeds 300 lines, extract sub-components
- If a service method exceeds 50 lines, extract helper functions
- If a repository has more than 15 methods, consider splitting by domain

---

## Comments

- No comments explaining what the code does — code must be self-explanatory
- Comments only for why — explaining a non-obvious decision, a timing dependency, or a deliberate deviation
- Never leave TODO comments in committed code — track in progress-tracker.md

---

## Testing Philosophy

- Repository functions: integration tests with test database
- Service functions: unit tests with mocked repositories
- API routes: integration tests with supertest or similar
- Components: React Testing Library for interaction tests
- E2E: Playwright for critical flows (checkout, payment)

## Test Infrastructure

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **Vitest** | Unit/integration test runner | `vitest.config.ts` (root) |
| **@testing-library/react** | Component tests | Setup in `tests/setup.ts` |
| **Playwright** | E2E tests | `playwright.config.ts` (root) |

**Commands:**
```bash
pnpm test          # Vitest unit/integration tests
pnpm test:watch    # Watch mode during development
pnpm test:e2e      # Playwright E2E tests
pnpm test:run      # CI mode (single run, no watch)
```

**File conventions:**
- Unit tests: `*.test.ts` co-located with source (e.g., `pricing-service.test.ts`)
- Component tests: `*.test.tsx` in `__tests__/` next to component
- E2E tests: `tests/e2e/*.spec.ts`
- Setup files: `tests/setup.ts` (Vitest), `tests/e2e/global-setup.ts` (Playwright)

---

## Dependencies

Never install a new package without a clear reason. Check:

1. Does Next.js or React already provide this functionality?
2. Is there a simpler native solution?
3. Is the package actively maintained?

**Approved dependencies:**

| Package | Purpose |
|---------|---------|
| `next` | Framework |
| `react`, `react-dom` | UI library |
| `typescript` | Language |
| `tailwindcss` | Styling |
| `@tailwindcss/postcss` | Tailwind PostCSS plugin |
| `@prisma/client`, `prisma` | ORM |
| `next-auth` | Authentication |
| `@tanstack/react-query` | Server state |
| `zustand` | Client state |
| `zod` | Validation |
| `react-hook-form` | Forms (optional) |
| `recharts` | Charts |
| `lucide-react` | Icons |
| `razorpay` | Payment gateway (backend SDK) |
| `nodemailer` | Email |
| `posthog-js` | Analytics |
| `pino` | Logging |
| `@sentry/nextjs` | Error tracking |
| `minio` | S3-compatible storage client |
| `ioredis` | Redis client |
| `clsx`, `tailwind-merge` | Class merging |
| `shadcn/ui` | UI primitives (individual components installed via CLI) |
| `bull` | Background job queue (Redis-backed) |
| `node-cron` | Scheduled job runner (lightweight alternative for simple cron) |

Do not install any other packages without updating this list first.

### Tailwind v4 + shadcn/ui Adaptation

shadcn/ui was originally authored for Tailwind v3. In this project (Tailwind v4):

- **Animation**: Tailwind v4 includes `animate-*` utilities natively. Skip `tailwindcss-animate` — use native `transition-*` and `animate-*` utilities.
- **`cn()` utility**: Already uses `clsx` + `tailwind-merge` — works identically in v4.
- **`cva` (class-variance-authority)**: shadcn/ui components may import `cva`. Install `class-variance-authority` if needed, or inline variant logic with `cn()`.
- **`@theme inline` vs `tailwind.config`**: All design tokens live in `globals.css` via `@theme inline` — no `tailwind.config.ts` file.
- **shadcn/ui init**: Run `npx shadcn@latest init` with the `--tailwind-v4` flag (supported in latest shadcn). If init prompts for a config file, point it to `globals.css`.
- **Component install**: `npx shadcn@latest add button input card badge skeleton` — the CLI generates components compatible with TW v4 when `@theme inline` is detected.

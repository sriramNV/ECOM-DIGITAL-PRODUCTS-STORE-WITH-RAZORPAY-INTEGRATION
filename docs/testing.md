# Testing Guide

## Strategy

| Layer | Tool | Location | Scope |
|---|---|---|---|
| Unit / Integration | Vitest | `__tests__/` near source, `tests/unit/` | Pure logic, stores, repositories, API routes |
| End-to-end | Playwright | `tests/e2e/` | Full-page flows, user journeys |

Unit tests mock or stub external services (Prisma, Printify, Redis) and run in-process. E2E tests boot the Next.js dev server and exercise real browser interactions.

---

## Unit Tests (Vitest)

### Configuration

`vitest.config.ts`:

- `environment: "node"` — server-side modules
- `globals: true` — `describe`, `it`, `expect` available without imports
- `setupFiles: ["./tests/setup.ts"]` — sets `DATABASE_URL`, `REDIS_URL`, `LOG_LEVEL`
- `resolve.alias` — `@` → `apps/web`

### File Naming & Location

- `*.test.ts` or `*.test.tsx` anywhere under `apps/web/`
- Convention: colocate with source in `__tests__/` directories, or place next to the file under test

| Example | Location |
|---|---|
| `pricing-service.test.ts` | `lib/services/__tests__/` |
| `product-repo.test.ts` | `lib/repositories/__tests__/` |
| `cart-store.test.ts` | `stores/__tests__/` |
| `route.test.ts` | `app/api/products/` |
| `client.test.ts` | `lib/printify/__tests__/` |

### Patterns

**Pure functions** — direct assertion, no setup:

```ts
import { describe, it, expect } from "vitest";
import { calculateSubtotal } from "../pricing-service";

describe("pricingService", () => {
  it("calculates subtotal correctly", () => {
    expect(calculateSubtotal([
      { unitPrice: 699, quantity: 2 },
      { unitPrice: 499, quantity: 1 },
    ])).toBe(1897);
  });
});
```

**Zustand stores** — reset state between tests with `useStore.setState`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/stores/cart-store";

describe("cartStore", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it("adds item to empty cart", () => {
    useCartStore.getState().addItem(item);
    expect(useCartStore.getState().items).toHaveLength(1);
  });
});
```

**Repositories (Prisma)** — these call the real database. In CI, ensure a test DB is available; locally, point to a local Postgres. The setup file sets `DATABASE_URL` to a test database:

```ts
// tests/setup.ts
process.env.DATABASE_URL = "postgresql://pod:password@localhost:5432/pod_test";
```

Repository tests verify the query API surface:

```ts
describe("productRepo", () => {
  it("list returns paginated results", async () => {
    const result = await productRepo.list({ page: 1, limit: 10 });
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.page).toBe(1);
  });
});
```

For unit-testing repositories without a database, mock `@/lib/prisma` using Vitest's `vi.mock`. Example:

```ts
import { vi, describe, it, expect } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));
```

**API routes** — hit the running dev server via `fetch`:

```ts
describe("GET /api/products", () => {
  it("returns 200 with paginated response", async () => {
    const res = await fetch("http://localhost:3000/api/products?page=1&limit=10");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("items");
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("page");
  });
});
```

### Running

```bash
pnpm test              # vitest run (single pass)
pnpm test -- --reporter=verbose   # verbose output
pnpm test:watch        # vitest (watch mode)
```

---

## E2E Tests (Playwright)

### Configuration

`playwright.config.ts`:

- `testDir: "./tests/e2e"`
- `fullyParallel: true`
- `webServer` — runs `pnpm dev`, waits for `http://localhost:3000`
- `use.baseURL` — defaults to `http://localhost:3000`

### File Naming & Location

- `*.spec.ts` in `tests/e2e/`

### Patterns

**Page assertions:**

```ts
import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("POD Store");
});
```

**API request testing:**

```ts
test("health check returns ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe("healthy");
});
```

### Running

```bash
pnpm test:e2e                            # headless (all browsers)
pnpm test:e2e --headed                   # visible browser
pnpm test:e2e --ui                       # Playwright UI mode
pnpm test:e2e --debug                    # step through with inspector
pnpm test:e2e --project=chromium         # single browser
```

---

## Best Practices

1. **Test behavior, not implementation.** Assert on outputs and side effects, not internal calls.
2. **Keep unit tests fast.** No network, no filesystem — mock at module boundaries.
3. **Reset state between tests.** Use `beforeEach` for stores, database cleanup for repos.
4. **One concern per test file.** If you're testing a form, keep form tests together.
5. **Coverage goals.** Aim for 80%+ on services and utilities; 60%+ on repositories and API routes.
6. **What not to test:**
   - Prisma schema migrations
   - Third-party service behaviour (Printify API semantics)
   - Next.js framework internals
7. **Factories.** Create reusable helpers for test data rather than inlining objects:

```ts
// tests/helpers/factories.ts
export function buildCartItem(overrides = {}) {
  return {
    id: "p-v1",
    productId: "p1",
    variantId: "v1",
    title: "Test Product",
    image: "",
    price: 499,
    quantity: 1,
    size: "M",
    color: "Black",
    slug: "test-product",
    ...overrides,
  };
}
```

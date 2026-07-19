# Task 1.7: Set up Vitest + Playwright test infrastructure

**Plan:** Plan 01 — Foundation & Project Setup
**Produces:** Working test infrastructure

## Files to Create

- `vitest.config.ts` (root)
- `playwright.config.ts` (root)
- `apps/web/vitest.config.ts` (or root vitest config is enough — create root level)
- `tests/setup.ts`
- `tests/e2e/example.spec.ts`

## Steps

### Step 1: Create root vitest.config.ts
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules/", "tests/"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./apps/web"),
    },
  },
});
```

### Step 2: Create playwright.config.ts
```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### Step 3: Create tests/setup.ts
```typescript
import { beforeAll, afterAll } from "vitest";

beforeAll(() => {
  process.env.DATABASE_URL = "postgresql://pod:password@localhost:5432/pod_test";
  process.env.REDIS_URL = "redis://localhost:6379";
  process.env.LOG_LEVEL = "silent";
});

afterAll(() => {
  // Cleanup
});
```

### Step 4: Create tests/e2e/example.spec.ts
```typescript
import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("POD Store");
});

test("health check returns ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe("healthy");
});
```

### Step 5: Verify tests pass
```bash
npx vitest run
```

Expected: Tests pass (health check may fail if Docker isn't running — tests will still compile).

## Notes

- Root-level vitest config covers all packages
- Playwright config needs `@playwright/test` installed
- Test setup sets env vars for test database and silent logging
- Install: `pnpm add -D @playwright/test vitest @types/node --filter root` or add at root

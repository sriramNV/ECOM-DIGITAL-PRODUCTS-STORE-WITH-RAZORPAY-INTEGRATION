# Task 3.2: Create product API routes

**Plan:** Plan 03 — Product Catalog
**Depends on:** Task 3.1 (productRepo, categoryRepo)
**Produces:** `GET /api/products`, `GET /api/products/[slug]`, `GET /api/categories`

## Files to Create

- `apps/web/app/api/products/route.ts`
- `apps/web/app/api/products/[slug]/route.ts`
- `apps/web/app/api/categories/route.ts`
- `apps/web/app/api/products/route.test.ts`

## Steps

### Step 1: Create apps/web/app/api/products/route.ts
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { productRepo } from "@/lib/repositories/product-repo";
import { logger } from "@/lib/logger";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "name"]).default("newest"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const products = await productRepo.list(query);

    return NextResponse.json(products);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    logger.error({ error }, "Failed to list products");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Step 2: Create apps/web/app/api/products/[slug]/route.ts
```typescript
import { NextRequest, NextResponse } from "next/server";
import { productRepo } from "@/lib/repositories/product-repo";
import { logger } from "@/lib/logger";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await productRepo.getBySlug(slug);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    logger.error({ error }, "Failed to get product");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Step 3: Create apps/web/app/api/categories/route.ts
```typescript
import { NextResponse } from "next/server";
import { categoryRepo } from "@/lib/repositories/category-repo";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const categories = await categoryRepo.list();
    return NextResponse.json(categories);
  } catch (error) {
    logger.error({ error }, "Failed to list categories");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Step 4: Write API test
```typescript
// apps/web/app/api/products/route.test.ts
import { describe, it, expect } from "vitest";

describe("GET /api/products", () => {
  it("returns 200 with paginated response", async () => {
    const res = await fetch("http://localhost:3000/api/products?page=1&limit=10");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("items");
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("page");
  });

  it("returns 422 for invalid params", async () => {
    const res = await fetch("http://localhost:3000/api/products?page=-1");
    expect(res.status).toBe(422);
  });
});
```

### Step 5: Commit
```bash
git add apps/web/app/api/products apps/web/app/api/categories
git commit -m "feat: add product and category API routes"
```

## Notes

- The `[slug]` directory uses Next.js 16 dynamic routes with `params: Promise`
- All routes use Zod validation
- Products route uses query params for filtering
- Categories route returns all categories with product counts

# Task 3.1: Create product repositories

**Plan:** Plan 03 — Product Catalog
**Depends on:** Plan 01 (Prisma schema with Product, Category models), Plan 02 (types)
**Produces:** `productRepo.list()`, `productRepo.getBySlug()`, `categoryRepo.list()`

## Files to Create

- `apps/web/lib/repositories/product-repo.ts`
- `apps/web/lib/repositories/category-repo.ts`
- `apps/web/lib/repositories/__tests__/product-repo.test.ts`

## Steps

### Step 1: Create apps/web/lib/repositories/product-repo.ts
```typescript
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type ListOptions = {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: "price_asc" | "price_desc" | "newest" | "name";
  isActive?: boolean;
};

type ListResult = {
  items: Array<{
    id: string;
    title: string;
    slug: string;
    basePrice: number;
    marginPercent: number;
    isFeatured: boolean;
    category: { name: string; slug: string } | null;
    images: Array<{ url: string; alt: string | null }>;
    variants: Array<{ price: number }>;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  totalPages: number;
};

export const productRepo = {
  async list(options: ListOptions = {}): Promise<ListResult> {
    const { page = 1, limit = 20, category, search, sort = "newest", isActive = true } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = { isActive };

    if (category) {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "price_asc"
        ? { basePrice: "asc" }
        : sort === "price_desc"
          ? { basePrice: "desc" }
          : sort === "name"
            ? { title: "asc" }
            : { createdAt: "desc" };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { name: true, slug: true } },
          images: { orderBy: { position: "asc" }, take: 1 },
          variants: { where: { isEnabled: true }, select: { price: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        basePrice: Number(item.basePrice),
        marginPercent: Number(item.marginPercent),
        isFeatured: item.isFeatured,
        category: item.category,
        images: item.images.map((img) => ({ url: img.url, alt: img.alt })),
        variants: item.variants,
        createdAt: item.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: true,
        variants: { where: { isEnabled: true }, orderBy: { title: "asc" } },
        images: { orderBy: { position: "asc" } },
      },
    });

    if (!product) return null;

    return {
      ...product,
      basePrice: Number(product.basePrice),
      marginPercent: Number(product.marginPercent),
      variants: product.variants.map((v) => ({ ...v, price: Number(v.price) })),
    };
  },

  async getFeatured(limit = 8) {
    return prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        category: { select: { name: true, slug: true } },
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: { where: { isEnabled: true }, select: { price: true } },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  },
};
```

### Step 2: Create apps/web/lib/repositories/category-repo.ts
```typescript
import { prisma } from "@/lib/prisma";

export const categoryRepo = {
  async list() {
    return prisma.category.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });
  },

  async getBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
      include: {
        children: true,
        products: {
          where: { isActive: true },
          include: {
            images: { orderBy: { position: "asc" }, take: 1 },
          },
        },
      },
    });
  },
};
```

### Step 3: Write product repository test
```typescript
// apps/web/lib/repositories/__tests__/product-repo.test.ts
import { describe, it, expect } from "vitest";
import { productRepo } from "../product-repo";

describe("productRepo", () => {
  it("list returns paginated results", async () => {
    const result = await productRepo.list({ page: 1, limit: 10 });
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBeGreaterThanOrEqual(0);
  });

  it("getBySlug returns null for non-existent product", async () => {
    const result = await productRepo.getBySlug("non-existent-product");
    expect(result).toBeNull();
  });
});
```

### Step 4: Run test
```bash
npx vitest run apps/web/lib/repositories/__tests__/product-repo.test.ts
```

Expected: Tests pass (items will be empty array since no products seeded yet).

### Step 5: Commit
```bash
git add apps/web/lib/repositories
git commit -m "feat: add product and category repositories"
```

## Notes

- Prisma client must be generated (should be from Plan 01)
- The `children` include on category-repo.list was removed because the Category model has `children Category?` (singular) in the schema — the implementer fixed this in Plan 01 Task 1.3. The diff shows `children: true` — verify if the schema has `children Category[]` or `children Category?`. If the schema was fixed to `Category[]`, the include works. If not, remove it.
- Actually, look carefully: the Category has `children Category? @relation("CategoryHierarchy")` — the fix in Task 1.3 changed this to `children Category[]`. So the array include is correct.
- Wait — Task 1.3 implementer reported fixing this. But the schema in the plan file wasn't updated. Let me check the actual schema.

Actually, I need to verify the actual schema to see if `children` is `Category[]` or `Category?`.

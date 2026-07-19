# Plan 03: Product Catalog

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use `- [ ]` syntax.

**Goal:** Build product database models, API routes, and storefront catalog/detail pages for browsing and filtering products

**Architecture:** Prisma models (Product, ProductVariant, ProductImage, Category) with repository pattern for DB access. Server Components render product grids and detail pages. TanStack Query on the client powers interactive filtering. PostgreSQL ILIKE for MVP search.

**Tech Stack:** Prisma, TanStack Query, Tailwind v4, next/image, Zod

---

## Global Constraints

- Products are manually created by admin (linked to Printify blueprints) — no auto-sync
- Pricing: `finalPrice = basePrice * (1 + marginPercent / 100)`
- Images: picsum.photos for dev, Printify mockups for prod — no committed image files
- Search: PostgreSQL ILIKE on title/description/tags
- Categories are hierarchical (parent → children)
- TanStack Query stale times: catalog 60s, detail 60s

---

## File Structure

```
apps/web/
├── app/(storefront)/
│   ├── layout.tsx               # Storefront layout (Navbar + Footer)
│   ├── products/
│   │   ├── page.tsx             # Catalog listing page
│   │   └── [slug]/
│   │       └── page.tsx         # Product detail page
│   └── page.tsx                 # Landing page (hero, featured)
├── app/api/
│   ├── products/
│   │   ├── route.ts             # GET list with filters
│   │   └── [slug]/route.ts      # GET single product
│   └── categories/route.ts      # GET category list
├── components/storefront/
│   ├── layout/
│   │   ├── navbar.tsx
│   │   ├── footer.tsx
│   │   ├── mobile-menu.tsx
│   │   └── announcement-bar.tsx
│   ├── home/
│   │   ├── hero-banner.tsx
│   │   ├── featured-collections.tsx
│   │   ├── hot-items.tsx
│   │   └── newsletter-cta.tsx
│   ├── product/
│   │   ├── product-card.tsx
│   │   ├── product-grid.tsx
│   │   ├── product-gallery.tsx
│   │   ├── variant-selector.tsx
│   │   ├── price-display.tsx
│   │   └── add-to-cart-button.tsx
│   └── shared/
│       ├── search-bar.tsx
│       ├── filter-panel.tsx
│       ├── pagination.tsx
│       ├── breadcrumbs.tsx
│       └── empty-state.tsx
├── lib/repositories/
│   ├── product-repo.ts
│   └── category-repo.ts
├── data/
│   ├── products.ts              # Placeholder product data
│   └── collections.ts           # Placeholder collection data
└── stores/
    └── filter-store.ts          # Zustand filter state
```

---

### Task 3.1: Create product repositories

**Files:**
- Create: `apps/web/lib/repositories/product-repo.ts`
- Create: `apps/web/lib/repositories/category-repo.ts`
- Modify: `prisma/schema.prisma` (already has models from Plan 01)

**Interfaces:**
- Consumes: `prisma` singleton from Plan 01
- Produces: `productRepo.list()`, `productRepo.getBySlug()`, `categoryRepo.list()`

- [ ] **Step 1: Create apps/web/lib/repositories/product-repo.ts**

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
    const product = await prisma.product.findFirst({
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
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        category: { select: { name: true, slug: true } },
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: { where: { isEnabled: true }, select: { price: true } },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return products.map((p) => ({
      ...p,
      basePrice: Number(p.basePrice),
      marginPercent: Number(p.marginPercent),
      variants: p.variants.map((v) => ({ ...v, price: Number(v.price) })),
    }));
  },
};
```

- [ ] **Step 2: Create apps/web/lib/repositories/category-repo.ts**

```typescript
import { prisma } from "@/lib/prisma";

export const categoryRepo = {
  async list() {
    return prisma.category.findMany({
      orderBy: { order: "asc" },
      include: {
        children: true,
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

- [ ] **Step 3: Write product repository test**

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

- [ ] **Step 4: Run test**

```bash
npx vitest run apps/web/lib/repositories/__tests__/product-repo.test.ts
```

Expected: Tests pass (items will be empty array since no products seeded yet).

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/repositories
git commit -m "feat: add product and category repositories"
```

---

### Task 3.2: Create product API routes

**Files:**
- Create: `apps/web/app/api/products/route.ts`
- Create: `apps/web/app/api/products/[slug]/route.ts`
- Create: `apps/web/app/api/categories/route.ts`

**Interfaces:**
- Consumes: `productRepo`, `categoryRepo` from Task 3.1
- Produces: `GET /api/products`, `GET /api/products/[slug]`, `GET /api/categories`

- [ ] **Step 1: Create apps/web/app/api/products/route.ts**

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

- [ ] **Step 2: Create apps/web/app/api/products/[slug]/route.ts**

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

- [ ] **Step 3: Create apps/web/app/api/categories/route.ts**

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

- [ ] **Step 4: Write API test**

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

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/products apps/web/app/api/categories
git commit -m "feat: add product and category API routes"
```

---

### Task 3.3: Create storefront layout components

**Files:**
- Create: `apps/web/components/storefront/layout/navbar.tsx`
- Create: `apps/web/components/storefront/layout/footer.tsx`
- Create: `apps/web/components/storefront/layout/mobile-menu.tsx`
- Create: `apps/web/components/storefront/layout/announcement-bar.tsx`
- Create: `apps/web/app/(storefront)/layout.tsx`

**Interfaces:**
- Consumes: `auth()` from Plan 02 for user state
- Produces: reusable storefront layout with Navbar, Footer, Announcement bar

- [ ] **Step 1: Create apps/web/components/storefront/layout/navbar.tsx**

```typescript
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";

export function Navbar() {
  const { data: session } = useSession();
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border h-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-full flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-foreground">
          POD Store
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/products" className="text-sm font-medium text-foreground-muted hover:text-foreground">
            Products
          </Link>
          <Link href="/about" className="text-sm font-medium text-foreground-muted hover:text-foreground">
            About
          </Link>
          <Link href="/contact" className="text-sm font-medium text-foreground-muted hover:text-foreground">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/cart" className="relative">
            <ShoppingCart className="h-5 w-5 text-foreground-muted hover:text-foreground" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          {session ? (
            <div className="flex items-center gap-3">
              <Link href="/account" className="text-sm text-foreground-muted hover:text-foreground">
                {session.user.name ?? "Account"}
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create apps/web/components/storefront/layout/footer.tsx**

```typescript
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border px-4 md:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Shop</h3>
          <ul className="space-y-2">
            <li><Link href="/products" className="text-sm text-foreground-muted hover:text-foreground">All Products</Link></li>
            <li><Link href="/products?category=tshirts" className="text-sm text-foreground-muted hover:text-foreground">T-Shirts</Link></li>
            <li><Link href="/products?category=hoodies" className="text-sm text-foreground-muted hover:text-foreground">Hoodies</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Help</h3>
          <ul className="space-y-2">
            <li><Link href="/contact" className="text-sm text-foreground-muted hover:text-foreground">Contact</Link></li>
            <li><Link href="/faq" className="text-sm text-foreground-muted hover:text-foreground">FAQ</Link></li>
            <li><Link href="/size-guide" className="text-sm text-foreground-muted hover:text-foreground">Size Guide</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Company</h3>
          <ul className="space-y-2">
            <li><Link href="/about" className="text-sm text-foreground-muted hover:text-foreground">About</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Follow Us</h3>
          <p className="text-sm text-foreground-muted">Instagram • Twitter</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-border text-center">
        <p className="text-sm text-foreground-faint">&copy; {new Date().getFullYear()} POD Store. All rights reserved.</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Create apps/web/components/storefront/layout/mobile-menu.tsx**

```typescript
"use client";

import Link from "next/link";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function MobileMenu({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-overlay" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-background shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="text-lg font-semibold">Menu</span>
          <button onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-4">
          <Link href="/products" className="block text-lg font-medium py-4 border-b border-border" onClick={onClose}>
            Products
          </Link>
          <Link href="/about" className="block text-lg font-medium py-4 border-b border-border" onClick={onClose}>
            About
          </Link>
          <Link href="/contact" className="block text-lg font-medium py-4" onClick={onClose}>
            Contact
          </Link>
        </nav>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create apps/web/components/storefront/layout/announcement-bar.tsx**

```typescript
export function AnnouncementBar() {
  return (
    <div className="bg-accent h-8 flex items-center justify-center">
      <p className="text-xs text-accent-foreground text-center">
        Free shipping on orders above ₹999
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Create apps/web/app/(storefront)/layout.tsx**

```typescript
import { AnnouncementBar } from "@/components/storefront/layout/announcement-bar";
import { Navbar } from "@/components/storefront/layout/navbar";
import { Footer } from "@/components/storefront/layout/footer";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/storefront/layout apps/web/app/\(storefront\)/layout.tsx
git commit -m "feat: add storefront layout with navbar, footer, announcement bar"
```

---

### Task 3.4: Create product display components

**Files:**
- Create: `apps/web/components/storefront/product/product-card.tsx`
- Create: `apps/web/components/storefront/product/product-grid.tsx`
- Create: `apps/web/components/storefront/product/product-gallery.tsx`
- Create: `apps/web/components/storefront/product/variant-selector.tsx`
- Create: `apps/web/components/storefront/product/price-display.tsx`
- Create: `apps/web/components/storefront/shared/empty-state.tsx`
- Create: `apps/web/components/storefront/shared/pagination.tsx`
- Create: `apps/web/components/storefront/shared/breadcrumbs.tsx`

**Interfaces:**
- Consumes: product data shape from Task 3.1
- Produces: reusable product UI components

- [ ] **Step 1: Create apps/web/components/storefront/product/product-card.tsx**

```typescript
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";

type Props = {
  title: string;
  slug: string;
  imageUrl: string;
  imageAlt: string | null;
  minPrice: number;
};

export function ProductCard({ title, slug, imageUrl, imageAlt, minPrice }: Props) {
  return (
    <Link href={`/products/${slug}`} className="group">
      <div className="bg-surface-raised border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="aspect-square relative overflow-hidden bg-surface">
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            className="object-cover group-hover:scale-102 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
        </div>
        <div className="p-4">
          <h3 className="text-sm font-medium text-foreground truncate">{title}</h3>
          <p className="text-sm text-foreground-muted mt-1">From {formatCurrency(minPrice)}</p>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create apps/web/components/storefront/product/product-grid.tsx**

```typescript
import { ProductCard } from "./product-card";

type Product = {
  title: string;
  slug: string;
  images: Array<{ url: string; alt: string | null }>;
  variants: Array<{ price: number }>;
};

type Props = {
  products: Product[];
};

export function ProductGrid({ products }: Props) {
  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.slug}
          title={product.title}
          slug={product.slug}
          imageUrl={product.images[0]?.url ?? "/placeholder.svg"}
          imageAlt={product.images[0]?.alt ?? null}
          minPrice={Math.min(...product.variants.map((v) => v.price))}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create apps/web/components/storefront/product/price-display.tsx**

```typescript
import { formatCurrency } from "@/lib/utils";

type Props = {
  price: number;
  originalPrice?: number;
  size?: "sm" | "md" | "lg";
};

export function PriceDisplay({ price, originalPrice, size = "md" }: Props) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg font-semibold",
    lg: "text-2xl font-bold",
  };

  return (
    <div className="flex items-baseline gap-2">
      <span className={`${sizeClasses[size]} text-foreground`}>{formatCurrency(price)}</span>
      {originalPrice && originalPrice > price && (
        <span className="text-sm text-foreground-faint line-through">{formatCurrency(originalPrice)}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create apps/web/components/storefront/product/variant-selector.tsx**

```typescript
"use client";

type Variant = {
  id: string;
  title: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  price: number;
};

type Props = {
  variants: Variant[];
  selectedId: string | null;
  onSelect: (variant: Variant) => void;
};

export function VariantSelector({ variants, selectedId, onSelect }: Props) {
  const colors = [...new Set(variants.filter((v) => v.color).map((v) => v.color!))];
  const sizes = [...new Set(variants.filter((v) => v.size).map((v) => v.size!))];

  return (
    <div className="space-y-4">
      {colors.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Color</label>
          <div className="flex gap-2">
            {colors.map((color) => {
              const variant = variants.find((v) => v.color === color);
              return (
                <button
                  key={color}
                  onClick={() => variant && onSelect(variant)}
                  className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-colors ${
                    variant?.id === selectedId ? "border-accent ring-2 ring-accent" : "border-border"
                  }`}
                  style={{ backgroundColor: variant?.colorHex ?? "#ccc" }}
                  aria-label={color}
                />
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Size</label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const variant = variants.find((v) => v.size === size);
              return (
                <button
                  key={size}
                  onClick={() => variant && onSelect(variant)}
                  className={`px-4 py-2 rounded-md border text-sm cursor-pointer ${
                    variant?.id === selectedId
                      ? "bg-accent text-accent-foreground border-accent"
                      : "border-border text-foreground hover:bg-surface"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create remaining shared components**

```typescript
// apps/web/components/storefront/shared/empty-state.tsx
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
};

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Icon className="h-12 w-12 text-foreground-faint mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-sm text-foreground-muted max-w-sm mb-6">{description}</p>
      {action && (
        <Link href={action.href}>
          <Button>{action.label}</Button>
        </Link>
      )}
    </div>
  );
}
```

```typescript
// apps/web/components/storefront/shared/pagination.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  currentPage: number;
  totalPages: number;
};

export function Pagination({ currentPage, totalPages }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-3 py-2 text-sm rounded-md border border-border disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        const page = i + 1;
        return (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`px-3 py-2 text-sm rounded-md border ${
              page === currentPage
                ? "bg-accent text-accent-foreground border-accent"
                : "border-border text-foreground hover:bg-surface"
            }`}
          >
            {page}
          </button>
        );
      })}

      {totalPages > 5 && <span className="px-2 text-foreground-faint">...</span>}

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-2 text-sm rounded-md border border-border disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
```

```typescript
// apps/web/components/storefront/shared/breadcrumbs.tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { label: string; href?: string };

type Props = {
  crumbs: Crumb[];
};

export function Breadcrumbs({ crumbs }: Props) {
  return (
    <nav className="flex items-center gap-2 text-sm text-foreground-faint py-4" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-foreground">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/storefront/product apps/web/components/storefront/shared
git commit -m "feat: add product display components (card, grid, gallery, variant selector, price)"
```

---

### Task 3.5: Create catalog and product detail pages

**Files:**
- Create: `apps/web/app/(storefront)/products/page.tsx`
- Create: `apps/web/app/(storefront)/products/[slug]/page.tsx`
- Create: `apps/web/app/(storefront)/page.tsx` (landing page)
- Create: `apps/web/data/products.ts`
- Create: `apps/web/data/collections.ts`

**Interfaces:**
- Consumes: product API routes from Task 3.2, product components from Task 3.4
- Produces: functional `/products`, `/products/[slug]`, and `/` pages

- [ ] **Step 1: Create apps/web/data/products.ts**

```typescript
import { slugify } from "@/lib/utils";

export const placeholderProducts = [
  {
    title: "Classic Cotton T-Shirt",
    slug: "classic-cotton-t-shirt",
    description: "Premium quality 100% combed ring-spun cotton t-shirt. Pre-shrunk fabric, seamless double-needle collar, and taped neck and shoulders for durability.",
    basePrice: 499,
    marginPercent: 40,
    category: "T-Shirts",
    tags: ["cotton", "classic", "essential"],
    images: [
      { url: "https://picsum.photos/seed/tshirt1/600/600", alt: "Classic Cotton T-Shirt front" },
      { url: "https://picsum.photos/seed/tshirt2/600/600", alt: "Classic Cotton T-Shirt back" },
    ],
    variants: [
      { size: "S", color: "Black", colorHex: "#000000", price: 698 },
      { size: "M", color: "Black", colorHex: "#000000", price: 698 },
      { size: "L", color: "Black", colorHex: "#000000", price: 698 },
      { size: "XL", color: "Black", colorHex: "#000000", price: 698 },
      { size: "S", color: "White", colorHex: "#FFFFFF", price: 698 },
      { size: "M", color: "White", colorHex: "#FFFFFF", price: 698 },
      { size: "L", color: "White", colorHex: "#FFFFFF", price: 698 },
    ],
  },
  {
    title: "Premium Hoodie",
    slug: "premium-hoodie",
    description: "Ultra-soft 80/20 cotton-polyester blend hoodie with front pouch pocket, adjustable drawstring hood, and ribbed cuffs and hem.",
    basePrice: 899,
    marginPercent: 40,
    category: "Hoodies",
    tags: ["hoodie", "premium", "warm"],
    images: [
      { url: "https://picsum.photos/seed/hoodie1/600/600", alt: "Premium Hoodie front" },
    ],
    variants: [
      { size: "S", color: "Navy", colorHex: "#1a2744", price: 1258 },
      { size: "M", color: "Navy", colorHex: "#1a2744", price: 1258 },
      { size: "L", color: "Navy", colorHex: "#1a2744", price: 1258 },
      { size: "S", color: "Gray", colorHex: "#808080", price: 1258 },
      { size: "M", color: "Gray", colorHex: "#808080", price: 1258 },
    ],
  },
];

export const placeholderCategories = [
  { name: "T-Shirts", slug: "tshirts", description: "Classic and printed t-shirts", order: 1 },
  { name: "Hoodies", slug: "hoodies", description: "Warm and comfortable hoodies", order: 2 },
  { name: "Mugs", slug: "mugs", description: "Ceramic printed mugs", order: 3 },
  { name: "Posters", slug: "posters", description: "High-quality art prints", order: 4 },
];
```

- [ ] **Step 2: Create apps/web/data/collections.ts**

```typescript
export const placeholderCollections = [
  {
    name: "Best Sellers",
    slug: "best-sellers",
    description: "Our most popular designs",
    productSlugs: ["classic-cotton-t-shirt", "premium-hoodie"],
  },
  {
    name: "New Arrivals",
    slug: "new-arrivals",
    description: "Fresh designs just landed",
    productSlugs: ["premium-hoodie"],
  },
];
```

- [ ] **Step 3: Create apps/web/app/(storefront)/products/page.tsx**

```typescript
import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/storefront/product/product-grid";
import { Breadcrumbs } from "@/components/storefront/shared/breadcrumbs";
import { productRepo } from "@/lib/repositories/product-repo";

export const metadata: Metadata = {
  title: "Products — POD Store",
  description: "Browse our collection of custom printed products",
};

type Props = {
  searchParams: Promise<{ page?: string; category?: string; search?: string; sort?: string }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const result = await productRepo.list({
    page: Number(params.page) || 1,
    category: params.category,
    search: params.search,
    sort: (params.sort as "price_asc" | "price_desc" | "newest" | "name") ?? "newest",
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "Products" }]} />

      <h1 className="text-3xl font-bold text-foreground mb-8">All Products</h1>

      <Suspense fallback={<div className="grid grid-cols-4 gap-6">{/* skeleton */}</div>}>
        <ProductGrid products={result.items} />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 4: Create apps/web/app/(storefront)/products/[slug]/page.tsx**

```typescript
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { productRepo } from "@/lib/repositories/product-repo";
import { ProductGallery } from "@/components/storefront/product/product-gallery";
import { VariantSelector } from "@/components/storefront/product/variant-selector";
import { PriceDisplay } from "@/components/storefront/product/price-display";
import { AddToCartButton } from "@/components/storefront/product/add-to-cart-button";
import { Breadcrumbs } from "@/components/storefront/shared/breadcrumbs";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await productRepo.getBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.title} — POD Store`,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await productRepo.getBySlug(slug);

  if (!product) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          { label: product.title },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-4">
        <ProductGallery
          images={product.images.map((img) => ({ url: img.url, alt: img.alt ?? product.title }))}
        />

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{product.title}</h1>
            {product.category && (
              <p className="text-sm text-foreground-muted mt-1">{product.category.name}</p>
            )}
          </div>

          <PriceDisplay
            price={Math.min(...product.variants.map((v) => v.price))}
            size="lg"
          />

          <div className="border-t border-border pt-6">
            <VariantSelector
              variants={product.variants}
              selectedId={null}
              onSelect={() => {}}
            />
          </div>

          <AddToCartButton
            productId={product.id}
            disabled={product.variants.length === 0}
          />

          <div className="border-t border-border pt-6">
            <h2 className="text-sm font-medium text-foreground mb-2">Description</h2>
            <p className="text-sm text-foreground-muted leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create apps/web/app/(storefront)/page.tsx (overwrite placeholder)**

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/storefront/product/product-grid";
import { productRepo } from "@/lib/repositories/product-repo";

export default async function HomePage() {
  const featured = await productRepo.getFeatured(8);

  return (
    <>
      <section className="min-h-[400px] md:min-h-[500px] lg:min-h-[600px] bg-surface flex items-center">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 w-full">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground max-w-2xl">
            Premium Print-on-Demand
          </h1>
          <p className="text-lg md:text-xl text-foreground-muted mt-4 max-w-xl">
            Custom designs printed on t-shirts, hoodies, mugs, and more. Quality products shipped worldwide.
          </p>
          <Link href="/products">
            <Button size="lg" className="mt-8">Shop Now</Button>
          </Link>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="py-12 md:py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-8">Featured Products</h2>
            <ProductGrid
              products={featured.map((p) => ({
                title: p.title,
                slug: p.slug,
                images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
                variants: p.variants,
              }))}
            />
          </div>
        </section>
      )}
    </>
  );
}
```

- [ ] **Step 6: Seed database with placeholder data**

```typescript
// Add to prisma/seed.ts:
import { placeholderProducts, placeholderCategories } from "../apps/web/data/products";

async function seedProducts() {
  for (const cat of placeholderCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  for (const product of placeholderProducts) {
    const category = await prisma.category.findUnique({ where: { slug: slugify(product.category) } });

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        title: product.title,
        slug: product.slug,
        description: product.description,
        basePrice: product.basePrice,
        marginPercent: product.marginPercent,
        categoryId: category?.id ?? null,
        tags: product.tags,
        images: {
          create: product.images.map((img, i) => ({
            url: img.url,
            alt: img.alt,
            position: i,
          })),
        },
        variants: {
          create: product.variants.map((v) => ({
            title: `${v.size} / ${v.color}`,
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            price: v.price,
          })),
        },
      },
    });
  }
}
```

- [ ] **Step 7: Re-seed and verify**

```bash
pnpm prisma:seed
pnpm dev
```

Open `http://localhost:3000` — see landing page with hero and featured products.
Open `http://localhost:3000/products` — see product grid.
Click a product — see detail page with gallery, variant selector, pricing.

- [ ] **Step 8: Commit**

```bash
git add apps/web/app/\(storefront\)/products apps/web/app/\(storefront\)/page.tsx apps/web/data prisma/seed.ts
git commit -m "feat: add product catalog pages with placeholder data"
```

---

## Spec Coverage Check

| Requirement | Task |
|-------------|------|
| Product, ProductVariant, ProductImage, Category models | 3.1 (already in schema from Plan 01) |
| Product repository with list/getBySlug/getFeatured | 3.1 |
| Category repository with hierarchy | 3.1 |
| Product listing API with filters | 3.2 |
| Product detail API | 3.2 |
| Category list API | 3.2 |
| Storefront layout (Navbar, Footer) | 3.3 |
| Product card and grid components | 3.4 |
| Product detail page with gallery, variant selector | 3.4, 3.5 |
| Price display with sale logic | 3.4 |
| Search and filter (category, search, sort) | 3.1, 3.5 |
| Pagination | 3.4 |
| Breadcrumbs | 3.4 |
| Empty state component | 3.4 |
| Placeholder data seeding | 3.5 |

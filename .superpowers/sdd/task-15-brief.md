# Task 3.5: Create catalog and product detail pages

**Plan:** Plan 03 — Product Catalog
**Depends on:** Tasks 3.1-3.4 (repos, APIs, layout, components)
**Produces:** Functional `/products`, `/products/[slug]`, and `/` pages with seeded data

## Files to Create

- `apps/web/app/(storefront)/products/page.tsx`
- `apps/web/app/(storefront)/products/[slug]/page.tsx`
- `apps/web/app/(storefront)/page.tsx` (overwrite placeholder)
- `apps/web/data/products.ts`
- `apps/web/data/collections.ts`
- Modify: `prisma/seed.ts` (add product seeding)

## Steps

### Step 1: Create apps/web/data/products.ts
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

### Step 2: Create apps/web/data/collections.ts
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

### Step 3: Create apps/web/app/(storefront)/products/page.tsx
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

### Step 4: Create apps/web/app/(storefront)/products/[slug]/page.tsx
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

**IMPORTANT:** `AddToCartButton` doesn't exist yet (Plans 03→04 skip). Use a placeholder instead:
```typescript
// Remove the import and replace the usage with a simple <Button>
// Or create a minimal placeholder:
```

### Step 5: Create apps/web/app/(storefront)/page.tsx (overwrite the existing placeholder)
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

### Step 6: Update prisma/seed.ts
Add to the seed file:
```typescript
import { placeholderProducts, placeholderCategories } from "../apps/web/data/products";
import { slugify } from "../apps/web/lib/utils";

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

### Step 7: Create a minimal AddToCartButton placeholder
```typescript
// apps/web/components/storefront/product/add-to-cart-button.tsx
"use client";

import { Button } from "@/components/ui/button";

type Props = {
  productId: string;
  variantId?: string;
  disabled?: boolean;
};

export function AddToCartButton({ productId, variantId, disabled }: Props) {
  return (
    <Button className="w-full" size="lg" disabled={disabled}>
      Add to Cart
    </Button>
  );
}
```

### Step 8: Re-seed and verify
```bash
pnpm prisma:seed
pnpm dev
```

### Step 9: Commit
```bash
git add apps/web/app/\(storefront\) apps/web/data prisma/seed.ts apps/web/components/storefront/product/add-to-cart-button.tsx
git commit -m "feat: add product catalog pages with placeholder data"
```

## Notes

- The existing `apps/web/app/page.tsx` will be overwritten
- The `(storefront)` route group means URLs are `/products` not `/storefront/products`
- Prisma seed must be re-run to populate placeholder data

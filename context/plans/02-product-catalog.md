# Phase 2a — Product Catalog

## Objective

Build the complete product catalog system — database models, API routes, and storefront pages — enabling customers to browse, filter, and view products. Products are created by the admin (linked to Printify blueprints), not auto-synced.

---

## System Design

### Data Model

```prisma
model Product {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  description String   @db.Text
  blueprintId Int?               // Printify blueprint ID
  printProviderId Int?           // Printify print provider ID
  printifyProductId String?      // Printify product ID (after creation)
  basePrice   Decimal  @default(0)  // merchant's base cost
  marginPercent Decimal @default(0) // profit margin percentage
  isActive    Boolean  @default(true)
  isFeatured  Boolean  @default(false)
  categoryId  String?
  tags        String[] @default([])
  metadata    Json?              // Printify metadata (print areas, etc.)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  category    Category?  @relation(fields: [categoryId], references: [id])
  variants    ProductVariant[]
  images      ProductImage[]
  collections CollectionProduct[]
}

model ProductVariant {
  id        String  @id @default(cuid())
  productId String
  printifyVariantId Int           // Printify variant ID
  title     String               // e.g., "Small / Black"
  size      String?              // e.g., "S", "M", "L"
  color     String?              // e.g., "Black", "White"
  colorHex  String?              // e.g., "#000000"
  price     Decimal              // final selling price
  isEnabled Boolean @default(true)
  stock     Int     @default(999)  // Printify = unlimited

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model ProductImage {
  id        String @id @default(cuid())
  productId String
  url       String
  alt       String?
  position  Int    @default(0)     // sort order
  isMockup  Boolean @default(false)  // true = Printify mockup

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique
  description String?
  image       String?
  parentId    String?
  order       Int       @default(0)
  createdAt   DateTime  @default(now())

  parent  Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category? @relation("CategoryHierarchy")
  products Product[]
}
```

### API Routes

```
GET  /api/products?page=1&limit=20&category=tshirts&search=query&sort=price_asc
GET  /api/products/[slug]
GET  /api/categories
```

### Pricing Logic

```
finalPrice = basePrice * (1 + marginPercent / 100)
```

Where:
- `basePrice` = merchant's cost from Printify (set when product is created)
- `marginPercent` = configurable per product (default in settings)
- `finalPrice` = what customer pays

---

## Architecture

### Product Listing Flow

```
Customer visits /products
    → Server Component fetches products + categories
    → Uses TanStack Query on client for interactive filtering
    → Category filter: query param → API route → Prisma where clause
    → Search: full-text search on title/description
    → Sorting: by price (asc/desc), newest, name
    → Pagination: cursor-based or offset (offset for < 1000 products)
```

### Product Detail Flow

```
Customer visits /products/[slug]
    → Server Component fetches product with variants + images
    → Renders product page with gallery, variant selector, add to cart
    → Client component handles variant selection (price updates)
    → Add to cart calls Zustand cart store
```

### Category/Navigation

```
Categories are hierarchical (parent → children)
    e.g., Apparel > T-Shirts, Apparel > Hoodies
    Used in: navbar dropdown, filter panel, breadcrumbs
```

### Search Implementation

```typescript
// For MVP: PostgreSQL ILIKE search
const products = await prisma.product.findMany({
  where: {
    isActive: true,
    OR: [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ],
  },
});

// Future: Upgrade to MeiliSearch or pg_trgm for better search
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Product source | Manual creation via admin (linked to Printify) | Curated catalog, control over pricing and variants |
| Pricing model | Base cost + margin% | Dynamic, easy to adjust globally or per product |
| Image storage | MinIO (self-hosted) + Printify mockups | Mockups come from Printify; custom images on MinIO |
| Slug generation | Auto from title (slugified) | SEO-friendly URLs, unique constraint |
| Search (MVP) | PostgreSQL ILIKE | No additional infrastructure, sufficient for < 1000 products |
| Caching | TanStack Query (client) + Redis (server) | Fast re-renders, reduced DB load |
| Variant model | Flat table (not JSON) | Queryable, indexable, type-safe with Prisma |

---

## Placeholder Data

```typescript
// data/products.ts
export const placeholderProducts = [
  {
    title: "Classic Cotton T-Shirt",
    slug: "classic-cotton-tshirt",
    description: "Premium quality cotton t-shirt...",
    basePrice: 499,
    marginPercent: 40,
    category: "T-Shirts",
    variants: [
      { size: "S", color: "Black", price: 698 },
      { size: "M", color: "Black", price: 698 },
    ],
  },
];
```

### Placeholder Image Strategy

For development and demo, placeholder product images come from:

1. **Development**: `picsum.photos` seeded with product-specific keywords (e.g., `https://picsum.photos/seed/tshirt/600/600`). Used in `data/products.ts` via `next/image` with `unoptimized` during dev.
2. **Production**: Admin uploads artwork → Printify generates mockups → stored in MinIO `pod-assets/mockups/`. URLs saved in `ProductImage` records.
3. **Seed script**: `prisma/seed.ts` creates 8-12 products with picsum URLs. A `scripts/generate-placeholders.ts` helper seeds the full catalog.
4. **No local image files**: Placeholder images are never committed to the repository — generated at seed time or fetched from CDN.

---

## Steps

1. Update Prisma schema with Product, ProductVariant, ProductImage, Category models
2. Run `pnpm prisma:migrate dev --name add-products`
3. Create `lib/repositories/product-repo.ts` (list, getBySlug, search, filter)
4. Create `lib/repositories/category-repo.ts` (list with hierarchy)
5. Create `app/api/products/route.ts` (list with filters)
6. Create `app/api/products/[slug]/route.ts` (single product)
7. Create `app/api/categories/route.ts` (category list)
8. Create `data/products.ts` with placeholder products
9. Create `data/collections.ts` with placeholder collections
10. Create placeholder product images (public/images/placeholders/)
11. Run `pnpm prisma:seed` to populate placeholder data
12. Create `components/storefront/product/product-card.tsx`
13. Create `components/storefront/product/product-grid.tsx`
14. Create `components/storefront/product/product-gallery.tsx`
15. Create `components/storefront/product/variant-selector.tsx`
16. Create `components/storefront/product/price-display.tsx`
17. Create `components/storefront/shared/filter-panel.tsx`
18. Create `components/storefront/shared/search-bar.tsx`
19. Create `components/storefront/shared/pagination.tsx`
20. Create `components/storefront/shared/breadcrumbs.tsx`
21. Create `app/(storefront)/products/page.tsx` (catalog listing)
22. Create `app/(storefront)/products/[slug]/page.tsx` (product detail)
23. Verify: browse catalog, filter by category, search, view product detail

---

## Files Created

| File | Content |
|------|---------|
| `prisma/schema.prisma` (updated) | Product, ProductVariant, ProductImage, Category models |
| `lib/repositories/product-repo.ts` | Product database queries |
| `lib/repositories/category-repo.ts` | Category queries |
| `app/api/products/route.ts` | Product listing API |
| `app/api/products/[slug]/route.ts` | Product detail API |
| `app/api/categories/route.ts` | Category list API |
| `data/products.ts` | Placeholder product data |
| `data/collections.ts` | Placeholder collection data |
| `prisma/seed.ts` (updated) | Seed with products and categories |
| `components/storefront/product/product-card.tsx` | Product card component |
| `components/storefront/product/product-grid.tsx` | Product grid layout |
| `components/storefront/product/product-gallery.tsx` | Image gallery |
| `components/storefront/product/variant-selector.tsx` | Size/color selector |
| `components/storefront/product/price-display.tsx` | Price with sale logic |
| `components/storefront/shared/filter-panel.tsx` | Category/price filters |
| `components/storefront/shared/search-bar.tsx` | Search input |
| `components/storefront/shared/pagination.tsx` | Page navigation |
| `components/storefront/shared/breadcrumbs.tsx` | Breadcrumb trail |
| `app/(storefront)/products/page.tsx` | Catalog page |
| `app/(storefront)/products/[slug]/page.tsx` | Product detail page |
| `app/(storefront)/layout.tsx` | Storefront layout (Navbar + Footer) |

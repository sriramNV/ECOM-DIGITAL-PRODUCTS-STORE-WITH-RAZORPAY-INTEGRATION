# Phase 5a — Content Management System

## Objective

Build a block-based content management system enabling the admin to create and manage pages, banners, and collections without touching code. The storefront renders CMS-managed content dynamically.

---

## System Design

### Block-Based Page Builder

```
┌───────────────────────────────────────────────────────┐
│  Edit Page: "Home"                     [Save] [Preview]│
├───────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────────────────────────────────┐         │
│  │ Hero Block                                │   ☰ ✕  │
│  │ ───────────                               │         │
│  │ Heading: [Welcome to our store.......]   │         │
│  │ Subtitle: [Custom printed apparel....]   │         │
│  │ CTA Text: [Shop Now...................]  │         │
│  │ CTA Link: [/products..................]  │         │
│  │ Background: [Image URL................]  │         │
│  └──────────────────────────────────────────┘         │
│                                                       │
│  ┌──────────────────────────────────────────┐         │
│  │ Product Grid Block                         │   ☰ ✕  │
│  │ ──────────────────                        │         │
│  │ Title: [Featured Products..............]  │         │
│  │ Collection: [▼ Best Sellers...........]  │         │
│  │ Count: [4...........................]    │         │
│  └──────────────────────────────────────────┘         │
│                                                       │
│  ┌──────────────────────────────────────────┐         │
│  │ Text Block                                │   ☰ ✕  │
│  │ ──────────                                │         │
│  │ Content: [Rich text editor............]  │         │
│  │ Alignment: [○ Left ○ Center ○ Right]     │         │
│  └──────────────────────────────────────────┘         │
│                                                       │
│                    [+ Add Block]                       │
└───────────────────────────────────────────────────────┘
```

### Block Types

| Block Type | Fields | Render |
|------------|--------|--------|
| `hero` | heading, subtitle, ctaText, ctaLink, backgroundImage | Full-width hero banner |
| `text` | content (HTML), alignment | Rich text section |
| `image` | src, alt, caption, width | Single image |
| `image_grid` | images[], columns | Collage/grid of images |
| `product_grid` | title, collectionId, count | Grid of product cards |
| `featured_collections` | title, collectionIds[] | Collection cards |
| `newsletter` | heading, subtitle, buttonText | Email signup CTA |
| `cta_banner` | heading, description, buttonText, buttonLink, background | Promotional banner |
| `testimonials` | testimonials[]{name, text, avatar} | Customer review carousel |
| `faq` | items[]{question, answer} | Accordion FAQ section |

---

## Architecture

### Prisma Models

```prisma
model Page {
  id        String   @id @default(cuid())
  title     String
  slug      String   @unique
  path      String   @unique               // e.g., "/about", "/"
  blocks    Json                            // ordered array of block definitions
  seoTitle  String?
  seoDesc   String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Banner {
  id         String   @id @default(cuid())
  title      String
  imageUrl   String
  linkUrl    String?
  position   String                        // "hero", "top", "sidebar"
  isActive   Boolean  @default(true)
  priority   Int      @default(0)          // sort order
  startDate  DateTime?
  endDate    DateTime?
  createdAt  DateTime @default(now())
}

model Collection {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  image       String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  products CollectionProduct[]
}

model CollectionProduct {
  collectionId String
  productId    String
  order        Int    @default(0)

  collection Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  product    Product    @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@id([collectionId, productId])
}
```

### Block Data Structure

```typescript
type Block = {
  id: string;
  type: BlockType;
  settings: Record<string, unknown>;  // type-specific fields
};

// Example hero block
const heroBlock: Block = {
  id: "block_1",
  type: "hero",
  settings: {
    heading: "Welcome to Our Store",
    subtitle: "Custom printed apparel, delivered to your door",
    ctaText: "Shop Now",
    ctaLink: "/products",
    backgroundImage: "/images/banners/hero.jpg",
  },
};
```

### Page Rendering

```tsx
// app/(marketing)/[slug]/page.tsx (or app/page.tsx for "/")
function renderBlock(block: Block) {
  switch (block.type) {
    case "hero":
      return <HeroBlock settings={block.settings} />;
    case "text":
      return <TextBlock settings={block.settings} />;
    case "product_grid":
      return <ProductGridBlock settings={block.settings} />;
    case "newsletter":
      return <NewsletterBlock settings={block.settings} />;
    // ... etc
  }
}

export default function CMSPage({ params }: { params: { slug?: string } }) {
  const path = `/${params.slug ?? ""}`;
  const page = await prisma.page.findUnique({ where: { path } });
  if (!page) return notFound();

  return (
    <div>
      {page.blocks.map((block) => (
        <div key={block.id}>{renderBlock(block)}</div>
      ))}
    </div>
  );
}
```

### Banner Rendering

Banners are rendered at specific positions on the storefront:

```tsx
// In storefront layout
function AnnouncementBar() {
  const topBanners = await prisma.banner.findMany({
    where: { position: "top", isActive: true, startDate: { lte: new Date() }, OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
    orderBy: { priority: "asc" },
  });

  return topBanners.map((banner) => (
    <Link key={banner.id} href={banner.linkUrl ?? "#"}>
      <img src={banner.imageUrl} alt={banner.title} />
    </Link>
  ));
}
```

### Collection Manager

Admin can create collections of products (e.g., "Best Sellers", "New Arrivals", "Summer Collection") and assign products to them with sort order. Collections are used by `product_grid` blocks and can be linked from navigation.

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Block storage | JSON column on Page model | Simple, flexible, no separate tables per block type |
| Rich text | Basic HTML (sanitized) | Avoid complexity of full rich text editor for MVP |
| Block types | 10 types covering common needs | Enough variety for a rich homepage without over-engineering |
| Banner scheduling | startDate / endDate fields | Time-limited promotions without manual toggling |
| Collection assignment | Many-to-many with sort order | Products can be in multiple collections |
| Page routing | Dynamic catch-all route | Any slug becomes a page, "/" is the homepage |
| Caching | Full page cache (Redis) with invalidation on save | CMS pages rarely change, cache aggressively |

---

## Steps

1. Update Prisma schema with Page, Banner, Collection, CollectionProduct models
2. Run `pnpm prisma:migrate dev --name add-cms`
3. Create `lib/repositories/cms-repo.ts`
4. Create block renderer components for each block type
5. Create `app/api/admin/cms/pages/route.ts` (CRUD)
6. Create `app/api/admin/cms/pages/[id]/route.ts`
7. Create `app/api/admin/cms/banners/route.ts`
8. Create `app/api/admin/cms/collections/route.ts`
9. Create `app/api/admin/cms/collections/[id]/products/route.ts`
10. Create `components/admin/cms/page-editor.tsx` (block-based editor)
11. Create `components/admin/cms/block-palette.tsx` (add block menu)
12. Create `components/admin/cms/banner-manager.tsx`
13. Create `components/admin/cms/collection-manager.tsx`
14. Create `app/admin/cms/pages/page.tsx`
15. Create `app/admin/cms/pages/[id]/page.tsx`
16. Create `app/admin/cms/banners/page.tsx`
17. Create `app/admin/cms/collections/page.tsx`
18. Create storefront renderer (`app/(marketing)/[[...slug]]/page.tsx`)
19. Seed initial homepage with hero + product_grid blocks
20. Verify: admin creates page with blocks, renders on storefront

---

## Files Created

| File | Content |
|------|---------|
| `prisma/schema.prisma` (updated) | Page, Banner, Collection, CollectionProduct |
| `lib/repositories/cms-repo.ts` | CMS queries |
| `app/api/admin/cms/pages/route.ts` | Page CRUD |
| `app/api/admin/cms/pages/[id]/route.ts` | Single page |
| `app/api/admin/cms/banners/route.ts` | Banner CRUD |
| `app/api/admin/cms/collections/route.ts` | Collection CRUD |
| `app/api/admin/cms/collections/[id]/products/route.ts` | Collection products |
| `components/admin/cms/page-editor.tsx` | Block-based editor |
| `components/admin/cms/block-palette.tsx` | Add block menu |
| `components/admin/cms/banner-manager.tsx` | Banner form + list |
| `components/admin/cms/collection-manager.tsx` | Collection form |
| `components/storefront/shared/blocks/*.tsx` | Block renderers |
| `app/admin/cms/pages/page.tsx` | Pages list |
| `app/admin/cms/pages/[id]/page.tsx` | Page editor |
| `app/admin/cms/banners/page.tsx` | Banners list |
| `app/admin/cms/collections/page.tsx` | Collections list |
| `app/(marketing)/[[...slug]]/page.tsx` | Dynamic CMS page renderer |

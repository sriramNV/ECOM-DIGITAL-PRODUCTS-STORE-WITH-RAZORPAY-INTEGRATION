# Plan 07: CMS & Promotions

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use `- [ ]` syntax.

**Goal:** Build a block-based content management system and coupon/promotion engine

**Architecture:** CMS uses a block-based page model (hero, text, product grid, etc.) stored as JSON in Prisma. Storefront renders blocks dynamically. Promotions use a Coupon model with percentage/fixed/free-ship types validated at checkout via the pricing service.

**Tech Stack:** Prisma, Zod, TanStack Query, shadcn/ui (Dialog, Form)

---

## Global Constraints

- CMS pages are JSON block-based — no HTML editing
- Coupons: percentage, fixed amount, free shipping — validated at checkout
- Coupon usage limited per-user and globally
- CMS content cached with TanStack Query (5 min stale time)

---

## File Structure

```
apps/web/
├── app/api/
│   ├── cms/
│   │   ├── pages/route.ts
│   │   ├── pages/[id]/route.ts
│   │   ├── banners/route.ts
│   │   └── collections/route.ts
│   └── promotions/
│       └── coupons/route.ts
├── app/admin/
│   ├── cms/
│   │   ├── pages/page.tsx
│   │   ├── banners/page.tsx
│   │   └── collections/page.tsx
│   └── promotions/
│       └── page.tsx
├── components/admin/
│   ├── cms/
│   │   ├── page-editor.tsx
│   │   ├── block-palette.tsx
│   │   ├── banner-manager.tsx
│   │   └── collection-manager.tsx
│   └── promotions/
│       ├── coupon-form.tsx
│       ├── coupon-table.tsx
│       └── flash-sale-scheduler.tsx
├── components/storefront/
│   ├── blocks/
│   │   ├── hero-block.tsx
│   │   ├── text-block.tsx
│   │   ├── product-grid-block.tsx
│   │   ├── cta-banner-block.tsx
│   │   └── newsletter-block.tsx
│   └── cms-page.tsx                 # Dynamic CMS page renderer
├── lib/repositories/
│   ├── cms-repo.ts
│   └── coupon-repo.ts
└── lib/services/
    └── coupon-service.ts
```

---

### Task 7.1: Create CMS repository and API

**Files:**
- Create: `apps/web/lib/repositories/cms-repo.ts`
- Create: `apps/web/app/api/cms/pages/route.ts`
- Create: `apps/web/app/api/cms/pages/[id]/route.ts`
- Create: `apps/web/app/api/cms/banners/route.ts`
- Create: `apps/web/app/api/cms/collections/route.ts`

**Interfaces:**
- Consumes: `prisma`, `Page`, `Banner`, `Collection` models (already in schema from Plan 01)
- Produces: CMS CRUD API for pages, banners, collections

- [ ] **Step 1: Create cms-repo.ts**

```typescript
import { prisma } from "@/lib/prisma";

export const cmsRepo = {
  async listPages() {
    return prisma.page.findMany({ orderBy: { updatedAt: "desc" } });
  },

  async getPage(id: string) {
    return prisma.page.findUnique({ where: { id } });
  },

  async getPageBySlug(slug: string) {
    return prisma.page.findUnique({ where: { slug, isPublished: true } });
  },

  async createPage(data: { title: string; slug: string; content?: unknown }) {
    return prisma.page.create({ data });
  },

  async updatePage(id: string, data: { title?: string; content?: unknown; seoTitle?: string; seoDesc?: string; isPublished?: boolean }) {
    return prisma.page.update({ where: { id }, data });
  },

  async listBanners() {
    return prisma.banner.findMany({ orderBy: { order: "asc" } });
  },

  async listActiveBanners() {
    const now = new Date();
    return prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: { order: "asc" },
    });
  },

  async listCollections() {
    return prisma.collection.findMany({
      where: { isActive: true },
      include: { products: { include: { product: { include: { images: { take: 1 } } } } } },
    });
  },
};
```

- [ ] **Step 2: Create CMS API routes. Commit.**

```bash
git add apps/web/lib/repositories/cms-repo.ts apps/web/app/api/cms
git commit -m "feat: add CMS repository and API routes"
```

---

### Task 7.2: Create admin CMS pages

**Files:**
- Create: `apps/web/app/admin/cms/pages/page.tsx`
- Create: `apps/web/app/admin/cms/banners/page.tsx`
- Create: `apps/web/app/admin/cms/collections/page.tsx`
- Create: `apps/web/components/admin/cms/page-editor.tsx`
- Create: `apps/web/components/admin/cms/block-palette.tsx`
- Create: `apps/web/components/admin/cms/banner-manager.tsx`
- Create: `apps/web/components/admin/cms/collection-manager.tsx`

**Interfaces:**
- Consumes: `cmsRepo` from Task 7.1
- Produces: admin UI for managing CMS content

- [ ] **Step 1: Create block-palette.tsx**

```typescript
"use client";

type BlockType = "hero" | "text" | "product-grid" | "cta-banner" | "newsletter";

type BlockDef = { type: BlockType; label: string; icon: string; defaultContent: unknown };

const blockTypes: BlockDef[] = [
  { type: "hero", label: "Hero Banner", icon: "🖼️", defaultContent: { heading: "", subtitle: "", ctaText: "", ctaLink: "" } },
  { type: "text", label: "Text Block", icon: "📝", defaultContent: { content: "" } },
  { type: "product-grid", label: "Product Grid", icon: "📦", defaultContent: { collectionSlug: "" } },
  { type: "cta-banner", label: "CTA Banner", icon: "🎯", defaultContent: { text: "", buttonText: "", buttonLink: "" } },
  { type: "newsletter", label: "Newsletter Signup", icon: "📧", defaultContent: {} },
];

type Props = { onAddBlock: (type: BlockType) => void };

export function BlockPalette({ onAddBlock }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 p-4 border border-border rounded-lg bg-surface">
      {blockTypes.map((block) => (
        <button
          key={block.type}
          onClick={() => onAddBlock(block.type)}
          className="flex items-center gap-2 p-3 rounded-md border border-border hover:bg-surface-raised text-sm"
        >
          <span>{block.icon}</span>
          <span>{block.label}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create page-editor.tsx, banner-manager.tsx, collection-manager.tsx, and pages. Commit.**

```bash
git add apps/web/app/admin/cms apps/web/components/admin/cms
git commit -m "feat: add admin CMS pages with block editor, banners, collections"
```

---

### Task 7.3: Create storefront CMS renderer

**Files:**
- Create: `apps/web/components/storefront/blocks/hero-block.tsx`
- Create: `apps/web/components/storefront/blocks/text-block.tsx`
- Create: `apps/web/components/storefront/blocks/product-grid-block.tsx`
- Create: `apps/web/components/storefront/blocks/cta-banner-block.tsx`
- Create: `apps/web/components/storefront/blocks/newsletter-block.tsx`
- Create: `apps/web/components/storefront/cms-page.tsx`
- Create: `apps/web/app/(marketing)/[slug]/page.tsx` (dynamic CMS page)

**Interfaces:**
- Consumes: `cmsRepo.getPageBySlug()`, `productRepo.list()`
- Produces: CMS pages rendered on storefront

- [ ] **Step 1: Create block renderers**

```typescript
// components/storefront/cms-page.tsx
import { HeroBlock } from "./blocks/hero-block";
import { TextBlock } from "./blocks/text-block";
import { ProductGridBlock } from "./blocks/product-grid-block";
import { CtaBannerBlock } from "./blocks/cta-banner-block";
import { NewsletterBlock } from "./blocks/newsletter-block";

type Block = {
  type: string;
  content: Record<string, unknown>;
};

type Props = { blocks: Block[] };

export function CmsPage({ blocks }: Props) {
  return (
    <div>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "hero": return <HeroBlock key={i} content={block.content as any} />;
          case "text": return <TextBlock key={i} content={block.content as any} />;
          case "product-grid": return <ProductGridBlock key={i} content={block.content as any} />;
          case "cta-banner": return <CtaBannerBlock key={i} content={block.content as any} />;
          case "newsletter": return <NewsletterBlock key={i} />;
          default: return null;
        }
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/storefront/blocks apps/web/components/storefront/cms-page.tsx apps/web/app/\(marketing\)
git commit -m "feat: add CMS block renderers and dynamic page routing"
```

---

### Task 7.4: Create coupon/promotion system

**Files:**
- Create: `apps/web/lib/repositories/coupon-repo.ts`
- Create: `apps/web/lib/services/coupon-service.ts`
- Create: `apps/web/app/api/promotions/coupons/route.ts`
- Create: `apps/web/app/admin/promotions/page.tsx`
- Create: `apps/web/components/admin/promotions/coupon-form.tsx`
- Create: `apps/web/components/admin/promotions/coupon-table.tsx`
- Create: `apps/web/components/storefront/cart/coupon-input.tsx`

**Interfaces:**
- Consumes: `prisma`, `Coupon` model, `pricingService` from Plan 04
- Produces: coupon CRUD + validation at checkout

- [ ] **Step 1: Create coupon-repo.ts**

```typescript
import { prisma } from "@/lib/prisma";

export const couponRepo = {
  async list() {
    return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  },

  async getByCode(code: string) {
    return prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  },

  async create(data: {
    code: string; type: string; value: number; minOrder?: number;
    maxDiscount?: number; usageLimit?: number; perUserLimit?: number;
    startDate: Date; endDate?: Date;
  }) {
    return prisma.coupon.create({ data: { ...data, code: data.code.toUpperCase() } });
  },

  async update(id: string, data: Partial<{ isActive: boolean }>) {
    return prisma.coupon.update({ where: { id }, data });
  },

  async getUsageCount(couponId: string) {
    return prisma.order.count({ where: { couponId } });
  },
};
```

- [ ] **Step 2: Create coupon-service.ts**

```typescript
import { couponRepo } from "@/lib/repositories/coupon-repo";

type CouponResult = {
  valid: boolean;
  discount: number;
  code: string;
  error?: string;
};

export const couponService = {
  async validateAndApply(code: string, subtotal: number, userId: string): Promise<CouponResult> {
    const coupon = await couponRepo.getByCode(code);

    if (!coupon || !coupon.isActive) {
      return { valid: false, discount: 0, code, error: "Invalid coupon code" };
    }

    const now = new Date();
    if (now < coupon.startDate || (coupon.endDate && now > coupon.endDate)) {
      return { valid: false, discount: 0, code, error: "Coupon has expired" };
    }

    if (subtotal < Number(coupon.minOrder)) {
      return { valid: false, discount: 0, code, error: `Minimum order of ₹${coupon.minOrder} required` };
    }

    if (coupon.usageLimit) {
      const usageCount = await couponRepo.getUsageCount(coupon.id);
      if (usageCount >= coupon.usageLimit) {
        return { valid: false, discount: 0, code, error: "Coupon usage limit reached" };
      }
    }

    let discount = 0;
    if (coupon.type === "percentage") {
      discount = Math.round((subtotal * Number(coupon.value)) / 100);
      if (coupon.maxDiscount) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
      }
    } else if (coupon.type === "fixed") {
      discount = Number(coupon.value);
    } else if (coupon.type === "free_shipping") {
      discount = 0; // Handled separately in shipping calculation
    }

    return { valid: true, discount, code: coupon.code };
  },
};
```

- [ ] **Step 3: Wire coupon into checkout**

```diff
// In checkout-service.ts createRazorpayOrder():
// Find coupon if couponId/code provided
+ const couponCode = cart.shippingAddress?.couponCode as string;
+ let discount = 0;
+ if (couponCode) {
+   const result = await couponService.validateAndApply(couponCode, subtotal, userId);
+   if (result.valid) discount = result.discount;
+ }
```

- [ ] **Step 4: Create coupon-input.tsx, coupon-form.tsx, coupon-table.tsx and admin pages. Commit.**

```bash
git add apps/web/lib/repositories/coupon-repo.ts apps/web/lib/services/coupon-service.ts apps/web/app/api/promotions apps/web/app/admin/promotions apps/web/components/admin/promotions apps/web/components/storefront/cart/coupon-input.tsx
git commit -m "feat: add coupon system with admin CRUD and checkout validation"
```

---

## Spec Coverage Check

| Requirement | Task |
|-------------|------|
| CMS page model (JSON blocks) | 7.1 |
| Block-based page editor (hero, text, product grid, CTA, newsletter) | 7.2 |
| Block palette for adding blocks | 7.2 |
| Banner manager with scheduling | 7.1, 7.2 |
| Collection manager | 7.1, 7.2 |
| Storefront CMS block renderers | 7.3 |
| Dynamic CMS page routing | 7.3 |
| Coupon CRUD (percentage, fixed, free shipping) | 7.4 |
| Coupon validation (dates, limits, min order) | 7.4 |
| Coupon input in cart | 7.4 |
| Coupon application in checkout pricing | 7.4 |

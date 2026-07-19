# Phase 4c — Product Management

## Objective

Build the admin product management interface — create products linked to Printify blueprints, manage variants and pricing, upload mockups, and publish to the storefront.

---

## System Design

### Product Creation Flow

```
Admin clicks "New Product"
    → Step 1: Browse Printify Catalog
        → Select Blueprint (e.g., "Gildan 5000")
        → Select Print Provider
        → View Variants (sizes, colors)
    → Step 2: Configure Product
        → Title, Description, Tags
        → Select which variants to enable
        → Set margin % or price per variant
        → Category assignment
    → Step 3: Upload Designs / Mockups
        → Upload artwork (PNG, JPG, SVG)
        → Position on product (front, back, left sleeve, etc.)
        → System generates mockup via Printify upload API
    → Step 4: Review & Create
        → Summary of product
        → Click "Create Product"
        → System calls Printify API to create product
        → System creates local Product record with Printify ID
        → Product appears in admin list
```

### Blueprint Browser

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Browse Printify Catalog                      [Search blueprints...]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │ Gildan 5000  │  │ Bella+Canvas │  │ Comfort      │  │ Next Level   ││
│  │ T-Shirt      │  │ 3001 T-Shirt │  │ Colors 636   │  │ 6210 T-Shirt ││
│  │ [Select]     │  │ [Select]     │  │ [Select]     │  │ [Select]     ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │ Mugs         │  │ Phone Cases  │  │ Hoodies      │  │ Posters      ││
│  │ [Select]     │  │ [Select]     │  │ [Select]     │  │ [Select]     ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

### Product List View

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Products                                [Search] [Category ▼] [+ New Product]│
├─────────────────────────────────────────────────────────────────────────┤
│  Image │ Title        │ Category │ Variants │ Price Range │ Status │ Published │
│  ──────┼──────────────┼──────────┼──────────┼─────────────┼────────┼──────────│
│  [img] │ Classic Tee  │ T-Shirts │ 12       │ ₹699-₹799   │ Active │ ✓        │
│  [img] │ Premium Mug  │ Mugs     │ 4        │ ₹499        │ Active │ ✓        │
│  [img] │ Canvas Poster│ Posters  │ 2        │ ₹999        │ Draft  │ ✕        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Product Form Component

```tsx
// components/admin/products/product-form.tsx
"use client";

type ProductFormProps = {
  product?: Product; // undefined for create, existing for edit
  blueprints: PrintifyBlueprint[];
};

// Form sections:
// 1. Basic Info: title, description, category, tags
// 2. Blueprint: selected blueprint + print provider + variants
// 3. Pricing: margin % or per-variant prices
// 4. Images: upload artwork, assign to positions
// 5. SEO: meta title, meta description, slug
```

### API Routes

```
GET  /api/admin/products                  → List all products (with Pagination)
GET  /api/admin/products/[id]              → Get product with variants + images
POST /api/admin/products                   → Create product
PUT  /api/admin/products/[id]              → Update product
DELETE /api/admin/products/[id]            → Soft delete / archive
POST /api/admin/products/[id]/publish     → Publish to storefront
POST /api/admin/products/[id]/unpublish   → Unpublish from storefront
POST /api/admin/products/[id]/sync-printify → Re-sync with Printify

// Printify catalog browsing (server-side, proxied through our API)
GET  /api/admin/printify/blueprints        → List all Printify blueprints
GET  /api/admin/printify/blueprints/[id]   → Get blueprint details
GET  /api/admin/printify/blueprints/[id]/providers → Get print providers
GET  /api/admin/printify/blueprints/[id]/providers/[pid]/variants → Get variants
```

### Product Sync with Printify

When creating a product via the admin, the flow is:

```typescript
async function createProduct(data: CreateProductInput) {
  // 1. Upload designs to Printify
  const uploadedImages = await Promise.all(
    data.images.map((img) =>
      printifyClient.uploads.upload({
        file_url: img.url, // from MinIO
        file_name: img.filename,
      })
    )
  );

  // 2. Create product on Printify
  const printifyProduct = await printifyClient.products.create(shopId, {
    title: data.title,
    description: data.description,
    blueprint_id: data.blueprintId,
    print_provider_id: data.printProviderId,
    variants: data.variants.map((v) => ({
      id: v.printifyVariantId,
      price: Math.round(v.price), // Printify takes price in cents
      is_enabled: v.isEnabled,
    })),
    print_areas: [
      {
        variant_ids: data.variants.map((v) => v.printifyVariantId),
        placeholders: data.placeholders.map((p) => ({
          position: p.position,
          images: [
            {
              src: uploadedImages.find((img) => img.position === p.position)!.id,
              x: p.x,
              y: p.y,
              scale: p.scale,
            },
          ],
        })),
      },
    ],
  });

  // 3. Create local product record
  const product = await prisma.product.create({
    data: {
      title: data.title,
      slug: generateSlug(data.title),
      description: data.description,
      blueprintId: data.blueprintId,
      printProviderId: data.printProviderId,
      printifyProductId: printifyProduct.id,
      basePrice: calculateBasePrice(data.variants),
      marginPercent: data.marginPercent,
      categoryId: data.categoryId,
      tags: data.tags,
      metadata: printifyProduct,
      variants: {
        create: data.variants.map((v) => ({
          printifyVariantId: v.printifyVariantId,
          title: v.title,
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          price: v.price,
          isEnabled: v.isEnabled,
        })),
      },
      images: {
        create: uploadedImages.map((img, i) => ({
          url: img.file_url,
          alt: `${data.title} - ${img.position}`,
          position: i,
          isMockup: true,
        })),
      },
    },
  });

  return product;
}
```

### Variant Manager

```tsx
// components/admin/products/variant-manager.tsx
// Displays all Printify variants for the selected blueprint/provider
// Admin can:
//   - Toggle variants on/off
//   - Set individual price (overrides auto-calculated)
//   - See which colors/sizes are available
//   - Preview variant mockup

// Layout:
┌───────────────────────────────────────────────────────┐
│ Enable All | Disable All                               │
│                                                       │
│ Color: Black      □ S (₹699)  □ M (₹699)  □ L (₹699) │
│ Color: White      □ S (₹699)  □ M (₹699)  ☑ L (₹749) │
│ Color: Navy       ☑ S (₹749)  ☑ M (₹749)  ☑ L (₹749) │
│ Color: Red        □ S (₹699)  □ M (₹699)  □ L (₹699) │
└───────────────────────────────────────────────────────┘
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Product creation | Admin creates via blueprint browser | Curated catalog, full control over pricing |
| Pricing per variant | Individual or margin% | Flexible: margin% for simple, per-variant for complex |
| Image storage | MinIO (upload) → Printify (mockup) | Design stored in MinIO, Printify generates mockup |
| Printify product creation | On admin "Create" action | Not automatic; admin reviews before publishing |
| Publishing | Separate step after creation | Admin can create draft, publish later |
| Blueprint cache | Redis (24h TTL) | Catalog data rarely changes, reduces API calls |

---

## Steps

1. Create `app/api/admin/products/route.ts` (list + create)
2. Create `app/api/admin/products/[id]/route.ts` (get + update + delete)
3. Create `app/api/admin/products/[id]/publish/route.ts`
4. Create `app/api/admin/products/[id]/sync-printify/route.ts` (if needed)
5. Create `app/api/admin/printify/blueprints/route.ts` (proxied catalog)
6. Create `app/api/admin/printify/blueprints/[id]/providers/route.ts`
7. Create `app/api/admin/printify/blueprints/[id]/providers/[pid]/variants/route.ts`
8. Create `components/admin/products/product-table.tsx`
9. Create `components/admin/products/product-form.tsx`
10. Create `components/admin/products/blueprint-browser.tsx`
11. Create `components/admin/products/variant-manager.tsx`
12. Create `components/admin/products/mockup-upload.tsx`
13. Create `app/admin/products/page.tsx`
14. Create `app/admin/products/new/page.tsx`
15. Create `app/admin/products/[id]/page.tsx`
16. Verify: browse Printify catalog, create product with variants, upload mockup, publish

---

## Files Created

| File | Content |
|------|---------|
| `app/api/admin/products/route.ts` | Product list + create |
| `app/api/admin/products/[id]/route.ts` | Product detail + update + delete |
| `app/api/admin/products/[id]/publish/route.ts` | Publish/unpublish |
| `app/api/admin/printify/blueprints/route.ts` | Catalog proxy |
| `app/api/admin/printify/blueprints/[id]/providers/route.ts` | Print providers |
| `app/api/admin/printify/blueprints/[id]/providers/[pid]/variants/route.ts` | Variants |
| `components/admin/products/product-table.tsx` | Product list table |
| `components/admin/products/product-form.tsx` | Create/edit form |
| `components/admin/products/blueprint-browser.tsx` | Printify catalog browser |
| `components/admin/products/variant-manager.tsx` | Variant toggle + pricing |
| `components/admin/products/mockup-upload.tsx` | Design upload UI |
| `app/admin/products/page.tsx` | Product list page |
| `app/admin/products/new/page.tsx` | New product page |
| `app/admin/products/[id]/page.tsx` | Edit product page |

# Phase 5b — Promotions & Coupons

## Objective

Build the promotions engine — coupon codes with various discount types (percentage, fixed amount, free shipping), flash sales with time limits, and automatic application of best-available discount at checkout.

---

## System Design

### Coupon Model

```prisma
model Coupon {
  id            String   @id @default(cuid())
  code          String   @unique
  description   String?
  type          CouponType          // PERCENTAGE, FIXED, FREE_SHIPPING
  value         Decimal             // percentage (10 = 10%) or amount (₹100)
  minOrderValue Decimal?            // minimum cart total to apply
  maxDiscount   Decimal?            // cap on discount amount (for percentage)
  usageLimit    Int?                 // total uses allowed
  usagePerUser  Int?                 // uses per customer
  usedCount     Int      @default(0)
  isActive      Boolean  @default(true)
  startDate     DateTime?
  endDate       DateTime?
  applicableProducts String[]       // product IDs (empty = all)
  applicableCategories String[]     // category IDs (empty = all)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  orders Order[]
}

enum CouponType {
  PERCENTAGE
  FIXED
  FREE_SHIPPING
}
```

### Discount Application Logic

```typescript
// lib/services/pricing-service.ts

async function calculateDiscount(couponCode: string, cartTotal: number, cartItems: CartItem[], userId: string): Promise<DiscountResult> {
  // 1. Find coupon (by code, active, within date range)
  const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
  if (!coupon || !coupon.isActive) return { valid: false, reason: "Invalid coupon" };

  // 2. Check date range
  const now = new Date();
  if (coupon.startDate && coupon.startDate > now) return { valid: false, reason: "Coupon not yet active" };
  if (coupon.endDate && coupon.endDate < now) return { valid: false, reason: "Coupon has expired" };

  // 3. Check usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { valid: false, reason: "Coupon usage limit reached" };

  // 4. Check per-user limit
  if (coupon.usagePerUser) {
    const userUsage = await prisma.order.count({ where: { userId, couponId: coupon.id } });
    if (userUsage >= coupon.usagePerUser) return { valid: false, reason: "You've already used this coupon" };
  }

  // 5. Check minimum order value
  if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) return { valid: false, reason: `Minimum order value of ₹${coupon.minOrderValue} required` };

  // 6. Calculate discount
  let discount = 0;
  switch (coupon.type) {
    case "PERCENTAGE":
      discount = cartTotal * (coupon.value / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
      break;
    case "FIXED":
      discount = Math.min(coupon.value, cartTotal); // can't exceed cart total
      break;
    case "FREE_SHIPPING":
      // handled separately — shipping cost set to 0
      break;
  }

  return { valid: true, discount, type: coupon.type, couponId: coupon.id };
}
```

### Flash Sales

Flash sales are time-limited discounts on specific products:

```prisma
model FlashSale {
  id        String   @id @default(cuid())
  title     String
  productId String
  discountPercent Decimal                 // e.g., 25 = 25% off
  startDate DateTime
  endDate   DateTime
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}
```

Flash sale discounts stack with coupon? **No** — the best available discount is applied automatically. Admin can configure priority in settings.

---

## Architecture

### Checkout Discount Flow

```
Cart page:
  Customer enters coupon code → "Apply"
  POST /api/promotions/validate { code, cartId }
    → Server validates coupon
    → Returns { valid, discount, message }
  UI updates total with discount

Checkout:
  Pricing service calculates:
    subtotal (sum of line items)
    - discount (from coupon, if any)
    + shipping (from Printify)
    = total
  Flash sale discounts applied at product level (reduced per-unit price)
```

### Admin Promotion Views

**Coupons List:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Coupons                                 [+ New Coupon]                   │
├─────────────────────────────────────────────────────────────────────────┤
│ Code │ Type │ Value │ Uses │ Min Order │ Status │ Expires │ Actions │
│ ─────┼──────┼───────┼──────┼───────────┼────────┼─────────┼─────────│
│ SAVE10│ %   │ 10%   │ 45/100│ ₹500     │ Active │ 31 Dec  │ [Edit]   │
│ FEST50│ ₹   │ ₹50   │ 12/50 │ ₹299     │ Active │ 15 Aug  │ [Edit]   │
│ FREESHIP│ FS│ —     │ 28/200│ ₹399     │ Active │ —       │ [Edit]   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Coupon Form:**
```
Code: [SAVE10..............]
Type: [▼ Percentage......]
Value: [10................]  (percentage or fixed amount)
Minimum Order: [500..........]
Max Discount: [100...........]  (cap for percentage coupons)
Usage Limit: [100............]  (total uses, empty = unlimited)
Per User Limit: [1.............]  (uses per customer, empty = unlimited)
Start Date: [01 Jul 2026......]
End Date:  [31 Dec 2026......]
Applicable Products: [All / Selected...]
Applicable Categories: [All / Selected...]

[Create Coupon]
```

### Admin Flash Sale Views

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Flash Sales                                      [+ New Flash Sale]     │
├─────────────────────────────────────────────────────────────────────────┤
│ Title │ Product │ Discount │ Start │ End │ Status │ Actions │
│ ──────┼─────────┼──────────┼───────┼─────┼────────┼─────────│
│ Monsoon│ Tee     │ 25%      │ 20 Jul │ 25 Jul│ Active │ [Edit]  │
│ Weekend│ Mug     │ 15%      │ 27 Jul │ 28 Jul│ Upcoming│ [Edit]  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Coupon types | 3 types (%, fixed, free shipping) | Covers most common promotion patterns |
| Discount stacking | Best of coupon OR flash sale (not both) | Prevents excessive discounts |
| Coupon validation | Server-side on apply + at checkout | Prevents tampering, double validation |
| Usage tracking | Incremented on completed order | Not on "applied" — prevents guest abuse |
| Expired coupons | Soft delete (isActive toggle) | Keep record of past promotions |
| Flash sale rendering | Badge on product card, countdown timer on PDP | Urgency + awareness |

---

## Steps

1. Update Prisma schema with Coupon and FlashSale models
2. Run `pnpm prisma:migrate dev --name add-promotions`
3. Create `lib/services/pricing-service.ts` (discount calculation)
4. Create `lib/repositories/coupon-repo.ts`
5. Create `app/api/admin/promotions/coupons/route.ts`
6. Create `app/api/admin/promotions/coupons/[id]/route.ts`
7. Create `app/api/admin/promotions/flash-sales/route.ts`
8. Create `app/api/promotions/validate/route.ts` (public: validate coupon)
9. Create `components/admin/promotions/coupon-table.tsx`
10. Create `components/admin/promotions/coupon-form.tsx`
11. Create `components/admin/promotions/flash-sale-scheduler.tsx`
12. Create `components/storefront/cart/coupon-input.tsx` (wire to validation API)
13. Create `app/admin/promotions/page.tsx`
14. Wire coupon validation into checkout-service.ts
15. Verify: create coupon, apply at checkout, discount reflected in total

---

## Files Created

| File | Content |
|------|---------|
| `prisma/schema.prisma` (updated) | Coupon, FlashSale |
| `lib/services/pricing-service.ts` | Discount calculation |
| `lib/repositories/coupon-repo.ts` | Coupon queries |
| `app/api/admin/promotions/coupons/route.ts` | Coupon CRUD |
| `app/api/admin/promotions/coupons/[id]/route.ts` | Single coupon |
| `app/api/admin/promotions/flash-sales/route.ts` | Flash sale CRUD |
| `app/api/promotions/validate/route.ts` | Coupon validation |
| `components/admin/promotions/coupon-table.tsx` | Coupon list |
| `components/admin/promotions/coupon-form.tsx` | Coupon create/edit |
| `components/admin/promotions/flash-sale-scheduler.tsx` | Flash sale form |
| `components/storefront/cart/coupon-input.tsx` (updated) | Wire validation |
| `app/admin/promotions/page.tsx` | Promotions list page |

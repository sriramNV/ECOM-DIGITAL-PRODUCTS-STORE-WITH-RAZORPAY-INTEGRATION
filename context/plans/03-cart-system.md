# Phase 2b — Cart System

## Objective

Implement a complete shopping cart system that works for both guest (localStorage) and authenticated (database-backed) users, with seamless cart merging on login.

---

## System Design

### Cart Data Model

```prisma
model Cart {
  id        String   @id @default(cuid())
  userId    String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user  User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items CartItem[]
}

model CartItem {
  id        String @id @default(cuid())
  cartId    String
  productId String
  variantId String
  quantity  Int    @default(1)
  createdAt DateTime @default(now())

  cart    Cart           @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product Product        @relation(fields: [productId], references: [id])
  variant ProductVariant @relation(fields: [variantId], references: [id])
}
```

### Zustand Client Store (Guest)

```typescript
// stores/cart-store.ts
type GuestCartItem = {
  id: string;             // composite: `${productId}-${variantId}`
  productId: string;
  variantId: string;
  title: string;
  image: string;
  price: number;          // final price at time of adding
  quantity: number;
  size: string;
  color: string;
  slug: string;           // for product link
};
```

Store is persisted to localStorage via `zustand/middleware/persist`.

---

## Architecture

### Cart State Machine

```
┌──────────────────────────────────────────┐
│           User State                     │
│  ┌──────────┐         ┌──────────────┐   │
│  │  Guest   │         │ Authenticated │   │
│  └────┬─────┘         └──────┬───────┘   │
│       │                      │            │
│  localStorage             PostgreSQL      │
│  (Zustand persist)      (Cart model)      │
│       │                      │            │
│       └──────────┬───────────┘            │
│                  ▼                        │
│           On Login: Merge                 │
│    Guest cart → DB cart (dedup)           │
└──────────────────────────────────────────┘
```

### Cart Operations

**Add to Cart (Guest):**
```
1. Zustand store.addItem(...)
2. localStorage persists automatically
3. UI updates immediately (optimistic)
```

**Add to Cart (Authenticated):**
```
1. Zustand store.addItem(...) (immediate UI)
2. POST /api/cart/sync (background sync to DB)
3. On success: no change (already in local state)
4. On failure: revert + show error toast
```

**Remove Item:**
Same pattern — optimistic UI update + background sync to DB.

**Cart Merge on Login:**
```
1. User logs in
2. Frontend calls POST /api/cart/merge
3. Server merges guest items into DB cart:
   a. For each guest item:
      - If same variant exists in DB → add quantities
      - If new variant → create new CartItem
4. Frontend replaces Zustand store with server response
5. localStorage guest cart cleared
```

### API Routes

```
GET  /api/cart              → Get authenticated user's cart (with product + variant data)
POST /api/cart/sync         → Sync local cart to DB (full replace)
POST /api/cart/merge        → Merge guest items into DB cart (on login)
POST /api/cart/items        → Add item to DB cart
PUT  /api/cart/items/[id]   → Update item quantity
DELETE /api/cart/items/[id] → Remove item from cart
```

### Cart UI Components

```
Cart Drawer (slide-out overlay):
  - Triggered by cart icon in navbar
  - Shows item previews (image, title, variant, quantity, price)
  - Quick quantity adjust (+/-)
  - Remove button
  - Subtotal + "View Cart" link
  - "Checkout" button

Cart Page (full page):
  - Full item list with larger thumbnails
  - Quantity selectors (dropdown or +/- buttons)
  - Coupon code input
  - Price summary: subtotal, shipping (estimated), discount, total
  - "Proceed to Checkout" button

Empty Cart State:
  - Illustration or icon
  - "Your cart is empty" message
  - "Start Shopping" CTA → /products
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Guest cart storage | Zustand persist (localStorage) | Survives page refresh, works without login |
| Cart sync strategy | Optimistic UI + background sync | Instant UI, eventual consistency |
| Cart merge timing | On login (explicit API call) | Predictable, no magic background sync |
| Duplicate handling | Merge quantities on same variant | Natural behavior, no duplicate rows |
| Price at add time | Stored in cart item | Won't change if admin updates product price later |
| Quantity limits | Max 10 per item | Prevents abuse, reasonable for POD |
| Cart expiration | Guest: no expiration. DB: retained indefinitely | Guest cart is local, DB cart is user's persistent data |

---

## Steps

1. Update Prisma schema with Cart and CartItem models
2. Run `pnpm prisma:migrate dev --name add-cart`
3. Create `lib/repositories/cart-repo.ts` (get, upsert, merge, addItem, removeItem)
4. Create `stores/cart-store.ts` (Zustand with persist)
5. Create `app/api/cart/route.ts` (GET cart, POST sync)
6. Create `app/api/cart/merge/route.ts` (POST merge on login)
7. Create `app/api/cart/items/route.ts` (POST add item)
8. Create `app/api/cart/items/[id]/route.ts` (PUT/DELETE update/remove)
9. Create `components/storefront/cart/cart-drawer.tsx`
10. Create `components/storefront/cart/cart-item-row.tsx`
11. Create `components/storefront/cart/cart-summary.tsx`
12. Create `components/storefront/cart/coupon-input.tsx` (UI only, logic in Phase 5)
13. Create `components/storefront/product/add-to-cart-button.tsx`
14. Create `app/(storefront)/cart/page.tsx`
15. Update navbar with cart icon + item count badge
16. Verify: guest adds items, cart persists on refresh, login merges cart, quantities update

---

## Files Created

| File | Content |
|------|---------|
| `prisma/schema.prisma` (updated) | Cart, CartItem models |
| `lib/repositories/cart-repo.ts` | Cart database operations |
| `stores/cart-store.ts` | Zustand cart store |
| `app/api/cart/route.ts` | Cart API (GET, POST sync) |
| `app/api/cart/merge/route.ts` | Cart merge on login |
| `app/api/cart/items/route.ts` | Add item to cart |
| `app/api/cart/items/[id]/route.ts` | Update/remove cart item |
| `hooks/use-cart.ts` | React hook wrapping cart store + API |
| `components/storefront/cart/cart-drawer.tsx` | Slide-out cart overlay |
| `components/storefront/cart/cart-item-row.tsx` | Single cart item row |
| `components/storefront/cart/cart-summary.tsx` | Price summary section |
| `components/storefront/cart/coupon-input.tsx` | Coupon code input |
| `components/storefront/product/add-to-cart-button.tsx` | Add to cart button |
| `app/(storefront)/cart/page.tsx` | Full cart page |

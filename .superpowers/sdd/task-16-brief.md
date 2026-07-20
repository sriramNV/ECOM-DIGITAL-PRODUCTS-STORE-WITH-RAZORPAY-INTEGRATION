# Task 4.1: Create cart store and repository

**Plan:** Plan 04 — Cart & Checkout
**Depends on:** Plan 01 (Prisma Cart/CartItem models), Plan 02 (auth)
**Produces:** `useCartStore` Zustand hook, `cartRepo` with CRUD + merge

## Files to Create

- `apps/web/stores/cart-store.ts`
- `apps/web/lib/repositories/cart-repo.ts`
- `apps/web/types/cart.ts`
- `stores/__tests__/cart-store.test.ts`

Detailed code in `docs/superpowers/plans/04-cart-checkout.md` lines 77-299.

### cart-store.ts
Zustand store with localStorage persist. Actions: addItem (with dedup + max 10), removeItem, updateQuantity, clearCart, setItems.

### types/cart.ts
```typescript
export type CartItem = {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  slug: string;
};
```

### cart-repo.ts
Repository with: getByUserId, addItem (upsert cart + find/create item), updateItemQuantity, removeItem, mergeGuestCart, clearCart.

### Test
3 tests: adds item to empty cart, increments for duplicate, removes item.

## Commit
```bash
git add apps/web/stores apps/web/types/cart.ts apps/web/lib/repositories/cart-repo.ts
git commit -m "feat: add cart store with Zustand and cart repository"
```

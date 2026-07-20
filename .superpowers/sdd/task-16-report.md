# Task 4.1 Report: Create cart store and repository

**Status:** ✅ Complete

**Commit:** `a06a42a` — feat: add cart store with Zustand and cart repository

## Summary

| Step | File | Status |
|------|------|--------|
| Install zustand | `pnpm add zustand --filter web` | ✅ |
| Cart type | `apps/web/types/cart.ts` (re-exported from `types/index.ts`) | ✅ |
| Zustand store | `apps/web/stores/cart-store.ts` with persist middleware (`pod-cart`) | ✅ |
| Cart repo | `apps/web/lib/repositories/cart-repo.ts` with CRUD + mergeGuestCart | ✅ |
| Tests | `apps/web/stores/__tests__/cart-store.test.ts` | ✅ |

## Test Results

```
✓ apps/web/stores/__tests__/cart-store.test.ts (3 tests) 4ms
  1) adds item to empty cart
  2) increments quantity for duplicate item
  3) removes item
```

All 3 tests pass. (Expected stderr from zustand persist middleware: localStorage unavailable in Node environment — does not affect functionality.)

## Notes

- `CartItem` type already existed in `types/index.ts` — moved to dedicated `types/cart.ts` with a re-export from `index.ts` for backward compatibility.
- `cart-repo.ts` connects to Prisma DB models (Cart, CartItem, Product, ProductVariant).
- Files staged: `apps/web/stores/`, `apps/web/types/cart.ts`, `apps/web/types/index.ts`, `apps/web/lib/repositories/cart-repo.ts`, `apps/web/package.json`.

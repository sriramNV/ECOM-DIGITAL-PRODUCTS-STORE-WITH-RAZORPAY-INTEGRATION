# Task 1.8: Create packages/shared types and validation

**Plan:** Plan 01 — Foundation & Project Setup
**Depends on:** Task 1.5 (types/index.ts)
**Produces:** `@pod/shared` package importable by web app

## Files to Create

- `packages/shared/types/index.ts`
- `packages/shared/validation/index.ts`

## Steps

### Step 1: Create packages/shared/types/index.ts
```typescript
export type * from "../../apps/web/types/index";
```

### Step 2: Create packages/shared/validation/index.ts
```typescript
import { z } from "zod";

export const addressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
  country: z.string().default("India"),
  phone: z.string().regex(/^\d{10}$/, "Invalid phone number"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AddressInput = z.infer<typeof addressSchema>;
```

### Step 3: Install zod
```bash
pnpm add zod --filter shared
```

Or add to `packages/shared/package.json`:
```json
"dependencies": {
  "zod": "^3.23.0"
}
```

Then `pnpm install`.

### Step 4: Commit
```bash
git add .
git commit -m "feat: scaffold monorepo with Next.js 16, Docker, Prisma, Tailwind v4, shadcn/ui"
```

## Notes

- `packages/shared/package.json` and `packages/shared/tsconfig.json` already exist from Task 1.1
- The `types/index.ts` re-exports from `apps/web/types/index` (which has Role, OrderStatus, CartItem, Address types)
- The validation module uses zod for address/pagination validation
- Need to add zod as dependency to shared package

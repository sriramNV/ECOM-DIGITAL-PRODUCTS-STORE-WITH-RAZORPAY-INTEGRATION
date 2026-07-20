# Task 6.4: Create product management pages

**Plan:** Plan 06 lines 360-430
**Files:**
- `apps/web/app/admin/products/page.tsx`
- `apps/web/app/admin/products/new/page.tsx`
- `apps/web/app/admin/products/[id]/page.tsx`
- `apps/web/components/admin/products/product-table.tsx`
- `apps/web/components/admin/products/product-form.tsx`
- `apps/web/components/admin/products/variant-manager.tsx`

Full code for product-table.tsx in plan.

For product-form.tsx: Create a form with fields for title, description, basePrice, category, images.
For variant-manager.tsx: Show variant list with price/size/color editing using shadcn Input.
For new/page.tsx and [id]/page.tsx: Render ProductForm.

Note: The plan references DataTable, Button, Input, Dialog — all exist in components/ui/.

Commit:
```bash
git add apps/web/app/admin/products apps/web/components/admin/products
git commit -m "feat: add product management pages with Printify integration"
```

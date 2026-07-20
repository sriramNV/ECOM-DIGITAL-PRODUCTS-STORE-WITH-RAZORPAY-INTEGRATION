# Task 7.2: Create admin CMS pages

**Plan:** Plan 07 lines 143-201
**Files:**
- `apps/web/app/admin/cms/pages/page.tsx`
- `apps/web/app/admin/cms/banners/page.tsx`
- `apps/web/app/admin/cms/collections/page.tsx`
- `apps/web/components/admin/cms/page-editor.tsx`
- `apps/web/components/admin/cms/block-palette.tsx`
- `apps/web/components/admin/cms/banner-manager.tsx`
- `apps/web/components/admin/cms/collection-manager.tsx`

Full code for block-palette.tsx in plan lines 160-194.

For page-editor.tsx: Create a client component with Tabs (Edit / Blocks). Edit tab shows title, slug, seo fields and save button. Blocks tab shows BlockPalette + rendered block list with delete.

For banner-manager.tsx: List of banners with create/edit dialog (title, imageUrl, linkUrl, position, dates, isActive).

For collection-manager.tsx: List of collections with create/edit dialog (name, slug, description, image).

For pages: Render respective components.

Commit:
```bash
git add apps/web/app/admin/cms apps/web/components/admin/cms
git commit -m "feat: add admin CMS pages with block editor, banners, collections"
```

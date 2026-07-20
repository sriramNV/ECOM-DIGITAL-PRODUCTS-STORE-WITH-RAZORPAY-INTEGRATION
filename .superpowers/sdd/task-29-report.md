# Task 29: CMS Repository and API

**Status:** Complete

## Files Created

| File | Description |
|------|-------------|
| `apps/web/lib/repositories/cms-repo.ts` | CMS repository with methods for pages, banners, collections |
| `apps/web/app/api/cms/pages/route.ts` | GET (list) and POST (create) pages |
| `apps/web/app/api/cms/pages/[id]/route.ts` | GET (by id) and PATCH (update) pages |
| `apps/web/app/api/cms/banners/route.ts` | GET banners with optional `?active=true` filter |
| `apps/web/app/api/cms/collections/route.ts` | GET collections with products included |

## Commit

```
e14435d feat: add CMS repository and API routes
```

## Notes

- Repository code follows exact specification from Plan 07 lines 83-133.
- API routes follow existing patterns in the codebase: `NextResponse`, `logger.error`, try/catch with 500 fallback, 404 for missing resources, `params: Promise<...>` async pattern.
- Banners route supports `?active=true` query param to return only currently active banners using the `listActiveBanners` date-range logic.

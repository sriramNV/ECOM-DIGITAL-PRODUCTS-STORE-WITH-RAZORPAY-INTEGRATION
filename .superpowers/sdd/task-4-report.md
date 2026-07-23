# Task 4 Report: Shared Utilities + Database + Storage Clients

**Status:** ✅ Complete

**Commits:**
- `8bd8778` — feat: add db, storage, utils, and rate-limit utilities

**Files created:**
- `apps/web/lib/db.ts` — Prisma client singleton
- `apps/web/lib/storage.ts` — MinIO S3 client (uploadFile, getDownloadUrl)
- `apps/web/lib/utils.ts` — cn(), formatCurrency, formatDate, generateOrderNumber, slugify
- `apps/web/lib/rate-limit.ts` — Redis-based rate limiter

**Dependencies installed:** `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `redis`

**Concerns:** None. All files follow the exact spec from the task brief.

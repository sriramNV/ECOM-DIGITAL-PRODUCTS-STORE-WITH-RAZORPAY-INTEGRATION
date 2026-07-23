# Task 4: Shared Utilities + Database + Storage Clients

## Context
Infrastructure is set up (Docker + Prisma). Now create utility modules used by all services.

## Requirements

### Create `apps/web/lib/db.ts` — Prisma client singleton
```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Create `apps/web/lib/storage.ts` — MinIO S3 client
```ts
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT!,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.MINIO_BUCKET!;

export async function uploadFile(key: string, buffer: Buffer, contentType: string) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
}

export async function getDownloadUrl(key: string, expiresIn = 900) {
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn }
  );
}

export { BUCKET };
```

### Create `apps/web/lib/utils.ts` — Shared utilities
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function generateOrderNumber(): string {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${yy}${mm}${dd}-${rand}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
```

### Create `apps/web/lib/rate-limit.ts` — Redis rate limiter
```ts
import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL });
redis.connect().catch(console.error);

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const windowKey = `ratelimit:${key}:${Math.floor(now / (windowSeconds * 1000))}`;

  const count = await redis.incr(windowKey);
  if (count === 1) {
    await redis.expire(windowKey, windowSeconds);
  }

  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
  };
}
```

### Install additional dependency
Run: `pnpm --filter web add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner redis`

## Steps
1. Create lib directory if needed
2. Create all 4 files
3. Install dependencies
4. Commit with: `"feat: add db, storage, utils, and rate-limit utilities"`

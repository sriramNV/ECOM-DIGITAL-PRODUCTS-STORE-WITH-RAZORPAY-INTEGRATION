# Digital Products Platform — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-hosted digital products e-commerce platform with Next.js, Razorpay, MinIO, and Cyberpunk+Mass Effect themed UI.

**Architecture:** Modular monolith — clean service boundaries within a single Next.js application, structured for future extraction into independent microservices. PostgreSQL via Prisma, MinIO for file storage, Redis for sessions/rate-limiting.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Prisma, PostgreSQL 16, MinIO, Redis 7, Tailwind v4, Framer Motion, NextAuth v5, Razorpay SDK, Zustand, TanStack React Query, Hono (lightweight API framework for services if extracted).

## Global Constraints

- Digital products only (zip files delivered as single download)
- Users must create accounts to purchase (email/password + Google OAuth)
- Bought items available for re-download from account page
- Razorpay only payment gateway
- Self-hosted infrastructure (PostgreSQL, MinIO, Redis via Docker)
- Max file upload: 400MB, strict zip validation (magic bytes `PK\x03\x04` + `.zip` extension)
- Download rate limit: 3 requests per hour per user (Redis-based sliding window)
- Signed URLs for downloads: 15 minute expiry
- Dark + Light theme (dark: Cyberpunk 2077 + Mass Effect, light: clean sci-fi)
- Scroll animations via Framer Motion (respects `prefers-reduced-motion`)
- Each service module extractable to standalone microservice without rewriting
- No shipping, no taxes, no variants on products
- NextAuth v5 with JWT strategy
- Admins are trusted uploaders — no ClamAV scanning in v1

---

## File Structure

```
pod/
├── apps/web/
│   ├── app/
│   │   ├── (storefront)/
│   │   │   ├── page.tsx                    # Landing page
│   │   │   ├── products/
│   │   │   │   ├── page.tsx                # Product catalog
│   │   │   │   └── [slug]/page.tsx         # Product detail
│   │   │   └── layout.tsx                  # Storefront wrapper
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── account/
│   │   │   ├── page.tsx                    # Dashboard
│   │   │   ├── orders/page.tsx             # Order history
│   │   │   └── orders/[id]/page.tsx        # Order detail
│   │   ├── admin/
│   │   │   ├── page.tsx                    # Dashboard
│   │   │   ├── layout.tsx                  # Admin shell
│   │   │   ├── products/
│   │   │   │   ├── page.tsx                # Product table
│   │   │   │   ├── new/page.tsx            # Create product
│   │   │   │   └── [slug]/edit/page.tsx    # Edit product
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx                # Orders table
│   │   │   │   └── [id]/page.tsx           # Order detail
│   │   │   └── categories/page.tsx         # Category manager
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── layout.tsx                     # Root layout
│   │   ├── providers.tsx                  # React Query, Session
│   │   ├── globals.css                    # Theme + Tailwind
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   └── [...nextauth]/route.ts
│   │       ├── products/
│   │       │   ├── route.ts
│   │       │   └── [slug]/route.ts
│   │       ├── categories/route.ts
│   │       ├── cart/
│   │       │   ├── route.ts
│   │       │   ├── items/[id]/route.ts
│   │       │   └── merge/route.ts
│   │       ├── razorpay/
│   │       │   ├── create-order/route.ts
│   │       │   ├── verify/route.ts
│   │       │   └── webhooks/route.ts
│   │       ├── orders/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── download/[itemId]/route.ts
│   │       ├── account/route.ts
│   │       ├── admin/
│   │       │   ├── products/
│   │       │   │   ├── route.ts
│   │       │   │   └── [slug]/
│   │       │   │       ├── route.ts
│   │       │   │       └── upload/route.ts
│   │       │   ├── categories/
│   │       │   │   ├── route.ts
│   │       │   │   └── [id]/route.ts
│   │       │   ├── orders/
│   │       │   │   ├── route.ts
│   │       │   │   └── [id]/route.ts
│   │       │   └── stats/route.ts
│   │       └── health/route.ts
│   ├── components/
│   │   ├── ui/                          # Themed primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── table.tsx
│   │   │   ├── data-table.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── select.tsx
│   │   │   └── label.tsx
│   │   ├── layout/
│   │   │   ├── navbar.tsx
│   │   │   ├── footer.tsx
│   │   │   └── mobile-menu.tsx
│   │   ├── landing/
│   │   │   ├── hero.tsx
│   │   │   ├── featured-grid.tsx
│   │   │   └── cta-section.tsx
│   │   ├── products/
│   │   │   ├── product-card.tsx
│   │   │   ├── product-grid.tsx
│   │   │   ├── product-gallery.tsx
│   │   │   ├── price-tag.tsx
│   │   │   └── add-to-cart-button.tsx
│   │   ├── cart/
│   │   │   ├── cart-drawer.tsx
│   │   │   ├── cart-item.tsx
│   │   │   └── cart-summary.tsx
│   │   ├── checkout/
│   │   │   └── razorpay-button.tsx
│   │   ├── account/
│   │   │   ├── orders-list.tsx
│   │   │   ├── order-detail.tsx
│   │   │   └── download-button.tsx
│   │   └── admin/
│   │       ├── shell.tsx
│   │       ├── sidebar.tsx
│   │       ├── product-form.tsx
│   │       ├── product-table.tsx
│   │       ├── file-upload.tsx
│   │       ├── order-table.tsx
│   │       └── category-manager.tsx
│   ├── lib/
│   │   ├── services/
│   │   │   ├── auth/
│   │   │   │   └── index.ts
│   │   │   ├── products/
│   │   │   │   └── index.ts
│   │   │   ├── orders/
│   │   │   │   └── index.ts
│   │   │   ├── payments/
│   │   │   │   └── index.ts
│   │   │   └── files/
│   │   │       └── index.ts
│   │   ├── db.ts                    # Prisma client singleton
│   │   ├── storage.ts               # MinIO client
│   │   ├── rate-limit.ts            # Redis rate limiter
│   │   ├── utils.ts                 # cn(), formatCurrency(), etc.
│   │   └── auth.ts                  # NextAuth config
│   ├── stores/
│   │   └── cart-store.ts
│   ├── middleware.ts
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
├── prisma/
│   └── schema.prisma
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .gitignore
├── package.json                     # Root workspace
├── pnpm-workspace.yaml
├── tsconfig.json                    # Root
└── README.md
```

---

## Tasks

### Task 1: Clean Up Existing Project

**Files:**
- Delete: All old POD project files and directories (apps/, packages/, prisma/, scripts/, tests/, nginx/, .turbo/, playwright-report/, test-results/, node_modules/, CONTRIBUTING.md, DEPLOYMENT.md, docker-compose.yml, docker-compose.prod.yml, Dockerfile.dev, playwright.config.ts, vitest.config.ts, turbo.json, pnpm-lock.yaml, .env, .next-dev*.log, dev-server*.log)
- Preserve: `.git/`, `.gitignore`, `.opencode/`, `.superpowers/`, `docs/`, `AGENTS.md`, `.env.example`, `skills-lock.json`
- Create: New root `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `.gitignore` updates

**Interfaces:**
- Produces: Clean workspace ready for new project scaffolding

- [ ] **Step 1: Remove old POD source files**

Run: Remove-Item -Recurse -Force apps, packages, prisma, scripts, tests, nginx, .turbo, playwright-report, test-results, node_modules, CONTRIBUTING.md, DEPLOYMENT.md, docker-compose.yml, docker-compose.prod.yml, Dockerfile.dev, playwright.config.ts, vitest.config.ts, turbo.json, pnpm-lock.yaml, .prettierrc

- [ ] **Step 2: Preserve essential config files**

Ensure `.gitignore`, `.env.example`, `.opencode/`, `.superpowers/`, `docs/`, `skills-lock.json` remain.

- [ ] **Step 3: Create root workspace package.json**

```json
{
  "name": "digital-products",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter web dev",
    "build": "pnpm --filter web build",
    "start": "pnpm --filter web start",
    "lint": "pnpm --filter web lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,json,css,md}\""
  },
  "engines": { "node": ">=20" }
}
```

- [ ] **Step 4: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
```

- [ ] **Step 5: Create root tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

- [ ] **Step 6: Create .env.example**

```env
# Database
DATABASE_URL=postgresql://pod:password@localhost:5432/digital-products

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=digital-products

# Auth (NextAuth)
AUTH_SECRET=generate-a-random-hex-string-here
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: clean up POD project, scaffold new workspace"
```

---

### Task 2: Scaffold Next.js App + Install Dependencies

**Files:**
- Create: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/next.config.ts`, `apps/web/.env.local`

**Interfaces:**
- Produces: Working Next.js 15 app with all dependencies

- [ ] **Step 1: Create apps/web/package.json**

```json
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next-auth": "5.0.0-beta.25",
    "@auth/prisma-adapter": "^2.0.0",
    "@prisma/client": "^6.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^5.0.0",
    "framer-motion": "^11.0.0",
    "zod": "^3.23.0",
    "bcryptjs": "^2.4.3",
    "sonner": "^1.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.400.0",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/bcryptjs": "^2.4.0",
    "prisma": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "postcss": "^8.4.0",
    "eslint": "^9.0.0",
    "@eslint/eslintrc": "^3.0.0",
    "@eslint/js": "^9.0.0",
    "typescript-eslint": "^8.0.0",
    "prettier": "^3.4.0",
    "prettier-plugin-tailwindcss": "^0.6.0"
  }
}
```

- [ ] **Step 2: Create apps/web/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create apps/web/next.config.ts**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { optimizePackageImports: ["lucide-react"] },
};

export default nextConfig;
```

- [ ] **Step 4: Install dependencies**

Run: `pnpm install`

- [ ] **Step 5: Create apps/web/.env.local** (copy from template)

Run: `Copy-Item .env.example apps/web/.env.local`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with dependencies"
```

---

### Task 3: Docker Compose + Prisma Schema + Infrastructure

**Files:**
- Create: `docker-compose.yml`, `Dockerfile`, `.dockerignore`, `prisma/schema.prisma`

**Interfaces:**
- Produces: Docker Compose with Postgres + MinIO + Redis, Prisma schema with all models

- [ ] **Step 1: Create docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: pod
      POSTGRES_PASSWORD: password
      POSTGRES_DB: digital-products
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pod -d digital-products"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports: ["6379:6379"]
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
  minio_data:
  redis_data:
```

- [ ] **Step 2: Create Dockerfile**

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/web/server.js"]
```

- [ ] **Step 3: Create .dockerignore**

```
.git
node_modules
.next
*.md
.env
.env.local
```

- [ ] **Step 4: Create prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  CUSTOMER
}

enum OrderStatus {
  PENDING_PAYMENT
  PAID
  COMPLETED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

model User {
  id        String   @id @default(cuid())
  name      String?
  email     String   @unique
  password  String?
  role      Role     @default(CUSTOMER)
  image     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cart     Cart?
  orders   Order[]
  accounts Account[]
  sessions Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Cart {
  id        String   @id @default(cuid())
  userId    String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user  User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items CartItem[]
}

model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  productId String
  quantity  Int      @default(1)
  createdAt DateTime @default(now())

  cart    Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])
}

model Product {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  description String   @db.Text
  price       Decimal
  salePrice   Decimal?
  isActive    Boolean  @default(true)
  isFeatured  Boolean  @default(false)
  categoryId  String?
  tags        String[]
  fileKey     String?
  fileName    String?
  fileSize    Int?
  fileVersion Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  category       Category?        @relation(fields: [categoryId], references: [id])
  images         ProductImage[]
  cartItems      CartItem[]
  orderItems     OrderItem[]
  downloads      Download[]
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  url       String
  alt       String?
  position  Int     @default(0)

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  image       String?
  parentId    String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())

  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")
  products Product[]
}

model Order {
  id            String      @id @default(cuid())
  orderNumber   String      @unique
  userId        String
  status        OrderStatus @default(PENDING_PAYMENT)
  totalAmount   Decimal
  subtotalAmount Decimal    @default(0)
  discountAmount Decimal    @default(0)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  user          User                  @relation(fields: [userId], references: [id])
  items         OrderItem[]
  payments      Payment[]
  statusHistory OrderStatusHistory[]
}

model OrderItem {
  id        String   @id @default(cuid())
  orderId   String
  productId String
  title     String
  quantity  Int
  unitPrice Decimal
  totalPrice Decimal

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])
}

model Payment {
  id                 String        @id @default(cuid())
  orderId            String
  razorpayPaymentId  String?
  razorpayOrderId    String?
  razorpaySignature  String?
  amount             Decimal
  currency           String        @default("INR")
  status             PaymentStatus @default(PENDING)
  method             String?
  createdAt          DateTime      @default(now())

  order Order @relation(fields: [orderId], references: [id])
}

model OrderStatusHistory {
  id        String      @id @default(cuid())
  orderId   String
  status    OrderStatus
  note      String?
  createdAt DateTime    @default(now())

  order Order @relation(fields: [orderId], references: [id])
}

model Download {
  id          String   @id @default(cuid())
  userId      String
  productId   String
  orderId     String
  fileVersion Int
  ip          String?
  createdAt   DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id])
  product Product @relation(fields: [productId], references: [id])
  order   Order   @relation(fields: [orderId], references: [id])
}
```

- [ ] **Step 5: Start infrastructure**

Run: `docker compose up -d postgres minio redis`

- [ ] **Step 6: Apply Prisma migration**

Run: `cd apps/web && npx prisma migrate dev --name init`

- [ ] **Step 7: Create MinIO bucket**

Run PowerShell to create the bucket:
```powershell
docker exec pod-minio-1 mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec pod-minio-1 mc mb local/digital-products
docker exec pod-minio-1 mc policy set download local/digital-products
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Docker Compose, Prisma schema, and MinIO setup"
```

---

### Task 4: Shared Utilities + Database + Storage Clients

**Files:**
- Create: `apps/web/lib/db.ts`, `apps/web/lib/storage.ts`, `apps/web/lib/utils.ts`, `apps/web/lib/rate-limit.ts`

**Interfaces:**
- Produces: Prisma client singleton, MinIO client, utility functions, Redis rate limiter

- [ ] **Step 1: Create Prisma client singleton (apps/web/lib/db.ts)**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 2: Create MinIO client (apps/web/lib/storage.ts)**

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

- [ ] **Step 3: Create utility functions (apps/web/lib/utils.ts)**

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

- [ ] **Step 4: Create Redis rate limiter (apps/web/lib/rate-limit.ts)**

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

- [ ] **Step 5: Install additional dependencies**

Run: `pnpm --filter web add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner redis`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add db, storage, utils, and rate-limit utilities"
```

---

### Task 5: Auth Service + NextAuth Configuration

**Files:**
- Create: `apps/web/lib/auth.ts`, `apps/web/app/api/auth/register/route.ts`, `apps/web/app/api/auth/[...nextauth]/route.ts`, `apps/web/app/providers.tsx`
- Modify: `apps/web/app/layout.tsx`

**Interfaces:**
- Consumes: `prisma` from `lib/db.ts`
- Produces: `auth()` server-side session checker, `auth` config used by middleware and API routes

- [ ] **Step 1: Create NextAuth config (apps/web/lib/auth.ts)**

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
  },
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.password) return null;
        const isValid = await compare(credentials.password as string, user.password);
        if (!isValid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
```

- [ ] **Step 2: Create NextAuth route handler (apps/web/app/api/auth/[...nextauth]/route.ts)**

```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 3: Create register API (apps/web/app/api/auth/register/route.ts)**

```ts
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = await hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create providers wrapper (apps/web/app/providers.tsx)**

```tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-right" />
      </QueryClientProvider>
    </SessionProvider>
  );
}
```

- [ ] **Step 5: Create root layout (apps/web/app/layout.tsx)**

```tsx
import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus Store — Digital Products",
  description: "Premium digital products for creators and developers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add NextAuth with credentials + Google OAuth, register API"
```

---

### Task 6: Admin Guard Middleware + Rate Limiting Middleware

**Files:**
- Create: `apps/web/app/api/admin/guard.ts`, `apps/web/middleware.ts`

**Interfaces:**
- Consumes: `auth()` from `lib/auth.ts`
- Produces: `adminGuard()` for API routes, middleware for route protection

- [ ] **Step 1: Create admin guard helper (apps/web/lib/guard.ts)**

```ts
import { auth } from "./auth";
import { NextResponse } from "next/server";

export async function adminGuard() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function userGuard() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session.user;
}
```

- [ ] **Step 2: Create middleware (apps/web/middleware.ts)**

```ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Protect account routes
  if (pathname.startsWith("/account") && !req.auth) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Protect admin routes
  if (pathname.startsWith("/admin") && !req.auth) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (pathname.startsWith("/admin") && req.auth?.user) {
    const role = (req.auth.user as any).role;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Redirect logged-in users away from auth pages
  if ((pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register")) && req.auth) {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/auth/:path*"],
};
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add admin guard and middleware for route protection"
```

---

### Task 7: Product Service + Categories

**Files:**
- Create: `apps/web/lib/services/products/index.ts`, `apps/web/app/api/products/route.ts`, `apps/web/app/api/products/[slug]/route.ts`, `apps/web/app/api/categories/route.ts`

**Interfaces:**
- Consumes: `prisma` from `lib/db.ts`, `slugify` from `lib/utils.ts`
- Produces: Product CRUD functions, product list/detail API, categories API

- [ ] **Step 1: Create products service (apps/web/lib/services/products/index.ts)**

```ts
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export type ProductListParams = {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "name";
};

export type ProductListResult = {
  items: any[];
  total: number;
  page: number;
  totalPages: number;
};

const productInclude = {
  images: { orderBy: { position: "asc" as const } },
  category: true,
};

export async function listProducts(params: ProductListParams): Promise<ProductListResult> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (params.category) {
    where.category = { slug: params.category };
  }
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
      { tags: { has: params.search } },
    ];
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "price_asc" ? { price: "asc" } :
    params.sort === "price_desc" ? { price: "desc" } :
    params.sort === "name" ? { title: "asc" } :
    { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      ...productInclude,
    },
  });
}

export async function createProduct(data: {
  title: string;
  description: string;
  price: number;
  salePrice?: number;
  categoryId?: string;
  tags?: string[];
  isFeatured?: boolean;
  imageUrls?: { url: string; alt?: string; position?: number }[];
}) {
  const slug = slugify(data.title);
  const product = await prisma.product.create({
    data: {
      title: data.title,
      slug,
      description: data.description,
      price: data.price,
      salePrice: data.salePrice,
      categoryId: data.categoryId,
      tags: data.tags || [],
      isFeatured: data.isFeatured || false,
      images: data.imageUrls
        ? { create: data.imageUrls.map((img) => ({ url: img.url, alt: img.alt, position: img.position || 0 })) }
        : undefined,
    },
    include: productInclude,
  });
  return product;
}

export async function updateProduct(slug: string, data: any) {
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return null;

  return prisma.product.update({
    where: { slug },
    data: {
      ...(data.title && { title: data.title, slug: slugify(data.title) }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.salePrice !== undefined && { salePrice: data.salePrice }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
    },
    include: productInclude,
  });
}

export async function deleteProduct(slug: string) {
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return false;
  await prisma.product.update({ where: { slug }, data: { isActive: false } });
  return true;
}
```

- [ ] **Step 2: Create products list/detail API routes**

apps/web/app/api/products/route.ts:
```ts
import { NextResponse } from "next/server";
import { listProducts } from "@/lib/services/products";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const products = await listProducts({
    page: Number(searchParams.get("page")) || 1,
    limit: Number(searchParams.get("limit")) || 20,
    category: searchParams.get("category") || undefined,
    search: searchParams.get("search") || undefined,
    sort: (searchParams.get("sort") as any) || "newest",
  });
  return NextResponse.json(products);
}
```

apps/web/app/api/products/[slug]/route.ts:
```ts
import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/services/products";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}
```

- [ ] **Step 3: Create categories API (apps/web/app/api/categories/route.ts)**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json(categories);
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add products and categories service + API routes"
```

---

### Task 8: Cart Service + API

**Files:**
- Create: `apps/web/stores/cart-store.ts`, `apps/web/app/api/cart/route.ts`, `apps/web/app/api/cart/items/[id]/route.ts`, `apps/web/app/api/cart/merge/route.ts`

**Interfaces:**
- Consumes: `prisma` from `lib/db.ts`, `userGuard()` from `lib/guard.ts`
- Produces: Zustand cart store, cart API with merge guest cart

- [ ] **Step 1: Create Zustand cart store (apps/web/stores/cart-store.ts)**

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalAmount: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((i) => i.productId === item.productId);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.productId !== productId) });
        } else {
          set({
            items: get().items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
          });
        }
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalAmount: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "nexus-cart" }
  )
);
```

- [ ] **Step 2: Create cart API routes**

apps/web/app/api/cart/route.ts:
```ts
import { NextResponse } from "next/server";
import { userGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { product: { include: { images: true } } } } },
  });

  return NextResponse.json(cart || { items: [] });
}

export async function POST(req: Request) {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  const { items } = await req.json();

  const cart = await prisma.cart.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  if (items?.length) {
    await prisma.cartItem.createMany({
      data: items.map((item: any) => ({
        cartId: cart.id,
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
  }

  return NextResponse.json({ success: true });
}
```

apps/web/app/api/cart/items/[id]/route.ts:
```ts
import { NextResponse } from "next/server";
import { userGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
  if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });

  await prisma.cartItem.deleteMany({
    where: { id: params.id, cartId: cart.id },
  });

  return NextResponse.json({ success: true });
}
```

apps/web/app/api/cart/merge/route.ts:
```ts
import { NextResponse } from "next/server";
import { userGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  const { items } = await req.json();
  if (!items?.length) return NextResponse.json({ success: true });

  const cart = await prisma.cart.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  const existingItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });

  for (const guestItem of items) {
    const existing = existingItems.find((i) => i.productId === guestItem.productId);
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + (guestItem.quantity || 1) },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: guestItem.productId,
          quantity: guestItem.quantity || 1,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Zustand cart store and cart API with guest merge"
```

---

### Task 9: File Service + Zip Upload

**Files:**
- Create: `apps/web/lib/services/files/index.ts`, `apps/web/app/api/admin/products/[slug]/upload/route.ts`

**Interfaces:**
- Consumes: `uploadFile` from `lib/storage.ts`, `prisma` from `lib/db.ts`, `adminGuard()` from `lib/guard.ts`
- Produces: Zip upload with magic byte validation, file upload API

- [ ] **Step 1: Create file service (apps/web/lib/services/files/index.ts)**

```ts
import { uploadFile, getDownloadUrl, BUCKET } from "@/lib/storage";

const ZIP_MAGIC_BYTES = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

export function validateZipFile(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return buffer[0] === ZIP_MAGIC_BYTES[0] &&
         buffer[1] === ZIP_MAGIC_BYTES[1] &&
         buffer[2] === ZIP_MAGIC_BYTES[2] &&
         buffer[3] === ZIP_MAGIC_BYTES[3];
}

export function validateFileExtension(filename: string): boolean {
  return filename.toLowerCase().endsWith(".zip");
}

export function generateFileKey(productId: string, version: number, filename: string): string {
  return `products/${productId}/v${version}/${filename}`;
}

export async function uploadProductFile(
  productId: string,
  version: number,
  filename: string,
  buffer: Buffer
) {
  const fileKey = generateFileKey(productId, version, filename);
  await uploadFile(fileKey, buffer, "application/zip");
  return fileKey;
}

export async function getProductDownloadUrl(fileKey: string) {
  return getDownloadUrl(fileKey, 900);
}
```

- [ ] **Step 2: Create file upload API (apps/web/app/api/admin/products/[slug]/upload/route.ts)**

```ts
import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { validateZipFile, validateFileExtension, uploadProductFile } from "@/lib/services/files";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const guard = await adminGuard();
  if (guard) return guard;

  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!validateFileExtension(file.name)) {
    return NextResponse.json({ error: "File must be a .zip" }, { status: 400 });
  }

  if (file.size > 400 * 1024 * 1024) {
    return NextResponse.json({ error: "File exceeds 400MB limit" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!validateZipFile(buffer)) {
    return NextResponse.json({ error: "Invalid zip file (magic bytes check failed)" }, { status: 400 });
  }

  const newVersion = product.fileVersion + 1;
  const fileKey = await uploadProductFile(product.id, newVersion, file.name, buffer);

  const updated = await prisma.product.update({
    where: { slug: params.slug },
    data: {
      fileKey,
      fileName: file.name,
      fileSize: file.size,
      fileVersion: newVersion,
    },
  });

  return NextResponse.json({ fileKey: updated.fileKey, fileName: updated.fileName, fileSize: updated.fileSize, fileVersion: updated.fileVersion });
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add file service with zip validation and upload API"
```

---

### Task 10: Payment Service (Razorpay)

**Files:**
- Create: `apps/web/lib/services/payments/index.ts`, `apps/web/app/api/razorpay/create-order/route.ts`, `apps/web/app/api/razorpay/verify/route.ts`, `apps/web/app/api/razorpay/webhooks/route.ts`

**Interfaces:**
- Consumes: `prisma`, `userGuard`, `adminGuard`
- Produces: Razorpay order creation, payment verification, webhook handling

- [ ] **Step 1: Create payment service (apps/web/lib/services/payments/index.ts)**

```ts
import { prisma } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

function createHmac(body: string) {
  const { createHmac } = require("crypto");
  return createHmac("sha256", RAZORPAY_KEY_SECRET).update(body).digest("hex");
}

export async function createRazorpayOrder(userId: string, couponCode?: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!cart?.items.length) {
    throw new Error("Cart is empty");
  }

  let subtotal = 0;
  for (const item of cart.items) {
    const price = item.product.salePrice || item.product.price;
    subtotal += Number(price) * item.quantity;
  }

  // Create Razorpay order via API
  const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(
        `${process.env.RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
      ).toString("base64")}`,
    },
    body: JSON.stringify({
      amount: Math.round(subtotal * 100),
      currency: "INR",
      receipt: `cart_${cart.id}_${Date.now()}`,
      notes: { userId, cartId: cart.id },
    }),
  });

  if (!razorpayRes.ok) {
    throw new Error("Failed to create Razorpay order");
  }

  const razorpayOrder = await razorpayRes.json();

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: subtotal,
    amountInPaise: Math.round(subtotal * 100),
  };
}

export async function verifyPayment(payload: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}) {
  const body = `${payload.razorpay_order_id}|${payload.razorpay_payment_id}`;
  const expectedSignature = createHmac(body);
  return expectedSignature === payload.razorpay_signature;
}

export async function createOrderFromPayment(
  userId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  amount: number
) {
  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart?.items.length) throw new Error("Cart is empty");

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.salePrice || item.product.price) * item.quantity,
      0
    );

    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        status: "PAID",
        subtotalAmount: subtotal,
        totalAmount: amount,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            title: item.product.title,
            quantity: item.quantity,
            unitPrice: item.product.salePrice || item.product.price,
            totalPrice: Number(item.product.salePrice || item.product.price) * item.quantity,
          })),
        },
        payments: {
          create: {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            amount,
            status: "COMPLETED",
          },
        },
        statusHistory: {
          create: [
            { status: "PENDING_PAYMENT" },
            { status: "PAID" },
          ],
        },
      },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return order;
  });
}
```

- [ ] **Step 2: Create Razorpay create-order API (apps/web/app/api/razorpay/create-order/route.ts)**

```ts
import { NextResponse } from "next/server";
import { userGuard } from "@/lib/guard";
import { createRazorpayOrder } from "@/lib/services/payments";

export async function POST(req: Request) {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  try {
    const { couponCode } = await req.json();
    const order = await createRazorpayOrder(user.id, couponCode);
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

- [ ] **Step 3: Create verify API (apps/web/app/api/razorpay/verify/route.ts)**

```ts
import { NextResponse } from "next/server";
import { userGuard } from "@/lib/guard";
import { verifyPayment, createOrderFromPayment } from "@/lib/services/payments";

export async function POST(req: Request) {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } = await req.json();

    const isValid = await verifyPayment({
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const order = await createOrderFromPayment(
      user.id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount
    );

    return NextResponse.json({ id: order.id, orderNumber: order.orderNumber });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

- [ ] **Step 4: Create webhook handler (apps/web/app/api/razorpay/webhooks/route.ts)**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  // HMAC verification
  const { createHmac } = require("crypto");
  const expectedSig = createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (signature !== expectedSig) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    
    const existingPayment = await prisma.payment.findFirst({
      where: { razorpayOrderId: payment.order_id },
    });

    if (existingPayment && existingPayment.status !== "COMPLETED") {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          razorpayPaymentId: payment.id,
          status: "COMPLETED",
          method: payment.method,
        },
      });

      const order = await prisma.order.findFirst({
        where: { payments: { some: { id: existingPayment.id } } },
      });

      if (order && order.status === "PENDING_PAYMENT") {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "PAID",
            statusHistory: { create: { status: "PAID" } },
          },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Razorpay payment service, verify, and webhook"
```

---

### Task 11: Orders Service + Download Flow

**Files:**
- Create: `apps/web/lib/services/orders/index.ts`, `apps/web/app/api/orders/route.ts`, `apps/web/app/api/orders/[id]/route.ts`, `apps/web/app/api/orders/[id]/download/[itemId]/route.ts`

**Interfaces:**
- Consumes: `prisma`, `userGuard`, `rateLimit` from `lib/rate-limit.ts`, `getProductDownloadUrl` from file service
- Produces: Order history, order detail, download with rate limiting

- [ ] **Step 1: Create orders service (apps/web/lib/services/orders/index.ts)**

```ts
import { prisma } from "@/lib/db";
import { getProductDownloadUrl } from "@/lib/services/files";
import { rateLimit } from "@/lib/rate-limit";
import type { OrderStatus } from "@prisma/client";

const orderInclude = {
  items: true,
  payments: true,
  statusHistory: { orderBy: { createdAt: "desc" as const } },
};

export async function getUserOrders(userId: string, page = 1, limit = 20) {
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      include: { ...orderInclude, items: { include: { product: { select: { fileKey: true, fileVersion: true } } } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getUserOrder(userId: string, orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { ...orderInclude, items: { include: { product: { select: { fileKey: true, fileVersion: true } } } } },
  });
}

export async function generateDownloadUrl(
  userId: string,
  orderId: string,
  itemId: string
) {
  // Rate limit check: 3 downloads per hour per user
  const { allowed, remaining } = await rateLimit(`download:${userId}`, 3, 3600);
  if (!allowed) {
    throw new Error("Download limit exceeded. Try again later.");
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });

  if (!order) throw new Error("Order not found");

  const item = order.items.find((i) => i.id === itemId);
  if (!item) throw new Error("Item not found in order");

  const product = await prisma.product.findUnique({
    where: { id: item.productId },
    select: { fileKey: true, fileVersion: true, fileName: true },
  });

  if (!product?.fileKey) throw new Error("No file available for this product");

  // Log download
  await prisma.download.create({
    data: {
      userId,
      productId: item.productId,
      orderId,
      fileVersion: product.fileVersion,
    },
  });

  const url = await getProductDownloadUrl(product.fileKey);
  return { url, fileName: product.fileName, remaining };
}
```

- [ ] **Step 2: Create orders list/detail APIs**

apps/web/app/api/orders/route.ts:
```ts
import { NextResponse } from "next/server";
import { userGuard } from "@/lib/guard";
import { getUserOrders } from "@/lib/services/orders";

export async function GET(req: Request) {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  const { searchParams } = new URL(req.url);
  const orders = await getUserOrders(
    user.id,
    Number(searchParams.get("page")) || 1,
    Number(searchParams.get("limit")) || 20
  );

  return NextResponse.json(orders);
}
```

apps/web/app/api/orders/[id]/route.ts:
```ts
import { NextResponse } from "next/server";
import { userGuard } from "@/lib/guard";
import { getUserOrder } from "@/lib/services/orders";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  const order = await getUserOrder(user.id, params.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}
```

- [ ] **Step 3: Create download endpoint (apps/web/app/api/orders/[id]/download/[itemId]/route.ts)**

```ts
import { NextResponse } from "next/server";
import { userGuard } from "@/lib/guard";
import { generateDownloadUrl } from "@/lib/services/orders";

export async function GET(req: Request, { params }: { params: { id: string; itemId: string } }) {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  try {
    const result = await generateDownloadUrl(user.id, params.id, params.itemId);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message.includes("limit exceeded") ? 429 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add orders service + download API with rate limiting"
```

---

### Task 12: Admin API Routes

**Files:**
- Create: `apps/web/app/api/admin/products/route.ts`, `apps/web/app/api/admin/products/[slug]/route.ts`, `apps/web/app/api/admin/categories/route.ts`, `apps/web/app/api/admin/categories/[id]/route.ts`, `apps/web/app/api/admin/orders/route.ts`, `apps/web/app/api/admin/orders/[id]/route.ts`, `apps/web/app/api/admin/stats/route.ts`

**Interfaces:**
- Produces: Full admin CRUD APIs for products, categories, orders, and stats

- [ ] **Step 1: Create admin products API**

apps/web/app/api/admin/products/route.ts:
```ts
import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { listProducts, createProduct } from "@/lib/services/products";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const guard = await adminGuard();
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const products = await listProducts({
    page: Number(searchParams.get("page")) || 1,
    limit: Number(searchParams.get("limit")) || 50,
    search: searchParams.get("search") || undefined,
    sort: (searchParams.get("sort") as any) || "newest",
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const guard = await adminGuard();
  if (guard) return guard;

  try {
    const data = await req.json();
    const product = await createProduct(data);
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

apps/web/app/api/admin/products/[slug]/route.ts:
```ts
import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { updateProduct, deleteProduct } from "@/lib/services/products";

export async function PUT(req: Request, { params }: { params: { slug: string } }) {
  const guard = await adminGuard();
  if (guard) return guard;

  const data = await req.json();
  const product = await updateProduct(params.slug, data);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
  const guard = await adminGuard();
  if (guard) return guard;

  const deleted = await deleteProduct(params.slug);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create admin categories API**

apps/web/app/api/admin/categories/route.ts:
```ts
import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const guard = await adminGuard();
  if (guard) return guard;

  const { name, description, image, parentId, order } = await req.json();
  const category = await prisma.category.create({
    data: { name, slug: slugify(name), description, image, parentId, order: order || 0 },
  });
  return NextResponse.json(category, { status: 201 });
}
```

apps/web/app/api/admin/categories/[id]/route.ts:
```ts
import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const guard = await adminGuard();
  if (guard) return guard;

  const data = await req.json();
  const category = await prisma.category.update({
    where: { id: params.id },
    data: {
      ...(data.name && { name: data.name, slug: slugify(data.name) }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.image !== undefined && { image: data.image }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.parentId !== undefined && { parentId: data.parentId }),
    },
  });
  return NextResponse.json(category);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const guard = await adminGuard();
  if (guard) return guard;

  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create admin orders API**

apps/web/app/api/admin/orders/route.ts:
```ts
import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const guard = await adminGuard();
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Math.min(100, Number(searchParams.get("limit")) || 20);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        payments: true,
        user: { select: { id: true, name: true, email: true } },
        statusHistory: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) });
}
```

apps/web/app/api/admin/orders/[id]/route.ts:
```ts
import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const guard = await adminGuard();
  if (guard) return guard;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { product: true } },
      payments: true,
      user: { select: { id: true, name: true, email: true } },
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await adminGuard();
  if (guard) return guard;

  const { status, note } = await req.json();
  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      status,
      statusHistory: { create: { status, note } },
    },
  });

  return NextResponse.json(order);
}
```

- [ ] **Step 4: Create admin stats API (apps/web/app/api/admin/stats/route.ts)**

```ts
import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";

export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalProducts,
    totalOrders,
    totalRevenue,
    todayOrders,
    todayRevenue,
    totalCustomers,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { totalAmount: true },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);

  return NextResponse.json({
    totalProducts,
    totalOrders,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    todayOrders,
    todayRevenue: todayRevenue._sum.totalAmount || 0,
    totalCustomers,
  });
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add admin CRUD APIs for products, categories, orders, stats"
```

---

### Task 13: Health Check + Auth Pages

**Files:**
- Create: `apps/web/app/api/health/route.ts`, `apps/web/app/api/account/route.ts`, `apps/web/app/(auth)/login/page.tsx`, `apps/web/app/(auth)/register/page.tsx`, `apps/web/app/(auth)/layout.tsx`

**Interfaces:**
- Consumes: `prisma`, `auth()`, `userGuard()`
- Produces: Health check, account info, auth page UIs

- [ ] **Step 1: Create health check endpoint (apps/web/app/api/health/route.ts)**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "healthy", db: "ok" });
  } catch {
    return NextResponse.json({ status: "unhealthy", db: "error" }, { status: 503 });
  }
}
```

- [ ] **Step 2: Create account info endpoint (apps/web/app/api/account/route.ts)**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
  });

  return NextResponse.json(user);
}
```

- [ ] **Step 3: Create auth page UIs**

Login page (`apps/web/app/(auth)/login/page.tsx`):
```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/account");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md glass-panel">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl: "/account" })}>
            Sign in with Google
          </Button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            No account?{" "}
            <a href="/auth/register" className="text-primary hover:underline">Register</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

Register page (`apps/web/app/(auth)/register/page.tsx`):
```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    // Auto sign-in after registration
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.ok) {
      router.push("/account");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md glass-panel">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create account</CardTitle>
          <CardDescription>Start your digital collection</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/auth/login" className="text-primary hover:underline">Sign in</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Create auth layout (apps/web/app/(auth)/layout.tsx)** — minimal wrapper that centers content vertically

- [ ] **Step 5: Commit**

---

### Task 14: Theme + CSS + UI Primitives

**Files:**
- Create: `apps/web/app/globals.css` (Tailwind v4 with Cyberpunk+ME theme), `apps/web/components/ui/button.tsx`, `apps/web/components/ui/input.tsx`, `apps/web/components/ui/card.tsx`, `apps/web/components/ui/badge.tsx`, `apps/web/components/ui/skeleton.tsx`, `apps/web/components/ui/dialog.tsx`, `apps/web/components/ui/table.tsx`, `apps/web/components/ui/data-table.tsx`, `apps/web/components/ui/select.tsx`, `apps/web/components/ui/label.tsx`, `apps/web/app/not-found.tsx`, `apps/web/app/error.tsx`

**Interfaces:**
- Consumes: `cn()` from `lib/utils.ts`
- Produces: Full design system with themed UI components

- [ ] **Step 1: Create globals.css with Cyberpunk 2077 + Mass Effect theme**

Dark mode is primary experience with neon accents, glass panels, and holographic elements. Light mode is clean sci-fi with same accent colors but muted.

```css
@import "tailwindcss";

@theme {
  --color-background: #0a0a0f;
  --color-foreground: #e8e8ed;
  --color-card: #12121a;
  --color-card-foreground: #e8e8ed;
  --color-popover: #12121a;
  --color-popover-foreground: #e8e8ed;
  --color-primary: #00f0ff;
  --color-primary-foreground: #0a0a0f;
  --color-secondary: #1a1a2e;
  --color-secondary-foreground: #e8e8ed;
  --color-muted: #1a1a2e;
  --color-muted-foreground: #8888a0;
  --color-accent: #ff00aa;
  --color-accent-foreground: #0a0a0f;
  --color-destructive: #ff3355;
  --color-destructive-foreground: #e8e8ed;
  --color-border: rgba(0, 240, 255, 0.15);
  --color-input: #1a1a2e;
  --color-ring: #00f0ff;
  --radius: 0.75rem;
}

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@utility neon-glow {
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.3), 0 0 30px rgba(0, 240, 255, 0.1);
}

@utility glass-panel {
  background: rgba(18, 18, 26, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 240, 255, 0.1);
}

@layer utilities {
  .animate-glow-pulse {
    animation: glow-pulse 3s ease-in-out infinite;
  }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 15px rgba(0, 240, 255, 0.3); }
  50% { box-shadow: 0 0 25px rgba(0, 240, 255, 0.6); }
}
```

- [ ] **Step 2: Create Button component**

```tsx
"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90 neon-glow",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
        outline: "border border-border bg-transparent hover:bg-secondary",
        secondary: "bg-secondary text-secondary-foreground hover:opacity-80",
        ghost: "hover:bg-secondary text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Cyberpunk+ME theme and UI primitives (Button, Card, etc.)"
```

---

### Task 15: Layout Components (Navbar + Footer)

**Files:**
- Create: `apps/web/components/layout/navbar.tsx`, `apps/web/components/layout/footer.tsx`, `apps/web/components/layout/mobile-menu.tsx`, `apps/web/app/(storefront)/layout.tsx`

**Interfaces:**
- Consumes: `useSession`, `useCartStore`, `cn()`, `Button`, Framer Motion
- Produces: Navigation with theme toggle, cart badge, mobile menu

- [ ] **Step 1: Create Navbar component (apps/web/components/layout/navbar.tsx)**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/stores/cart-store";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, LogOut, Sun, Moon, Menu } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const totalItems = useCartStore((s) => s.totalItems());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(true);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl"
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">NEXUS</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors hover:text-primary ${
                pathname === link.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDark(!dark)}
            title="Toggle theme"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Button>
          </Link>

          {session?.user ? (
            <div className="flex items-center gap-2">
              <Link href="/account">
                <Button variant="ghost" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
              {(session.user as any).role === "ADMIN" && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm">Admin</Button>
                </Link>
              )}
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link href="/auth/login">
              <Button size="sm">Sign in</Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-border px-4 pb-4 md:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </motion.div>
      )}
    </motion.header>
  );
}
```

- [ ] **Step 2: Create Footer component (apps/web/components/layout/footer.tsx)**

```tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
        <Link href="/" className="text-sm font-bold text-primary">NEXUS</Link>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Nexus Store. All rights reserved.
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <Link href="/products" className="hover:text-primary">Products</Link>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Create storefront layout (apps/web/app/(storefront)/layout.tsx)**

```tsx
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

---

### Task 16: Landing Page

**Files:**
- Create: `apps/web/components/landing/hero.tsx`, `apps/web/components/landing/featured-grid.tsx`, `apps/web/components/landing/cta-section.tsx`, `apps/web/app/(storefront)/page.tsx`

**Interfaces:**
- Consumes: `prisma` for featured products, Framer Motion for animations
- Produces: Landing page with parallax hero, animated featured grid, scroll animations

- [ ] **Step 1: Create Hero component with parallax (apps/web/components/landing/hero.tsx)**

```tsx
"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(0,240,255,0.07)_1px,transparent_1px)] bg-[length:30px_30px]" />

      {/* Floating geometric shapes */}
      <motion.div
        className="absolute left-20 top-20 h-32 w-32 rounded-xl border border-primary/20"
        animate={{ rotate: 360, y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute right-20 bottom-20 h-24 w-24 rounded-full border border-accent/20"
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div style={{ y, opacity }} className="relative z-10 max-w-4xl px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 text-5xl font-bold tracking-tight md:text-7xl"
        >
          Premium{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Digital Products
            </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground"
        >
          E-books, templates, software, and more — download your purchases anytime.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex justify-center gap-4"
        >
          <Link href="/products">
            <Button size="lg" className="animate-glow-pulse">
              Browse Products
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="outline" size="lg">
              Get Started
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 2: Create FeaturedGrid with staggered cards (apps/web/components/landing/featured-grid.tsx)**

```tsx
"use client";

import { motion } from "framer-motion";
import { ProductCard } from "@/components/products/product-card";
import type { Product } from "@prisma/client";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function FeaturedGrid({ products }: { products: any[] }) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-3xl font-bold"
        >
          Featured Products
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={itemVariants}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create CTA section (apps/web/components/landing/cta-section.tsx)**

```tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="border-t border-border py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto max-w-3xl px-4 text-center"
      >
        <h2 className="mb-4 text-3xl font-bold">Ready to start your collection?</h2>
        <p className="mb-8 text-muted-foreground">
          Create an account and get instant access to your purchases, anytime.
        </p>
        <Link href="/auth/register">
          <Button size="lg">Create Account</Button>
        </Link>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 4: Create landing page (apps/web/app/(storefront)/page.tsx)**

```tsx
import { Hero } from "@/components/landing/hero";
import { FeaturedGrid } from "@/components/landing/featured-grid";
import { CtaSection } from "@/components/landing/cta-section";
import { prisma } from "@/lib/db";

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Hero />
      {featuredProducts.length > 0 && <FeaturedGrid products={featuredProducts} />}
      <CtaSection />
    </>
  );
}
```

- [ ] **Step 5: Commit**

---

### Task 17: Product Catalog Pages

**Files:**
- Create: `apps/web/components/products/product-card.tsx`, `apps/web/components/products/product-grid.tsx`, `apps/web/components/products/product-gallery.tsx`, `apps/web/components/products/price-tag.tsx`, `apps/web/components/products/add-to-cart-button.tsx`, `apps/web/app/(storefront)/products/page.tsx`, `apps/web/app/(storefront)/products/[slug]/page.tsx`

**Interfaces:**
- Consumes: `useCartStore` for add-to-cart, product API
- Produces: Product catalog with filters, product detail page

- [ ] **Step 1: Create ProductCard with hover glow and fade-up animation**

- [ ] **Step 2: Create ProductGrid with stagger animation**

- [ ] **Step 3: Create ProductGallery (screenshot carousel)**

- [ ] **Step 4: Create PriceTag with sale price support**

- [ ] **Step 5: Create AddToCartButton**

- [ ] **Step 6: Create catalog page with filters, search, pagination**

- [ ] **Step 7: Create product detail page**

- [ ] **Step 8: Commit**

---

### Task 18: Cart + Checkout UI

**Files:**
- Create: `apps/web/components/cart/cart-drawer.tsx`, `apps/web/components/cart/cart-item.tsx`, `apps/web/components/cart/cart-summary.tsx`, `apps/web/components/checkout/razorpay-button.tsx`, `apps/web/app/cart/page.tsx`, `apps/web/app/checkout/page.tsx`

**Interfaces:**
- Consumes: `useCartStore`, Razorpay SDK
- Produces: Cart drawer, cart page, checkout with Razorpay payment

- [ ] **Step 1: Create CartDrawer (slide-out overlay with cart items)**

- [ ] **Step 2: Create CartItem with quantity controls**

- [ ] **Step 3: Create CartSummary**

- [ ] **Step 4: Create RazorpayButton (integrates Razorpay checkout SDK)**

- [ ] **Step 5: Create cart page**

- [ ] **Step 6: Create checkout page**

- [ ] **Step 7: Commit**

---

### Task 19: Account Page (Orders + Downloads)

**Files:**
- Create: `apps/web/components/account/orders-list.tsx`, `apps/web/components/account/order-detail.tsx`, `apps/web/components/account/download-button.tsx`, `apps/web/app/account/page.tsx`, `apps/web/app/account/orders/page.tsx`, `apps/web/app/account/orders/[id]/page.tsx`

**Interfaces:**
- Consumes: Orders API, download API
- Produces: Account dashboard, order history, download flow

- [ ] **Step 1: Create OrdersList component with pagination**

- [ ] **Step 2: Create OrderDetail component with download buttons**

- [ ] **Step 3: Create DownloadButton (calls API, shows progress, handles errors)**

- [ ] **Step 4: Create account dashboard page**

- [ ] **Step 5: Create orders page**

- [ ] **Step 6: Create order detail page**

- [ ] **Step 7: Commit**

---

### Task 20: Admin Panel UI

**Files:**
- Create: `apps/web/components/admin/shell.tsx`, `apps/web/components/admin/sidebar.tsx`, `apps/web/components/admin/product-form.tsx`, `apps/web/components/admin/product-table.tsx`, `apps/web/components/admin/file-upload.tsx`, `apps/web/components/admin/order-table.tsx`, `apps/web/components/admin/category-manager.tsx`, `apps/web/app/admin/layout.tsx`, `apps/web/app/admin/page.tsx`, `apps/web/app/admin/products/page.tsx`, `apps/web/app/admin/products/new/page.tsx`, `apps/web/app/admin/products/[slug]/edit/page.tsx`, `apps/web/app/admin/orders/page.tsx`, `apps/web/app/admin/orders/[id]/page.tsx`, `apps/web/app/admin/categories/page.tsx`

**Interfaces:**
- Consumes: All admin APIs
- Produces: Full admin panel

- [ ] **Step 1: Create AdminShell with sidebar navigation**

- [ ] **Step 2: Create Sidebar with HUD-style navigation**

- [ ] **Step 3: Create ProductForm with title, description, pricing, images**

- [ ] **Step 4: Create FileUpload with drag-drop, progress, zip validation**

- [ ] **Step 5: Create ProductTable**

- [ ] **Step 6: Create OrderTable**

- [ ] **Step 7: Create CategoryManager**

- [ ] **Step 8: Create all admin pages**

- [ ] **Step 9: Commit**

---

### Task 21: Seed Script + Final Setup

**Files:**
- Create: `prisma/seed.ts`, update `apps/web/package.json`

**Interfaces:**
- Produces: Seed data for development

- [ ] **Step 1: Create seed script**

```ts
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin created:", admin.email);

  // Create sample categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "ebooks" },
      update: {},
      create: { name: "E-Books", slug: "ebooks", order: 1 },
    }),
    prisma.category.upsert({
      where: { slug: "templates" },
      update: {},
      create: { name: "Templates", slug: "templates", order: 2 },
    }),
    prisma.category.upsert({
      where: { slug: "software" },
      update: {},
      create: { name: "Software", slug: "software", order: 3 },
    }),
    prisma.category.upsert({
      where: { slug: "fonts" },
      update: {},
      create: { name: "Fonts", slug: "fonts", order: 4 },
    }),
  ]);
  console.log("Categories created:", categories.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Update apps/web/package.json with seed config**

Add to package.json: `"prisma": { "seed": "tsx prisma/seed.ts" }`

- [ ] **Step 3: Run seed**

Run: `cd apps/web && npx prisma db seed`

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: add seed script and final setup"
```

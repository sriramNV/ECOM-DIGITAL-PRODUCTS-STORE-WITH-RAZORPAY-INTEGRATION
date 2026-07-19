# Plan 01: Foundation & Project Setup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use `- [ ]` syntax.

**Goal:** Scaffold the monorepo, Docker infrastructure, Prisma schema, Tailwind tokens, and all base libraries

**Architecture:** pnpm workspace with Turborepo, Next.js 16 App Router app in `apps/web/`, shared package in `packages/shared/`. Docker Compose provides PostgreSQL 16, Redis 7, and MinIO. All design tokens are CSS custom properties in `globals.css` mapped via `@theme inline`.

**Tech Stack:** Next.js 16, TypeScript strict, Tailwind CSS v4, Prisma, PostgreSQL 16, Redis 7, MinIO, shadcn/ui, Pino, Zod, Vitest

---

## Global Constraints

- TypeScript strict mode — no `any`, no type assertions without comment
- App Router only — no Pages Router
- Components are Server Components by default; `"use client"` only for interactivity
- Never use Tailwind built-in color classes (`bg-blue-500`) — use project tokens only
- All colors defined in `globals.css` via `:root` + `@theme inline` — no `tailwind.config.ts`
- Prisma imported only in `lib/repositories/` — never in components or API routes
- Files under 300 lines; services under 50 lines per method
- No comments explaining what — only why
- Approved deps only: next, react, typescript, tailwindcss, prisma, next-auth, zustand, zod, tanstack-query, razorpay, nodemailer, pino, ioredis, bull, lucide-react, recharts, clsx, tailwind-merge, minio, posthog-js, @sentry/nextjs

---

## File Structure

```
pod/
├── apps/web/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with Inter font + globals.css
│   │   ├── page.tsx                # Placeholder landing page
│   │   └── globals.css             # Tailwind v4 + design tokens
│   ├── components/
│   │   └── ui/                     # shadcn/ui primitives
│   ├── lib/
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── redis.ts                # ioredis client
│   │   ├── queue.ts                # Bull job queue setup
│   │   ├── logger.ts               # Pino logger
│   │   ├── utils.ts                # cn(), formatCurrency(), formatDate()
│   │   └── order-number.ts         # Sequential order number generator
│   ├── types/
│   │   └── index.ts                # Base shared types
│   ├── data/
│   │   └── site.ts                 # Site constants
│   └── vitest.config.ts            # Vitest configuration
├── packages/shared/
│   ├── types/
│   │   └── index.ts
│   └── validation/
│       └── index.ts
├── prisma/
│   └── schema.prisma               # Initial User model
├── scripts/
│   └── init-buckets.sh             # MinIO bucket initialization
├── docker-compose.yml              # PostgreSQL, Redis, MinIO
├── Dockerfile                      # Multi-stage production build
├── .env.example
├── vitest.config.ts
├── playwright.config.ts
├── package.json
└── turbo.json
```

---

### Task 1.1: Scaffold Next.js 16 monorepo

**Files:**
- Create: `package.json` (root)
- Create: `turbo.json`
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `.gitignore`
- Create: `.prettierrc`
- Create: `.env.example`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: monorepo scaffold that `pnpm install` can resolve

- [ ] **Step 1: Initialize root package.json**

```json
{
  "name": "pod",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "prettier": "^3.4.0",
    "turbo": "^2.0.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": { "node": ">=20.0.0" }
}
```

- [ ] **Step 2: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] }
  }
}
```

- [ ] **Step 3: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 4: Create apps/web/package.json**

```json
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 5: Create apps/web/tsconfig.json**

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
    "paths": { "@/*": ["./apps/web/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 6: Create apps/web/next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.printify.com" },
      { protocol: "https", hostname: "cdn.printify.com" },
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
```

- [ ] **Step 7: Create .gitignore**

```
node_modules/
.next/
*.local
.env
.env.local
!.env.example
dist/
.turbo/
coverage/
test-results/
```

- [ ] **Step 8: Create .prettierrc**

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100
}
```

- [ ] **Step 9: Create .env.example**

```env
# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://pod:password@localhost:5432/pod

# Redis
REDIS_URL=redis://localhost:6379

# Auth
AUTH_SECRET=generate-a-random-64-char-secret

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Printify
PRINTIFY_API_TOKEN=
PRINTIFY_SHOP_ID=
PRINTIFY_WEBHOOK_SECRET=

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_PUBLIC_URL=localhost:9000

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Logging
LOG_LEVEL=debug
```

- [ ] **Step 10: Create packages/shared/package.json**

```json
{
  "name": "@pod/shared",
  "version": "0.1.0",
  "private": true,
  "main": "./types/index.ts",
  "types": "./types/index.ts"
}
```

- [ ] **Step 11: Create packages/shared/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["**/*.ts"]
}
```

- [ ] **Step 12: Install dependencies and verify**

```bash
pnpm install
pnpm dev
```

Expected: `pnpm dev` starts Next.js dev server on localhost:3000 with empty page.

---

### Task 1.2: Set up Docker infrastructure

**Files:**
- Create: `docker-compose.yml`
- Create: `Dockerfile`
- Create: `scripts/init-buckets.sh`

**Interfaces:**
- Consumes: monorepo scaffold from Task 1.1
- Produces: running PostgreSQL 16, Redis 7, MinIO containers

- [ ] **Step 1: Create docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: pod-postgres
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: pod
      POSTGRES_USER: pod
      POSTGRES_PASSWORD: password
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pod"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: pod-redis
    ports: ["6379:6379"]
    volumes: [redisdata:/data]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  minio:
    image: minio/minio
    container_name: pod-minio
    ports: ["9000:9000", "9001:9001"]
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes: [miniodata:/data]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  pgdata:
  redisdata:
  miniodata:
```

- [ ] **Step 2: Create Dockerfile (multi-stage)**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN corepack enable && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
```

- [ ] **Step 3: Create scripts/init-buckets.sh**

```bash
#!/bin/bash
# MinIO bucket initialization — runs on first app boot
mc alias set podminio http://minio:9000 minioadmin minioadmin
mc mb podminio/pod-assets --ignore-existing
mc policy set public podminio/pod-assets
echo "MinIO buckets initialized"
```

- [ ] **Step 4: Start Docker services**

```bash
docker compose up -d
```

Expected: `docker compose ps` shows postgres, redis, minio all healthy.

---

### Task 1.3: Set up Prisma with initial schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `apps/web/lib/prisma.ts`
- Create: `apps/web/lib/redis.ts`
- Modify: `apps/web/package.json` (add prisma deps)
- Modify: `.env.example` (add DATABASE_URL)

**Interfaces:**
- Consumes: running PostgreSQL from Task 1.2
- Produces: `prisma` client singleton, `redis` client, `PrismaClient` type

- [ ] **Step 1: Install Prisma dependencies**

```bash
pnpm add -D prisma --filter web
pnpm add @prisma/client --filter web
pnpm add ioredis --filter web
pnpm add bull --filter web
```

- [ ] **Step 2: Create prisma/schema.prisma**

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
  PROCESSING
  PRINTING
  SHIPPED
  DELIVERED
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
  email     String   @unique
  name      String?
  password  String?
  role      Role     @default(CUSTOMER)
  image     String?
  phone     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  orders   Order[]
  cart     Cart?
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
  variantId String
  quantity  Int      @default(1)
  createdAt DateTime @default(now())

  cart    Cart           @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product Product        @relation(fields: [productId], references: [id])
  variant ProductVariant @relation(fields: [variantId], references: [id])
}

model Product {
  id               String   @id @default(cuid())
  title            String
  slug             String   @unique
  description      String   @db.Text
  blueprintId      Int?
  printProviderId  Int?
  printifyProductId String?
  basePrice        Decimal  @default(0)
  marginPercent    Decimal  @default(0)
  isActive         Boolean  @default(true)
  isFeatured       Boolean  @default(false)
  categoryId       String?
  tags             String[]
  metadata         Json?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  category    Category?  @relation(fields: [categoryId], references: [id])
  variants    ProductVariant[]
  images      ProductImage[]
  collections CollectionProduct[]
}

model ProductVariant {
  id               String  @id @default(cuid())
  productId        String
  printifyVariantId Int?
  title            String
  size             String?
  color            String?
  colorHex         String?
  price            Decimal
  isEnabled        Boolean @default(true)
  stock            Int     @default(999)

  product  Product      @relation(fields: [productId], references: [id], onDelete: Cascade)
  cartItems CartItem[]
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  url       String
  alt       String?
  position  Int     @default(0)
  isMockup  Boolean @default(false)

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique
  description String?
  image       String?
  parentId    String?
  order       Int       @default(0)
  createdAt   DateTime  @default(now())

  parent   Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category? @relation("CategoryHierarchy")
  products Product[]
}

model Order {
  id              String       @id @default(cuid())
  orderNumber     String       @unique
  userId          String
  status          OrderStatus  @default(PENDING_PAYMENT)
  totalAmount     Decimal
  subtotalAmount  Decimal      @default(0)
  shippingAmount  Decimal      @default(0)
  taxAmount       Decimal      @default(0)
  taxRate         Decimal      @default(18)
  discountAmount  Decimal      @default(0)
  couponId        String?
  currency        String       @default("INR")
  shippingAddress Json?
  shippingMethod  String?
  printifyOrderId String?
  notes           String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  user          User              @relation(fields: [userId], references: [id])
  items         OrderItem[]
  payments      Payment[]
  statusHistory OrderStatusHistory[]
  coupon        Coupon?           @relation(fields: [couponId], references: [id])
}

model OrderItem {
  id         String  @id @default(cuid())
  orderId    String
  productId  String
  variantId  String
  title      String
  variant    String
  quantity   Int
  unitPrice  Decimal
  totalPrice Decimal

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

model Payment {
  id                String        @id @default(cuid())
  orderId           String
  razorpayPaymentId String?
  razorpayOrderId   String?
  razorpaySignature String?
  amount            Decimal
  currency          String        @default("INR")
  status            PaymentStatus @default(PENDING)
  method            String?
  createdAt         DateTime      @default(now())

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

model Coupon {
  id            String    @id @default(cuid())
  code          String    @unique
  type          String
  value         Decimal
  minOrder      Decimal   @default(0)
  maxDiscount   Decimal?
  usageLimit    Int?
  perUserLimit  Int?
  startDate     DateTime
  endDate       DateTime?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())

  orders Order[]
}

model Collection {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  description String?
  image     String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  products CollectionProduct[]
}

model CollectionProduct {
  id           String @id @default(cuid())
  collectionId String
  productId    String
  sortOrder    Int    @default(0)

  collection Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  product    Product    @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model Page {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  content     Json?
  seoTitle    String?
  seoDesc     String?
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Banner {
  id        String   @id @default(cuid())
  title     String
  imageUrl  String
  linkUrl   String?
  position  String   @default("hero")
  order     Int      @default(0)
  startDate DateTime?
  endDate   DateTime?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}

model EmailLog {
  id        String   @id @default(cuid())
  to        String
  subject   String
  type      String
  orderId   String?
  status    String
  error     String?
  createdAt DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String
  entity    String
  entityId  String?
  metadata  Json?
  ip        String?
  createdAt DateTime @default(now())
}
```

- [ ] **Step 3: Create apps/web/lib/prisma.ts**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Create apps/web/lib/redis.ts**

```typescript
import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis };

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
```

- [ ] **Step 5: Create apps/web/lib/queue.ts**

```typescript
import { Queue, Worker } from "bull";
import { redis } from "./redis";

const connection = { host: "localhost", port: 6379 };

export const abandonedCartQueue = new Queue("abandoned-cart", { redis: process.env.REDIS_URL });
export const emailQueue = new Queue("email", { redis: process.env.REDIS_URL });
export const fulfillmentQueue = new Queue("fulfillment", { redis: process.env.REDIS_URL });
```

- [ ] **Step 6: Run initial migration**

```bash
cd apps/web
npx prisma migrate dev --name init
cd ../..
```

Expected: `prisma/migrations/` directory created with initial migration SQL.

---

### Task 1.4: Set up Tailwind v4 with design tokens

**Files:**
- Create: `apps/web/app/globals.css`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/postcss.config.mjs`

**Interfaces:**
- Consumes: nothing
- Produces: themed Next.js 16 app with Inter font, design tokens, placeholder page

- [ ] **Step 1: Create apps/web/postcss.config.mjs**

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 2: Create apps/web/app/globals.css**

```css
@import "tailwindcss";

:root {
  --bg: #ffffff;
  --surface: #f8f9fa;
  --surface-raised: #ffffff;
  --surface-inverse: #1a1a2e;

  --fg: #1a1a2e;
  --fg-muted: #6b7280;
  --fg-faint: #9ca3af;
  --fg-inverse: #ffffff;

  --border: #e5e7eb;
  --border-strong: #d1d5db;

  --accent: #2563eb;
  --accent-fg: #ffffff;
  --accent-hover: #1d4ed8;
  --accent-muted: #dbeafe;

  --success: #059669;
  --success-bg: #ecfdf5;
  --warning: #d97706;
  --warning-bg: #fffbeb;
  --error: #dc2626;
  --error-bg: #fef2f2;
  --info: #0284c7;
  --info-bg: #f0f9ff;

  --overlay: rgba(0, 0, 0, 0.5);

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

@theme inline {
  --font-sans: var(--font-inter), system-ui, sans-serif;

  --color-background: var(--bg);
  --color-surface: var(--surface);
  --color-surface-raised: var(--surface-raised);
  --color-surface-inverse: var(--surface-inverse);

  --color-foreground: var(--fg);
  --color-foreground-muted: var(--fg-muted);
  --color-foreground-faint: var(--fg-faint);
  --color-foreground-inverse: var(--fg-inverse);

  --color-border: var(--border);
  --color-border-strong: var(--border-strong);

  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-fg);
  --color-accent-hover: var(--accent-hover);
  --color-accent-muted: var(--accent-muted);

  --color-success: var(--success);
  --color-success-background: var(--success-bg);
  --color-warning: var(--warning);
  --color-warning-background: var(--warning-bg);
  --color-error: var(--error);
  --color-error-background: var(--error-bg);
  --color-info: var(--info);
  --color-info-background: var(--info-bg);

  --color-overlay: var(--overlay);

  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}

body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-sans);
}
```

- [ ] **Step 3: Create apps/web/app/layout.tsx**

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "POD Store",
  description: "Premium print-on-demand products",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Create apps/web/app/page.tsx**

```typescript
export default function HomePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 lg:py-24">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">POD Store</h1>
      <p className="text-lg md:text-xl text-foreground-muted mt-4">Coming soon.</p>
    </main>
  );
}
```

- [ ] **Step 5: Verify Tailwind is working**

```bash
pnpm dev
```

Open localhost:3000 — page should show "POD Store" heading in Inter font, styled with Tailwind tokens.

---

### Task 1.5: Create base libraries and types

**Files:**
- Create: `apps/web/lib/logger.ts`
- Create: `apps/web/lib/utils.ts`
- Create: `apps/web/lib/order-number.ts`
- Create: `apps/web/types/index.ts`
- Create: `apps/web/data/site.ts`
- Create: `apps/web/app/api/health/route.ts`

**Interfaces:**
- Consumes: `prisma` from Task 1.3, `redis` from Task 1.3
- Produces: utility functions used by all subsequent plans

- [ ] **Step 1: Create apps/web/lib/logger.ts**

```typescript
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "body.password"],
    censor: "[REDACTED]",
  },
});
```

- [ ] **Step 2: Create apps/web/lib/utils.ts**

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "INR"): string {
  const value = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
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

- [ ] **Step 3: Create apps/web/lib/order-number.ts**

```typescript
import { redis } from "./redis";
import { logger } from "./logger";

const COUNTER_KEY = "order:counter";

export async function generateOrderNumber(): Promise<string> {
  try {
    const exists = await redis.exists(COUNTER_KEY);
    if (!exists) {
      await redis.set(COUNTER_KEY, 100000);
    }
    const count = await redis.incr(COUNTER_KEY);
    return `POD-${String(count).padStart(6, "0")}`;
  } catch (error) {
    logger.warn({ error }, "Redis unavailable for order counter, using fallback");
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `POD-${ts}${rand}`;
  }
}
```

- [ ] **Step 4: Create apps/web/types/index.ts**

```typescript
export type Role = "ADMIN" | "CUSTOMER";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "PRINTING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

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

export type Address = {
  name: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
};
```

- [ ] **Step 5: Create apps/web/data/site.ts**

```typescript
export const siteConfig = {
  name: "POD Store",
  description: "Premium print-on-demand products",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  currency: "INR",
  taxRate: 18,
  shipping: {
    freeThreshold: 999,
    standard: 99,
    express: 199,
  },
  email: {
    from: process.env.SMTP_FROM ?? "store@podstore.com",
  },
  social: {
    instagram: "#",
    twitter: "#",
  },
  navbar: {
    links: [
      { label: "Products", href: "/products" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
};
```

- [ ] **Step 6: Create apps/web/app/api/health/route.ts**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

export async function GET() {
  const checks: Record<string, string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  try {
    await redis.ping();
    checks.redis = "ok";
  } catch {
    checks.redis = "error";
  }

  const healthy = Object.values(checks).every((v) => v === "ok");

  if (!healthy) {
    logger.error({ checks }, "Health check failed");
    return NextResponse.json({ status: "unhealthy", checks }, { status: 503 });
  }

  return NextResponse.json({ status: "healthy", checks });
}
```

---

### Task 1.6: Install shadcn/ui primitives

**Files:**
- Create: `apps/web/components.json`
- Create: `apps/web/components/ui/button.tsx`
- Create: `apps/web/components/ui/input.tsx`
- Create: `apps/web/components/ui/badge.tsx`
- Create: `apps/web/components/ui/card.tsx`
- Create: `apps/web/components/ui/skeleton.tsx`
- Create: `apps/web/components/ui/dialog.tsx`
- Create: `apps/web/components/ui/dropdown-menu.tsx`
- Create: `apps/web/components/ui/table.tsx`
- Create: `apps/web/components/ui/toast.tsx`
- Create: `apps/web/hooks/use-toast.ts`
- Install: `class-variance-authority`, `lucide-react`

**Interfaces:**
- Consumes: globals.css from Task 1.4
- Produces: shadcn/ui component primitives available to all subsequent plans

- [ ] **Step 1: Add shadcn/ui dependencies**

```bash
pnpm add class-variance-authority clsx tailwind-merge lucide-react --filter web
```

- [ ] **Step 2: Initialize shadcn/ui**

```bash
cd apps/web
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes
- Tailwind v4: Yes

- [ ] **Step 3: Install component primitives**

```bash
npx shadcn@latest add button input badge card skeleton dialog dropdown-menu table toast
```

Expected: All component files created under `apps/web/components/ui/`.

---

### Task 1.7: Set up Vitest + Playwright test infrastructure

**Files:**
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `apps/web/vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `tests/e2e/example.spec.ts`

**Interfaces:**
- Consumes: nothing
- Produces: working test infrastructure

- [ ] **Step 1: Create root vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules/", "tests/"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./apps/web"),
    },
  },
});
```

- [ ] **Step 2: Create playwright.config.ts**

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 3: Create tests/setup.ts**

```typescript
import { beforeAll, afterAll } from "vitest";

// Global test setup — runs before all tests
beforeAll(() => {
  // Set test environment variables
  process.env.DATABASE_URL = "postgresql://pod:password@localhost:5432/pod_test";
  process.env.REDIS_URL = "redis://localhost:6379";
  process.env.LOG_LEVEL = "silent";
});

afterAll(() => {
  // Cleanup
});
```

- [ ] **Step 4: Create tests/e2e/example.spec.ts**

```typescript
import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("POD Store");
});

test("health check returns ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe("healthy");
});
```

- [ ] **Step 5: Verify tests pass**

```bash
npx vitest run
```

Expected: Tests pass (health check may fail if Docker isn't running — tests will still compile).

---

### Task 1.8: Create packages/shared types and validation

**Files:**
- Create: `packages/shared/types/index.ts`
- Create: `packages/shared/validation/index.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `@pod/shared` package importable by web app

- [ ] **Step 1: Create packages/shared/types/index.ts**

```typescript
export type * from "../../apps/web/types/index";
```

- [ ] **Step 2: Create packages/shared/validation/index.ts**

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

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: scaffold monorepo with Next.js 16, Docker, Prisma, Tailwind v4, shadcn/ui"
```

---

## Spec Coverage Check

| Requirement | Task |
|-------------|------|
| Next.js 16 App Router with TypeScript strict | 1.1 |
| pnpm workspace + Turborepo | 1.1 |
| Docker Compose (PostgreSQL, Redis, MinIO) | 1.2 |
| Prisma with full schema | 1.3 |
| Tailwind v4 design tokens via `@theme inline` | 1.4 |
| Base libs: prisma, redis, queue, logger, utils | 1.5 |
| shadcn/ui component primitives | 1.6 |
| Vitest + Playwright test infrastructure | 1.7 |
| Shared types/validation package | 1.8 |

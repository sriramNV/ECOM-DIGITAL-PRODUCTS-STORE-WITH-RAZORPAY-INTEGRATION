# Task 3: Docker Compose + Prisma Schema + Infrastructure

## Context
Tasks 1-2 set up the workspace and Next.js app. Now we need database schema and infrastructure.

## Requirements

### Create `docker-compose.yml` at root
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

### Create `Dockerfile` at root
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

### Create `.dockerignore` at root
```
.git
node_modules
.next
*.md
.env
.env.local
```

### Create `prisma/schema.prisma`
Full schema with all models:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role { ADMIN CUSTOMER }
enum OrderStatus { PENDING_PAYMENT PAID COMPLETED CANCELLED REFUNDED }
enum PaymentStatus { PENDING COMPLETED FAILED REFUNDED }

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
  category    Category?        @relation(fields: [categoryId], references: [id])
  images      ProductImage[]
  cartItems   CartItem[]
  orderItems  OrderItem[]
  downloads   Download[]
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
  id             String      @id @default(cuid())
  orderNumber    String      @unique
  userId         String
  status         OrderStatus @default(PENDING_PAYMENT)
  totalAmount    Decimal
  subtotalAmount Decimal     @default(0)
  discountAmount Decimal     @default(0)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  user          User                  @relation(fields: [userId], references: [id])
  items         OrderItem[]
  payments      Payment[]
  statusHistory OrderStatusHistory[]
}

model OrderItem {
  id         String   @id @default(cuid())
  orderId    String
  productId  String
  title      String
  quantity   Int
  unitPrice  Decimal
  totalPrice Decimal
  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])
}

model Payment {
  id                String        @id @default(cuid())
  orderId           String
  razorpayPaymentId  String?
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

### Steps
1. Create docker-compose.yml
2. Create Dockerfile
3. Create .dockerignore
4. Create prisma/schema.prisma
5. Run `docker compose up -d postgres minio redis`
6. In the apps/web directory, run `npx prisma migrate dev --name init`
7. Create MinIO bucket using PowerShell:
```powershell
docker exec pod-postgres-1 mc alias set local http://localhost:9000 minioadmin minioadmin
# Actually use the minio container name - check `docker ps` first. Usually pod-minio-1
docker exec <minio-container> mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec <minio-container> mc mb local/digital-products
```
8. Commit with message: `"feat: add Docker Compose, Prisma schema, and MinIO setup"`

## Working Directory
D:\Projects\web\pod

## Platform
Windows PowerShell. The `docker compose` commands should work if Docker Desktop is running.

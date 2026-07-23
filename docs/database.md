# Database Schema Reference

## Overview

| Property | Value |
|----------|-------|
| Database | PostgreSQL 16 |
| ORM | Prisma 6 (prisma-client-js) |
| ID Strategy | CUID (cuid()) |
| Monetary type | Decimal (PostgreSQL numeric) |
| Soft-delete | `isActive` on Product |
| Total models | 11 |

**Enums:** `Role`, `OrderStatus`, `PaymentStatus`

## Entity-Relationship

```
User ──1:1── Cart ──1:N── CartItem ──N:1── Product
  │                                            │
  │──1:N── Order ──1:N── OrderItem ────────────┘
  │              │──1:N── Payment
  │              │──1:N── OrderStatusHistory
  │              └──1:N── Download
  │
  │──1:N── Account (NextAuth)
  └──1:N── Session (NextAuth)

Product ──N:1── Category
Product ──1:N── ProductImage
Product ──1:N── Download
Product ──1:N── OrderItem
```

## Models

### User & Auth

#### User
| Field | Type | Notes |
|-------|------|-------|
| id | String @id @default(cuid()) | |
| name | String? | Display name |
| email | String @unique | Login identifier |
| password | String? | bcrypt hash (null for OAuth) |
| role | Role @default(CUSTOMER) | ADMIN or CUSTOMER |
| image | String? | Avatar URL |
| createdAt | DateTime @default(now()) | |
| updatedAt | DateTime @updatedAt | |

Relations: cart (Cart?), orders (Order[]), accounts (Account[]), sessions (Session[]), downloads (Download[])

#### Account (NextAuth)
Standard NextAuth Account model with OAuth provider fields. `@@unique([provider, providerAccountId])`.

#### Session (NextAuth)
Standard NextAuth Session model. `sessionToken @unique`.

#### VerificationToken (NextAuth)
Standard NextAuth verification token. `@@unique([identifier, token])`.

### Cart

#### Cart
| Field | Type | Notes |
|-------|------|-------|
| id | String @id @default(cuid()) | |
| userId | String @unique | One cart per user |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Cascade delete with User.

#### CartItem
| Field | Type | Notes |
|-------|------|-------|
| id | String @id @default(cuid()) | |
| cartId | String → Cart | |
| productId | String → Product | |
| quantity | Int @default(1) | |
| createdAt | DateTime | |

Cascade delete with Cart.

### Products

#### Product
| Field | Type | Notes |
|-------|------|-------|
| id | String @id @default(cuid()) | |
| title | String | Product name |
| slug | String @unique | URL-friendly identifier |
| description | String @db.Text | Markdown supported |
| price | Decimal | Selling price |
| salePrice | Decimal? | Discounted price (null = no sale) |
| isActive | Boolean @default(true) | Soft-delete / hide |
| isFeatured | Boolean @default(false) | Featured flag |
| categoryId | String? → Category | |
| tags | String[] | PostgreSQL text array |
| fileKey | String? | MinIO/S3 object key |
| fileName | String? | Original filename |
| fileSize | Int? | File size in bytes |
| fileVersion | Int @default(1) | Incremented on file update |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### ProductImage
| Field | Type | Notes |
|-------|------|-------|
| id | String @id @default(cuid()) | |
| productId | String → Product | |
| url | String | Image URL |
| alt | String? | Alt text |
| position | Int @default(0) | Sort order |

Cascade delete with Product.

#### Category
| Field | Type | Notes |
|-------|------|-------|
| id | String @id @default(cuid()) | |
| name | String @unique | Category name |
| slug | String @unique | URL slug |
| description | String? | |
| image | String? | Category image |
| parentId | String? → Category | Self-referencing hierarchy |
| order | Int @default(0) | Sort order |
| createdAt | DateTime | |

### Orders

#### Order
| Field | Type | Notes |
|-------|------|-------|
| id | String @id @default(cuid()) | |
| orderNumber | String @unique | Human-readable (timestamp-based) |
| userId | String → User | |
| status | OrderStatus @default(PENDING_PAYMENT) | Current state |
| totalAmount | Decimal | Final total |
| subtotalAmount | Decimal @default(0) | Pre-discount total |
| discountAmount | Decimal @default(0) | Discount applied |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### OrderItem
| Field | Type | Notes |
|-------|------|-------|
| id | String @id @default(cuid()) | |
| orderId | String → Order | |
| productId | String → Product | Snapshot reference |
| title | String | Product title at order time |
| quantity | Int | |
| unitPrice | Decimal | Price per unit |
| totalPrice | Decimal | Line total |

Cascade delete with Order.

#### Payment
| Field | Type | Notes |
|-------|------|-------|
| id | String @id @default(cuid()) | |
| orderId | String → Order | |
| razorpayPaymentId | String? | Legacy Razorpay field |
| razorpayOrderId | String? | Legacy Razorpay field |
| razorpaySignature | String? | Legacy Razorpay field |
| amount | Decimal | Transaction amount |
| currency | String @default("INR") | |
| status | PaymentStatus @default(PENDING) | |
| method | String? | Payment method |
| createdAt | DateTime | |

#### OrderStatusHistory
| Field | Type | Notes |
|-------|------|-------|
| id | String @id @default(cuid()) | |
| orderId | String → Order | |
| status | OrderStatus | Snapshot of status |
| note | String? | Admin note |
| createdAt | DateTime | |

#### Download
| Field | Type | Notes |
|-------|------|-------|
| id | String @id @default(cuid()) | |
| userId | String → User | |
| productId | String → Product | |
| orderId | String → Order | |
| fileVersion | Int | Version at time of download |
| ip | String? | Request IP |
| createdAt | DateTime | |

## Enums

### Role
`ADMIN`, `CUSTOMER`

### OrderStatus
`PENDING_PAYMENT` → `PAID` → `COMPLETED`
`PENDING_PAYMENT` → `CANCELLED`
`PAID` → `REFUNDED`

### PaymentStatus
`PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`

## Key Design Decisions

### Decimal for Monetary Fields
All money values use Prisma's `Decimal` type (PostgreSQL `numeric`). Avoids floating-point rounding errors.

### CUID for IDs
Provides uniqueness across distributed systems with no sequential ID leakage. Sortable by creation time (CUIDs embed timestamps).

### JSON Fields Not Used
Unlike print-on-demand variants, this digital products schema has no JSON fields — all data is relational.

### File Versioning
`Product.fileVersion` increments on each file upload. The `Download` record captures the version at download time, so users always get the file that existed when they purchased.

### Order Status State Machine
```
PENDING_PAYMENT → PAID → COMPLETED
     │              │
     └── CANCELLED  └── REFUNDED
```

Each transition is recorded in `OrderStatusHistory` for an immutable audit trail.

## Common Queries

### List Active Products
```ts
const products = await prisma.product.findMany({
  where: { isActive: true },
  include: { images: { orderBy: { position: "asc" } }, category: true },
  orderBy: { createdAt: "desc" },
});
```

### Get User Orders with Download Status
```ts
const orders = await prisma.order.findMany({
  where: { userId },
  include: {
    items: { include: { product: { select: { fileKey: true } } } },
    statusHistory: { orderBy: { createdAt: "desc" } },
  },
  orderBy: { createdAt: "desc" },
});
```

### Create Download Record
```ts
await prisma.download.create({
  data: { userId, productId, orderId, fileVersion: product.fileVersion },
});
```

## Migrations

```bash
# Development (create + apply)
npx prisma migrate dev --name <name>

# Production (apply pending)
npx prisma migrate deploy

# Regenerate client
npx prisma generate

# Seed data
npx prisma db seed

# View in browser
npx prisma studio
```

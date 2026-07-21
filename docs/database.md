# POD E-Commerce — Database Schema Reference

## 1. Overview

| Property | Value |
|----------|-------|
| Database | PostgreSQL |
| ORM | Prisma (prisma-client-js) |
| ID Strategy | CUID (cuid()) |
| Monetary type | Decimal |
| JSON fields | shippingAddress, metadata, content |
| Soft-delete | isActive/isEnabled/isPublished/isPublished booleans |
| Total models | 18 |

**Enums:** `Role`, `OrderStatus`, `PaymentStatus`

---

## 2. Entity-Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              ┌──────────┐                               │
│                  ┌──────────→│  Page    │    (standalone CMS pages)      │
│                  │           └──────────┘                               │
│                  │                                                       │
│                  │           ┌──────────┐                               │
│                  │           │  Banner  │    (standalone hero banners)   │
│                  │           └──────────┘                               │
│                  │                                                       │
│  ┌───────────┐   │           ┌──────────┐      ┌──────────────────┐    │
│  │   User    │───│──1──────→│  Order   │──*──→│   OrderItem      │    │
│  │           │   │           │          │       │                  │    │
│  │ 1──1 Cart │   │           │ *──1 Coupon│     │ → Product        │    │
│  └─────┬─────┘   │           │ *──* Payment│    │ → ProductVariant │    │
│        │         │           │ *──* StatusHistory│                  │    │
│        │         │           └──────────┘      └──────────────────┘    │
│        │         │                                                       │
│        │         │  ┌───────────────────────┐                            │
│        │         │  │       Product          │                           │
│        │         │  │                        │                           │
│        │         │  │ *──1 Category          │                           │
│        │         │  │ 1──* ProductVariant    │                           │
│        │         │  │ 1──* ProductImage      │                           │
│        │         │  │ *──* Collection (via    │                          │
│        │         │  │     CollectionProduct)  │                          │
│        └─────────└──│ 1──* CartItem          │                           │
│                     └──────────┬─────────────┘                           │
│                                │                                         │
│  ┌──────────────┐              │                                         │
│  │ Collection   │*──────────*──┘                                         │
│  │ (CollectionProduct)                                                  │
│  └──────────────┘                                                        │
│                                                                          │
│  Other: Account, Session, VerificationToken ←─ NextAuth                   │
│         EmailLog, AuditLog (logging/audit)                               │
└──────────────────────────────────────────────────────────────────────────┘
```

### Key Relationships

| From | To | Type | Via |
|------|----|------|-----|
| User | Order | 1 → * | userId |
| User | Cart | 1 → 1 | userId |
| Cart | CartItem | 1 → * | cartId |
| CartItem | Product | * → 1 | productId |
| CartItem | ProductVariant | * → 1 | variantId |
| Product | ProductVariant | 1 → * | productId |
| Product | ProductImage | 1 → * | productId |
| Product | Category | * → 1 | categoryId |
| Product | Collection | * → * | CollectionProduct |
| Order | OrderItem | 1 → * | orderId |
| Order | Payment | 1 → * | orderId |
| Order | OrderStatusHistory | 1 → * | orderId |
| Order | Coupon | * → 1 | couponId |
| Collection | Product | * → * | CollectionProduct |
| Category | Category | 1 → * | parentId (self-referential) |

---

## 3. Model Reference

### 3.1 Enums

#### Role

| Value | Description |
|-------|-------------|
| ADMIN | Full administrative access |
| CUSTOMER | Regular customer |

#### OrderStatus

| Value | Description |
|-------|-------------|
| PENDING_PAYMENT | Awaiting payment confirmation |
| PAID | Payment received |
| PROCESSING | Being prepared for production |
| PRINTING | Sent to print provider |
| SHIPPED | Dispatched to customer |
| DELIVERED | Confirmed delivered |
| CANCELLED | Order cancelled |
| REFUNDED | Payment refunded |

#### PaymentStatus

| Value | Description |
|-------|-------------|
| PENDING | Awaiting completion |
| COMPLETED | Payment successful |
| FAILED | Payment failed |
| REFUNDED | Payment returned |

---

### 3.2 User & Auth (NextAuth)

#### User

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | Primary key |
| email | String | @unique | User email address |
| name | String? | | Display name |
| password | String? | | Hashed password (null for OAuth users) |
| role | Role | @default(CUSTOMER) | ADMIN or CUSTOMER |
| image | String? | | Avatar URL |
| phone | String? | | Contact number |
| createdAt | DateTime | @default(now()) | |
| updatedAt | DateTime | @updatedAt | |

**Relations:** orders (Order[]), cart (Cart?), accounts (Account[]), sessions (Session[])

#### Account

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| userId | String | | FK → User |
| type | String | | OAuth account type |
| provider | String | | OAuth provider name |
| providerAccountId | String | | Provider-side user ID |
| refresh_token | String? | @db.Text | |
| access_token | String? | @db.Text | |
| expires_at | Int? | | Token expiry timestamp |
| token_type | String? | | |
| scope | String? | | |
| id_token | String? | @db.Text | |
| session_state | String? | | |

**Unique:** @@unique([provider, providerAccountId])
**Relation:** user (User, onDelete: Cascade)

#### Session

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| sessionToken | String | @unique | Session token |
| userId | String | | FK → User |
| expires | DateTime | | Session expiry |

**Relation:** user (User, onDelete: Cascade)

#### VerificationToken

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| identifier | String | | Email or identifier |
| token | String | @unique | Verification token |
| expires | DateTime | | Expiry time |

**Unique:** @@unique([identifier, token])

---

### 3.3 Cart

#### Cart

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| userId | String | @unique | FK → User (one cart per user) |
| createdAt | DateTime | @default(now()) | |
| updatedAt | DateTime | @updatedAt | |

**Relation:** user (User, onDelete: Cascade), items (CartItem[])

#### CartItem

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| cartId | String | | FK → Cart |
| productId | String | | FK → Product |
| variantId | String | | FK → ProductVariant |
| quantity | Int | @default(1) | Quantity selected |
| createdAt | DateTime | @default(now()) | |

**Relations:** cart (Cart, onDelete: Cascade), product (Product), variant (ProductVariant)

---

### 3.4 Product Catalog

#### Product

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| title | String | | Product name |
| slug | String | @unique | URL-friendly identifier |
| description | String | @db.Text | Full description |
| blueprintId | Int? | | Printify blueprint ID |
| printProviderId | Int? | | Printify provider ID |
| printifyProductId | String? | | Printify product ID |
| basePrice | Decimal | @default(0) | Base cost before margin |
| marginPercent | Decimal | @default(0) | Markup percentage |
| isActive | Boolean | @default(true) | Soft-delete / hide flag |
| isFeatured | Boolean | @default(false) | Featured product flag |
| categoryId | String? | | FK → Category |
| tags | String[] | | PostgreSQL text array |
| metadata | Json? | | Arbitrary metadata |
| createdAt | DateTime | @default(now()) | |
| updatedAt | DateTime | @updatedAt | |

**Relations:** category (Category?), variants (ProductVariant[]), images (ProductImage[]), collections (CollectionProduct[]), cartItems (CartItem[])

#### ProductVariant

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| productId | String | | FK → Product |
| printifyVariantId | Int? | | Printify variant ID |
| title | String | | Variant display name (e.g. "Small / Black") |
| size | String? | | Size option |
| color | String? | | Color name |
| colorHex | String? | | Color hex code |
| price | Decimal | | Selling price |
| isEnabled | Boolean | @default(true) | Soft-delete / hide flag |
| stock | Int | @default(999) | Inventory count |

**Relations:** product (Product, onDelete: Cascade), cartItems (CartItem[])

#### ProductImage

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| productId | String | | FK → Product |
| url | String | | Image URL |
| alt | String? | | Alt text |
| position | Int | @default(0) | Sort order |
| isMockup | Boolean | @default(false) | Mockup vs design image |

**Relation:** product (Product, onDelete: Cascade)

#### Category

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| name | String | @unique | Category name |
| slug | String | @unique | URL slug |
| description | String? | | |
| image | String? | | Category image URL |
| parentId | String? | | Self-referencing FK → Category |
| order | Int | @default(0) | Sort order |
| createdAt | DateTime | @default(now()) | |

**Relations:** parent (Category? "CategoryHierarchy"), children (Category[] "CategoryHierarchy"), products (Product[])

#### Collection

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| name | String | | Collection name |
| slug | String | @unique | URL slug |
| description | String? | | |
| image | String? | | Collection image |
| isActive | Boolean | @default(true) | Soft-delete flag |
| createdAt | DateTime | @default(now()) | |

**Relation:** products (CollectionProduct[])

#### CollectionProduct

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| collectionId | String | | FK → Collection |
| productId | String | | FK → Product |
| sortOrder | Int | @default(0) | Position in collection |

**Relations:** collection (Collection, onDelete: Cascade), product (Product, onDelete: Cascade)

---

### 3.5 Ordering

#### Order

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| orderNumber | String | @unique | Human-readable order number |
| userId | String | | FK → User |
| status | OrderStatus | @default(PENDING_PAYMENT) | Current status |
| totalAmount | Decimal | | Final total |
| subtotalAmount | Decimal | @default(0) | Pre-tax/shipping total |
| shippingAmount | Decimal | @default(0) | Shipping cost |
| taxAmount | Decimal | @default(0) | Tax amount |
| taxRate | Decimal | @default(18) | Tax percentage |
| discountAmount | Decimal | @default(0) | Discount applied |
| couponId | String? | | FK → Coupon |
| currency | String | @default("INR") | Currency code |
| shippingAddress | Json? | | Address object |
| shippingMethod | String? | | Shipping method name |
| printifyOrderId | String? | | Printify order reference |
| notes | String? | | Order notes |
| createdAt | DateTime | @default(now()) | |
| updatedAt | DateTime | @updatedAt | |

**Relations:** user (User), items (OrderItem[]), payments (Payment[]), statusHistory (OrderStatusHistory[]), coupon (Coupon?)

#### OrderItem

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| orderId | String | | FK → Order |
| productId | String | | FK → Product (snapshot) |
| variantId | String | | FK → ProductVariant (snapshot) |
| title | String | | Product title at time of order |
| variant | String | | Variant label at time of order |
| quantity | Int | | Quantity ordered |
| unitPrice | Decimal | | Price per unit |
| totalPrice | Decimal | | Line total |

**Relation:** order (Order, onDelete: Cascade)

#### Payment

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| orderId | String | | FK → Order |
| razorpayPaymentId | String? | | Razorpay payment ID |
| razorpayOrderId | String? | | Razorpay order ID |
| razorpaySignature | String? | | Payment signature |
| amount | Decimal | | Transaction amount |
| currency | String | @default("INR") | |
| status | PaymentStatus | @default(PENDING) | |
| method | String? | | Payment method (card, UPI, etc.) |
| createdAt | DateTime | @default(now()) | |

**Relation:** order (Order)

#### OrderStatusHistory

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| orderId | String | | FK → Order |
| status | OrderStatus | | Status at this point |
| note | String? | | Admin note |
| createdAt | DateTime | @default(now()) | |

**Relation:** order (Order)

---

### 3.6 Coupon

#### Coupon

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| code | String | @unique | Coupon code |
| type | String | | discount type (percentage/flat) |
| value | Decimal | | Discount value |
| minOrder | Decimal | @default(0) | Minimum order amount |
| maxDiscount | Decimal? | | Maximum discount cap |
| usageLimit | Int? | | Global usage limit |
| perUserLimit | Int? | | Per-user usage limit |
| startDate | DateTime | | Promotion start |
| endDate | DateTime? | | Promotion end |
| isActive | Boolean | @default(true) | Soft-delete / enable flag |
| createdAt | DateTime | @default(now()) | |

**Relation:** orders (Order[])

---

### 3.7 Content

#### Page

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| title | String | | Page title |
| slug | String | @unique | URL slug |
| content | Json? | | Page content as structured JSON |
| seoTitle | String? | | Meta title |
| seoDesc | String? | | Meta description |
| isPublished | Boolean | @default(false) | Publish state |
| createdAt | DateTime | @default(now()) | |
| updatedAt | DateTime | @updatedAt | |

#### Banner

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| title | String | | Banner title |
| imageUrl | String | | Banner image |
| linkUrl | String? | | Click-through URL |
| position | String | @default("hero") | Placement (hero, sidebar, etc.) |
| order | Int | @default(0) | Sort order |
| startDate | DateTime? | | Scheduled start |
| endDate | DateTime? | | Scheduled end |
| isActive | Boolean | @default(true) | Enable flag |
| createdAt | DateTime | @default(now()) | |

---

### 3.8 Logging

#### EmailLog

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| to | String | | Recipient email |
| subject | String | | Email subject |
| type | String | | Email type (order_confirmation, etc.) |
| orderId | String? | | Related order |
| status | String | | sent / failed |
| error | String? | | Error message if failed |
| createdAt | DateTime | @default(now()) | |

#### AuditLog

| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | String | @id @default(cuid()) | |
| userId | String? | | Actor user ID |
| action | String | | Action performed |
| entity | String | | Affected entity type |
| entityId | String? | | Affected entity ID |
| metadata | Json? | | Additional context |
| ip | String? | | Request IP address |
| createdAt | DateTime | @default(now()) | |

---

## 4. Key Design Decisions

### 4.1 JSON Fields Instead of Separate Tables

`shippingAddress`, `metadata`, and `content` are stored as `Json` columns rather than normalized tables. This is intentional:

- **shippingAddress** on Order: addresses are immutable snapshots tied to a single order; normalizing offers no query benefit
- **metadata** on Product and AuditLog: fully dynamic schemas that vary across products/events
- **content** on Page: page content is always loaded as a unit; relational decomposition adds complexity without benefit

### 4.2 Decimal for Monetary Fields

All money values (`basePrice`, `price`, `totalAmount`, `subtotalAmount`, `shippingAmount`, `taxAmount`, `discountAmount`, `unitPrice`, `totalPrice`, `value`, `minOrder`, `maxDiscount`) use Prisma's `Decimal` type, mapped to PostgreSQL `numeric`. This avoids floating-point rounding errors.

### 4.3 CUID for IDs

All models use `cuid()` as the ID strategy. This provides:
- Uniqueness across distributed systems
- No sequential ID leakage (order count guessing)
- Sortable by creation time (CUIDs embed timestamps)

### 4.4 Soft-Delete Pattern

Models that support hide/disable without data loss:

| Model | Field |
|-------|-------|
| Product | `isActive` |
| ProductVariant | `isEnabled` |
| Coupon | `isActive` |
| Collection | `isActive` |
| Page | `isPublished` |
| Banner | `isActive` |

All queries must filter on these flags unless admin override is intended.

### 4.5 Order Status State Machine

```
PENDING_PAYMENT → PAID → PROCESSING → PRINTING → SHIPPED → DELIVERED
     │              │
     └── CANCELLED  └── REFUNDED
```

Each transition is recorded in `OrderStatusHistory` for an immutable audit trail.

### 4.6 Price Model

```
finalPrice = basePrice × (1 + marginPercent / 100)
```

`basePrice` is the raw cost from the print provider. `marginPercent` is the markup applied by the store. The `price` on `ProductVariant` can override this formula for specific variant-level pricing.

### 4.7 Printify Integration

Fields prefixed with `printify` / `blueprint` / `printProvider` store external Printify API references:
- `Product.blueprintId` — Printify blueprint (product type)
- `Product.printProviderId` — Printify provider
- `Product.printifyProductId` — Printify product sync ID
- `ProductVariant.printifyVariantId` — Printify variant sync ID
- `Order.printifyOrderId` — Printify order reference

---

## 5. Migration Workflow

### 5.1 Create Migration

```bash
npx prisma migrate dev --name <migration_name>
```

This creates a new migration file in `prisma/migrations/`, applies it to the database, and regenerates the client.

### 5.2 Apply Migrations (Production)

```bash
npx prisma migrate deploy
```

Applies all pending migrations without confirmation.

### 5.3 Regenerate Client Only

```bash
npx prisma generate
```

Useful after pulling changes that include schema updates (the client auto-regenerates on `migrate dev`, but not on `migrate deploy`).

### 5.4 Reset Database

```bash
npx prisma migrate reset
```

Drops the database, recreates it, applies all migrations, and runs seed.

### 5.5 Seed Data

```bash
npx prisma db seed
```

Executes the script defined in `package.json` under `"prisma": { "seed" }`.

### 5.6 View Database in Browser

```bash
npx prisma studio
```

---

## 6. Common Queries

### 6.1 List Active Products with Variants and Images

```ts
const products = await prisma.product.findMany({
  where: { isActive: true },
  include: {
    variants: { where: { isEnabled: true } },
    images: { orderBy: { position: 'asc' } },
    category: true,
  },
  orderBy: { createdAt: 'desc' },
});
```

### 6.2 Get Product by Slug with Full Relations

```ts
const product = await prisma.product.findUnique({
  where: { slug },
  include: {
    variants: { where: { isEnabled: true } },
    images: { orderBy: { position: 'asc' } },
    category: true,
    collections: { include: { collection: true } },
  },
});
```

### 6.3 Create Cart with Item

```ts
const cart = await prisma.cart.upsert({
  where: { userId },
  update: {},
  create: { userId },
});

await prisma.cartItem.create({
  data: {
    cartId: cart.id,
    productId,
    variantId,
    quantity,
  },
});
```

### 6.4 Get Cart with Items for Current User

```ts
const cart = await prisma.cart.findUnique({
  where: { userId },
  include: {
    items: {
      include: {
        product: { include: { images: { where: { position: 0 } } } },
        variant: true,
      },
    },
  },
});
```

### 6.5 Create Order with Items (Transaction)

```ts
const order = await prisma.$transaction(async (tx) => {
  const cart = await tx.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true, variant: true } } },
  });

  const order = await tx.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId,
      totalAmount,
      subtotalAmount,
      shippingAmount,
      taxAmount,
      shippingAddress,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          title: item.product.title,
          variant: item.variant.title,
          quantity: item.quantity,
          unitPrice: item.variant.price,
          totalPrice: item.variant.price * item.quantity,
        })),
      },
      statusHistory: {
        create: { status: 'PENDING_PAYMENT' },
      },
    },
  });

  await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

  return order;
});
```

### 6.6 Get Orders for User

```ts
const orders = await prisma.order.findMany({
  where: { userId },
  include: {
    items: true,
    payments: true,
    statusHistory: { orderBy: { createdAt: 'desc' } },
  },
  orderBy: { createdAt: 'desc' },
});
```

### 6.7 Update Order Status (with History)

```ts
const order = await prisma.order.update({
  where: { id: orderId },
  data: {
    status: newStatus,
    statusHistory: {
      create: { status: newStatus, note },
    },
  },
  include: { statusHistory: true },
});
```

### 6.8 Validate and Apply Coupon

```ts
const coupon = await prisma.coupon.findUnique({
  where: { code },
});

if (
  !coupon ||
  !coupon.isActive ||
  coupon.startDate > new Date() ||
  (coupon.endDate && coupon.endDate < new Date()) ||
  (coupon.usageLimit && coupon.usageLimit <= coupon.orders.length)
) {
  throw new Error('Invalid or expired coupon');
}
```

### 6.9 Products in a Collection by Slug

```ts
const collection = await prisma.collection.findUnique({
  where: { slug },
  include: {
    products: {
      orderBy: { sortOrder: 'asc' },
      include: {
        product: {
          include: {
            variants: { where: { isEnabled: true } },
            images: { orderBy: { position: 'asc' }, take: 1 },
          },
        },
      },
    },
  },
});
```

### 6.10 Featured Products

```ts
const featured = await prisma.product.findMany({
  where: { isActive: true, isFeatured: true },
  include: {
    variants: { where: { isEnabled: true } },
    images: { orderBy: { position: 'asc' }, take: 1 },
  },
  take: 8,
});
```

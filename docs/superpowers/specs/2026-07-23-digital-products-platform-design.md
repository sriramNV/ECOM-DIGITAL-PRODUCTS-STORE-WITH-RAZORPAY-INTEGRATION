# Digital Products Platform — System Design

**Date:** 2026-07-23
**Status:** Draft

## 1. Overview

A self-hosted digital products e-commerce platform where users create accounts, browse a product catalog, purchase digital goods (delivered as zip files) via Razorpay, and re-download their purchases from their account page. Built as a modular monolith — clean service boundaries within a single Next.js application, structured for future extraction into independent microservices.

### Core Requirements

- Digital products only (ebooks, software, templates, fonts, etc. — delivered as zip)
- User accounts mandatory for purchase (bought items stored in account for re-download)
- Razorpay payment integration
- Admin panel for product management (upload zips, create product pages)
- Modern UI: Cyberpunk 2077 + Mass Effect aesthetic
- Scroll animations, fade in/out, motion effects throughout
- Self-hosted infrastructure (no AWS/GCP)
- Each service independently hostable without affecting others

---

## 2. Architecture

### 2.1 Modular Monolith

```
pod/
├── apps/web/                   # Next.js application (frontend + API)
│   ├── app/
│   │   ├── (storefront)/       # Public pages
│   │   ├── (auth)/             # Login/register
│   │   ├── account/            # User dashboard + orders
│   │   ├── admin/              # Admin panel
│   │   ├── cart/               # Cart page
│   │   ├── checkout/           # Checkout page
│   │   └── api/                # API routes (thin routing layer)
│   ├── components/
│   │   ├── ui/                 # Base primitives (shadcn-style, themed)
│   │   ├── layout/             # Navbar, Footer, MobileMenu
│   │   ├── landing/            # Homepage sections
│   │   ├── products/           # ProductCard, ProductGrid, etc.
│   │   ├── cart/               # CartDrawer, CartItem, CartSummary
│   │   ├── checkout/           # CheckoutForm, RazorpayButton
│   │   ├── account/            # OrdersList, OrderDetail, DownloadButton
│   │   └── admin/              # AdminShell, Sidebar, ProductForm, etc.
│   ├── lib/
│   │   ├── services/           # Business logic (service modules)
│   │   │   ├── auth/           # Can extract → standalone auth service
│   │   │   ├── products/       # Can extract → standalone catalog service
│   │   │   ├── orders/         # Can extract → standalone order service
│   │   │   ├── payments/       # Can extract → standalone payment service
│   │   │   └── files/          # Can extract → standalone file service
│   │   ├── db/                 # Prisma client
│   │   ├── storage/            # MinIO client
│   │   └── queue/              # Bull/Redis queue
│   ├── stores/                 # Zustand (cart, UI state)
│   └── styles/                 # Global CSS, theme tokens
├── prisma/
│   └── schema.prisma           # Database schema
├── packages/
│   └── shared/                 # Types, validation schemas, utilities
├── infra/                      # Docker configs, scripts
├── docker-compose.yml          # PostgreSQL + MinIO + Redis + app
├── Dockerfile                  # Next.js production build
└── package.json
```

### 2.2 Service Boundaries

| Service | Directory | Responsibility | Extractable |
|---------|-----------|----------------|-------------|
| Auth | `lib/services/auth/` | Register, login, sessions, NextAuth config, user CRUD | Yes |
| Products | `lib/services/products/` | Product CRUD, catalog listing, categories, search | Yes |
| Orders | `lib/services/orders/` | Order creation, status management, history, download audit | Yes |
| Payments | `lib/services/payments/` | Razorpay order creation, payment verification, webhook handling | Yes |
| Files | `lib/services/files/` | MinIO upload/download, signed URL generation, file validation | Yes |

Each service exports a clean interface (functions, not HTTP routes). API routes in `app/api/` call these services directly. If a service is extracted later, the API route swaps the in-process function call for an HTTP client call to the new service URL — no other code changes.

### 2.3 Data Flow

#### Purchase Flow
```
Browse → Add to cart → Checkout → Create Razorpay order → Pay (Razorpay SDK)
→ Verify signature (server) → Create Order in DB → Clear cart → Email confirmation
→ Items appear in /account/orders
```

#### Download Flow
```
User clicks Download → Server verifies ownership → Server checks rate limit (3/hr)
→ Generate MinIO signed URL (15 min expiry) → Log download in Download table
→ Redirect to signed URL → Browser downloads zip directly from MinIO
```

### 2.4 Resource Profile

- **Single VPS deployment:** ~400MB RAM total (Next.js + Postgres + MinIO + Redis)
- **Multi-host split:** Move Postgres and/or MinIO to separate VPSs — just change connection strings

---

## 3. Database Schema

### 3.1 Enums

```prisma
enum Role { ADMIN, CUSTOMER }
enum OrderStatus { PENDING_PAYMENT, PAID, COMPLETED, CANCELLED, REFUNDED }
enum PaymentStatus { PENDING, COMPLETED, FAILED, REFUNDED }
```

### 3.2 Models

#### User
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| name | String | |
| email | String @unique | |
| password | String? | bcrypt hash (null for OAuth users) |
| role | Role @default(CUSTOMER) | |
| image | String? | Avatar URL |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Relations:** orders, cart, accounts, sessions (NextAuth)

#### Session, Account, VerificationToken
Standard NextAuth v5 models for JWT + Google OAuth support.

#### Cart
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| userId | String @unique | FK → User |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Relations:** items (CartItem[])

#### CartItem
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| cartId | String | FK → Cart |
| productId | String | FK → Product |
| quantity | Int @default(1) | |

**Relations:** cart, product

#### Product
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| title | String | |
| slug | String @unique | URL-friendly |
| description | String @db.Text | Rich text |
| price | Decimal | Selling price in INR |
| salePrice | Decimal? | Discount price |
| isActive | Boolean @default(true) | Soft-delete |
| isFeatured | Boolean @default(false) | |
| categoryId | String? | FK → Category |
| tags | String[] | |
| fileKey | String? | MinIO object key (zip file) |
| fileName | String? | Original filename |
| fileSize | Int? | File size in bytes |
| fileVersion | Int @default(1) | Increments on re-upload |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Relations:** category, images (ProductImage[]), cartItems, orderItems

#### ProductImage
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| productId | String | FK → Product |
| url | String | Image URL (MinIO or hosted) |
| alt | String? | Alt text |
| position | Int @default(0) | Sort order |

#### Category
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| name | String @unique | |
| slug | String @unique | |
| description | String? | |
| image | String? | |
| parentId | String? | Self-referencing (hierarchy) |
| order | Int @default(0) | |

#### Order
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| orderNumber | String @unique | Human-readable |
| userId | String | FK → User |
| status | OrderStatus @default(PENDING_PAYMENT) | |
| totalAmount | Decimal | |
| subtotalAmount | Decimal @default(0) | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Relations:** user, items (OrderItem[]), payments (Payment[]), statusHistory (OrderStatusHistory[])

#### OrderItem
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| orderId | String | FK → Order |
| productId | String | FK → Product |
| title | String | Snapshot at time of purchase |
| quantity | Int | |
| unitPrice | Decimal | |
| totalPrice | Decimal | |

**Relations:** order

#### Payment
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| orderId | String | FK → Order |
| razorpayPaymentId | String? | |
| razorpayOrderId | String? | |
| razorpaySignature | String? | |
| amount | Decimal | |
| currency | String @default("INR") | |
| status | PaymentStatus @default(PENDING) | |
| method | String? | card, UPI, etc. |
| createdAt | DateTime | |

#### OrderStatusHistory
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| orderId | String | FK → Order |
| status | OrderStatus | |
| note | String? | |
| createdAt | DateTime | |

#### Download
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| productId | String | FK → Product |
| orderId | String | FK → Order |
| fileVersion | Int | Version downloaded |
| ip | String? | Request IP |
| createdAt | DateTime | |

### 3.3 Key Differences from POD Schema

- No ProductVariant, no Printify fields
- No shipping address, shipping amount, tax amount on Order
- New `fileKey`, `fileName`, `fileSize`, `fileVersion` on Product
- New `Download` model for download auditing
- No Coupon, Collection, Banner, Page, CMS models (YAGNI — add later if needed)
- No EmailLog, AuditLog (can add later)
- Order status simplified: PENDING_PAYMENT → PAID → COMPLETED

---

## 4. API Design

### 4.1 Public (no auth)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/products` | List products (paginated, filterable, sortable) |
| GET | `/api/products/[slug]` | Single product detail |
| GET | `/api/categories` | List categories |
| GET | `/api/health` | Health check |

### 4.2 Auth (NextAuth)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Create account (name, email, password) |
| POST | `/api/auth/callback/credentials` | Email/password sign-in |
| POST | `/api/auth/callback/google` | Google OAuth sign-in |
| GET | `/api/auth/session` | Current session |

### 4.3 Cart (auth required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/cart` | Get user's cart |
| POST | `/api/cart` | Replace cart contents |
| DELETE | `/api/cart/items/[id]` | Remove item |
| POST | `/api/cart/merge` | Merge guest cart on login |

### 4.4 Payments & Checkout (auth required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/razorpay/create-order` | Create Razorpay order from cart |
| POST | `/api/razorpay/verify` | Verify payment → create Order |
| POST | `/api/razorpay/webhooks` | Razorpay webhook (HMAC verified) |

### 4.5 Account (auth required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/orders` | User's order history |
| GET | `/api/orders/[id]` | Single order detail |
| GET | `/api/orders/[id]/download/[itemId]` | Generate signed URL + log download |
| GET | `/api/account` | User profile info |

### 4.6 Admin (ADMIN role required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/api/admin/products` | List all / Create product |
| PUT/DELETE | `/api/admin/products/[slug]` | Update / Delete product |
| POST | `/api/admin/products/[slug]/upload` | Upload zip to MinIO |
| GET/POST | `/api/admin/categories` | List / Create category |
| PUT/DELETE | `/api/admin/categories/[id]` | Update / Delete category |
| GET | `/api/admin/orders` | List all orders (filterable) |
| GET | `/api/admin/orders/[id]` | Order detail |
| PATCH | `/api/admin/orders/[id]` | Update status |
| GET | `/api/admin/stats` | Dashboard metrics |

---

## 5. Frontend Architecture

### 5.1 Route Design

```
/                              → Landing (hero, featured, collections)
/products                      → Catalog grid with filters
/products/[slug]               → Product detail + buy button
/auth/login                    → Login
/auth/register                 → Register
/account                       → Account dashboard (orders overview)
/account/orders                → Full order history
/account/orders/[id]           → Order detail + download buttons
/admin                         → Admin dashboard
/admin/products                → Product table
/admin/products/new            → Create product + upload zip
/admin/products/[slug]/edit    → Edit product
/admin/orders                  → Orders table
/admin/orders/[id]             → Order detail
/admin/categories              → Category CRUD
/cart                          → Cart page (or drawer)
/checkout                      → Razorpay checkout
```

### 5.2 Component Tree

```
components/
├── ui/                    # Base primitives (cyberpunk-themed shadcn-style)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── badge.tsx
│   ├── skeleton.tsx
│   ├── table.tsx
│   ├── data-table.tsx
│   └── toast.tsx (sonner)
├── layout/
│   ├── navbar.tsx          # Client: cart badge, theme toggle, mobile menu
│   ├── footer.tsx          # Server
│   └── mobile-menu.tsx     # Client
├── landing/
│   ├── hero.tsx            # Parallax + animated headline
│   ├── featured-grid.tsx   # Staggered product cards
│   └── cta-section.tsx     # Call to action
├── products/
│   ├── product-card.tsx    # Hover glow, fade-up animation
│   ├── product-grid.tsx    # Responsive grid with stagger
│   ├── product-gallery.tsx # Screenshot carousel
│   ├── price-tag.tsx       # With sale price support
│   └── add-to-cart-button.tsx
├── cart/
│   ├── cart-drawer.tsx     # Slide-out overlay
│   ├── cart-item.tsx       # Quantity controls
│   └── cart-summary.tsx    # Total + checkout CTA
├── checkout/
│   ├── checkout-form.tsx   # (minimal — no shipping for digital)
│   └── razorpay-button.tsx # Payment gateway integration
├── account/
│   ├── orders-list.tsx     # Paginated order history
│   ├── order-detail.tsx    # Items + download buttons
│   └── download-button.tsx # Request signed URL + track
├── admin/
│   ├── shell.tsx           # Sidebar + topbar layout
│   ├── sidebar.tsx         # Nav menu
│   ├── product-form.tsx    # Create/edit with file upload
│   ├── product-table.tsx   # DataTable of products
│   ├── file-upload.tsx     # Drag-drop zip uploader (400MB limit)
│   ├── order-table.tsx     # All orders DataTable
│   ├── order-detail.tsx    # Full admin order view
│   ├── category-manager.tsx
│   └── stats-cards.tsx     # Dashboard metrics
└── auth/
    ├── login-form.tsx
    └── register-form.tsx
```

### 5.3 State Management

| State | Tool | Location |
|-------|------|----------|
| Server data | TanStack React Query | `useQuery`/`useMutation` hooks |
| Cart | Zustand + localStorage persist | `stores/cart-store.ts` |
| Auth | NextAuth SessionProvider | Root layout |
| UI state | React useState/useReducer | Component-local |

### 5.4 UI Theme: Cyberpunk 2077 + Mass Effect

**Dark mode** (primary):
- Background: `#0a0a0f` with subtle grid/noise overlay
- Surfaces: Glass-panel cards with `backdrop-blur` and thin `rgba(0, 240, 255, 0.15)` borders
- Accents: Cyan (`#00f0ff`), Magenta (`#ff00aa`), Amber (`#ffaa00`)
- Typography: Bold sans-serif for headings (Orbitron or similar), clean sans-serif for body
- Glow effects: `box-shadow` with accent color on buttons, borders that pulse

**Light mode** (secondary):
- Background: `#f5f5f7`
- Surfaces: Frosted white glass (`rgba(255,255,255,0.7)` backdrop-blur)
- Same accent colors but muted — no glow, thinner borders
- Same layout, spacing, typography as dark mode

### 5.5 Animation System (Framer Motion)

| Pattern | Implementation | Trigger |
|---------|---------------|---------|
| fadeInUp | `motion.div` with `initial → animate` | `useInView` |
| staggerChildren | `variants` with `staggerChildren: 0.1` | Grid/lists entering viewport |
| parallax | `useScroll` + `useTransform` | Hero section |
| glowPulse | Keyframe animation on `box-shadow` | Buttons (dark mode) |
| pageTransition | `layout` animations on route change | Route transitions |
| hoverLift | `whileHover={{ y: -4 }}` | Cards, buttons |
| countUp | `useSpring` from Framer Motion | Stats/numbers |
| revealText | `whileInView` staggered character animation | Headlines |

- All animations disabled when `prefers-reduced-motion` is active
- Animations only trigger when in viewport (performance)

---

## 6. Security Architecture

| Layer | Measure |
|-------|---------|
| Passwords | bcrypt hash (cost 12) |
| Auth sessions | JWT with expiry, NextAuth CSRF protection |
| Google OAuth | OAuth 2.0 with state parameter verification |
| Input validation | Zod schemas on every API route |
| Rate limiting | Redis-based (100 req/min/IP general, 3 downloads/hr/user) |
| Payment verification | HMAC-SHA256 signature check on Razorpay webhooks |
| Amount tampering | Server recalculates total from DB prices, compares with Razorpay order notes |
| File upload | 400MB limit, strict zip validation (magic bytes `PK\x03\x04` + `.zip` extension), rejected otherwise, streamed directly to MinIO. Admins are trusted uploaders — no ClamAV scanning in v1. |
| Download auth | Time-limited signed URLs (15 min expiry), ownership verified server-side |
| Admin routes | `adminGuard()` returns 401/403 if not ADMIN role |
| Security headers | CSP, X-Frame-Options, X-Content-Type-Options, HSTS via middleware |
| SQL injection | Prisma parameterized queries (no raw SQL) |
| Secrets management | All keys in `.env`, never committed to git |

---

## 7. Infrastructure & Deployment

### 7.1 Docker Compose

```yaml
services:
  app:          # Next.js (Dockerfile)
    build: .
    ports: ["3000:3000"]
    depends_on: [postgres, minio, redis]
    env_file: .env

  postgres:     # PostgreSQL 16
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]
    env_file: .env

  minio:        # Self-hosted S3-compatible storage
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]
    volumes: [minio_data:/data]
    env_file: .env

  redis:        # Sessions, rate limiting, queue
    image: redis:7-alpine
    ports: ["6379:6379"]
```

### 7.2 File Upload Flow

```
Admin uploads .zip
  → Next.js app (multipart/form-data)
  → Validate: magic bytes (PK\x03\x04) + .zip extension + < 400MB
  → If invalid → reject with error (not a valid zip / too large)
  → If valid → stream directly to MinIO (no temp file on disk)
  → fileKey stored on Product model
  → fileVersion auto-increments on re-upload
  → Old versions retained in MinIO for existing purchases
```

### 7.3 Backup Strategy

- PostgreSQL: Daily `pg_dump` → compressed archive → MinIO backup bucket
- MinIO: `mc mirror` to secondary storage
- Redis: RDB snapshots (cached data — rebuildable)

### 7.4 CI/CD

1. Build Next.js app → produce single Docker image
2. Push to registry (GHCR / Docker Hub)
3. Pull on VPS → `docker compose up -d`

### 7.5 Environment Variables

```
# Database
DATABASE_URL=postgresql://pod:password@postgres:5432/pod

# Redis
REDIS_URL=redis://redis:6379

# MinIO
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=digital-products
MINIO_PUBLIC_URL=http://localhost:9000

# Auth (NextAuth)
AUTH_SECRET=<random-hex>
AUTH_GOOGLE_ID=<google-oauth-client-id>
AUTH_GOOGLE_SECRET=<google-oauth-client-secret>

# Razorpay
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=<secret>
RAZORPAY_WEBHOOK_SECRET=<webhook-secret>
```

---

## 8. Future Extraction Path

When a service needs to become a standalone microservice (e.g., scaling the file service separately):

1. Copy `lib/services/files/` into `services/files/` in a new package
2. Wrap the exported functions in an Express/Hono HTTP server
3. In the API route, swap `import { filesService } from '@/lib/services/files'` for `import { filesClient } from '@/lib/clients/files'`
4. Both implementations implement the same TypeScript interface — no other code changes

This modular monolith approach ensures zero wasted work when splitting.

---

## 9. Design Decisions

### Why no variants on products?
Digital products are singular files (zips). No size/color options needed. Keeps the schema, UI, and checkout flow simple.

### Why no shipping/tax on orders?
Digital goods have no physical shipping. Tax handling can be added later when needed.

### Why Prisma over raw SQL?
Type safety, auto-generated types, schema migrations, and consistent with the team's existing expertise from the POD project.

### Why Next.js over a separate frontend framework?
Single deployment unit, SSR for SEO on product pages, BFF layer built in, excellent DX with Turbopack.

### Why 3 downloads/hour limit?
Prevents automated download scripts without affecting legitimate users who might download multiple purchases in a session. The 15-minute signed URL window means they don't need to re-request if they download within that window.

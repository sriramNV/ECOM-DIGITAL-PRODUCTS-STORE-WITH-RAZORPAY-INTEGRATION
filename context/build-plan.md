# Build Plan

## Core Principle

Build in vertical slices — every feature must be testable end-to-end before moving to the next. No invisible phases. Each slice includes: database schema, API routes, business logic, and UI.

---

## Phase 0 — Foundation

### 00 Project Setup & Infra

Scaffold the monorepo, Docker infrastructure, and core libraries before any feature code.

**Logic:**
- Initialize Next.js 16 app with TypeScript strict
- Install approved dependencies from code-standards.md
- Configure Tailwind CSS v4 with tokens from ui-tokens.md
- Set up Docker Compose (PostgreSQL 16, Redis 7, MinIO)
- Set up Prisma with initial schema
- Create `lib/prisma.ts`, `lib/redis.ts`, `lib/minio.ts`, `lib/logger.ts`
- Create `lib/utils.ts` with `cn()`, `formatCurrency()`, `formatDate()`
- Create `lib/queue.ts` — Bull job queue (Redis-backed, for background jobs)
- Create folder structure per architecture.md
- Configure ESLint, Prettier, TypeScript strict
- Set up test infrastructure: Vitest + `@testing-library/react` + Playwright
- Add test scripts to `package.json`: `pnpm test`, `pnpm test:e2e`
- Create `apps/web/lib/queue.ts` — Bull queue for background jobs (abandoned cart, retries, scheduled tasks)
- Add MinIO bucket init script (`scripts/init-buckets.sh`)

---

## Phase 1 — Auth & Users

### 01 Authentication System

Set up the auth layer that all subsequent features depend on.

**Deliverables:**
- NextAuth.js v5 with credentials provider (email + password)
- Prisma `User` and `Session` models
- Login/register pages with form validation (Zod)
- Session management (JWT in HttpOnly cookies)
- Admin role check middleware

**Verification:** User can register, login, logout. Session persists across refresh.

---

## Phase 2 — Storefront Core

### 02 Product Catalog

The product catalog is the foundation of the storefront.

**Deliverables:**
- Prisma `Product`, `ProductVariant`, `Category`, `ProductImage` models
- Product listing API (`GET /api/products`)
- Product detail API (`GET /api/products/[slug]`)
- Catalog page with responsive grid
- Product detail page with gallery, variant selector, pricing
- Category filtering and search (basic full-text)
- Server-side rendering with TanStack Query hydration

**Verification:** Products display in grid, filterable by category, detail page shows correct variants.

### 03 Cart System

Shopping cart for both guest and authenticated users.

**Deliverables:**
- Zustand cart store with localStorage persistence (guest)
- Cart API (`GET/POST/PUT /api/cart`, `DELETE /api/cart/[id]`)
- Cart page with item list, quantity controls, remove
- Cart drawer (slide-out overlay)
- Cart merge on login (guest cart → DB cart via `POST /api/cart/merge`)
- Empty cart state

**Verification:** Guest adds items, logs in, cart persists. Quantity updates work. Empty state shows.

### 04 Shopify-like Checkout

Checkout flow with Razorpay payment integration.

**Deliverables:**
- Checkout page with single-page layout
- `shipping-address-form.tsx` with address fields + validation
- `shipping-method-selector.tsx` with Printify shipping fetch
- `razorpay-button.tsx` with full Razorpay Checkout integration
- `POST /api/razorpay/create-order` — creates Razorpay order
- `POST /api/razorpay/verify` — verifies payment signature
- `POST /api/razorpay/webhooks` — webhook receiver
- `checkout-service.ts` — orchestrates the full payment flow
- `checkout-schema.ts` — Zod validation schemas
- Orders DB models (`Order`, `OrderItem`, `Payment`)
- Tax handling: GST calculation in pricing service (`pricing-service.ts`)
  - Default GST rate: 18% (configurable per product category)
  - Tax breakdown stored on Order model (separate from item price)
  - GST shown as line item on checkout + invoice
- Order number generation: sequential `POD-{6-digit}` via DB sequence or Redis INCR

**Verification:** Full checkout flow: form → Razorpay modal → payment → redirect to success page. Order appears in DB with correct tax and order number.

---

## Phase 3 — Printify Integration

### 05 Printify API Client

Build the Printify adapter layer before any POD-specific features.

**Deliverables:**
- `lib/printify/client.ts` — base HTTP client with auth, rate limiting, error handling
- `lib/printify/types.ts` — all Printify API types
- `lib/printify/catalog.ts` — blueprint and print provider queries
- `lib/printify/products.ts` — product CRUD
- `lib/printify/orders.ts` — order submission + status
- `lib/printify/uploads.ts` — artwork upload
- `lib/printify/webhooks.ts` — webhook registration

**Verification:** Can list shops, list blueprints, create a test product.

### 06 Fulfillment Pipeline

Automatic order submission to Printify on payment success.

**Deliverables:**
- `fulfillment-service.ts` — submits orders to Printify after payment
- `POST /api/printify/webhooks` — webhook receiver for order status
- Order status management (pending → paid → processing → printing → shipped → delivered)
- Idempotent order submission (external_id)
- Dead letter queue (failed submissions stored in DB for admin review)
- Printify webhook signature verification
- Job queue (Bull): retry failed submissions, schedule status checks

**Verification:** Pay for an order → order auto-submits to Printify → webhooks update order status.

---

## Phase 4 — Admin Dashboard

### 07 Admin Shell

The layout and navigation for the entire admin area.

**Deliverables:**
- `admin-shell.tsx` — sidebar + topbar + content area layout
- `sidebar.tsx` — navigation links with active state
- `topbar.tsx` — user info, notifications
- Responsive sidebar (collapsed on mobile)

**Verification:** Admin can navigate between all sections.

### 08 Order Management

Admin views and manages orders.

**Deliverables:**
- `order-table.tsx` — data table with all orders, sortable, filterable
- `order-detail.tsx` — full order view with line items, status history, customer info
- `order-actions.tsx` — fulfill, cancel, refund actions
- `order-repo.ts` — order queries with pagination and filtering
- Audit logging for all order mutations

**Verification:** Admin sees all orders, can filter by status, view detail, perform actions.

### 09 Product Management

Admin manages the product catalog and Printify sync.

**Deliverables:**
- `product-table.tsx` — product list with status, pricing, image
- `product-form.tsx` — create/edit product form
- `blueprint-browser.tsx` — browse Printify catalog, search blueprints
- `variant-manager.tsx` — enable/disable variants, set pricing
- `mockup-upload.tsx` — upload design artwork, assign to products
- `product-repo.ts` — product queries with Printify sync

**Verification:** Admin can create a product linked to a Printify blueprint, set variants, upload mockup.

### 10 Customer CRM

Customer management and history.

**Deliverables:**
- `customer-table.tsx` — all customers with email, total orders, lifetime value
- `customer-detail.tsx` — customer profile with order history, contact info
- `customer-notes.tsx` — admin notes per customer
- `customer-repo.ts` — customer queries

**Verification:** Admin can view customers, see their order history, add notes.

---

## Phase 5 — CMS & Promotions

### 11 Content Management System

**Note:** Placeholder mockup images for development are generated via:
- `picsum.photos` for generic product imagery (dev only)
- Printify mockup generator for production (admin uploads artwork → Printify generates mockup)
- A `scripts/generate-placeholders.ts` script seeds the DB with 8-12 products + images during `pnpm prisma:seed`

Manage static pages, banners, and collections without code changes.

**Deliverables:**
- `cms-repo.ts` — CMS data models and queries
- `page-editor.tsx` — block-based page editor (hero, grid, CTA, text blocks)
- `block-palette.tsx` — available block types to add
- `banner-manager.tsx` — create/edit banners with scheduling
- `collection-manager.tsx` — curated product collections
- CMS rendered pages on storefront (`/[slug]` routes)
- Prisma `Page`, `Banner`, `Collection`, `Block` models

**Verification:** Admin creates a page with blocks, it renders on storefront. Banners show on schedule.

### 12 Promotions & Coupons

Discount engine with coupon codes.

**Deliverables:**
- `coupon-form.tsx` — create/edit coupon (percentage, fixed, free shipping)
- `coupon-table.tsx` — all coupons with usage stats
- `flash-sale-scheduler.tsx` — time-limited discounts
- `coupon-repo.ts` — coupon validation and application
- Coupon API (`GET/POST/PUT /api/promotions`)
- Frontend coupon input in cart

**Verification:** Admin creates coupon, customer applies it at checkout, discount reflects in total.

---

## Phase 6 — Analytics & Operations

### 13 Analytics Dashboard

Business intelligence dashboards.

**Deliverables:**
- `stat-card.tsx` — KPI cards (revenue, orders, AOV, conversion)
- `revenue-chart.tsx` — daily/weekly/monthly revenue line chart
- `conversion-funnel.tsx` — cart → checkout → payment funnel
- `margin-analysis.tsx` — per-product and per-order margin breakdown
- `cohort-table.tsx` — customer acquisition cohorts
- `analytics-service.ts` — aggregation queries
- `analytics-repo.ts` — time-series data access
- PostHog event tracking integration

**Verification:** Admin sees charts with real data. Margins calculated correctly.

### 14 Operations & Monitoring

Logging, error tracking, admin settings.

**Deliverables:**
- `audit-log-viewer.tsx` — searchable audit log with filters
- `webhook-log-viewer.tsx` — webhook delivery history
- `settings.tsx` — store config (name, email, shipping, tax, Printify API key)
- Sentry error tracking integration
- Logger setup (Pino + Loki)
- Health check endpoint (`/api/health`)

**Verification:** All admin actions logged. Webhook deliveries visible. Health check passes.

---

## Phase 7 — Polish & Production

### 15 Email Automation

Transactional emails for the complete order lifecycle.

**Deliverables:**
- `email-service.ts` — email sending with Nodemailer
- Email templates: order confirmation, shipped, delivered, abandoned cart
- HTML email templates with responsive design
- Email preference management
- Abandoned cart job: Bull queue processes carts created 24h+ ago with no checkout
- EmailLog model for delivery tracking

**Verification:** Emails send on order events. Templates render correctly in email clients.

### 16 Security & Performance

Production hardening.

**Deliverables:**
- Rate limiting (Redis-backed: 100 req/min API, 10 req/min auth)
- Security headers (CSP, HSTS, X-Frame-Options)
- Input sanitization on all user inputs
- Razorpay webhook signature verification
- Printify webhook signature verification
- Database query optimization (indexes, N+1 prevention)
- Image optimization (next/image, proper sizes)
- Lighthouse audit pass

**Verification:** Lighthouse score > 80. Rate limits enforce. Security headers present.

### 17 Deployment & Documentation

Final production deployment setup.

**Deliverables:**
- Production Dockerfile (multi-stage build)
- Docker Compose production config
- Nginx reverse proxy config (TLS, static caching)
- Environment variable documentation
- Backup strategy (PostgreSQL pg_dump, MinIO backup)
- Monitoring setup (Grafana dashboards, uptime checks)

**Verification:** Full `docker compose up -d` in production environment. Site accessible via HTTPS. All features working.

---

## Feature Count

| Phase | Features | Est. Duration |
|-------|----------|---------------|
| Phase 0 — Foundation | 1 | 2 days |
| Phase 1 — Auth | 1 | 2 days |
| Phase 2 — Storefront Core | 3 | 6 days |
| Phase 3 — Printify Integration | 2 | 4 days |
| Phase 4 — Admin Dashboard | 4 | 6 days |
| Phase 5 — CMS & Promotions | 2 | 4 days |
| Phase 6 — Analytics & Operations | 2 | 4 days |
| Phase 7 — Polish & Production | 3 | 4 days |
| **Total** | **18** | **~32 days** |

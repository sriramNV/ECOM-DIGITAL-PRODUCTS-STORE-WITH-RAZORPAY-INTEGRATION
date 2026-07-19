# Project Overview

## About the Project

This is a production-grade Print-on-Demand (POD) e-commerce web application. It connects directly to the **Printify API** for order fulfillment — no third-party middleware. The platform covers the complete e-commerce lifecycle: storefront (landing, catalog, product pages, cart, checkout), order fulfillment pipeline, admin dashboard, CRM, CMS, analytics, and operations tooling.

The business model: a curated catalog of Printify blueprints (t-shirts, hoodies, mugs, posters, phone cases, etc.) with pre-made designs applied as print-ready mockups. Customers browse, select, and purchase. Orders are submitted to Printify automatically for production and shipping. The merchant (you) controls pricing, promotions, catalog curation, and branding.

---

## Pages

```
/                          → Landing page (hero, hot items, featured collections, banners, CTA)
/products                  → Catalog listing (filterable, searchable grid)
/products/[slug]           → Product detail page (variant selector, mockup, pricing, add to cart)
/cart                      → Shopping cart (guest checkout support)
/checkout                  → Checkout flow (Razorpay payment, address, shipping)
/checkout/success          → Post-payment confirmation
/account/orders            → Order history (authenticated users)
/account/saved-designs     → Saved/reorder designs
/account/settings          → Account settings, address book
/contact                   → Contact page
/about                     → About / FAQ / Size Guide (CMS-managed)
/admin                     → Admin dashboard (redirect to /admin/dashboard)
/admin/dashboard           → Analytics overview (revenue, orders, conversion)
/admin/orders              → Order management (list, detail, fulfill, cancel, refund)
/admin/products            → Product management (Printify-linked CRUD, blueprint browser)
/admin/customers           → CRM (customer list, detail, order history)
/admin/cms                 → Content management (pages, banners, collections)
/admin/promotions          → Coupons, flash sales, discount rules
/admin/analytics           → Detailed analytics (charts, funnels, margins, cohorts)
/admin/logs                → Audit log, webhook deliveries, error log
/admin/settings            → Store config, shipping, tax, email templates
```

---

## Core User Flow

1. **Browse** — Customer lands on homepage, sees banners, hot items, featured collections
2. **Discover** — Browses catalog with filters (category, price, color, size) and search
3. **Select** — Chooses a product, views mockup, selects variant (size/color), adds to cart
4. **Cart** — Reviews items, applies coupon code, shipping estimate shown
5. **Checkout** — Enters shipping address, selects shipping method, pays via Razorpay modal
6. **Confirm** — Order submitted, confirmation email sent, order visible in account
7. **Fulfill** — Backend submits order to Printify automatically (idempotent)
8. **Track** — Webhooks update order status: processing → printing → shipped → delivered
9. **Notify** — Customer notified via email at each status change
10. **Manage** — Admin monitors everything via dashboard, handles exceptions

---

## Fulfillment Pipeline

```
Customer checks out
    → Razorpay modal opens → customer pays
    → Frontend verifies payment signature
    → Razorpay sends payment.captured webhook
    → Order created in DB (status: pending_payment → paid)
    → Printify order submission (POST /v1/shops/{id}/orders.json)
    → Order status: processing
    ← Printify webhook: order:sent-to-production
    → status: printing
    ← Printify webhook: order:shipment:created
    → status: shipped (tracking number + carrier stored)
    ← Printify webhook: order:shipment:delivered
    → status: delivered
    → Customer notified via email at each transition
```

---

## Target User

- **End customers**: Anyone buying custom printed apparel, accessories, or home goods online. Expects modern e-commerce UX: fast pages, clear mockups, transparent shipping times, easy checkout.
- **Admin (you)**: Single merchant managing the entire operation. Needs full control over products, pricing, orders, customers, content, promotions, and analytics. Technical background assumed for initial setup and configuration.

---

## Success Criteria

- Complete e-commerce flow: browse → cart → checkout → payment → fulfillment
- Automatic Printify order submission on successful payment (zero manual intervention)
- Real-time order status via webhooks (no polling)
- Admin dashboard covering all operations
- CRM with customer history, order data, and segmentation
- CMS for pages, banners, collections (no code changes needed for content updates)
- Analytics showing revenue, conversion funnel, margin per product/order
- Production readiness: rate limiting, error monitoring, audit logging, security headers
- Global shipping via Printify's print provider network
- Self-hosted open-source stack (PostHog, Nodemailer, Grafana, Loki)
- Docker-based deployment (self-hosted VPS)
- All content placeholder-seeded, structured for real data later

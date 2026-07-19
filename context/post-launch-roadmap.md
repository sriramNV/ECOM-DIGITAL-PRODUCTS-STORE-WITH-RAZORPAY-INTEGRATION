# Post-Launch Roadmap — How to Use the Completed Project

This document covers everything you need to know to operate, manage, and grow your POD store after deployment.

---

## Table of Contents

1. [Daily Operations](#1-daily-operations)
2. [Admin Dashboard Guide](#2-admin-dashboard-guide)
3. [Adding Products](#3-adding-products)
4. [Managing Orders](#4-managing-orders)
5. [Content Management](#5-content-management)
6. [Promotions & Marketing](#6-promotions--marketing)
7. [Analytics & Reporting](#7-analytics--reporting)
8. [Customer Management](#8-customer-management)
9. [Email Automation](#9-email-automation)
10. [Maintenance & Troubleshooting](#10-maintenance--troubleshooting)
11. [Growth Playbook](#11-growth-playbook)

---

## 1. Daily Operations

Your daily routine should take 15-30 minutes:

### Morning Checklist

```
□ Check new orders (Admin → Orders → filter: PAID)
□ Verify all new orders submitted to Printify
  - If any stuck at PAID → check dead letter queue (Admin → Logs)
  - Click "Retry" on failed submissions
□ Review any customer support emails
  - Check for address corrections, sizing questions
□ Quick revenue glance (Admin → Dashboard)
```

### Weekly Checklist

```
□ Review analytics (Admin → Analytics)
  - Revenue trend, top products, conversion rate
  - Margin analysis — are any products underperforming?
□ Process any refund requests
□ Check inventory — any products running low on variants?
□ Review Printify provider performance (shipping times)
```

---

## 2. Admin Dashboard Guide

### Access

URL: `https://yourstore.com/admin`
Login: Your admin email + password (set during deployment)

### Dashboard Overview

```
┌─────────────────────────────────────────────────┐
│ Dashboard                                        │
│                                                 │
│ 4 KPI Cards at top:                             │
│   Revenue (today/this month)                    │
│   Orders (count)                                │
│   Average Order Value (AOV)                     │
│   Conversion Rate                               │
│                                                 │
│ Revenue chart (7 days / 30 days / 90 days)      │
│ Top products list                               │
│ Recent orders                                   │
│ Conversion funnel                               │
└─────────────────────────────────────────────────┘
```

### Navigation

```
📊 Dashboard    — Business overview, KPIs, charts
📦 Orders       — All orders, search, filter, manage
🏷️ Products     — Product catalog, add/edit products
👥 Customers    — Customer list, profiles, history
📝 Content      — Pages, banners, collections (CMS)
🎯 Promotions   — Coupons, flash sales
📈 Analytics    — Detailed reports, margins, cohorts
📋 Logs         — Audit trail, webhook deliveries
⚙️ Settings     — Store config, API keys, email
```

---

## 3. Adding Products

### Step-by-Step: Creating a New Product

```
1. Go to Admin → Products
2. Click [+ New Product]
3. Step 1 — Choose Blueprint:
   - Browse the Printify catalog (loaded automatically)
   - Select a product type (T-shirt, Mug, Poster, etc.)
   - Select a print provider for that blueprint
   - System shows available variants (sizes, colors)
4. Step 2 — Configure:
   - Enter product title (e.g., "Mountain Sunset Tee")
   - Enter description (SEO-friendly)
   - Select category
   - Add tags (helps with search)
5. Step 3 — Set Pricing:
   - Set margin percentage (e.g., 40%)
   - Or set individual prices per variant
   - System shows: your cost → selling price → profit
6. Step 4 — Upload Design:
   - Upload your artwork (PNG, JPG, SVG recommended)
   - Position on product (front, back, etc.)
   - System generates mockup via Printify
7. Step 5 — Review & Create:
   - Preview the product
   - Click "Create Product"
   - Product appears in storefront (draft)
8. Click "Publish" to make it live
```

### Design Guidelines

| Product | File Type | Min DPI | Recommended Size | Max File Size |
|---------|-----------|---------|-----------------|---------------|
| T-Shirt (front) | PNG | 150 DPI | 4500 x 5400 px | 20 MB |
| Hoodie (front) | PNG | 150 DPI | 4500 x 5400 px | 20 MB |
| Mug | PNG | 200 DPI | 3000 x 1500 px | 20 MB |
| Poster | PNG/PDF | 300 DPI | 6000 x 9000 px | 20 MB |
| Phone Case | PNG | 200 DPI | 3000 x 2000 px | 20 MB |

**Best practices:**
- Use transparent backgrounds (PNG) for apparel — white backgrounds for mugs/posters
- Keep design within the safe zone (Printify provides template per product)
- RGB color mode (CMYK handled by Printify)
- Test print before going live with a product

### Editing Products

```
1. Go to Admin → Products
2. Find the product in the list
3. Click on it → Edit form opens
4. You can modify:
   - Title, description, tags
   - Pricing (margin % or per variant)
   - Enable/disable specific variants
   - Replace images
   - Change category
5. Click "Save"
6. Changes reflect on storefront immediately
```

---

## 4. Managing Orders

### Order Statuses

| Status | Meaning | Action Needed |
|--------|---------|---------------|
| `PENDING_PAYMENT` | Customer started checkout but didn't pay | None (auto-cancelled after 30 min) |
| `PAID` | Payment received, pending Printify submission | Verify auto-submit worked |
| `PROCESSING` | Submitted to Printify | None |
| `PRINTING` | Printify production started | None |
| `SHIPPED` | Dispatched with tracking | None (customer notified) |
| `DELIVERED` | Customer received | None |
| `CANCELLED` | Cancelled before production | Verify refund if paid |
| `REFUNDED` | Refunded to customer | — |

### Manual Actions

**Cancel an Order:**
```
1. Go to Admin → Orders → Click order
2. Click "Cancel"
3. Enter reason
4. Confirm
5. System auto-refunds if payment was captured
```

**Mark as Shipped (manual override):**
```
1. Go to Admin → Orders → Click order
2. Click "Mark Shipped"
3. Enter tracking number and carrier
4. Customer receives shipment email
```

**Process Refund:**
```
1. Go to Admin → Orders → Click order
2. Click "Refund"
3. Enter amount and reason
4. Confirm
5. System refunds via Razorpay
```

### Dead Letter Queue

If an order fails to submit to Printify:

```
1. Admin → Logs → Check Dead Letter Queue
2. See failed orders with error messages
3. Click "Retry" to resubmit
4. If persists → check Printify API status
5. Last resort: manually create order in Printify dashboard
```

---

## 5. Content Management

### Pages (CMS)

The homepage and all marketing pages are built with blocks. No coding required.

**Creating/Editing a Page:**
```
1. Admin → Content → Pages
2. Click edit on existing page (e.g., "Home") or "+ New Page"
3. In the editor:
   - Add blocks using the [+ Add Block] button
   - Rearrange blocks by dragging
   - Edit block content inline
   - Remove blocks with ✕ button
4. Available blocks:
   - Hero: Big image + heading + CTA button
   - Text: Rich text content (about, FAQ)
   - Product Grid: Show products from a collection
   - Featured Collections: Collection cards with images
   - Newsletter: Email signup form
   - CTA Banner: Promotional banner with button
   - Testimonials: Customer reviews carousel
   - FAQ: Expandable Q&A sections
   - Image: Single image with caption
   - Image Grid: Collage of images
5. Set SEO title and description
6. Click "Save" → page updates instantly
```

**Pro tip:** Create different landing pages for marketing campaigns (e.g., `/summer-sale`, `/new-arrivals`).

### Banners

```
1. Admin → Content → Banners
2. [+ New Banner]
3. Set:
   - Title (internal name)
   - Image URL (1920x400px recommended)
   - Link URL (where banner clicks go)
   - Position: "Top" = announcement bar, "Hero" = hero section
   - Schedule: Start + end date for time-limited promos
4. Multiple banners auto-rotate
```

### Collections

```
1. Admin → Content → Collections
2. [+ New Collection]
3. Name: e.g., "Summer Collection"
4. Add products with search → set sort order
5. Use in Product Grid blocks on CMS pages
```

---

## 6. Promotions & Marketing

### Creating a Coupon

```
1. Admin → Promotions → [+ New Coupon]
2. Fill in:
   - Code: e.g., "SUMMER20"
   - Type:
     • Percentage — e.g., 20% off
     • Fixed Amount — e.g., ₹100 off
     • Free Shipping
   - Value: e.g., 20 (for 20%)
   - Min Order: e.g., ₹500 (minimum cart value)
   - Max Discount: e.g., ₹200 (cap for % coupons)
   - Usage Limit: e.g., 100 (total redemptions)
   - Per User Limit: e.g., 1 (per customer)
   - Start/End Date
   - Applicable Products/Categories (optional)
3. Click "Create"
4. Share code on social media, email, etc.
```

### Flash Sales

```
1. Admin → Promotions → Flash Sales → [+ New]
2. Select product
3. Set discount percentage
4. Set start + end date/time
5. Customer sees countdown timer on product page
```

### Marketing Ideas

| Tactic | How | Cost |
|--------|-----|------|
| **Launch discount** | 20% off first order coupon | Margin reduction |
| **Referral program** | "Share with friend, both get ₹100 off" | ₹100 per new customer |
| **Abandoned cart** | Auto-email after 24h with 10% off | Built-in |
| **Seasonal sales** | Flash sales on holidays | Margin reduction |
| **Bundle deals** | "Buy 2 tees, get 10% off" | Implement via coupon |
| **Social media** | Post mockups on Instagram/Pinterest | Free |
| **Email newsletter** | Monthly new design showcase | Free (SMTP) |

---

## 7. Analytics & Reporting

### Dashboard Metrics

| Metric | What It Tells You |
|--------|-------------------|
| **Revenue** | Total sales (daily, weekly, monthly) |
| **Orders** | Number of transactions |
| **AOV** | Average Order Value — how much customers spend |
| **Conversion Rate** | % of visitors who buy |
| **Top Products** | Best-selling items by revenue |
| **Funnel** | Where customers drop off (view → cart → checkout) |
| **Margin** | Profit per product (selling price - Printify cost) |
| **Cohorts** | Customer retention over time |

### Understanding Your Numbers

**Good margins:** Printify cost eats 40-60% of selling price. If your tee costs ₹350:
- Sell at ₹699 = 50% margin ✅ (good)
- Sell at ₹499 = 30% margin ⚠️ (low)
- Sell at ₹999 = 65% margin 🔥 (great, if customers buy)

**Conversion rate benchmarks:**
- 1-2% = average for e-commerce
- 2-3% = good
- 3%+ = excellent

**AOV improvement ideas:**
- Free shipping at ₹999 threshold → customers add more items
- "Complete the look" upsells on product page
- Bundle discounts

---

## 8. Customer Management

### Viewing Customers

```
1. Admin → Customers
2. Search by name or email
3. Click customer to see:
   - Contact info
   - Order history with statuses
   - Total spent + average order value
   - Notes (internal)
```

### Adding Notes

```
1. Admin → Customers → Click customer
2. Go to "Notes" section
3. Type note (e.g., "Prefers DTG printing, has size concerns")
4. Click "Add Note"
5. Notes are internal only — customer doesn't see them
```

---

## 9. Email Automation

Emails are sent automatically. Here's what triggers them:

| Email | Trigger | Content |
|-------|---------|---------|
| **Order Confirmation** | Payment successful | Order number, items, amount, shipping address |
| **Shipped** | Printify marks as shipped | Tracking number + carrier + link to track |
| **Delivered** | Printify marks as delivered | Thank you + review request |
| **Cancelled** | Admin cancels order | Cancellation reason + refund info |
| **Abandoned Cart** | 24h after cart creation | Items in cart + CTA to complete purchase |

### Customizing Email Templates

Email templates are in `lib/email/templates/`. Each is a TypeScript function returning HTML. To customize:

1. Open the template file (e.g., `lib/email/templates/order-confirmation.ts`)
2. Edit the HTML string
3. Deploy → emails now use new template

---

## 10. Maintenance & Troubleshooting

### Regular Maintenance

| Frequency | Task | How |
|-----------|------|-----|
| **Daily** | Check new orders | Admin → Orders → filter PAID |
| **Daily** | Check dead letter queue | Admin → Logs |
| **Weekly** | Review analytics | Admin → Analytics |
| **Monthly** | Update dependencies | `pnpm update` on dev machine, redeploy |
| **Monthly** | Check backup integrity | Restore backup to test environment |
| **Quarterly** | Rotate API keys | Generate new keys in Printify/Razorpay |

### Common Issues

**Order not submitting to Printify**
```
Check: Admin → Logs → Dead Letter Queue
Cause: Printify API down, invalid variant, address issue
Fix: Click "Retry" or create order manually in Printify
```

**Webhook not updating order**
```
Check: Admin → Logs → Webhook Log
Cause: Endpoint down, signature mismatch
Fix: Verify webhook URL in Printify dashboard, check server logs
```

**Razorpay payment failed**
```
Customer sees error → ask them to retry
If amount debited but order not created → check Razorpay dashboard
Manual action: Create order in admin, mark as paid
```

**Site not loading**
```
Check: Is VPS running? (VPS provider dashboard)
Check: Is Docker running? → ssh → docker ps
Fix: docker compose -f docker-compose.prod.yml up -d
```

### Backup & Restore

**Backups run automatically:**
- Database: daily pg_dump → uploaded to cloud storage
- Files: daily rclone sync of MinIO → cloud storage
- Retention: 30 daily backups, then weekly for 6 months

**Manual backup:**
```bash
ssh into VPS
docker compose exec postgres pg_dump -U pod -d pod > backup.sql
```

**Restore:**
```bash
cat backup.sql | docker compose exec -T postgres psql -U pod -d pod
```

### Updating the App

```bash
# On your development machine:
git pull                    # Get latest code
pnpm install                # Update dependencies
pnpm build                  # Test build

# Deploy (auto via GitHub Actions on push to main):
git add .
git commit -m "Description of changes"
git push origin main
# → GitHub Actions builds and deploys to VPS automatically
```

---

## 11. Growth Playbook

### Stage 1: Launch (Month 1)

**Goal:** Validate product-market fit with 10-20 products

```
□ Create 10-20 products across 3-4 categories
□ Set competitive pricing (40-50% margin)
□ Launch with 20% discount coupon
□ Share on personal social media
□ Ask friends/family for orders and feedback
□ Monitor analytics weekly
```

**Success metric:** 10+ orders in first month

### Stage 2: Growth (Months 2-3)

**Goal:** Scale to 50+ products, optimize conversion

```
□ Add 30-40 more products
□ Create collections (Best Sellers, New Arrivals)
□ Set up abandoned cart emails (auto)
□ Run first flash sale (limited time, 24h)
□ Start Instagram/Pinterest posting schedule
□ A/B test pricing (try +10% on best sellers)
□ Analyze top products → create similar designs
```

**Success metric:** 50+ orders/month, 2%+ conversion rate

### Stage 3: Scale (Months 4-6)

**Goal:** Build repeat customer base, expand catalog

```
□ Reach 100+ products
□ Create homepage with CMS blocks (hero, featured, testimonials)
□ Referral program ("Share with friend, both save ₹100")
□ Email newsletter (monthly new design showcase)
□ Retargeting ads on social media
□ Seasonal collections (Diwali, Christmas, Summer)
□ Introduce bundles or multi-buy discounts
```

**Success metric:** 200+ orders/month, 15%+ repeat customers

### Stage 4: Optimize (Month 7+)

**Goal:** Maximize profit, automate operations

```
□ Analyze margin by product → drop low-margin items
□ Negotiate better rates? (Printify volume discounts at 100+/month)
□ Automate product creation pipeline
□ Build brand loyalty program
□ Expand to international (if Printify providers allow)
□ Consider adding more product categories
```

**Success metric:** Sustainable profit, minimal daily ops time

---

## Key Contacts & URLs Quick Reference

| Resource | URL |
|----------|-----|
| Your Store | `https://yourstore.com` |
| Admin Login | `https://yourstore.com/admin` |
| Printify Dashboard | `https://printify.com` |
| Printify API Docs | `https://developers.printify.com` |
| Razorpay Dashboard | `https://dashboard.razorpay.com` |
| PostHog (self-hosted) | `http://your-vps-ip:8000` |
| MinIO Console | `http://your-vps-ip:9001` |
| VPS Provider | Your VPS provider's dashboard |
| Domain Registrar | Where you bought the domain |
| GitHub Repo | Your repository on GitHub |

---

## Final Note

This platform is designed to run with minimal ongoing technical effort. Your main job after launch is:

1. **Create designs** — This is the core of your business. Good designs sell.
2. **Set pricing** — Competitive but profitable.
3. **Promote** — Drive traffic to your store.
4. **Monitor** — Check dashboard daily, catch issues early.

Everything else (orders → printing → shipping → emails → tracking) happens automatically.

**Questions or issues?** The developer has access to all context files and the source code. Open an issue in GitHub or contact them directly.

# API Reference

Base URL: `http://localhost:3000/api`

## Authentication

### POST /api/auth/register
Create a new user account.

```json
{ "name": "John Doe", "email": "john@example.com", "password": "securepass123" }
```

**Response**: `201` `{ id, name, email }` | `409` Email exists | `422` Validation error

### POST /api/auth/signin
Handled by NextAuth. POST email + password to `/api/auth/callback/credentials`.

## Products

### GET /api/products
List products with pagination, filtering, and sorting.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 100) |
| `category` | string | — | Filter by category slug |
| `search` | string | — | Search title/description/tags |
| `sort` | enum | `newest` | `price_asc`, `price_desc`, `newest`, `name` |
| `isActive` | string | `true` | Filter: `true`, `false`, or `all` (admin) |

**Response**: `200`
```json
{
  "items": [{ "id": "...", "title": "T-Shirt", "slug": "t-shirt", "basePrice": 599, "images": [...], "variants": [...] }],
  "total": 50,
  "page": 1,
  "totalPages": 3
}
```

### POST /api/products
Create a new product. **Admin only**.

```json
{
  "title": "T-Shirt",
  "description": "A comfortable cotton t-shirt",
  "basePrice": 599,
  "categoryId": null,
  "images": [{ "url": "https://..." }],
  "variants": [{ "title": "Small Black", "size": "S", "color": "Black", "colorHex": "#000000", "price": 599, "stock": 999 }]
}
```

**Response**: `201` Created product | `422` Validation error

### GET /api/products/:slug
Get a single product by slug.

**Response**: `200` Product object | `404` Not found

### PUT /api/products/:slug
Update a product. **Admin only**. All fields optional — only provided fields are updated. Image and variant arrays replace existing data entirely.

**Response**: `200` Updated product | `404` Not found | `422` Validation error

## Categories

### GET /api/categories
List all categories.

**Response**: `200` `[{ id, name, slug, description, image, order, _count: { products } }]`

## Cart

All cart endpoints require authentication.

### GET /api/cart
Get current user's cart with items (includes product title, variant price/image).

### POST /api/cart
Replace entire cart contents.

```json
{ "items": [{ "productId": "...", "variantId": "...", "quantity": 2 }] }
```

**Note**: This clears the existing cart and inserts the provided items atomically.

### DELETE /api/cart/items/:id
Remove a single item from cart.

### POST /api/cart/merge
Merge guest cart into user's cart (called after login).

```json
{ "items": [{ "productId": "...", "variantId": "...", "quantity": 1 }] }
```

## Orders

### GET /api/orders
Get current user's order history. Requires auth.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |

## Razorpay (Payments)

### POST /api/razorpay/create-order
Create a Razorpay order for the user's cart. Requires auth.

```json
{ "couponCode": "SAVE20", "shippingAddress": { "fullName": "...", ... } }
```

**Response**: `200`
```json
{ "razorpayOrderId": "order_...", "amount": 1279, "amountInPaise": 127900, "currency": "INR" }
```

### POST /api/razorpay/verify
Verify payment and create order in database. Requires auth.

```json
{
  "razorpay_payment_id": "pay_...",
  "razorpay_order_id": "order_...",
  "razorpay_signature": "...",
  "shippingAddress": { ... }
}
```

**Response**: `200` `{ id, orderNumber }` | `400` Verification failed / Tampering detected

### POST /api/razorpay/webhooks
Razorpay webhook handler. Verified via HMAC signature. Handles `payment.captured` events with Redis-based deduplication.

## Printify (Fulfillment)

### POST /api/printify/webhooks
Printify webhook handler. Verified via HMAC timing-safe comparison. Handles order status events: `order:sent-to-production`, `order:shipment:created`, `order:shipment:delivered`.

## Admin

All admin endpoints require `ADMIN` role.

### GET /api/admin/stats
Dashboard statistics.

**Response**: `{ totalOrders, todayOrders, totalRevenue, todayRevenue, totalCustomers }`

### GET /api/admin/orders
List all orders with filtering.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | int | 20 | Items per page (max 100) |
| `status` | string | — | Filter by order status |
| `search` | string | — | Search by order number or customer email |

### GET /api/admin/orders/:id
Get single order with items, payments, and status history.

### PATCH /api/admin/orders/:id
Perform order action.

```json
{ "action": "submit_to_printify" | "cancel" | "mark_delivered" }
```

### GET /api/admin/customers
Search customers.

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by name or email (case-insensitive) |

### GET /api/admin/settings
Get current app settings.

### PATCH /api/admin/settings
Update app settings.

```json
{ "appName": "My Store", "currency": "INR", "supportEmail": "help@example.com", "itemsPerPage": "12" }
```

## CMS

### GET /api/cms/pages
List CMS pages. Paginated.

### POST /api/cms/pages
Create a CMS page. **Admin only**.

```json
{ "title": "About Us", "slug": "about-us", "content": [{ "type": "text", "data": { "body": "..." } }], "isPublished": true }
```

### GET /api/cms/pages/:id
Get single CMS page.

### PATCH /api/cms/pages/:id
Update CMS page. **Admin only**.

### GET /api/cms/banners
List banners. `?active=true` returns only currently active banners.

### GET /api/cms/collections
List collections. `?slug=X` returns single collection by slug.

| Param | Type | Description |
|-------|------|-------------|
| `slug` | string | Filter by collection slug |

## Promotions

### GET /api/promotions/coupons
List all coupons. Paginated.

### POST /api/promotions/coupons
Create a coupon. **Admin only**.

```json
{
  "code": "SAVE20",
  "type": "percentage",
  "value": 20,
  "minOrder": 500,
  "maxDiscount": 200,
  "usageLimit": 100,
  "perUserLimit": 1,
  "startDate": "2026-01-01",
  "endDate": "2026-12-31"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `code` | string (3-20) | Coupon code, uppercased automatically |
| `type` | enum | `percentage`, `fixed`, or `free_shipping` |
| `value` | number | Discount value (percent or amount) |
| `minOrder` | number | Minimum order subtotal |
| `maxDiscount` | number | Maximum discount for percentage type |
| `usageLimit` | int | Total usage cap |
| `perUserLimit` | int | Uses per customer |
| `startDate` | string (date) | Start date `YYYY-MM-DD` |
| `endDate` | string (date) | End date `YYYY-MM-DD` |

### POST /api/promotions/coupons/validate
Validate a coupon code.

```json
{ "code": "SAVE20", "subtotal": 1000 }
```

## Analytics (Admin)

### GET /api/analytics/overview
Overview metrics: revenue, orders, AOV, customers, conversion funnel.

### GET /api/analytics/revenue
Revenue history. `?days=30` for configurable range.

### GET /api/analytics/funnel
Conversion funnel stages.

## Other

### GET /api/health
Health check (IP-restricted to private ranges).

**Response**: `200` `{ status: "healthy", checks: { database: "ok", redis: "ok" } }` | `503` Unhealthy

### POST /api/contact
Submit contact form.

```json
{ "name": "John", "email": "john@example.com", "message": "..." }
```

### POST /api/newsletter/subscribe
Subscribe to newsletter.

```json
{ "email": "john@example.com" }
```

### GET /api/logs/audit
Query audit logs. **Admin only**.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `action` | string | — | Filter by action type |
| `entity` | string | — | Filter by entity type |
| `entityId` | string | — | Filter by entity ID |
| `page` | int | 1 | Page number |
| `limit` | int | 50 | Items per page (max 100) |

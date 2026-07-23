# API Reference

Base URL: `http://localhost:3000/api`

## Authentication

### POST /api/auth/register
Create a new user account. Rate-limited: 5 req/5min per IP.

```json
{ "name": "John Doe", "email": "john@example.com", "password": "securepass123" }
```

**Response**: `201` `{ id, name, email }` | `409` Email exists | `422` Validation error | `429` Rate limited

### POST /api/auth/callback/credentials
NextAuth credentials login. POST email + password as form data.

### POST /api/auth/signout
NextAuth sign out.

### GET /api/auth/session
Get current session data.

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

**Response**: `200`
```json
{
  "items": [{ "id": "...", "title": "Ebook", "slug": "ebook", "price": 9.99, "salePrice": null, "images": [...], "category": {...} }],
  "total": 50, "page": 1, "totalPages": 3
}
```

### GET /api/products/[slug]
Get a single product by slug.

**Response**: `200` Product object with images and category | `404` Not found

## Categories

### GET /api/categories
List all categories.

**Response**: `200` `[{ id, name, slug, description, image, order, _count: { products } }]`

## Cart (Authenticated)

### GET /api/cart
Get current user's cart with items (includes product title, price, images).

### POST /api/cart
Replace entire cart contents. Clears existing cart and inserts provided items atomically.

```json
{ "items": [{ "productId": "...", "quantity": 2 }] }
```

### DELETE /api/cart/items/[id]
Remove a single item from cart.

### POST /api/cart/merge
Merge guest cart into user's cart (called after login).

```json
{ "items": [{ "productId": "...", "quantity": 1 }] }
```

## Orders

### GET /api/orders
Get current user's order history. Requires auth.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |

### POST /api/orders
Create order from cart (simulated payment). Rate-limited: 5/hr per user. Requires auth.

**Response**: `201` Order object | `400` Cart empty | `429` Rate limited

**Behavior**: Creates order with `PAID` status directly. No real payment processing.

### GET /api/orders/[id]
Get a single order (must belong to current user).

### POST /api/orders/[id]/download/[itemId]
Generate a signed download URL for a purchased product. Rate-limited: 3/hr per user.

**Response**: `200` `{ url, fileName, remaining }` | `429` Rate limited | `400` Not found / not paid

## Account

### GET /api/account
Get current user profile.

### DELETE /api/account/delete
Permanently delete account and all associated data (orders, cart, sessions, downloads). Signs out after deletion.

### GET /api/account/download-all
Generate signed download URLs for ALL purchased files. Rate-limited: 3/hr per user.

**Response**: `200` `{ downloads: [{ title, url, fileName }] }` | `429` Rate limited

## Admin (Requires ADMIN role)

### GET /api/admin/stats
Dashboard statistics.

**Response**: `{ totalOrders, todayOrders, totalRevenue, todayRevenue, totalCustomers }`

### GET /api/admin/orders
List all orders with filtering.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |
| `status` | string | — | Filter by order status |
| `search` | string | — | Search by order number or customer email |

### GET /api/admin/orders/[id]
Get single order with items, payments, and status history.

### PATCH /api/admin/orders/[id]
Update order status.

```json
{ "status": "COMPLETED", "note": "Delivered" }
```

### GET /api/admin/products
List all products (including inactive). Admin variant of product listing.

### POST /api/admin/products
Create a new product.

```json
{
  "title": "My Ebook",
  "description": "A great ebook",
  "price": 19.99,
  "salePrice": 14.99,
  "categoryId": "clx...",
  "images": [{ "url": "https://...", "alt": "Cover" }],
  "fileKey": "products/my-ebook.pdf",
  "fileName": "my-ebook.pdf"
}
```

### PUT /api/admin/products/[slug]
Update a product. All fields optional.

### DELETE /api/admin/products/[slug]
Soft-delete a product (sets `isActive: false`).

### POST /api/admin/products/[slug]/upload
Generate a presigned upload URL for file upload.

```json
{ "fileName": "ebook.pdf", "contentType": "application/pdf" }
```

**Response**: `200` `{ uploadUrl, fileKey, fileName }`

### GET /api/admin/categories
List all categories with product counts.

### POST /api/admin/categories
Create a category.

```json
{ "name": "Ebooks", "slug": "ebooks", "description": "...", "image": "..." }
```

### PUT /api/admin/categories/[id]
Update a category.

### DELETE /api/admin/categories/[id]
Delete a category.

## Health

### GET /api/health
Health check endpoint.

**Response**: `200` `{ status: "healthy", db: "ok" }`

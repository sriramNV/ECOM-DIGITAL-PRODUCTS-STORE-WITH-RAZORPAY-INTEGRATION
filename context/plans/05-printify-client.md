# Phase 3a — Printify API Client

## Objective

Build a comprehensive, production-grade Printify API client that handles all communication with the Printify service — authentication, request signing, rate limiting, error handling, and typed responses for every endpoint used by the platform.

---

## System Design

### Client Architecture

```
lib/printify/
├── client.ts        # Base HTTP client (auth, rate limiting, logging)
├── types.ts          # All Printify API request/response types
├── catalog.ts        # Blueprint, print provider, variant queries
├── products.ts       # Product CRUD + publish
├── orders.ts         # Order submission + status
├── uploads.ts        # Image upload
└── webhooks.ts       # Webhook registration
```

### Base Client

```typescript
// lib/printify/client.ts
const BASE_URL = "https://api.printify.com/v1";

export async function printifyRequest<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const token = process.env.PRINTIFY_API_TOKEN;

  logger.debug({ method, url, body }, "Printify request");

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "POD-App/1.0",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Rate limit handling
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") ?? "5");
    logger.warn({ retryAfter }, "Printify rate limited, waiting");
    await sleep(retryAfter * 1000);
    return printifyRequest<T>(method, path, body);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error({ status: response.status, body: errorBody }, "Printify API error");
    throw new PrintifyApiError(response.status, errorBody);
  }

  return response.json();
}
```

### Endpoints Covered

#### Catalog

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/v1/shops.json` | List all shops (get shop ID) |
| GET | `/v1/catalog/blueprints.json` | List all available blueprints |
| GET | `/v1/catalog/blueprints/{id}.json` | Get single blueprint details |
| GET | `/v1/catalog/blueprints/{id}/print_providers.json` | List print providers for blueprint |
| GET | `/v1/catalog/blueprints/{id}/print_providers/{pid}/variants.json` | List all variants |
| GET | `/v1/catalog/blueprints/{id}/print_providers/{pid}/shipping.json` | Get shipping info |

#### Products

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/v1/shops/{id}/products.json` | List products in shop |
| POST | `/v1/shops/{id}/products.json` | Create a new product |
| PUT | `/v1/shops/{id}/products/{pid}.json` | Update a product |
| DELETE | `/v1/shops/{id}/products/{pid}.json` | Delete a product |
| POST | `/v1/shops/{id}/products/{pid}/publish.json` | Publish to storefront |

#### Orders

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/v1/shops/{id}/orders.json` | Submit a new order |
| GET | `/v1/shops/{id}/orders/{oid}.json` | Get order status |
| POST | `/v1/shops/{id}/orders/shipping.json` | Calculate shipping cost |

#### Uploads

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/v1/uploads/images.json` | Upload design image |

#### Webhooks

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/v1/shops/{id}/webhooks.json` | List webhooks |
| POST | `/v1/shops/{id}/webhooks.json` | Create webhook |
| PUT | `/v1/shops/{id}/webhooks/{wid}.json` | Update webhook |
| DELETE | `/v1/shops/{id}/webhooks/{wid}.json` | Delete webhook |

---

## Architecture

### Type Definitions

```typescript
// lib/printify/types.ts

export type PrintifyShop = {
  id: number;
  title: string;
  sales_channel: string;
};

export type PrintifyBlueprint = {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: { src: string }[];
};

export type PrintifyVariant = {
  id: number;
  title: string;
  options: { name: string; value: string }[];
  placeholders: { position: string; height: number; width: number }[];
};

export type PrintifyPrintProvider = {
  id: number;
  title: string;
  location: { country: string };
  blueprints: { id: number; title: string }[];
};

export type PrintifyShippingRate = {
  standard: { cost: number };
  express?: { cost: number };
};

export type PrintifyProduct = {
  id: string;
  title: string;
  description: string;
  blueprint_id: number;
  print_provider_id: number;
  variants: { id: number; price: number; is_enabled: boolean }[];
  images: { src: string; position: string }[];
};

export type PrintifyProductCreate = {
  title: string;
  description: string;
  blueprint_id: number;
  print_provider_id: number;
  variants: { id: number; price: number; is_enabled: boolean }[];
  print_areas: { variant_ids: number[]; placeholders: { position: string; images: { src: string; x: number; y: number; scale: number }[] }[] }[];
};

export type PrintifyOrder = {
  id: string;
  status: string;
  shipping_method: number;
  line_items: { product_id: string; variant_id: number; quantity: number }[];
};

export type PrintifyOrderCreate = {
  external_id: string;
  label: string;
  line_items: { product_id: string; variant_id: number; quantity: number }[];
  shipping_method: number;
  address_to: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };
};

export type PrintifyUploadResponse = {
  id: string;
  file_name: string;
  width: number;
  height: number;
  file_url: string;
};

export type PrintifyWebhook = {
  id: string;
  topic: string;
  url: string;
  shop_id: number;
};
```

### Rate Limit Strategy

```
Global limit: 600 req/min
Catalog limit: 100 req/min
Publish limit: 200 req/30min

Strategy:
  - Track requests per endpoint category in-memory
  - On 429: exponential backoff (1s, 2s, 4s, max 30s)
  - Cache catalog responses (24h TTL)
  - Queue publish operations (max 5/min)
```

### Caching Strategy

| Endpoint Group | Cache TTL | Cache Key |
|---------------|-----------|-----------|
| Blueprint list | 24h | `printify:blueprints` |
| Blueprint detail | 24h | `printify:blueprint:{id}` |
| Variants | 24h | `printify:variants:{blueprint}:{provider}` |
| Shipping rates | 1h | `printify:shipping:{blueprint}:{provider}` |
| Product list | 5min | `printify:products:shop:{id}` |
| Order status | No cache | — |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API version | v1 primary, v2 for catalog | v1 covers all ops; v2 for richer catalog data |
| Auth method | Personal Access Token | Single merchant shop (not multi-merchant platform) |
| Rate limiting | Client-side backoff on 429 | Printify returns 429 with Retry-After header |
| Caching | Redis | Shared across instances, fast TTL-based expiry |
| SDK approach | Custom thin adapter | Full control, no dependency on unmaintained SDKs |
| Shop ID storage | Environment variable | Single shop, hardcoded per environment |

---

## Steps

1. Get PRINTIFY_API_TOKEN from Printify dashboard (My Profile → Connections)
2. Get SHOP_ID via `GET /v1/shops.json`
3. Create `lib/printify/client.ts` (base HTTP client)
4. Create `lib/printify/types.ts` (all type definitions)
5. Create `lib/printify/catalog.ts` (blueprint queries with caching)
6. Create `lib/printify/products.ts` (product CRUD)
7. Create `lib/printify/orders.ts` (order submission + status)
8. Create `lib/printify/uploads.ts` (image upload)
9. Create `lib/printify/webhooks.ts` (webhook registration)
10. Verify: list shops, list blueprints, get variants, test image upload

---

## Files Created

| File | Content |
|------|---------|
| `lib/printify/client.ts` | Base HTTP client with auth + rate limiting |
| `lib/printify/types.ts` | All Printify API types |
| `lib/printify/catalog.ts` | Catalog queries |
| `lib/printify/products.ts` | Product CRUD |
| `lib/printify/orders.ts` | Order submission |
| `lib/printify/uploads.ts` | Image management |
| `lib/printify/webhooks.ts` | Webhook management |

# Components

## UI Base Components (`components/ui/`)

| Component | File | Description |
|-----------|------|-------------|
| Button | `button.tsx` | CVA-styled button with variants: default, destructive, outline, secondary, ghost, link |
| Input | `input.tsx` | Styled text input field |
| Textarea | `textarea.tsx` | Styled textarea |
| Select | `select.tsx` | Styled select dropdown |
| Badge | `badge.tsx` | Status badge (used for order status, etc.) |
| Card | `card.tsx` | Card container with header, content, footer |
| Dialog | `dialog.tsx` | Modal dialog with overlay |
| Label | `label.tsx` | Form label component |

All UI components follow shadcn/ui conventions. Sourced from `components/ui/` with Tailwind-based styling.

## Layout Components (`components/layout/`)

### Navbar (`navbar.tsx`)
Responsive navigation bar. Server component shell with client sub-components.
- **Left**: Logo/brand link to home
- **Center**: Desktop nav links (Browse, Cart)
- **Right**: Theme toggle, Cart link with count badge, User menu (Account, Admin, Logout), Sign-in button
- **Mobile**: Hamburger menu with full nav overlay
- Adapts for authenticated vs anonymous users

### Footer (`footer.tsx`)
Simple footer with copyright year.

## Landing Page Components (`components/landing/`)

### Hero (`hero.tsx`)
Full-width hero section with:
- Headline and subtitle
- "Browse Products" primary CTA (default variant, glow-pulse animation)
- "Get Started" secondary CTA (outline variant)
- Animated floating particles background

### FeaturedGrid (`featured-grid.tsx`)
Grid of featured product cards for the landing page.

### CTASection (`cta-section.tsx`)
Bottom call-to-action section. Hides for authenticated users (checks `useSession`).

## Product Components (`components/products/`)

### ProductCard (`product-card.tsx`)
Product card for grids and listings. Shows image, title, price (with sale price), and category badge.

### ProductDetail (`product-detail.tsx`)
Full product detail view with:
- Image gallery with thumbnails
- Product title, description, pricing
- Framer-motion entrance animations
- Add to Cart button

### AddToCartButton (`add-to-cart-button.tsx`)
Client component that adds a product to the Zustand cart store. Shows toast confirmation.

### ProductForm (`product-form.tsx`)
Admin product create/edit form with:
- Title, slug, description, price, sale price
- Category selector
- Image URL management (add/remove multiple URLs with alt text)
- File upload with name and size

## Account Components (`components/account/`)

### DownloadButton (`download-button.tsx`)
Per-order file download button. Calls download API, handles loading/error states.

### AccountActions (`account-actions.tsx`)
Contains:
- `DeleteAccountButton` — Two-step confirmation dialog, deletes all user data, signs out
- `DownloadAllButton` — Fetches all purchase download URLs and opens them

## Theme Provider

`components/theme-provider.tsx` — React context for dark/light theme. Syncs with Zustand theme store and applies `dark` class to `<html>`. An inline `<script>` in the root layout prevents theme flash by reading localStorage before React hydrates.

## Storefront Page Components

Located directly in `app/(storefront)/`:
- **Home page** (`page.tsx`): Hero, FeaturedGrid, CTASection. Uses `force-dynamic`.
- **Products page** (`products/page.tsx`): Product grid with search, category filter, sort, pagination
- **Product detail** (`products/[slug]/page.tsx`): ProductDetail component wrapping

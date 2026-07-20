# Frontend Code Review

**Date:** 2026-07-20
**Scope:** All storefront pages, admin pages, UI components, cart store
**Reviewer:** opencode

---

## Critical (must fix now)

### C1. Variant selection is completely broken — `selectedId={null}` and `onSelect={() => {}}` are never wired

**Files:** `apps/web/app/(storefront)/products/[slug]/page.tsx:62-63`
**Problem:** `VariantSelector` receives `selectedId={null}` and `onSelect={() => {}}` — there is no state to track which variant the user has selected. All variant selector buttons are visual-only; clicking them does nothing.
**Fix:** Add `useState` for selected variant ID, wire `onSelect` to update it, and pass the selected ID to `AddToCartButton` instead of `product.variants[0]?.id`.

### C2. AddToCartButton always adds the first variant regardless of user selection

**File:** `apps/web/app/(storefront)/products/[slug]/page.tsx:68-75`
**Problem:** `variantId={product.variants[0]?.id}`, `size={product.variants[0]?.size ?? ""}`, `color={product.variants[0]?.color ?? ""}`. Even though `VariantSelector` lets the user "browse" options, the add-to-cart payload is always the first variant.
**Fix:** C1's fix resolves this — pass the selected variant's data instead of `product.variants[0]`.

### C3. Razorpay create-order endpoint receives no amount/items from the client

**File:** `apps/web/components/storefront/checkout/razorpay-button.tsx:36`
**Problem:** `fetch("/api/razorpay/create-order", { method: "POST" })` sends an empty POST body. The cart is stored only in Zustand (client `localStorage`) — the server has no way of knowing the order total or items. The server either guesses a zero amount or must look up a server-side cart, which doesn't exist.
**Fix:** Send the items/total in the POST body: `body: JSON.stringify({ amount: total, items, shippingAddress })`.

### C4. Admin order detail page uses sync `params` in Next.js 15 (params must be async/Promise)

**File:** `apps/web/app/admin/orders/[id]/page.tsx:3`
**Problem:** `{ params: { id: string } }` should be `{ params: Promise<{ id: string }> }` per Next.js 15 conventions. The `params.id` is read synchronously, which will break in future Next.js versions.
**Fix:** `const { id } = await params;` and update the type signature.

---

## Important (fix before production)

### I1. Products page Suspense wraps the grid but data fetching is outside the boundary

**File:** `apps/web/app/(storefront)/products/page.tsx:16-34`
**Problem:** `await productRepo.list(...)` blocks rendering before the `Suspense` boundary is reached. The `Suspense` fallback is never shown because the data is already loaded. The skeleton in the fallback also uses `grid-cols-4` but the actual grid uses responsive columns.
**Fix:** Move the data fetch inside a component wrapped by Suspense, or match skeleton columns to the responsive grid.

### I2. Pagination component exists but is never rendered on the products page

**File:** `apps/web/app/(storefront)/products/page.tsx` (missing import/usage)
**Problem:** `Pagination` is defined in `shared/pagination.tsx` but not imported or rendered on the products page. Users can only see the first page of results.
**Fix:** Import and render `<Pagination currentPage={result.page} totalPages={result.totalPages} />`.

### I3. Cart summary ignores coupon discounts entirely

**File:** `apps/web/components/storefront/cart/cart-summary.tsx:6-8`
**Problem:** `CouponInput` exists but `CartSummary` never uses it — no coupon state, no discount subtraction. The total is always `subtotal + shipping`.
**Fix:** Integrate coupon state into `CartSummary`, pass discount to calculation, or wire the `CouponInput` into the summary display.

### I4. Newsletter signup form has no API call — submits silently

**File:** `apps/web/components/storefront/blocks/newsletter-block.tsx:12-14`
**Problem:** `handleSubmit` calls `e.preventDefault()` and does nothing. Users fill in their email, click Subscribe, and nothing happens.
**Fix:** Add a `fetch` call to a newsletter API endpoint with the email.

### I5. Contact form has no submit handler — refreshes page on submit

**File:** `apps/web/app/(marketing)/contact/page.tsx:34`
**Problem:** The `<form>` has no `onSubmit` handler. Submitting the form causes a full page reload with no data being sent anywhere.
**Fix:** Add client component with form handler that POSTs to an API endpoint.

### I6. Admin product form fields don't update when edit data loads from API

**File:** `apps/web/components/admin/products/product-form.tsx:30-37`
**Problem:** `useState(product?.title ?? "")` — the initial values are captured from the first render only. The `useQuery` for the product fires asynchronously; by the time data returns, the state has already initialized to empty strings. The form always shows blank in edit mode regardless of product data.
**Fix:** Use `useEffect` to populate state when `product` changes, or use a single state object initialized via `useEffect` on data load.

### I7. Admin customers detail page never populates notes state

**File:** `apps/web/app/admin/customers/[id]/page.tsx:27-28`
**Problem:** `setOrders(data.orders ?? [])` is called but `setNotes` is never invoked. The notes array stays `[]` forever, so the "Order Notes" section always shows "No notes."
**Fix:** Extract notes from the response and call `setNotes(data.notes ?? [])`.

### I8. Checkout form lacks field-level validation

**File:** `apps/web/components/storefront/checkout/checkout-form.tsx:18`
**Problem:** `isComplete` is just a truthy check on all fields. No email format validation, phone format, pincode format. Invalid data passes through to Razorpay.
**Fix:** Add field validation (email regex, phone digits, pincode length/pattern) before enabling the payment button.

### I9. Admin orders list and logs have no request cancellation on unmount

**Files:** `apps/web/components/admin/orders/order-table.tsx:50`, `apps/web/components/admin/logs/audit-log-viewer.tsx:43`
**Problem:** `fetch` in `useEffect` with no `AbortController`. If the component unmounts before the fetch completes, `setOrders`/`setData` is called on an unmounted component (React warning + potential memory leak).
**Fix:** Use `AbortController` and clean up in the `useEffect` return.

### I10. OrderActions has no error handling — API failure is invisible

**File:** `apps/web/components/admin/orders/order-actions.tsx:18-22`
**Problem:** The `fetch` result is not checked with `.ok` and errors are not caught. If the PATCH fails, the button re-enables with no feedback.
**Fix:** Check `res.ok`, catch errors, and show toast/error state.

### I11. Recently blocked 404 page when params.id doesn't exist — the url rewrite doesn't signal notFound

**File:** `apps/web/app/admin/orders/[id]/page.tsx:3-4`
**Problem:** The page passes `params.id` directly to `<OrderDetail orderId={params.id} />` which does an API call. If the order doesn't exist, it renders "Failed to load order" but doesn't call `notFound()`.
**Fix:** Check the error status and call `notFound()` for 404 responses.

### I12. `grid-cols-4` skeleton on products page doesn't match responsive grid

**File:** `apps/web/app/(storefront)/products/page.tsx:31`
**Problem:** Fallback `<div className="grid grid-cols-4 gap-6">` shows 4 columns at all breakpoints, but the actual grid is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
**Fix:** Match the skeleton to the responsive grid classes.

### I13. Auth redirect on checkout doesn't preserve cart after login

**File:** `apps/web/app/(storefront)/checkout/page.tsx:9`
**Problem:** `redirect("/login?redirect=/checkout")` — after login, the user lands on `/checkout` but the client-side Zustand cart (in localStorage) should persist. However, the guest-to-logged-in cart merge happens on login (`login-form.tsx:37`) via `/api/cart/merge`. If the login form redirects to `/account` (line 43), the cart merge has already happened, so the checkout page should show the right items. This works *if* the user logs in via the login page. But if they have an active session from a previous login, they won't hit the merge endpoint, and their cart might be stale.
**Fix:** This is marginal — but consider calling merge on the checkout page mount too.

---

## Minor (nice to fix)

### M1. Navbar has no cart item count badge

**File:** `apps/web/components/storefront/layout/navbar.tsx:31-33`
**Problem:** The cart icon has no badge showing item count. Users can't see how many items are in their cart.
**Fix:** Import and use `useCartStore` to show `items.length` as a badge.

### M2. Mobile menu is never rendered — no hamburger button in navbar

**File:** `apps/web/components/storefront/layout/navbar.tsx` (missing usage), `mobile-menu.tsx` exists unused
**Problem:** The `MobileMenu` component exists but is not rendered anywhere. The navbar has no hamburger toggle on mobile. The desktop nav is hidden with `hidden md:flex` but there's no mobile alternative.
**Fix:** Import `MobileMenu`, add a hamburger button visible on mobile, and wire open/close state.

### M3. Cart drawer does not use proper ARIA dialog pattern

**File:** `apps/web/components/storefront/cart/cart-drawer.tsx`
**Problem:** The drawer is a plain `div` with no `role="dialog"`, `aria-modal`, or focus trapping. Keyboard navigation (Tab, Esc) is not managed.
**Fix:** Add `role="dialog"`, `aria-modal="true"`, focus trap, and Esc key handling.

### M4. Product grid returns null on empty — no "no products" message

**File:** `apps/web/components/storefront/product/product-grid.tsx:15`
**Problem:** `if (products.length === 0) return null;` — users see nothing. The parent page section is also conditionally hidden.
**Fix:** Show an empty state message ("No products found") with a suggestion to browse other categories.

### M5. Breadcrumbs use array index as key

**File:** `apps/web/components/storefront/shared/breadcrumbs.tsx:14`
**Problem:** `<span key={i} ...>` — array index as key is acceptable for static lists but fragile if items are added/reordered.
**Fix:** Use crumb label + href as key: `key={crumb.href ?? crumb.label}`.

### M6. Pagination only shows first 5 pages regardless of current page

**File:** `apps/web/components/storefront/shared/pagination.tsx:34`
**Problem:** `Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1)` always shows pages 1-5. If user is on page 10, they see pages 1-5, not pages around 10.
**Fix:** Calculate a sliding window around the current page.

### M7. `scale-102` is not a standard Tailwind class

**File:** `apps/web/components/storefront/product/product-card.tsx:22`
**Problem:** `group-hover:scale-102` — Tailwind's default scale utilities go up to `scale-100` (or `scale-110`, `scale-125`). `scale-102` won't apply unless custom theme config exists.
**Fix:** Use `group-hover:scale-105` or configure the custom value in `tailwind.config`.

### M8. Customer table "Last Order" column shows amount instead of date

**File:** `apps/web/components/admin/crm/customer-table.tsx:37-40`
**Problem:** Column header says "Last Order" but cell renders the amount of the last order, not the order date or a link to the order.
**Fix:** Show `orders[0]?.createdAt` as a formatted date (or both date and amount).

### M9. Admin dashboard shows PAID orders only in Recent Orders

**File:** `apps/web/components/admin/dashboard/recent-orders.tsx:10`
**Problem:** `?limit=5&status=PAID` — only PAID orders appear. Recently placed orders with PENDING_PAYMENT or orders in PROCESSING/PRINTING/SHIPPED status don't show.
**Fix:** Remove `&status=PAID` or add a more inclusive filter.

### M10. Cart store item ID uses string concatenation — fragile

**File:** `apps/web/stores/cart-store.ts:27`
**Problem:** `id: ${productId}-${variantId}` — if variantId contains a `-`, parsing the ID back becomes ambiguous. A collision could occur if productId is "a-b" and variantId is "c" vs productId "a" and variantId "b-c".
**Fix:** Use structured ID or a more robust separator.

### M11. NewsletterBlock unused `content` prop

**File:** `apps/web/components/storefront/blocks/newsletter-block.tsx:9`
**Problem:** The component accepts `content` but ignores it entirely. The CmsPage passes no content anyway (`<NewsletterBlock key={i} />`).
**Fix:** Remove the prop or use it for custom heading/subtitle.

### M12. Admin settings form depends on `form ?? settings` pattern — fragile race condition

**File:** `apps/web/app/admin/settings/page.tsx:40`
**Problem:** `const current = form ?? settings;` — if the user edits a field, `form` becomes a partial object spread from current. If `settings` data hasn't loaded yet, `current` evaluates to `null` (since `form` is null and `settings` is undefined during loading), which moves to the loading state. Works but brittle.
**Fix:** Manage form state more explicitly — copy settings into form state after load completes.

### M13. Coupon form doesn't validate endDate > startDate

**File:** `apps/web/components/admin/promotions/coupon-form.tsx:62-65`
**Problem:** Start date is required but no validation that end date is after start date. A coupon could be created with end date before start date.
**Fix:** Add validation: if both dates are set, `endDate >= startDate`.

### M14. Register form has no password confirmation field

**File:** `apps/web/components/auth/register-form.tsx:72-78`
**Problem:** Only one password field. Users can type a password they can't see (type="password") with no confirmation. If they mistype, they're locked out.
**Fix:** Add a "Confirm Password" field and validate that both match.

### M15. Login form uses `FormData` (uncontrolled) instead of controlled state

**File:** `apps/web/components/auth/login-form.tsx:19-21`
**Problem:** `new FormData(e.currentTarget)` — okay for simple forms, but inconsistent with the rest of the codebase (most other forms use controlled `useState` + `onChange`). Also makes it harder to add client-side validation.
**Fix:** Use controlled inputs like checkout form does, or keep as-is since it's simpler.

### M16. The account page shows "No orders yet" without checking the API

**File:** `apps/web/app/(storefront)/account/page.tsx:34`
**Problem:** The orders section statically says "No orders yet." — it never queries the user's actual order history.
**Fix:** Fetch and display the user's orders from the API.

### M17. Topbar fetches `/api/auth/session` redundantly every mount

**File:** `apps/web/components/admin/layout/topbar.tsx:7`
**Problem:** Auth session is fetched on every mount without caching or using `useSession` from next-auth (which is already used in the Navbar). This creates an unnecessary HTTP request.
**Fix:** Use `useSession()` from `next-auth/react` if available, or cache the result.

### M18. Client-side data-tables commit `window.location.href = href` directly instead of using Next.js router

**File:** `apps/web/components/ui/data-table.tsx:42`
**Problem:** `window.location.href = href` causes a full page navigation instead of a client-side transition. This loses React state and causes unnecessary reloads.
**Fix:** Accept and use `useRouter().push(href)` via a callback prop or a wrapper.

### M19. Page editor preview shows raw JSON for block content

**File:** `apps/web/components/admin/cms/page-editor.tsx:222`
**Problem:** `JSON.stringify(block.content)` — admin users see raw JSON in the block list, which is not user-friendly.
**Fix:** Show a human-readable summary (e.g., "Heading: ...", "Button: ...").

### M20. NewsletterBlock and some other block components lack `key` props

**File:** `apps/web/components/admin/cms/page-editor.tsx:214`
**Problem:** Blocks use `key={i}` (array index) — if blocks are reordered, React may misidentify them.
**Fix:** Generate unique IDs for blocks instead of using array index.

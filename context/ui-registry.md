# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## Baseline — Established 2026-07-19

### Navbar (Storefront)
File: `components/storefront/layout/navbar.tsx`
| Property | Class |
|----------|-------|
| Background | `bg-background/95 backdrop-blur-sm` |
| Border | `border-b border-border` |
| Height | `h-16` |
| Padding | `px-4 md:px-6 lg:px-8` |
| Logo | `text-xl font-bold text-foreground` |
| Nav links | `text-sm font-medium text-foreground-muted hover:text-foreground` |
| Cart icon | `relative` with item count badge |
| Position | `sticky top-0 z-50` |

### Footer (Storefront)
File: `components/storefront/layout/footer.tsx`
| Property | Class |
|----------|-------|
| Background | `bg-surface` |
| Border | `border-t border-border` |
| Padding | `px-4 md:px-6 lg:px-8 py-12` |
| Text | `text-sm text-foreground-muted` |
| Grid | `grid-cols-2 md:grid-cols-4 gap-8` |

### Announcement Bar
File: `components/storefront/layout/announcement-bar.tsx`
| Property | Class |
|----------|-------|
| Background | `bg-accent` |
| Text | `text-xs text-accent-foreground text-center` |
| Height | `h-8` |
| Overflow | `overflow-hidden` (for marquee text) |

### Mobile Menu
File: `components/storefront/layout/mobile-menu.tsx`
| Property | Class |
|----------|-------|
| Background | `bg-background` |
| Width | `w-full max-w-sm` |
| Animation | slide from right |
| Nav links | `text-lg font-medium py-4 border-b border-border` |

### Hero Banner
File: `components/storefront/home/hero-banner.tsx`
| Property | Class |
|----------|-------|
| Min height | `min-h-[400px] md:min-h-[500px] lg:min-h-[600px]` |
| Background | `bg-surface` |
| Inner width | `max-w-7xl mx-auto px-4 md:px-6 lg:px-8` |
| Heading | `text-4xl md:text-5xl lg:text-6xl font-bold text-foreground` |
| Subtitle | `text-lg md:text-xl text-foreground-muted mt-4` |
| CTA button | `mt-8` primary button style |

### Product Card
File: `components/storefront/product/product-card.tsx`
| Property | Class |
|----------|-------|
| Container | `bg-surface-raised border border-border rounded-lg overflow-hidden` |
| Image wrapper | `aspect-square relative overflow-hidden` |
| Image hover | `scale-102 transition-transform duration-300` |
| Content padding | `p-4` |
| Title | `text-sm font-medium text-foreground truncate` |
| Price | `text-sm text-foreground-muted mt-1` |
| Hover overlay | `absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors` |

### Product Grid
File: `components/storefront/product/product-grid.tsx`
| Property | Class |
|----------|-------|
| Grid | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6` |
| Padding | `px-4 md:px-6 lg:px-8 max-w-7xl mx-auto` |

### Product Gallery (PDP)
File: `components/storefront/product/product-gallery.tsx`
| Property | Class |
|----------|-------|
| Main image | `aspect-square relative rounded-lg overflow-hidden` |
| Thumbnails | `grid grid-cols-4 gap-2 mt-4` |
| Thumbnail | `aspect-square relative rounded-md overflow-hidden cursor-pointer border-2` |
| Active thumb | `border-accent` |

### Variant Selector
File: `components/storefront/product/variant-selector.tsx`
| Property | Class |
|----------|-------|
| Color swatch | `w-8 h-8 rounded-full border-2 border-border cursor-pointer` |
| Active swatch | `border-accent ring-2 ring-accent` |
| Size button | `px-4 py-2 rounded-md border border-border text-sm cursor-pointer` |
| Active size | `bg-accent text-accent-foreground border-accent` |
| Label | `text-sm font-medium text-foreground mb-2` |

### Add to Cart Button
File: `components/storefront/product/add-to-cart-button.tsx`
| Property | Class |
|----------|-------|
| Base | Primary button style |
| Width | `w-full` |
| Text | `text-sm font-medium` |
| States | default, loading, success, error, sold-out |

### Cart Drawer
File: `components/storefront/cart/cart-drawer.tsx`
| Property | Class |
|----------|-------|
| Width | `w-full max-w-md` |
| Background | `bg-background` |
| Shadow | `shadow-xl` |
| Position | `fixed right-0 top-0 h-full z-50` |
| Header | `p-4 border-b border-border flex justify-between items-center` |
| Items | `flex-1 overflow-y-auto p-4` |
| Footer | `p-4 border-t border-border` |

### Cart Item Row
File: `components/storefront/cart/cart-item-row.tsx`
| Property | Class |
|----------|-------|
| Layout | `flex gap-4 py-4` |
| Image | `w-20 h-20 relative rounded-md overflow-hidden flex-shrink-0` |
| Details | `flex-1 min-w-0` |
| Title | `text-sm font-medium text-foreground truncate` |
| Variant | `text-xs text-foreground-faint` |
| Quantity | `flex items-center gap-2` |
| Price | `text-sm font-medium text-foreground` |
| Remove | `text-xs text-foreground-faint hover:text-error` |

### Checkout Form
File: `components/storefront/checkout/checkout-form.tsx`
| Property | Class |
|----------|-------|
| Layout | `grid grid-cols-1 lg:grid-cols-2 gap-8` |
| Form section | `space-y-6` |
| Order summary | `bg-surface rounded-lg p-6` |
| Pay button | Primary button style, `w-full mt-6` |

### Razorpay Button
File: `components/storefront/checkout/razorpay-button.tsx`
| Property | Class |
|----------|-------|
| Base | Primary button style, `w-full` |
| Text | `text-sm font-medium` |
| States | default ("Pay ₹XXX"), loading (spinner), processing, error |
| Disabled | `opacity-50 cursor-not-allowed` while order being created |

---

## Admin Shell
File: `components/admin/layout/admin-shell.tsx`
| Property | Class |
|----------|-------|
| Layout | `flex h-screen` |
| Sidebar | `w-64 flex-shrink-0 hidden lg:block` |
| Main | `flex-1 flex flex-col overflow-hidden` |
| Content | `flex-1 overflow-y-auto p-6` |

### Sidebar
File: `components/admin/layout/sidebar.tsx`
| Property | Class |
|----------|-------|
| Background | `bg-surface-inverse text-foreground-inverse` |
| Width | `w-64` |
| Padding | `p-4` |
| Nav item | `flex items-center gap-3 px-3 py-2 rounded-lg text-sm` |
| Active nav | `bg-white/10 text-white` |
| Hover nav | `bg-white/5 text-white/80` |

### Topbar (Admin)
File: `components/admin/layout/topbar.tsx`
| Property | Class |
|----------|-------|
| Background | `bg-surface-raised` |
| Border | `border-b border-border` |
| Height | `h-16` |
| Padding | `px-6` |

### Data Table
File: `components/ui/data-table.tsx`
| Property | Class |
|----------|-------|
| Wrapper | `bg-surface-raised border border-border rounded-lg overflow-hidden` |
| Table | `w-full` |
| Header | `bg-surface text-xs uppercase tracking-wider text-foreground-faint font-medium` |
| Header cell | `px-4 py-3 text-left` |
| Body cell | `px-4 py-3 text-sm border-t border-border` |
| Row hover | `bg-surface/50` |

### Stat Card
File: `components/admin/dashboard/stat-card.tsx`
| Property | Class |
|----------|-------|
| Container | `bg-surface-raised border border-border rounded-lg p-6` |
| Label | `text-sm text-foreground-faint` |
| Value | `text-2xl font-bold text-foreground mt-1` |
| Change | `text-xs mt-2` (green for positive, red for negative) |

### Status Badge
File: `components/shared/status-badge.tsx`
| Property | Class |
|----------|-------|
| Base | `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium` |
| Paid/Shipped/Delivered | `bg-success-background text-success` |
| Pending/Processing | `bg-warning-background text-warning` |
| Failed/Cancelled/Refunded | `bg-error-background text-error` |
| Draft/Archived | `bg-surface text-foreground-muted` |

### Filter Panel
File: `components/storefront/shared/filter-panel.tsx`
| Property | Class |
|----------|-------|
| Layout | `space-y-6` |
| Section | `border-b border-border pb-6` |
| Section title | `text-sm font-medium text-foreground mb-3` |
| Desktop | sidebar on left of product grid |
| Mobile | slide-out drawer triggered by filter button |

### Pagination
File: `components/storefront/shared/pagination.tsx`
| Property | Class |
|----------|-------|
| Layout | `flex items-center justify-center gap-1 mt-8` |
| Page button | `px-3 py-2 text-sm rounded-md border border-border` |
| Active page | `bg-accent text-accent-foreground border-accent` |
| Disabled | `opacity-50 cursor-not-allowed` |

### Search Bar
File: `components/storefront/shared/search-bar.tsx`
| Property | Class |
|----------|-------|
| Container | `relative w-full max-w-md` |
| Input | `w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm` |
| Icon | `absolute left-3 top-1/2 -translate-y-1/2 text-foreground-faint` |

### Breadcrumbs
File: `components/storefront/shared/breadcrumbs.tsx`
| Property | Class |
|----------|-------|
| Layout | `flex items-center gap-2 text-sm text-foreground-faint py-4` |
| Link | `hover:text-foreground` |
| Separator | `/` or chevron icon |
| Current | `text-foreground font-medium` |

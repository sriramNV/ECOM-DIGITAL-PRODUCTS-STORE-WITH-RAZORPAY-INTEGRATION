# POD E-Commerce Platform — Master Implementation Index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement plans sequentially. Execute plans in numeric order — each depends on its predecessor.

**Goal:** Build a production-grade Print-on-Demand e-commerce platform from scratch

**Architecture:** Next.js 16 App Router monorepo with PostgreSQL (Prisma ORM), Redis caching/jobs, MinIO storage, Razorpay payments, and Printify fulfillment. Admin dashboard, storefront, CMS, analytics, and email automation in a Docker-deployed stack.

**Tech Stack:** Next.js 16, TypeScript strict, Tailwind CSS v4, shadcn/ui, Prisma, PostgreSQL 16, Redis 7, Zustand, TanStack Query, Razorpay, Printify API, MinIO, Bull, Zod, Nodemailer, PostHog, Pino, Vitest, Playwright

---

## Plan Decomposition

The project is split into 9 independent plans. Each produces working, testable software. Execute strictly in order.

| # | Plan | Depends On | Deliverable |
|---|------|------------|-------------|
| 01 | Foundation & Project Setup | — | Scaffolded monorepo, Docker infra, Prisma schema, Tailwind tokens, base libs |
| 02 | Authentication & Users | 01 | Login/register, sessions, admin middleware, user model |
| 03 | Product Catalog | 02 | Product/variant/category models, API, storefront listing + detail pages |
| 04 | Cart & Checkout | 03 | Zustand cart, guest→DB cart merge, Razorpay payment, order creation |
| 05 | Printify Integration | 04 | Printify API client, automated fulfillment, webhook status updates |
| 06 | Admin Dashboard | 05 | Admin shell, order/product/customer management UI |
| 07 | CMS & Promotions | 06 | Block-based page editor, banners, collections, coupons, flash sales |
| 08 | Analytics & Operations | 07 | Recharts dashboards, PostHog events, audit logs, settings, monitoring |
| 09 | Production Readiness | 08 | Email automation, security hardening, Docker deployment, CI/CD |

---

## Shared Conventions (All Plans)

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Component files | PascalCase | `ProductCard.tsx` |
| Utility/lib files | camelCase | `prisma.ts` |
| API routes | kebab-case | `create-order/route.ts` |
| Type files | camelCase | `product.ts` |
| Hooks | kebab-case | `use-cart.ts` |
| Stores | kebab-case | `cart-store.ts` |
| Test files | `*.test.ts` or `*.test.tsx` | `pricing-service.test.ts` |

### Component Standards

- Named exports only, no default exports
- Props type defined above component
- Server Components by default, `"use client"` only when needed
- No inline styles except computed-at-runtime
- Every interactive element has `aria-label` or accessible text

### API Route Standards

- Every route validates input with Zod
- Every mutation checks authentication (except webhooks/public)
- Returns `NextResponse` — never `Response`
- HTTP status codes: 200, 201, 400, 401, 404, 422, 500

### Testing Standards

- Vitest for unit/integration, Playwright for E2E
- Tests co-located with source: `*.test.ts` next to implementation
- Repository functions: integration tests
- Service functions: unit tests with mocks
- No tests for shadcn/ui primitives (tested upstream)

### Commit Convention

```
type: short description

- type: feat, fix, refactor, test, chore, docs
- lowercase after colon
- no period at end
```

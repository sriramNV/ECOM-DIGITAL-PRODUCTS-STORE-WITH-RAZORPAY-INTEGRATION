# Contributing to POD

## Getting Started

### Prerequisites

- **Node.js** 20+ (with [corepack](https://nodejs.org/api/corepack.html) enabled for pnpm)
- **pnpm** 9+ (`corepack enable && corepack prepare pnpm@9 --activate`)
- **Docker Desktop** (for PostgreSQL, Redis, MinIO)
- **Git**

### Setup

```bash
# Clone the repository
git clone <repo-url> pod
cd pod

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env as needed — defaults work for local Docker services

# Start infrastructure (PostgreSQL, Redis, MinIO)
docker compose up -d postgres redis minio

# Initialize the database
cd apps/web
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
cd ../..

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The seed creates an admin user at `admin@example.com` / `admin123`.

## Codebase Overview

```
pod/
├── apps/
│   └── web/                # Next.js storefront + admin panel + API
│       ├── app/            # App Router — pages, layouts, API routes
│       ├── components/     # React components (ui/, storefront/, admin/)
│       ├── lib/            # Utilities, repositories, helpers
│       ├── stores/         # Zustand client state stores
│       ├── providers/      # React context providers
│       ├── hooks/          # Custom React hooks
│       ├── data/           # Static/data-layer files
│       ├── prisma/         # Database schema, migrations, seed
│       └── types/          # Shared TypeScript types
├── packages/
│   └── shared/             # Shared types, constants, utilities
└── docs/                   # Documentation
```

Key conventions:
- **TypeScript**: strict mode enabled, `@/` path alias maps to `apps/web/`
- **Package manager**: pnpm workspaces via `pnpm-workspace.yaml`
- **Build system**: Turborepo (`turbo.json`) orchestrates dev/build/lint tasks
- **Database**: Prisma ORM with PostgreSQL, repositories layer for data access

## Development Workflow

### Branch Naming

- `feature/<description>` — new features
- `fix/<description>` — bug fixes
- `chore/<description>` — tooling, dependencies, CI

### Running the Dev Server

```bash
pnpm dev     # Starts all apps via Turborepo (Next.js on port 3000)
```

### Code Quality

```bash
pnpm lint       # ESLint across all workspaces
pnpm format     # Prettier formatting
pnpm test       # Vitest unit tests
pnpm test:e2e   # Playwright E2E tests
pnpm build      # Type-check + build (strict TypeScript enforced)
```

## Code Conventions

### TypeScript

- Strict mode is enabled — avoid `any`, use proper types
- Use the `@/` path alias for imports within `apps/web/` (e.g., `import { prisma } from "@/lib/prisma"`)
- Prefer `type` over `interface` for props and return types (project convention)

### Formatting

Prettier is configured with:
- Semicolons
- Double quotes
- Trailing commas (all)
- 100 character print width
- 2 space indentation

Run `pnpm format` before committing.

### Components

- **UI primitives** go in `components/ui/` following shadcn/ui conventions
- **Storefront components** in `components/storefront/<section>/`
- **Admin components** in `components/admin/<section>/`
- Use `cva` (Class Variance Authority) for component variants
- Use the `cn()` utility for conditional class merging (re-exported from `@/lib/utils`)

### API Routes

API routes live in `apps/web/app/api/<route>/route.ts`. Each handler:

1. Uses **Zod** schemas for request body/query validation
2. Wraps logic in `try/catch` with `logger.error` for error reporting
3. Calls `adminGuard()` for admin-only routes (imported from `@/lib/admin-guard`)
4. Uses repositories for all database access — **no direct Prisma calls in route handlers**

### Data Access

All database queries go through **repository functions** in `apps/web/lib/repositories/`. This keeps business logic separate from the ORM and makes testing easier. If a repository doesn't exist for your model, create one.

### State Management

- **Server state** (API data, cache): React Query (TanStack Query)
- **Client state** (UI state, cart, preferences): Zustand stores in `apps/web/stores/`

## Pull Request Process

1. **Keep PRs focused** — one feature or fix per PR
2. **Write descriptive titles and descriptions** — explain what and why
3. **Ensure all tests pass** — run `pnpm test` and `pnpm test:e2e` locally
4. **Request review** from a maintainer
5. **Squash merge** on approval — keep the commit history clean

## Commit Guidelines

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add product image upload
fix: resolve cart total miscalculation
chore: update Prisma to 5.22
docs: update API route documentation
refactor: extract order validation logic
test: add unit tests for coupon repo
```

## Adding New Features

Walk through the full stack when adding a new feature:

1. **Model**: Add the model to `apps/web/prisma/schema.prisma`, then run `cd apps/web && npx prisma migrate dev --name <name>`
2. **Repository**: Create a repository in `apps/web/lib/repositories/` with typed query methods
3. **API route**: Create the route at `apps/web/app/api/<route>/route.ts` with Zod validation, error handling, and `adminGuard()` where needed
4. **Component**: Build the UI — Server Component for data fetching, Client Component (`"use client"`) for interactivity
5. **Navigation**: If the feature adds an admin page, register it in `components/admin/layout/nav-items.ts`
6. **Tests**: Write unit tests in `__tests__` directories next to source files, and E2E tests in the Playwright test directory

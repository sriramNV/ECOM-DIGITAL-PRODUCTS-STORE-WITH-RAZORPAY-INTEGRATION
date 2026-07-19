# Task 1.1: Scaffold Next.js 16 monorepo

**Plan:** Plan 01 — Foundation & Project Setup
**Depends on:** Nothing (first task)
**Produces:** Monorepo scaffold that `pnpm install` can resolve

## Files to Create

- `package.json` (root)
- `turbo.json`
- `pnpm-workspace.yaml`
- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/next.config.ts`
- `.gitignore`
- `.prettierrc`
- `.env.example`
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`

## Steps

### Step 1: Initialize root package.json

```json
{
  "name": "pod",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "prettier": "^3.4.0",
    "turbo": "^2.0.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": { "node": ">=20.0.0" }
}
```

### Step 2: Create turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] }
  }
}
```

### Step 3: Create pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Step 4: Create apps/web/package.json

```json
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "typescript": "^5.6.0"
  }
}
```

### Step 5: Create apps/web/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./apps/web/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Step 6: Create apps/web/next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.printify.com" },
      { protocol: "https", hostname: "cdn.printify.com" },
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
```

### Step 7: Create .gitignore

```
node_modules/
.next/
*.local
.env
.env.local
!.env.example
dist/
.turbo/
coverage/
test-results/
```

### Step 8: Create .prettierrc

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100
}
```

### Step 9: Create .env.example

```env
# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://pod:password@localhost:5432/pod

# Redis
REDIS_URL=redis://localhost:6379

# Auth
AUTH_SECRET=generate-a-random-64-char-secret

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Printify
PRINTIFY_API_TOKEN=
PRINTIFY_SHOP_ID=
PRINTIFY_WEBHOOK_SECRET=

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_PUBLIC_URL=localhost:9000

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Logging
LOG_LEVEL=debug
```

### Step 10: Create packages/shared/package.json

```json
{
  "name": "@pod/shared",
  "version": "0.1.0",
  "private": true,
  "main": "./types/index.ts",
  "types": "./types/index.ts"
}
```

### Step 11: Create packages/shared/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["**/*.ts"]
}
```

### Step 12: Install dependencies and verify

```bash
pnpm install
pnpm dev
```

Expected: `pnpm dev` starts Next.js dev server on localhost:3000 with empty page.

## Notes

- This is a pnpm workspace monorepo with Turborepo
- No shadcn/ui components yet — those come in Task 1.6
- The `@/*` path alias maps to `./apps/web/*`
- After creating all files, run `pnpm install` and verify `pnpm dev` starts
- There are no existing files in the repo — everything is new

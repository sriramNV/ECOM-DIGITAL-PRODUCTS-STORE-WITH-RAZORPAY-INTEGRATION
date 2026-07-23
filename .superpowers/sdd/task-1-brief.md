# Task 1: Clean Up Existing Project

## Context
This is the first task of building a digital products platform. The current workspace (`D:\Projects\web\pod`) contains an old POD e-commerce project that must be removed.

## Requirements

**Files to DELETE:**
- `apps/` (entire directory — old Next.js app)
- `packages/` (entire directory)
- `prisma/` (entire directory — old schema)
- `scripts/` (entire directory)
- `tests/` (entire directory)
- `nginx/` (entire directory)
- `.turbo/` (entire directory)
- `playwright-report/` (entire directory)
- `test-results/` (entire directory)
- `node_modules/` (entire directory)
- `CONTRIBUTING.md`
- `DEPLOYMENT.md`
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `Dockerfile.dev`
- `playwright.config.ts`
- `vitest.config.ts`
- `turbo.json`
- `pnpm-lock.yaml`
- `.prettierrc`
- `pnpm-lock.yaml`
- `.next-dev*.log` files
- `dev-server*.log` files
- `dev-server-err.log`

**Files to PRESERVE:**
- `.git/`
- `.gitignore`
- `.env.example`
- `.opencode/`
- `.superpowers/`
- `docs/` (all files — the spec and plan docs)
- `skills-lock.json`
- `AGENTS.md` (if it exists in root)
- `.env` (if it exists)

**Files to CREATE:**
- `package.json` at root:
```json
{
  "name": "digital-products",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter web dev",
    "build": "pnpm --filter web build",
    "start": "pnpm --filter web start",
    "lint": "pnpm --filter web lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,json,css,md}\""
  },
  "engines": { "node": ">=20" }
}
```

- `pnpm-workspace.yaml` at root:
```yaml
packages:
  - "apps/*"
```

- `tsconfig.json` at root:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

- `.env.example` at root with:
```
# Database
DATABASE_URL=postgresql://pod:password@localhost:5432/digital-products

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=digital-products

# Auth (NextAuth)
AUTH_SECRET=generate-a-random-hex-string-here
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Steps
1. Delete all old POD source files listed above
2. Preserve essential config files
3. Create root workspace package.json
4. Create pnpm-workspace.yaml
5. Create root tsconfig.json
6. Create .env.example
7. Commit with message: `"chore: clean up POD project, scaffold new workspace"`

## Working Directory
`D:\Projects\web\pod`

## Platform
Windows PowerShell. Use `Remove-Item -Recurse -Force` for deletions, `New-Item` and `Set-Content` for file creation.

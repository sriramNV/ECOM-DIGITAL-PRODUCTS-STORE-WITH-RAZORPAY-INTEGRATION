# Task 2: Scaffold Next.js App + Install Dependencies

## Context
This is the second task. Task 1 cleaned up the old project. Now we need to create the new Next.js application.

## Requirements

### Create `apps/web/package.json`
```json
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next-auth": "5.0.0-beta.25",
    "@auth/prisma-adapter": "^2.0.0",
    "@prisma/client": "^6.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^5.0.0",
    "framer-motion": "^11.0.0",
    "zod": "^3.23.0",
    "bcryptjs": "^2.4.3",
    "sonner": "^1.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/bcryptjs": "^2.4.0",
    "prisma": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "postcss": "^8.4.0",
    "eslint": "^9.0.0",
    "@eslint/eslintrc": "^3.0.0",
    "@eslint/js": "^9.0.0",
    "typescript-eslint": "^8.0.0",
    "prettier": "^3.4.0",
    "prettier-plugin-tailwindcss": "^0.6.0"
  }
}
```

### Create `apps/web/tsconfig.json`
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
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Create `apps/web/next.config.ts`
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { optimizePackageImports: ["lucide-react"] },
};

export default nextConfig;
```

### Install dependencies
Run: `pnpm install` from the root directory (D:\Projects\web\pod)

### Create `.env.local`
Copy `D:\Projects\web\pod\.env.example` to `apps/web/.env.local`

## Steps
1. Create the apps/web directory
2. Create package.json, tsconfig.json, next.config.ts
3. Run `pnpm install`
4. Copy .env.example to apps/web/.env.local
5. Commit with message: `"chore: scaffold Next.js app with dependencies"`

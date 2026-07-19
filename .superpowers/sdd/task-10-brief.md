# Task 2.2: Create auth pages (login + register)

**Plan:** Plan 02 — Authentication & Users
**Depends on:** Task 2.1 (NextAuth config, middleware, register API)
**Produces:** Working login/register UI on `/login` and `/register`

## Files to Create

- `apps/web/app/(auth)/layout.tsx`
- `apps/web/app/(auth)/login/page.tsx`
- `apps/web/app/(auth)/register/page.tsx`
- `apps/web/components/auth/login-form.tsx`
- `apps/web/components/auth/register-form.tsx`
- `prisma/seed.ts`
- Modify: `apps/web/package.json` (add prisma:seed script)

## Steps

### Step 1: Create apps/web/app/(auth)/layout.tsx
```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md bg-surface-raised border border-border rounded-lg p-8 shadow-md">
        {children}
      </div>
    </div>
  );
}
```

### Step 2: Create apps/web/components/auth/login-form.tsx
```typescript
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    // Merge guest cart into DB cart on login
    try {
      await fetch("/api/cart/merge", { method: "POST" });
    } catch {
      // Non-blocking
    }

    router.refresh();
    router.push("/account");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input id="email" name="email" type="email" required className="mt-1" />
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <Input id="password" name="password" type="password" required className="mt-1" />
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
```

### Step 3: Create apps/web/app/(auth)/login/page.tsx
```typescript
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In — POD Store",
};

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-6">Sign In</h1>
      <LoginForm />
      <p className="text-sm text-foreground-muted mt-4 text-center">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}
```

### Step 4: Create apps/web/components/auth/register-form.tsx
```typescript
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get("name") as string,
      email: form.get("email") as string,
      password: form.get("password") as string,
    };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    // Auto-login after registration
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Account created but login failed. Please sign in.");
      setLoading(false);
      return;
    }

    router.refresh();
    router.push("/account");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Name
        </label>
        <Input id="name" name="name" required className="mt-1" />
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input id="email" name="email" type="email" required className="mt-1" />
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <Input id="password" name="password" type="password" required minLength={8} className="mt-1" />
        <p className="text-xs text-foreground-faint mt-1">At least 8 characters</p>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
```

### Step 5: Create apps/web/app/(auth)/register/page.tsx
```typescript
import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Sign Up — POD Store",
};

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-6">Create Account</h1>
      <RegisterForm />
      <p className="text-sm text-foreground-muted mt-4 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
```

### Step 6: Create prisma/seed.ts
```typescript
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@podstore.com";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const password = await hash("admin123", 12);
    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        password,
        role: "ADMIN",
      },
    });
    console.log("Admin user created: admin@podstore.com / admin123");
  } else {
    console.log("Admin user already exists");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

### Step 7: Add seed script to package.json
Add to `apps/web/package.json` scripts:
```json
"prisma:seed": "npx tsx prisma/seed.ts"
```

### Step 8: Run seed and verify
```bash
pnpm --filter web prisma:seed
```

### Step 9: Commit
```bash
git add apps/web/app/\(auth\) apps/web/components/auth prisma/seed.ts
git commit -m "feat: add login and registration pages with admin seed"
```

## Notes

- The `(auth)` directory uses Next.js route groups — URL paths are `/login` and `/register` (no `/auth` prefix)
- Login form calls `/api/cart/merge` on success — this endpoint will be built in Plan 04, so it's wrapped in try/catch
- Seed script creates an admin user for development
- Need `tsx` installed for seed script: `pnpm add -D tsx --filter web`

# Plan 02: Authentication & Users

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use `- [ ]` syntax.

**Goal:** Implement email/password authentication with session management, admin role enforcement, and cart merge on login

**Architecture:** NextAuth v5 (Auth.js) with Credentials provider and JWT sessions. Middleware protects admin routes. Registration is a custom API route. On successful login, guest cart merges into the user's DB cart via `POST /api/cart/merge`.

**Tech Stack:** NextAuth v5, bcryptjs, Zod, Prisma, JWT HttpOnly cookies

---

## Global Constraints

- NextAuth v5 with Credentials provider only (no OAuth for MVP)
- JWT strategy — no database sessions
- Passwords hashed with bcryptjs (cost 12)
- All admin routes protected by middleware (`/admin/*`)
- Auth pages redirect to `/account` if already logged in
- Login triggers `POST /api/cart/merge` to migrate guest cart to DB

---

## File Structure

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx           # Centered card layout for auth pages
│   │   ├── login/page.tsx       # Login form
│   │   └── register/page.tsx    # Registration form
│   └── api/
│       └── auth/
│           ├── [...nextauth]/route.ts  # NextAuth API handler
│           └── register/route.ts       # User registration endpoint
├── components/
│   └── auth/
│       ├── login-form.tsx       # Login form component
│       └── register-form.tsx    # Registration form component
├── lib/
│   └── auth.ts                  # NextAuth configuration
└── middleware.ts                 # Route protection
```

---

### Task 2.1: Install auth dependencies and configure NextAuth

**Files:**
- Create: `apps/web/lib/auth.ts`
- Create: `apps/web/app/api/auth/[...nextauth]/route.ts`
- Create: `apps/web/middleware.ts`
- Create: `apps/web/app/api/auth/register/route.ts`
- Modify: `apps/web/package.json` (add deps)

**Interfaces:**
- Consumes: `prisma` (singleton), `User` model from Plan 01
- Produces: `auth()`, `signIn()`, `signOut()` exports, middleware protection

- [ ] **Step 1: Install auth dependencies**

```bash
pnpm add next-auth@beta bcryptjs @types/bcryptjs --filter web
```

- [ ] **Step 2: Create apps/web/lib/auth.ts**

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import type { Role } from "@/types";

declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    id: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string };

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const isValid = await compare(password, user.password);
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role as Role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id!;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
```

- [ ] **Step 3: Create apps/web/app/api/auth/[...nextauth]/route.ts**

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 4: Create apps/web/middleware.ts**

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "ADMIN";

  if (pathname.startsWith("/admin") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/account") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if ((pathname === "/login" || pathname === "/register") && isLoggedIn) {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/login", "/register"],
};
```

- [ ] **Step 5: Create apps/web/app/api/auth/register/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = await hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "CUSTOMER",
      },
    });

    logger.info({ userId: user.id }, "User registered");

    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    logger.error({ error }, "Registration failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 6: Write registration test**

```typescript
// apps/web/app/api/auth/register/route.test.ts
import { describe, it, expect, beforeAll } from "vitest";

const BASE = "http://localhost:3000/api/auth";

describe("POST /api/auth/register", () => {
  it("rejects invalid email", async () => {
    const res = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test", email: "not-an-email", password: "password123" }),
    });
    expect(res.status).toBe(422);
  });

  it("rejects short password", async () => {
    const res = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test", email: "test@test.com", password: "123" }),
    });
    expect(res.status).toBe(422);
  });
});
```

- [ ] **Step 7: Run test**

```bash
npx vitest run apps/web/app/api/auth/register/route.test.ts
```

Expected: Tests pass.

- [ ] **Step 8: Commit**

```bash
git add apps/web/lib/auth.ts apps/web/app/api/auth apps/web/middleware.ts
git commit -m "feat: add NextAuth v5 with credentials provider and middleware"
```

---

### Task 2.2: Create auth pages (login + register)

**Files:**
- Create: `apps/web/app/(auth)/layout.tsx`
- Create: `apps/web/app/(auth)/login/page.tsx`
- Create: `apps/web/app/(auth)/register/page.tsx`
- Create: `apps/web/components/auth/login-form.tsx`
- Create: `apps/web/components/auth/register-form.tsx`

**Interfaces:**
- Consumes: `signIn()` from `@/lib/auth`
- Produces: working login/register UI on `/login` and `/register`

- [ ] **Step 1: Create apps/web/app/(auth)/layout.tsx**

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

- [ ] **Step 2: Create apps/web/components/auth/login-form.tsx**

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
      // Non-blocking — cart merge failure shouldn't block login
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

- [ ] **Step 3: Create apps/web/app/(auth)/login/page.tsx**

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

- [ ] **Step 4: Create apps/web/components/auth/register-form.tsx**

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

- [ ] **Step 5: Create apps/web/app/(auth)/register/page.tsx**

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

- [ ] **Step 6: Create seed script for admin user**

```typescript
// prisma/seed.ts
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

- [ ] **Step 7: Add seed script to package.json**

```json
// In apps/web/package.json, add to "scripts":
"prisma:seed": "npx tsx prisma/seed.ts"
```

- [ ] **Step 8: Run seed and verify**

```bash
pnpm prisma:seed
```

Expected: Admin user created. Open `/login`, log in with admin@podstore.com / admin123. Redirected to `/account`. Access `/admin` — should work.

- [ ] **Step 9: Commit**

```bash
git add apps/web/app/\(auth\) apps/web/components/auth prisma/seed.ts
git commit -m "feat: add login and registration pages with admin seed"
```

---

## Spec Coverage Check

| Requirement | Task |
|-------------|------|
| NextAuth v5 with credentials provider | 2.1 |
| Login/register pages with Zod validation | 2.2 |
| JWT session in HttpOnly cookies | 2.1 |
| Admin role check middleware | 2.1 |
| Guest cart merge on login | 2.2 (login-form.tsx) |
| Admin user seed script | 2.2 |

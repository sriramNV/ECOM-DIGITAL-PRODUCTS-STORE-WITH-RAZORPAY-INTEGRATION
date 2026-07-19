# Task 2.1: Install auth dependencies and configure NextAuth

**Plan:** Plan 02 — Authentication & Users
**Depends on:** Plan 01 (Prisma User model, lib folder, types)
**Produces:** `auth()`, `signIn()`, `signOut()` exports, middleware protection, register API

## Files to Create

- `apps/web/lib/auth.ts`
- `apps/web/app/api/auth/[...nextauth]/route.ts`
- `apps/web/middleware.ts`
- `apps/web/app/api/auth/register/route.ts`
- Modify: `apps/web/package.json` (add deps)
- Modify: `apps/web/package.json` (add prisma:seed script — actually add in Task 2.2)

## Steps

### Step 1: Install auth dependencies
```bash
pnpm add next-auth@beta bcryptjs --filter web
pnpm add -D @types/bcryptjs --filter web
```

### Step 2: Create apps/web/lib/auth.ts
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

### Step 3: Create apps/web/app/api/auth/[...nextauth]/route.ts
```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

### Step 4: Create apps/web/middleware.ts
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

### Step 5: Create apps/web/app/api/auth/register/route.ts
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

### Step 6: Write registration test
```typescript
// apps/web/app/api/auth/register/route.test.ts
import { describe, it, expect } from "vitest";

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

### Step 7: Run test
```bash
npx vitest run apps/web/app/api/auth/register/route.test.ts
```

### Step 8: Commit
```bash
git add apps/web/lib/auth.ts apps/web/app/api/auth apps/web/middleware.ts
git commit -m "feat: add NextAuth v5 with credentials provider and middleware"
```

## Notes

- The prisma client is already configured from Plan 01
- `@/types` has Role type (from Plan 01 Task 1.5)
- `@/lib/prisma` and `@/lib/logger` exist from Plan 01
- NextAuth v5 uses the new `next-auth@beta` package
- The middleware auth wrapper is the NextAuth v5 pattern

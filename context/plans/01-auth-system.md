# Phase 1 — Authentication System

## Objective

Implement a complete authentication system with email/password login, session management via HttpOnly cookies, admin role enforcement, and a middleware-based protection layer for admin routes.

---

## System Design

### Auth Flow

```
User visits protected route
    → Next.js middleware checks for session cookie
    → If no session → redirect to /login
    → If session exists → verify with NextAuth
    → If valid → render page
    → If expired → redirect to /login
```

### Registration Flow

```
User fills registration form
    → Zod validation (email format, password min 8 chars)
    → POST /api/auth/register
    → Hash password with bcrypt (cost 12)
    → Create User in Prisma (role: CUSTOMER)
    → Auto-login (sign in with credentials)
    → Redirect to /account
```

### Login Flow

```
User fills login form
    → POST /api/auth/callback/credentials
    → NextAuth validates email + password
    → JWT token created (sub: userId, role: user.role)
    → HttpOnly cookie set
    → Redirect to requested page or default
```

### Admin Middleware Flow

```
Request to /admin/*
    → Middleware reads JWT from cookie
    → If no token → redirect to /login
    → If token.role !== "ADMIN" → redirect to / or 403
    → If valid → allow request
```

---

## Architecture

### Prisma Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String?             // hashed with bcrypt, null for OAuth
  role      Role     @default(CUSTOMER)
  image     String?             // avatar URL
  phone     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  orders    Order[]
  cart      Cart?
  accounts  Account[]
  sessions  Session[]
}

enum Role {
  ADMIN
  CUSTOMER
}

// NextAuth v5 required models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### JWT Token Payload

```typescript
type JwtPayload = {
  sub: string;       // user ID
  role: "ADMIN" | "CUSTOMER";
  email: string;
  name?: string;
  iat: number;
  exp: number;
};
```

### NextAuth v5 Configuration

```typescript
// lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const isValid = await compare(password, user.password);
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
```

### Middleware

```typescript
// middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "ADMIN";

  // Admin routes protection
  if (pathname.startsWith("/admin") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Auth pages — redirect if already logged in
  if ((pathname === "/login" || pathname === "/register") && isLoggedIn) {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/login", "/register"],
};
```

### API Routes

```
POST /api/auth/register     → Create user, return success
POST /api/auth/callback/credentials  → NextAuth built-in login
POST /api/auth/signout      → NextAuth built-in logout
GET  /api/auth/session      → Get current session (NextAuth built-in)
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth library | NextAuth v5 (Auth.js) | Industry standard, built-in JWT, middleware support |
| Password hashing | bcryptjs (cost 12) | Well-tested, native JS (no native deps), OWASP recommended |
| Session strategy | JWT (not database sessions) | No DB lookup on every request, stateless |
| Cookie type | HttpOnly, Secure, SameSite=Lax | Prevents XSS access, works with CSRF protection |
| Role field | String enum in JWT token | Simple, no extra DB query on protected routes |
| Registration | Custom API route (not NextAuth) | More control over validation, error messages |

---

## Steps

1. Install dependencies: `next-auth@beta`, `bcryptjs`, `@types/bcryptjs`
2. Update Prisma schema with User, Account, Session, VerificationToken models
3. Run `pnpm prisma:migrate dev --name add-auth`
4. Create `lib/auth.ts` with NextAuth configuration
5. Create `app/api/auth/[...nextauth]/route.ts` (NextAuth handler)
6. Create `app/api/auth/register/route.ts` (registration endpoint)
7. Create `middleware.ts` (route protection)
8. Create `app/(auth)/login/page.tsx` (login form page)
9. Create `app/(auth)/register/page.tsx` (registration form page)
10. Create `components/storefront/layout/navbar.tsx` (show login/account state)
11. Wire login to trigger `POST /api/cart/merge` — on successful sign-in, frontend calls cart merge endpoint to migrate guest cart to DB
12. Seed admin user script (`prisma/seed.ts`)
13. Verify: register → login → protected route works. Admin can access /admin.

---

## Files Created

| File | Content |
|------|---------|
| `lib/auth.ts` | NextAuth config with credentials provider |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth API handler |
| `app/api/auth/register/route.ts` | User registration |
| `middleware.ts` | Route protection middleware |
| `app/(auth)/login/page.tsx` | Login form |
| `app/(auth)/register/page.tsx` | Registration form |
| `app/(auth)/layout.tsx` | Auth pages layout |
| `prisma/seed.ts` | Admin user seed script |

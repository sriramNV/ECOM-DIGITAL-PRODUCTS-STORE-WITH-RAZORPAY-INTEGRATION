# Task 5: Auth Service + NextAuth Configuration

## Context
Utility modules created. Now set up NextAuth v5 with credentials + Google OAuth.

## Requirements

### Create `apps/web/lib/auth.ts` — NextAuth configuration
```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "./db";

declare module "next-auth" {
  interface User { role?: string }
  interface Session { user: { id: string; role: string; name?: string | null; email?: string | null; image?: string | null } }
}

declare module "next-auth/jwt" {
  interface JWT { id: string; role: string }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login", newUser: "/auth/register" },
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.password) return null;
        const isValid = await compare(credentials.password as string, user.password);
        if (!isValid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
});
```

### Create `apps/web/app/api/auth/[...nextauth]/route.ts`
```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

### Create `apps/web/app/api/auth/register/route.ts`
```ts
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = await hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Create `apps/web/app/providers.tsx`
```tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-right" />
      </QueryClientProvider>
    </SessionProvider>
  );
}
```

### Create `apps/web/app/layout.tsx`
```tsx
import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus Store — Digital Products",
  description: "Premium digital products for creators and developers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Create `apps/web/app/globals.css` (basic Tailwind setup)
```css
@import "tailwindcss";
```

### Install deps
Run: `pnpm --filter web add next-auth@5.0.0-beta.25 @auth/prisma-adapter bcryptjs zod @tanstack/react-query sonner zustand framer-motion clsx tailwind-merge class-variance-authority lucide-react`
Run: `pnpm --filter web add -D @types/bcryptjs`

### Create postcss.config.ts (for Tailwind)
```ts
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

## Steps
1. Create all files listed above
2. Install dependencies
3. Verify the Next.js app compiles by running `pnpm --filter web build` (or try `pnpm --filter web dev` and check for errors)
4. Commit with: `"feat: add NextAuth with credentials + Google OAuth, register API"`

# Task 6: Admin Guard + Middleware

## Context
Auth is set up. Now create the admin/user guard helpers and request middleware.

## Requirements

### Create `apps/web/lib/guard.ts`
```ts
import { auth } from "./auth";
import { NextResponse } from "next/server";

export async function adminGuard() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function userGuard() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session.user;
}
```

### Create `apps/web/middleware.ts`
```ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/account") && !req.auth) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (pathname.startsWith("/admin") && !req.auth) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (pathname.startsWith("/admin") && req.auth?.user) {
    const role = (req.auth.user as any).role;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if ((pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register")) && req.auth) {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/auth/:path*"],
};
```

## Steps
1. Create both files
2. Commit with: `"feat: add admin guard and middleware for route protection"`

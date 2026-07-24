import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const role = (token as any)?.role as string | undefined;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/account") && !token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (pathname.startsWith("/admin") && !token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (pathname.startsWith("/admin") && token && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if ((pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register")) && token) {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  if (pathname.startsWith("/api/") && !["GET", "HEAD"].includes(req.method)) {
    const origin = req.headers.get("origin");
    if (origin) {
      const requestUrl = new URL(req.url);
      if (origin !== requestUrl.origin) {
        return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
      }
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/auth/:path*", "/api/:path*"],
};

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

async function rateLimit(ip: string, maxRequests: number, windowMs: number): Promise<boolean> {
  try {
    const { redis } = await import("@/lib/redis");
    const key = `ratelimit:${ip}`;
    const current = await redis.incr(key);
    if (current === 1) await redis.expire(key, Math.floor(windowMs / 1000));
    return current <= maxRequests;
  } catch {
    return true;
  }
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "ADMIN";

  if (pathname.startsWith("/api/")) {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const allowed = await rateLimit(ip, 100, 60000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

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

  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
});

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/account/:path*", "/login", "/register"],
};

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { redis } from "@/lib/redis";

async function rateLimit(ip: string, maxRequests: number, windowMs: number): Promise<boolean> {
  try {
    const key = `ratelimit:${ip}`;
    const current = await redis.incr(key);
    if (current === 1) await redis.expire(key, Math.floor(windowMs / 1000));
    return current <= maxRequests;
  } catch {
    logger.warn({ maxRequests, windowMs }, "Rate limiting unavailable - blocking request");
    return false;
  }
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "ADMIN";

  if (pathname.startsWith("/api/")) {
    const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
    const ip = forwardedFor.split(",").shift()?.trim() || req.headers.get("x-real-ip") || "unknown";
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
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }
  return response;
});

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/account/:path*", "/login", "/register"],
};

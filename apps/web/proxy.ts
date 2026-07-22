import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { redis } from "@/lib/redis";

const MAX_LOCAL_ENTRIES = 10_000;
const localRateLimitMap = new Map<string, { count: number; resetAt: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of localRateLimitMap) {
    if (now > entry.resetAt) localRateLimitMap.delete(ip);
  }
  if (localRateLimitMap.size > MAX_LOCAL_ENTRIES) {
    const toDelete = localRateLimitMap.size - MAX_LOCAL_ENTRIES;
    const keys = [...localRateLimitMap.keys()].slice(0, toDelete);
    for (const key of keys) localRateLimitMap.delete(key);
  }
}, 60_000).unref();

function localRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = localRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    localRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= maxRequests;
}

async function rateLimit(ip: string, maxRequests: number, windowMs: number): Promise<boolean> {
  try {
    const key = `ratelimit:${ip}`;
    const script = `
      local current = redis.call("INCR", KEYS[1])
      if current == 1 then
        redis.call("EXPIRE", KEYS[1], ARGV[1])
      end
      return current
    `;
    const current = await redis.eval(script, 1, key, Math.floor(windowMs / 1000));
    return Number(current) <= maxRequests;
  } catch {
    logger.warn({ maxRequests, windowMs }, "Rate limiting unavailable - using local fallback");
    return localRateLimit(ip, maxRequests, windowMs);
  }
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "ADMIN";

  if (pathname.startsWith("/api/") || pathname === "/login" || pathname === "/register") {
    const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
    const remoteIp = req.headers.get("x-real-ip") ?? "unknown";
    const ip = forwardedFor.split(",").shift()?.trim() || remoteIp;
    const maxRequests =
      pathname === "/api/auth/register" ? 5 :
      pathname === "/api/promotions/coupons/validate" ? 10 :
      pathname === "/api/contact" ? 5 :
      pathname === "/api/newsletter/subscribe" ? 5 :
      pathname.startsWith("/api/auth/") ? 5 :
      pathname === "/login" || pathname === "/register" ? 5 : 100;
    const allowed = await rateLimit(ip, maxRequests, 60000);
    if (!allowed) {
      const isApi = pathname.startsWith("/api/");
      return isApi
        ? NextResponse.json({ error: "Too many requests" }, { status: 429 })
        : NextResponse.redirect(new URL(`/login?error=RateLimited`, req.url));
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

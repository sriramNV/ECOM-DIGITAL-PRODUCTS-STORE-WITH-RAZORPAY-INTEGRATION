import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  if (!forwarded.startsWith("127.") && !forwarded.startsWith("10.") && !forwarded.startsWith("192.168.") && !forwarded.startsWith("172.")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const checks: Record<string, string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  try {
    await redis.ping();
    checks.redis = "ok";
  } catch {
    checks.redis = "error";
  }

  const healthy = Object.values(checks).every((v) => v === "ok");

  if (!healthy) {
    logger.error({ checks }, "Health check failed");
    return NextResponse.json({ status: "unhealthy", checks }, { status: 503 });
  }

  return NextResponse.json({ status: "healthy", checks });
}

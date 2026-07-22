import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

const HEALTH_CHECK_TOKEN = process.env.HEALTH_CHECK_TOKEN;

if (!HEALTH_CHECK_TOKEN) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("HEALTH_CHECK_TOKEN environment variable is required");
  }
  logger.warn("HEALTH_CHECK_TOKEN not set - health endpoint is unsecured");
}

export async function GET(request: NextRequest) {
  const healthToken = request.headers.get("x-health-token") ?? request.nextUrl.searchParams.get("token");
  if (HEALTH_CHECK_TOKEN && healthToken !== HEALTH_CHECK_TOKEN) {
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

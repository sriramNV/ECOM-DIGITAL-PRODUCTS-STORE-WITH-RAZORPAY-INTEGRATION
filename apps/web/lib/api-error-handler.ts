import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export function handleApiError(error: unknown, context?: string) {
  const message = error instanceof Error ? error.message : "Unknown error";
  logger.error({ err: error, context }, message);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

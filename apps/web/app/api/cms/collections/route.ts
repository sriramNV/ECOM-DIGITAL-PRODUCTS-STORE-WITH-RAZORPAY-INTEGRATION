import { NextRequest, NextResponse } from "next/server";
import { cmsRepo } from "@/lib/repositories/cms-repo";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug") ?? undefined;
    const result = await cmsRepo.listCollections(slug);
    const collections = Array.isArray(result) ? result : [result];
    return NextResponse.json(slug ? collections[0] ?? null : collections);
  } catch (error) {
    logger.error({ error }, "Failed to list collections");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

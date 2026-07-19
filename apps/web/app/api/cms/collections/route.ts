import { NextResponse } from "next/server";
import { cmsRepo } from "@/lib/repositories/cms-repo";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const collections = await cmsRepo.listCollections();
    return NextResponse.json(collections);
  } catch (error) {
    logger.error({ error }, "Failed to list collections");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

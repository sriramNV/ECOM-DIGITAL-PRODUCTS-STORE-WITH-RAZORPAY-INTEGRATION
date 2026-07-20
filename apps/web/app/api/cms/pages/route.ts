import { NextRequest, NextResponse } from "next/server";
import { cmsRepo } from "@/lib/repositories/cms-repo";
import { logger } from "@/lib/logger";
import { adminGuard } from "@/lib/admin-guard";

export async function GET() {
  try {
    const pages = await cmsRepo.listPages();
    return NextResponse.json(pages);
  } catch (error) {
    logger.error({ error }, "Failed to list CMS pages");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await adminGuard();
  if (guard) return guard;
  try {
    const data = await request.json();
    const page = await cmsRepo.createPage(data);
    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Failed to create CMS page");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { cmsRepo } from "@/lib/repositories/cms-repo";
import { adminGuard } from "@/lib/admin-guard";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const guard = await adminGuard();
  if (guard) return guard;

  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const banners = activeOnly ? await cmsRepo.listActiveBanners() : await cmsRepo.listBanners();
    return NextResponse.json(banners);
  } catch (error) {
    logger.error({ error }, "Failed to list banners");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

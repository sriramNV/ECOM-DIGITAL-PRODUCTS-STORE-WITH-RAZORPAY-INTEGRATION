import { NextRequest, NextResponse } from "next/server";
import { cmsRepo } from "@/lib/repositories/cms-repo";
import { logger } from "@/lib/logger";
import { adminGuard } from "@/lib/admin-guard";
import { handleApiError } from "@/lib/api-error-handler";
import { validateBody, cmsPageSchema } from "@/lib/schemas";

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
  try {
    const guard = await adminGuard();
    if (guard) return guard;
    const { data, error: validationError } = validateBody(cmsPageSchema, await request.json());
    if (validationError) return validationError;
    const page = await cmsRepo.createPage(data!);
    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Failed to create CMS page");
    return handleApiError(error, "cms/pages POST");
  }
}

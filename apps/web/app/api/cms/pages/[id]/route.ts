import { NextRequest, NextResponse } from "next/server";
import { cmsRepo } from "@/lib/repositories/cms-repo";
import { logger } from "@/lib/logger";
import { adminGuard } from "@/lib/admin-guard";
import { validateBody, cmsPageSchema } from "@/lib/schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const page = await cmsRepo.getPage(id);

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    logger.error({ error }, "Failed to get CMS page");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await adminGuard();
    if (guard) return guard;
    const { id } = await params;
    const body = await request.json();
    const { data, error: validationError } = validateBody(cmsPageSchema, body);
    if (validationError) return validationError;
    const page = await cmsRepo.updatePage(id, data!);

    return NextResponse.json(page);
  } catch (error) {
    logger.error({ error }, "Failed to update CMS page");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

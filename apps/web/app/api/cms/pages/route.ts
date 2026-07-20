import { NextRequest, NextResponse } from "next/server";
import { cmsRepo } from "@/lib/repositories/cms-repo";
import { adminGuard } from "@/lib/admin-guard";
import { handleApiError } from "@/lib/api-error-handler";
import { validateBody, cmsPageSchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const result = await cmsRepo.listPages(page, limit);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "cms/pages GET");
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
    return handleApiError(error, "cms/pages POST");
  }
}

import { NextResponse } from "next/server";
import { analyticsRepo } from "@/lib/repositories/analytics-repo";
import { adminGuard } from "@/lib/admin-guard";
import { handleApiError } from "@/lib/api-error-handler";

export async function GET() {
  try {
    const guard = await adminGuard();
    if (guard) return guard;
    const data = await analyticsRepo.getOverview();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, "analytics/overview GET");
  }
}

import { NextResponse } from "next/server";
import { analyticsRepo } from "@/lib/repositories/analytics-repo";
import { adminGuard } from "@/lib/admin-guard";
import { handleApiError } from "@/lib/api-error-handler";

export async function GET(request: Request) {
  try {
    const guard = await adminGuard();
    if (guard) return guard;
    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") ?? "30", 10) || 30));
    const data = await analyticsRepo.getRevenueHistory(days);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, "analytics/revenue GET");
  }
}

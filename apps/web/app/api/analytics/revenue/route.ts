import { NextResponse } from "next/server";
import { analyticsRepo } from "@/lib/repositories/analytics-repo";
import { adminGuard } from "@/lib/admin-guard";

export async function GET(request: Request) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "30", 10);
  const data = await analyticsRepo.getRevenueHistory(days);
  return NextResponse.json(data);
}

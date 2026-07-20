import { NextResponse } from "next/server";
import { analyticsRepo } from "@/lib/repositories/analytics-repo";
import { adminGuard } from "@/lib/admin-guard";

export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;
  const data = await analyticsRepo.getOverview();
  return NextResponse.json(data);
}

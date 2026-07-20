import { NextResponse } from "next/server";
import { analyticsRepo } from "@/lib/repositories/analytics-repo";

export async function GET() {
  const data = await analyticsRepo.getOverview();
  return NextResponse.json(data);
}

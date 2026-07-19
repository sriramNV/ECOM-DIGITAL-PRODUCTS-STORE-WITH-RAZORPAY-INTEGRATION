import { NextRequest, NextResponse } from "next/server";
import { orderRepo } from "@/lib/repositories/order-repo";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const result = await orderRepo.list({ limit, status, search });
  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "healthy", db: "ok" });
  } catch {
    return NextResponse.json({ status: "unhealthy", db: "error" }, { status: 503 });
  }
}

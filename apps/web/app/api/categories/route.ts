import { NextResponse } from "next/server";
import { categoryRepo } from "@/lib/repositories/category-repo";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const categories = await categoryRepo.list();
    return NextResponse.json(categories);
  } catch (error) {
    logger.error({ error }, "Failed to list categories");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

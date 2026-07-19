import { NextRequest, NextResponse } from "next/server";
import { productRepo } from "@/lib/repositories/product-repo";
import { logger } from "@/lib/logger";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await productRepo.getBySlug(slug);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    logger.error({ error }, "Failed to get product");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

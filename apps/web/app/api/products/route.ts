import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { productRepo } from "@/lib/repositories/product-repo";
import { logger } from "@/lib/logger";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "name"]).default("newest"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const products = await productRepo.list(query);

    return NextResponse.json(products);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    logger.error({ error }, "Failed to list products");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

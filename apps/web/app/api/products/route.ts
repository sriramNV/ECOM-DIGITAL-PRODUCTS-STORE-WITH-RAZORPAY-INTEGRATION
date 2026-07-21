import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { productRepo } from "@/lib/repositories/product-repo";
import { adminGuard } from "@/lib/admin-guard";
import { slugify } from "@/lib/utils";
import { logger } from "@/lib/logger";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "name"]).default("newest"),
  isActive: z.string().optional(),
});

const createProductSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  basePrice: z.number().positive(),
  marginPercent: z.number().min(0).max(100).optional(),
  categoryId: z.string().nullable().optional(),
  images: z.array(z.object({ url: z.string().url() })).optional(),
  variants: z.array(z.object({
    title: z.string().min(1),
    price: z.number().positive(),
    size: z.string().optional(),
    color: z.string().optional(),
    colorHex: z.string().optional(),
    stock: z.number().int().positive().optional(),
  })).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { isActive: isActiveStr, ...rest } = querySchema.parse(Object.fromEntries(searchParams));

    const isActive: boolean | "all" | undefined =
      isActiveStr === "all" ? "all" : isActiveStr === "false" ? false : isActiveStr === "true" ? true : undefined;

    const products = await productRepo.list({ ...rest, isActive });

    return NextResponse.json(products);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    logger.error({ error }, "Failed to list products");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await adminGuard();
    if (guard) return guard;

    const body = createProductSchema.parse(await request.json());
    const slug = slugify(body.title);

    const product = await productRepo.create({ ...body, slug });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    logger.error({ error }, "Failed to create product");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

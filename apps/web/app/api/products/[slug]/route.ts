import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { productRepo } from "@/lib/repositories/product-repo";
import { adminGuard } from "@/lib/admin-guard";
import { logger } from "@/lib/logger";

const updateProductSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  basePrice: z.number().positive().optional(),
  marginPercent: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const guard = await adminGuard();
    if (guard) return guard;

    const { slug } = await params;
    const body = updateProductSchema.parse(await request.json());

    const existing = await productRepo.getBySlug(slug);
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = await productRepo.update(existing.id, body);

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    logger.error({ error }, "Failed to update product");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const guard = await adminGuard();
  if (guard) return guard;

  const { name, description, image, parentId, order } = await req.json();
  const category = await prisma.category.create({
    data: { name, slug: slugify(name), description, image, parentId, order: order || 0 },
  });
  return NextResponse.json(category, { status: 201 });
}

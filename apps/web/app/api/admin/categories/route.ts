import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const guard = await adminGuard();
    if (guard) return guard;

    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error in admin categories GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const guard = await adminGuard();
    if (guard) return guard;

    const { name, description, image, parentId, order } = await req.json();
    const category = await prisma.category.create({
      data: { name, slug: slugify(name), description, image, parentId, order: order || 0 },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error in admin categories POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

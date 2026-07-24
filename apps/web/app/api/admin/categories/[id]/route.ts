import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const guard = await adminGuard();
    if (guard) return guard;

    const data = await req.json();
    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name, slug: slugify(data.name) }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
      },
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error("Category update failed:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 400 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const guard = await adminGuard();
    if (guard) return guard;

    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Category delete failed:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 400 });
  }
}

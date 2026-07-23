import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
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
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const guard = await adminGuard();
  if (guard) return guard;

  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

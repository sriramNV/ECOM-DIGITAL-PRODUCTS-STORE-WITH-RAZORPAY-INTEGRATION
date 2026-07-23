import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { updateProduct, deleteProduct } from "@/lib/services/products";

export async function PUT(req: Request, { params }: { params: { slug: string } }) {
  const guard = await adminGuard();
  if (guard) return guard;

  const data = await req.json();
  const product = await updateProduct(params.slug, data);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
  const guard = await adminGuard();
  if (guard) return guard;

  const deleted = await deleteProduct(params.slug);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

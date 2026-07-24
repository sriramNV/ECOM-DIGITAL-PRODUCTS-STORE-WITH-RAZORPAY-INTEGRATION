import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { listProducts, createProduct } from "@/lib/services/products";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const guard = await adminGuard();
  if (guard) return guard;

  const { allowed } = await rateLimit(`admin-products:${getClientIp(req)}`, 120, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const products = await listProducts({
    page: Number(searchParams.get("page")) || 1,
    limit: Number(searchParams.get("limit")) || 50,
    search: searchParams.get("search") || undefined,
    sort: (searchParams.get("sort") as any) || "newest",
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const guard = await adminGuard();
  if (guard) return guard;

  try {
    const data = await req.json();
    const product = await createProduct(data);
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("Product creation failed:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 400 });
  }
}

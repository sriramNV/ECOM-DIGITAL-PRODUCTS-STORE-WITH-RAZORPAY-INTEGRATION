import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/services/products";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;

  const { allowed } = await rateLimit(`product-detail:${getClientIp(req)}`, 60, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const product = await getProductBySlug(params.slug);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

import { NextResponse } from "next/server";
import { listProducts } from "@/lib/services/products";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const products = await listProducts({
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 20,
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
      sort: (searchParams.get("sort") as any) || "newest",
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error in products GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

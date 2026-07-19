import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/storefront/product/product-grid";
import { Breadcrumbs } from "@/components/storefront/shared/breadcrumbs";
import { productRepo } from "@/lib/repositories/product-repo";

export const metadata: Metadata = {
  title: "Products — POD Store",
  description: "Browse our collection of custom printed products",
};

type Props = {
  searchParams: Promise<{ page?: string; category?: string; search?: string; sort?: string }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const result = await productRepo.list({
    page: Number(params.page) || 1,
    category: params.category,
    search: params.search,
    sort: (params.sort as "price_asc" | "price_desc" | "newest" | "name") ?? "newest",
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "Products" }]} />

      <h1 className="text-3xl font-bold text-foreground mb-8">All Products</h1>

      <Suspense fallback={<div className="grid grid-cols-4 gap-6">{/* skeleton */}</div>}>
        <ProductGrid products={result.items} />
      </Suspense>
    </div>
  );
}

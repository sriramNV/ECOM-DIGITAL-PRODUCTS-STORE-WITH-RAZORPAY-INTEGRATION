import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/storefront/product/product-grid";
import { Breadcrumbs } from "@/components/storefront/shared/breadcrumbs";
import { Pagination } from "@/components/storefront/shared/pagination";
import { productRepo } from "@/lib/repositories/product-repo";

export const metadata: Metadata = {
  title: "Products — POD Store",
  description: "Browse our collection of custom printed products",
};

type Props = {
  searchParams: Promise<{ page?: string; category?: string; search?: string; sort?: string }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "Products" }]} />

      <h1 className="text-3xl font-bold text-foreground mb-8">All Products</h1>

      <Suspense fallback={<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-80 bg-surface rounded-lg animate-pulse" />)}</div>}>
        <ProductGridSection searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProductGridSection({ searchParams }: { searchParams: Promise<{ page?: string; category?: string; search?: string; sort?: string }> }) {
  const params = await searchParams;
  const result = await productRepo.list({
    page: Number(params.page) || 1,
    category: params.category,
    search: params.search,
    sort: (params.sort as "price_asc" | "price_desc" | "newest" | "name") ?? "newest",
  });

  return (
    <>
      <ProductGrid products={result.items} />
      {result.totalPages > 1 && (
        <Pagination currentPage={result.page} totalPages={result.totalPages} />
      )}
    </>
  );
}

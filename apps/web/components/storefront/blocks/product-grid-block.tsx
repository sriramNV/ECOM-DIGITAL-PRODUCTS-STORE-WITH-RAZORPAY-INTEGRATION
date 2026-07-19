"use client";

import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/storefront/product/product-card";

type ProductGridContent = {
  collectionSlug?: string;
  heading?: string;
};

type Props = { content: ProductGridContent };

export function ProductGridBlock({ content }: Props) {
  const { collectionSlug, heading } = content;

  const { data, isLoading } = useQuery({
    queryKey: ["collection-products", collectionSlug],
    queryFn: async () => {
      const res = await fetch(`/api/cms/collections?slug=${collectionSlug}`);
      if (!res.ok) throw new Error("Failed to fetch collection");
      return res.json();
    },
    enabled: !!collectionSlug,
  });

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {heading && <div className="h-8 bg-surface rounded w-64 mb-8 animate-pulse" />}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface-raised border border-border rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-square bg-surface" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-surface rounded w-3/4" />
                  <div className="h-4 bg-surface rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const products: Array<{
    title: string;
    slug: string;
    images?: Array<{ url: string; alt: string | null }>;
    variants?: Array<{ price: number }>;
  }> = (data as any)?.products?.map((cp: any) => cp.product ?? cp) ?? [];

  if (products.length === 0) return null;

  return (
    <section className="py-12 md:py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {heading && (
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-8">{heading}</h2>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.slug}
              title={product.title}
              slug={product.slug}
              imageUrl={product.images?.[0]?.url ?? "/placeholder.svg"}
              imageAlt={product.images?.[0]?.alt ?? null}
              minPrice={Math.min(...(product.variants?.map((v) => v.price) ?? [0]))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState, useEffect, use } from "react";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/storefront/shared/breadcrumbs";
import { ProductGallery } from "@/components/storefront/product/product-gallery";
import { PriceDisplay } from "@/components/storefront/product/price-display";
import { VariantSelector } from "@/components/storefront/product/variant-selector";
import { AddToCartButton } from "@/components/storefront/product/add-to-cart-button";
import { Skeleton } from "@/components/ui/skeleton";

type Props = { params: Promise<{ slug: string }> };

export default function ProductDetailPage({ params }: Props) {
  const { slug } = use(params);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then((data) => { setProduct(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) { notFound(); return null; }

  const selectedVariant = product.variants.find((v: any) => v.id === selectedVariantId);
  const minPrice = product.variants.length > 0 ? Math.min(...product.variants.map((v: any) => v.price)) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          { label: product.title },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-6">
        <ProductGallery
          images={product.images.map((img: any) => ({ url: img.url, alt: img.alt ?? product.title }))}
        />
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground text-balance">{product.title}</h1>
            {product.category && (
              <p className="text-sm text-foreground-muted mt-1.5">{product.category.name}</p>
            )}
          </div>
          <PriceDisplay
            price={selectedVariant ? selectedVariant.price : minPrice}
            size="lg"
          />
          {product.variants.length > 1 && (
            <div className="border-t border-border pt-8">
              <VariantSelector variants={product.variants} selectedId={selectedVariantId} onSelect={(v) => setSelectedVariantId(v.id)} />
            </div>
          )}
          <AddToCartButton
            productId={product.id}
            variantId={selectedVariant?.id ?? product.variants[0]?.id}
            title={product.title}
            image={product.images[0]?.url ?? ""}
            price={selectedVariant ? selectedVariant.price : minPrice}
            size={selectedVariant?.size ?? product.variants[0]?.size ?? ""}
            color={selectedVariant?.color ?? product.variants[0]?.color ?? ""}
            slug={product.slug}
            disabled={product.variants.length === 0}
          />
          {product.description && (
            <div className="border-t border-border pt-8">
              <h2 className="text-sm font-semibold text-foreground mb-3">Description</h2>
              <p className="text-sm text-foreground-muted leading-relaxed text-pretty">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

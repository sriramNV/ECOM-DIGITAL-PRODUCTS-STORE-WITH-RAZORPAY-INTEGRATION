import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { productRepo } from "@/lib/repositories/product-repo";
import { ProductGallery } from "@/components/storefront/product/product-gallery";
import { VariantSelector } from "@/components/storefront/product/variant-selector";
import { PriceDisplay } from "@/components/storefront/product/price-display";
import { AddToCartButton } from "@/components/storefront/product/add-to-cart-button";
import { Breadcrumbs } from "@/components/storefront/shared/breadcrumbs";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await productRepo.getBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.title} — POD Store`,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await productRepo.getBySlug(slug);

  if (!product) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          { label: product.title },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-4">
        <ProductGallery
          images={product.images.map((img) => ({ url: img.url, alt: img.alt ?? product.title }))}
        />

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{product.title}</h1>
            {product.category && (
              <p className="text-sm text-foreground-muted mt-1">{product.category.name}</p>
            )}
          </div>

          <PriceDisplay
            price={Math.min(...product.variants.map((v) => v.price))}
            size="lg"
          />

          <div className="border-t border-border pt-6">
            <VariantSelector
              variants={product.variants}
              selectedId={null}
              onSelect={() => {}}
            />
          </div>

          <AddToCartButton
            productId={product.id}
            disabled={product.variants.length === 0}
          />

          <div className="border-t border-border pt-6">
            <h2 className="text-sm font-medium text-foreground mb-2">Description</h2>
            <p className="text-sm text-foreground-muted leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

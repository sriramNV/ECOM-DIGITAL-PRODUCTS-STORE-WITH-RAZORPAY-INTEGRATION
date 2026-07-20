import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/storefront/product/product-grid";
import { productRepo } from "@/lib/repositories/product-repo";

export default async function HomePage() {
  const featured = await productRepo.getFeatured(8);

  return (
    <>
      <section className="relative min-h-[400px] md:min-h-[500px] lg:min-h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-accent/5" />
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-accent/[0.03] to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 w-full">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground max-w-2xl text-balance">
            Premium Print-on-Demand
          </h1>
          <p className="text-lg md:text-xl text-foreground-muted mt-4 max-w-xl text-pretty">
            Custom designs printed on t-shirts, hoodies, mugs, and more. Quality products shipped worldwide.
          </p>
          <Link href="/products">
            <Button size="lg" className="mt-8">Shop Now</Button>
          </Link>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="py-12 md:py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Featured Products</h2>
              <Link href="/products" className="text-sm font-medium text-accent hover:text-accent-hover transition-colors">
                View All &rarr;
              </Link>
            </div>
            <ProductGrid
              products={featured.map((p) => ({
                title: p.title,
                slug: p.slug,
                images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
                variants: p.variants,
              }))}
            />
          </div>
        </section>
      )}
    </>
  );
}

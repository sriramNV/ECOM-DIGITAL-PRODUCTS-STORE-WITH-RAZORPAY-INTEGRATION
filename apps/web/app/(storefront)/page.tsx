import { Hero } from "@/components/landing/hero";
import { FeaturedGrid } from "@/components/landing/featured-grid";
import { CtaSection } from "@/components/landing/cta-section";
import { prisma } from "@/lib/db";

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Hero />
      {featuredProducts.length > 0 && <FeaturedGrid products={featuredProducts} />}
      <CtaSection />
    </>
  );
}

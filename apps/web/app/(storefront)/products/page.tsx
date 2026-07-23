import { ProductGrid } from "@/components/products/product-grid";
import { prisma } from "@/lib/db";

export default async function ProductsPage(props: {
  searchParams: Promise<{ page?: string; category?: string; search?: string; sort?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const limit = 20;
  const where: any = { isActive: true };

  if (searchParams.category) {
    where.category = { slug: searchParams.category };
  }
  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search, mode: "insensitive" } },
      { description: { contains: searchParams.search, mode: "insensitive" } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
      orderBy: searchParams.sort === "price_asc" ? { price: "asc" } : searchParams.sort === "price_desc" ? { price: "desc" } : { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/products" className="rounded-full border border-border px-4 py-1 text-sm hover:border-primary">All</a>
          {categories.map((cat) => (
            <a key={cat.id} href={`/products?category=${cat.slug}`} className="rounded-full border border-border px-4 py-1 text-sm hover:border-primary">
              {cat.name}
            </a>
          ))}
        </div>
      </div>
      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <p className="py-20 text-center text-muted-foreground">No products found.</p>
      )}
      {total > limit && (
        <div className="mt-10 flex justify-center gap-2">
          {page > 1 && <a href={`/products?page=${page - 1}`} className="rounded-lg border border-border px-4 py-2 text-sm hover:border-primary">Previous</a>}
          {page * limit < total && <a href={`/products?page=${page + 1}`} className="rounded-lg border border-border px-4 py-2 text-sm hover:border-primary">Next</a>}
        </div>
      )}
    </div>
  );
}

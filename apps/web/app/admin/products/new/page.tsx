import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">New Product</h1>
      <ProductForm categories={categories} isNew />
    </div>
  );
}

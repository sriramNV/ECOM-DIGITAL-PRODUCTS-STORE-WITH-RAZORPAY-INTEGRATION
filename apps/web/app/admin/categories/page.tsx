import { prisma } from "@/lib/db";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Categories</h1>
      <CategoryManager categories={categories} />
    </div>
  );
}

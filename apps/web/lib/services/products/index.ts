import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export type ProductListParams = {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "name";
};

export type ProductListResult = {
  items: any[];
  total: number;
  page: number;
  totalPages: number;
};

const productInclude = {
  images: { orderBy: { position: "asc" as const } },
  category: true,
};

export async function listProducts(params: ProductListParams = {}): Promise<ProductListResult> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (params.category) {
    where.category = { slug: params.category };
  }
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
      { tags: { has: params.search } },
    ];
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "price_asc" ? { price: "asc" } :
    params.sort === "price_desc" ? { price: "desc" } :
    params.sort === "name" ? { title: "asc" } :
    { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug, isActive: true },
    include: productInclude,
  });
}

export async function createProduct(data: {
  title: string;
  description: string;
  price: number;
  salePrice?: number;
  categoryId?: string;
  tags?: string[];
  isFeatured?: boolean;
  imageUrls?: { url: string; alt?: string; position?: number }[];
}) {
  const slug = slugify(data.title);
  const product = await prisma.product.create({
    data: {
      title: data.title,
      slug,
      description: data.description,
      price: data.price,
      salePrice: data.salePrice,
      categoryId: data.categoryId,
      tags: data.tags || [],
      isFeatured: data.isFeatured || false,
      images: data.imageUrls
        ? { create: data.imageUrls.map((img) => ({ url: img.url, alt: img.alt, position: img.position || 0 })) }
        : undefined,
    },
    include: productInclude,
  });
  return product;
}

export async function updateProduct(slug: string, data: any) {
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return null;

  return prisma.product.update({
    where: { slug },
    data: {
      ...(data.title && { title: data.title, slug: slugify(data.title) }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.salePrice !== undefined && { salePrice: data.salePrice }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
      ...(data.imageUrls !== undefined && {
        images: {
          deleteMany: {},
          create: data.imageUrls.map((img: any, i: number) => ({ url: img.url, alt: img.alt || null, position: i })),
        },
      }),
    },
    include: productInclude,
  });
}

export async function deleteProduct(slug: string) {
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return false;
  await prisma.product.update({ where: { slug }, data: { isActive: false } });
  return true;
}

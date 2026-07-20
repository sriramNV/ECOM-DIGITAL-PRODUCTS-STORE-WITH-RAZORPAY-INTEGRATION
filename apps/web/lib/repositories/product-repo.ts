import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type ListOptions = {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: "price_asc" | "price_desc" | "newest" | "name";
  isActive?: boolean;
};

type ListResult = {
  items: Array<{
    id: string;
    title: string;
    slug: string;
    basePrice: number;
    marginPercent: number;
    isFeatured: boolean;
    category: { name: string; slug: string } | null;
    images: Array<{ url: string; alt: string | null }>;
    variants: Array<{ price: number }>;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  totalPages: number;
};

export const productRepo = {
  async list(options: ListOptions = {}): Promise<ListResult> {
    const { page = 1, limit = 20, category, search, sort = "newest", isActive = true } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = { isActive };

    if (category) {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "price_asc"
        ? { basePrice: "asc" }
        : sort === "price_desc"
          ? { basePrice: "desc" }
          : sort === "name"
            ? { title: "asc" }
            : { createdAt: "desc" };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { name: true, slug: true } },
          images: { orderBy: { position: "asc" }, take: 1 },
          variants: { where: { isEnabled: true }, select: { price: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        basePrice: Number(item.basePrice),
        marginPercent: Number(item.marginPercent),
        isFeatured: item.isFeatured,
        category: item.category,
        images: item.images.map((img) => ({ url: img.url, alt: img.alt })),
        variants: item.variants.map((v) => ({ ...v, price: Number(v.price) })),
        createdAt: item.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getBySlug(slug: string) {
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        category: true,
        variants: { where: { isEnabled: true }, orderBy: { title: "asc" } },
        images: { orderBy: { position: "asc" } },
      },
    });

    if (!product) return null;

    return {
      ...product,
      basePrice: Number(product.basePrice),
      marginPercent: Number(product.marginPercent),
      variants: product.variants.map((v) => ({ ...v, price: Number(v.price) })),
    };
  },

  async getFeatured(limit = 8) {
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        category: { select: { name: true, slug: true } },
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: { where: { isEnabled: true }, select: { price: true } },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return products.map((p) => ({
      ...p,
      basePrice: Number(p.basePrice),
      marginPercent: Number(p.marginPercent),
      variants: p.variants.map((v) => ({ ...v, price: Number(v.price) })),
    }));
  },
};

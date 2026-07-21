import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type ListOptions = {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: "price_asc" | "price_desc" | "newest" | "name";
  isActive?: boolean | "all";
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
    const { page = 1, limit = 20, category, search, sort = "newest", isActive } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};
    if (isActive !== undefined && isActive !== "all") where.isActive = isActive;

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
      where: { slug },
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

  async create(data: {
    title: string;
    description: string;
    basePrice: number;
    marginPercent?: number;
    slug: string;
    categoryId?: string | null;
    images?: { url: string; alt?: string; position?: number }[];
    variants?: { title: string; price: number; size?: string; color?: string; colorHex?: string; stock?: number }[];
  }) {
    return prisma.product.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        basePrice: data.basePrice,
        marginPercent: data.marginPercent ?? 0,
        categoryId: data.categoryId || null,
        images: data.images?.length
          ? { create: data.images.map((img, i) => ({ url: img.url, alt: img.alt, position: img.position ?? i })) }
          : undefined,
        variants: data.variants?.length
          ? { create: data.variants.map((v) => ({ title: v.title, price: v.price, size: v.size, color: v.color, colorHex: v.colorHex, stock: v.stock ?? 999 })) }
          : undefined,
      },
    });
  },

  async update(id: string, data: {
    title?: string;
    description?: string;
    basePrice?: number;
    marginPercent?: number;
    slug?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    categoryId?: string | null;
    images?: { url: string; alt?: string; position?: number }[];
    variants?: { id?: string; title: string; price: number; size?: string; color?: string; colorHex?: string; stock?: number; isEnabled?: boolean }[];
  }) {
    const updateData: Prisma.ProductUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.basePrice !== undefined) updateData.basePrice = data.basePrice;
    if (data.marginPercent !== undefined) updateData.marginPercent = data.marginPercent;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.categoryId !== undefined) {
      updateData.category = data.categoryId
        ? { connect: { id: data.categoryId } }
        : { disconnect: true };
    }

    return prisma.$transaction(async (tx) => {
      if (data.images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (data.images.length > 0) {
          await tx.productImage.createMany({
            data: data.images.map((img, i) => ({ productId: id, url: img.url, alt: img.alt, position: img.position ?? i })),
          });
        }
      }
      if (data.variants) {
        const submittedIds = data.variants.filter((v) => v.id).map((v) => v.id!);
        await tx.productVariant.updateMany({
          where: { productId: id, id: { notIn: submittedIds } },
          data: { isEnabled: false },
        });
        for (const v of data.variants) {
          if (v.id) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: { title: v.title, price: v.price, size: v.size, color: v.color, colorHex: v.colorHex, stock: v.stock ?? 999, isEnabled: v.isEnabled ?? true },
            });
          } else {
            await tx.productVariant.create({
              data: { productId: id, title: v.title, price: v.price, size: v.size, color: v.color, colorHex: v.colorHex, stock: v.stock ?? 999, isEnabled: v.isEnabled ?? true },
            });
          }
        }
      }
      return tx.product.update({ where: { id }, data: updateData });
    });
  },
};

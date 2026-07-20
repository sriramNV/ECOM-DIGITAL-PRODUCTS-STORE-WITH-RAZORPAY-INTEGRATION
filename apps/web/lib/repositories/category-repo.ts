import { prisma } from "@/lib/prisma";

export const categoryRepo = {
  async list() {
    return prisma.category.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });
  },

  async getBySlug(slug: string, page = 1) {
    const limit = 20;
    const skip = (page - 1) * limit;
    return prisma.category.findUnique({
      where: { slug },
      include: {
        children: true,
        products: {
          where: { isActive: true },
          include: {
            images: { orderBy: { position: "asc" }, take: 1 },
          },
          skip,
          take: limit,
        },
      },
    });
  },
};

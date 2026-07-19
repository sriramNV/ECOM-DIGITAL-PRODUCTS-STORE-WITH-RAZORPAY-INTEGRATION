import { prisma } from "@/lib/prisma";

export const cmsRepo = {
  async listPages() {
    return prisma.page.findMany({ orderBy: { updatedAt: "desc" } });
  },

  async getPage(id: string) {
    return prisma.page.findUnique({ where: { id } });
  },

  async getPageBySlug(slug: string) {
    return prisma.page.findUnique({ where: { slug, isPublished: true } });
  },

  async createPage(data: { title: string; slug: string; content?: unknown }) {
    return prisma.page.create({ data });
  },

  async updatePage(id: string, data: { title?: string; content?: unknown; seoTitle?: string; seoDesc?: string; isPublished?: boolean }) {
    return prisma.page.update({ where: { id }, data });
  },

  async listBanners() {
    return prisma.banner.findMany({ orderBy: { order: "asc" } });
  },

  async listActiveBanners() {
    const now = new Date();
    return prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: { order: "asc" },
    });
  },

  async listCollections() {
    return prisma.collection.findMany({
      where: { isActive: true },
      include: { products: { include: { product: { include: { images: { take: 1 } } } } } },
    });
  },
};

import { prisma } from "@/lib/prisma";

export const cmsRepo = {
  async listPages(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [pages, total] = await Promise.all([
      prisma.page.findMany({ orderBy: { updatedAt: "desc" }, skip, take: limit }),
      prisma.page.count(),
    ]);
    return { pages, total, page, totalPages: Math.ceil(total / limit) };
  },

  async getPage(id: string) {
    return prisma.page.findUnique({ where: { id } });
  },

  async getPageBySlug(slug: string) {
    return prisma.page.findUnique({ where: { slug, isPublished: true } });
  },

  async createPage(data: { title: string; slug: string; content?: unknown; seoTitle?: string | null; seoDesc?: string | null; isPublished?: boolean }) {
    return prisma.page.create({ data: data as any });
  },

  async updatePage(id: string, data: { title?: string; content?: unknown; seoTitle?: string | null; seoDesc?: string | null; isPublished?: boolean }) {
    return prisma.page.update({ where: { id }, data: data as any });
  },

  async listBanners(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [banners, total] = await Promise.all([
      prisma.banner.findMany({ orderBy: { order: "asc" }, skip, take: limit }),
      prisma.banner.count(),
    ]);
    return { banners, total, page, totalPages: Math.ceil(total / limit) };
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

  async listCollections(slug?: string) {
    return prisma.collection.findMany({
      where: { isActive: true, ...(slug ? { slug } : {}) },
      include: { products: { include: { product: { include: { images: { take: 1 } } } } } },
    });
  },
};

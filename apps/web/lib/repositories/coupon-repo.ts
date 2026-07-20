import { prisma } from "@/lib/prisma";

export const couponRepo = {
  async list(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.coupon.count(),
    ]);
    return { coupons, total, page, totalPages: Math.ceil(total / limit) };
  },

  async getByCode(code: string) {
    return prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  },

  async create(data: {
    code: string; type: string; value: number; minOrder?: number;
    maxDiscount?: number; usageLimit?: number; perUserLimit?: number;
    startDate: Date; endDate?: Date;
  }) {
    return prisma.coupon.create({ data: { ...data, code: data.code.toUpperCase() } });
  },

  async update(id: string, data: Partial<{ isActive: boolean }>) {
    return prisma.coupon.update({ where: { id }, data });
  },

  async getUsageCount(couponId: string) {
    return prisma.order.count({ where: { couponId } });
  },
};

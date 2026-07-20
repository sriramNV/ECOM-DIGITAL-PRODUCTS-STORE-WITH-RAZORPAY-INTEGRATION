import { prisma } from "@/lib/prisma";

export const couponRepo = {
  async list() {
    return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
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

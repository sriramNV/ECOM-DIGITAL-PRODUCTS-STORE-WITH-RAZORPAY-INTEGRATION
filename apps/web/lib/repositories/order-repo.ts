import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type OrderStatus = "PENDING_PAYMENT" | "PAID" | "PROCESSING" | "PRINTING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";

export const orderRepo = {
  async getById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    });
  },

  async getByUserId(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: { items: true, payments: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  },

  async list(options: { page?: number; limit?: number; status?: string; search?: string }) {
    const { page = 1, limit = 20, status, search } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status as OrderStatus;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true, user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  },

  async updateStatus(id: string, status: string, note?: string) {
    const allowedTransitions: Record<string, string[]> = {
      PENDING_PAYMENT: ["PAID", "CANCELLED"],
      PAID: ["PROCESSING", "CANCELLED", "REFUNDED"],
      PROCESSING: ["PRINTING", "CANCELLED"],
      PRINTING: ["SHIPPED", "CANCELLED"],
      SHIPPED: ["DELIVERED"],
      DELIVERED: ["REFUNDED"],
      CANCELLED: ["REFUNDED"],
    };

    return prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({ where: { id }, select: { status: true } });
      if (!currentOrder) throw new Error("Order not found");
      const allowed = allowedTransitions[currentOrder.status as string];
      if (allowed && !allowed.includes(status)) {
        throw new Error(`Cannot transition order from ${currentOrder.status} to ${status}`);
      }

      const order = await tx.order.update({
        where: { id },
        data: { status: status as OrderStatus },
      });

      await tx.orderStatusHistory.create({
        data: { orderId: id, status: status as OrderStatus, note },
      });

      return order;
    });
  },
};

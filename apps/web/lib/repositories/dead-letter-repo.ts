import { prisma } from "@/lib/prisma";

export const deadLetterRepo = {
  async add(orderId: string, error: string, context: Record<string, unknown>) {
    await prisma.auditLog.create({
      data: {
        action: "fulfillment_failed",
        entity: "order",
        entityId: orderId,
        metadata: { error, context } as any,
      },
    });
  },

  async list() {
    return prisma.auditLog.findMany({
      where: { action: "fulfillment_failed" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },
};

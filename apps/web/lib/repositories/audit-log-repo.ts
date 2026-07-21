import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const auditLogRepo = {
  async log(params: { userId: string; action: string; entity: string; entityId?: string; metadata?: Record<string, unknown>; ip?: string }) {
    return prisma.auditLog.create({ data: { ...params, metadata: params.metadata as Prisma.InputJsonValue } });
  },
};

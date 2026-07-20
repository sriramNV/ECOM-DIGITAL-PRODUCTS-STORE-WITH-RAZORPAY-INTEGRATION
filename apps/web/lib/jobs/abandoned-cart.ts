import Queue from "bull";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/services/email-service";
import { logger } from "@/lib/logger";

const abandonedCartQueue = new Queue("abandoned-cart", { redis: process.env.REDIS_URL as string });

abandonedCartQueue.process(async () => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oldCarts = await prisma.cart.findMany({
    where: {
      updatedAt: { lte: cutoff },
      items: { some: {} },
      user: { orders: { none: {} } },
    },
    include: { items: true, user: { select: { email: true, name: true } } },
  });

  for (const cart of oldCarts) {
    try {
      await emailService.sendAbandonedCart(cart.user.email, cart as any);
      logger.info({ cartId: cart.id, userEmail: cart.user.email }, "Abandoned cart email sent");
    } catch (error) {
      logger.error({ error, cartId: cart.id }, "Failed to send abandoned cart email");
    }
  }
});

logger.info("Abandoned cart worker started");

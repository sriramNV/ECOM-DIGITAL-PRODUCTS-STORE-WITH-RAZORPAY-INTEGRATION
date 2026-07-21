import { prisma } from "@/lib/prisma";

export const cartRepo = {
  async getByUserId(userId: string) {
    return prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { select: { title: true, slug: true } },
            variant: { select: { title: true, price: true, size: true, color: true, stock: true } },
          },
        },
      },
    });
  },

  async addItem(userId: string, productId: string, variantId: string, quantity: number) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, product: { isActive: true, id: productId } },
    });
    if (!variant) throw new Error("Product variant not found or inactive");

    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, variantId },
    });

    if (existing) {
      return prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(existing.quantity + quantity, 10) },
      });
    }

    return prisma.cartItem.create({
      data: { cartId: cart.id, productId, variantId, quantity: Math.min(quantity, 10) },
    });
  },

  async updateItemQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      return prisma.cartItem.delete({ where: { id: itemId } });
    }
    return prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: Math.min(quantity, 10) },
    });
  },

  async removeItem(itemId: string) {
    return prisma.cartItem.delete({ where: { id: itemId } });
  },

  async mergeGuestCart(userId: string, guestItems: Array<{ productId: string; variantId: string; quantity: number }>) {
    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const existingItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id, variantId: { in: guestItems.map((g) => g.variantId) } },
    });
    const existingMap = new Map(existingItems.map((e) => [e.variantId, e]));

    await prisma.$transaction(async (tx) => {
      for (const guest of guestItems) {
        const existing = existingMap.get(guest.variantId);
        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: Math.min(existing.quantity + guest.quantity, 10) },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: cart.id,
              productId: guest.productId,
              variantId: guest.variantId,
              quantity: Math.min(guest.quantity, 10),
            },
          });
        }
      }
    });

    return cartRepo.getByUserId(userId);
  },

  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  },
};

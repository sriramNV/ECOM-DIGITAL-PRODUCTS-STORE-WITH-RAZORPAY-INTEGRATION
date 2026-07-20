import { transporter } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { renderOrderConfirmation } from "@/lib/email/templates/order-confirmation";
import { renderOrderShipped } from "@/lib/email/templates/order-shipped";
import { renderOrderDelivered } from "@/lib/email/templates/order-delivered";
import { renderOrderCancelled } from "@/lib/email/templates/order-cancelled";
import { renderAbandonedCart } from "@/lib/email/templates/abandoned-cart";
import { logger } from "@/lib/logger";
import type { Order, User, Cart, CartItem } from "@prisma/client";

const FROM = `"POD Store" <${process.env.SMTP_FROM ?? "store@podstore.com"}>`;

async function sendEmail(to: string, subject: string, html: string, type: string, orderId?: string) {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    await prisma.emailLog.create({ data: { to, subject, type, orderId, status: "sent" } });
  } catch (error) {
    logger.error({ error, to, type }, "Failed to send email");
    await prisma.emailLog.create({ data: { to, subject, type, orderId, status: "failed", error: (error as Error).message } });
  }
}

export const emailService = {
  async sendOrderConfirmation(order: Order & { items: Array<{ title: string; quantity: number; totalPrice: number }> }, user: User) {
    const html = renderOrderConfirmation({
      orderNumber: order.orderNumber,
      totalAmount: Number(order.totalAmount),
      items: order.items.map((i) => ({ title: i.title, quantity: i.quantity, totalPrice: Number(i.totalPrice) })),
      shippingAddress: order.shippingAddress as Record<string, string>,
    }, user.name ?? "Customer");
    await sendEmail(user.email, `Order Confirmed — ${order.orderNumber}`, html, "order.confirmation", order.id);
  },

  async sendShipmentNotification(order: Order, tracking: { carrier: string; trackingNumber: string; trackingUrl: string }, userEmail: string) {
    const html = renderOrderShipped({ orderNumber: order.orderNumber, tracking });
    await sendEmail(userEmail, `Your Order Has Shipped — ${order.orderNumber}`, html, "order.shipped", order.id);
  },

  async sendDeliveryConfirmation(order: Order, userEmail: string) {
    const html = renderOrderDelivered({ orderNumber: order.orderNumber });
    await sendEmail(userEmail, `Order Delivered — ${order.orderNumber}`, html, "order.delivered", order.id);
  },

  async sendCancellationNotice(order: Order, reason: string, userEmail: string) {
    const html = renderOrderCancelled({ orderNumber: order.orderNumber, reason });
    await sendEmail(userEmail, `Order Cancelled — ${order.orderNumber}`, html, "order.cancelled", order.id);
  },

  async sendAbandonedCart(email: string, cart: Cart & { items: CartItem[] }) {
    const html = renderAbandonedCart({ itemCount: cart.items.length });
    await sendEmail(email, "You left something in your cart!", html, "cart.abandoned");
  },
};

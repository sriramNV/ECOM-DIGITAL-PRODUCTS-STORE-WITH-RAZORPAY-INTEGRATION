import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { printifyOrders } from "@/lib/printify/orders";
import { orderRepo } from "@/lib/repositories/order-repo";
import { deadLetterRepo } from "@/lib/repositories/dead-letter-repo";
import { logger } from "@/lib/logger";
import { emailService } from "./email-service";

const PRINTIFY_WEBHOOK_SECRET = process.env.PRINTIFY_WEBHOOK_SECRET!;

export const fulfillmentService = {
  async submitOrder(orderId: string) {
    const order = await orderRepo.getById(orderId);
    if (!order || order.status !== "PAID") return;

    if (order.printifyOrderId) {
      logger.info({ orderId }, "Order already submitted to Printify");
      return;
    }

    const address = order.shippingAddress as Record<string, string> | null;
    if (!address) {
      await deadLetterRepo.add(orderId, "Missing shipping address", {});
      return;
    }

    try {
      const result = await printifyOrders.submit({
        external_id: order.id,
        line_items: order.items.map((item) => ({
          product_id: item.productId,
          variant_id: Number(item.variantId),
          quantity: item.quantity,
        })),
        shipping_method: 1,
        address_to: {
          first_name: (address.name ?? "").split(" ")[0] || "Customer",
          last_name: (address.name ?? "").split(" ").slice(1).join(" ") || "",
          address1: address.street ?? "",
          city: address.city ?? "",
          state: address.state ?? "",
          zip: address.pincode ?? "",
          country: address.country ?? "IN",
          phone: address.phone ?? "",
        },
      });

      await prisma.order.update({
        where: { id: orderId },
        data: {
          printifyOrderId: result.id,
          status: "PROCESSING",
        },
      });

      await prisma.orderStatusHistory.create({
        data: { orderId, status: "PROCESSING", note: "Submitted to Printify" },
      });

      logger.info({ orderId, printifyOrderId: result.id }, "Order submitted to Printify");
    } catch (error) {
      logger.error({ error, orderId }, "Failed to submit order to Printify");
      await deadLetterRepo.add(orderId, (error as Error).message, {});
    }
  },

  async handleWebhook(payload: unknown, signature: string, rawBody: string) {
    const expected = crypto
      .createHmac("sha256", PRINTIFY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    const safe = sigBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    if (!safe) {
      throw new Error("Invalid Printify webhook signature");
    }

    const event = payload as { event: string; data?: { order_id?: string; external_id?: string; shipping?: { carrier: string; tracking_number: string; tracking_url: string } } };
    const orderId = event.data?.external_id;
    if (!orderId) return;

    const statusMap: Record<string, string> = {
      "order:sent-to-production": "PRINTING",
      "order:shipment:created": "SHIPPED",
      "order:shipment:delivered": "DELIVERED",
    };

    const newStatus = statusMap[event.event];
    if (newStatus) {
      await orderRepo.updateStatus(orderId, newStatus);

      if (newStatus === "SHIPPED" && event.data?.shipping) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            shippingMethod: `${event.data.shipping.carrier} - ${event.data.shipping.tracking_number}`,
          },
        });
      }

      const orderEntity = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, userId: true, orderNumber: true },
      });
      if (orderEntity) {
        const user = await prisma.user.findUnique({ where: { id: orderEntity.userId }, select: { email: true } });
        if (newStatus === "SHIPPED" && user && event.data?.shipping) {
          emailService.sendShipmentNotification(orderEntity as any, { carrier: event.data.shipping.carrier, trackingNumber: event.data.shipping.tracking_number, trackingUrl: event.data.shipping.tracking_url }, user.email).catch(logger.error);
        }
        if (newStatus === "DELIVERED" && user) {
          emailService.sendDeliveryConfirmation(orderEntity as any, user.email).catch(logger.error);
        }
      }

      logger.info({ orderId, status: newStatus, event: event.event }, "Order status updated via Printify webhook");
    }
  },
};

import { printifyClient } from "./client";
import type { PrintifyOrderInput, PrintifyOrder } from "./types";

const SHOP_ID = process.env.PRINTIFY_SHOP_ID;
if (!SHOP_ID) throw new Error("PRINTIFY_SHOP_ID environment variable is not configured");

export const printifyOrders = {
  async submit(data: PrintifyOrderInput) {
    return printifyClient.request<PrintifyOrder>({
      method: "POST",
      path: `/shops/${SHOP_ID}/orders.json`,
      body: data,
    });
  },

  async getStatus(orderId: string) {
    return printifyClient.request<PrintifyOrder>({
      method: "GET",
      path: `/shops/${SHOP_ID}/orders/${orderId}.json`,
    });
  },

  async calculateShipping(lineItems: Array<{ product_id: string; variant_id: number; quantity: number }>, address: { country: string }) {
    return printifyClient.request<{ standard: number; express: number }>({
      method: "POST",
      path: `/shops/${SHOP_ID}/orders/shipping.json`,
      body: { line_items: lineItems, address_to: address },
    });
  },
};

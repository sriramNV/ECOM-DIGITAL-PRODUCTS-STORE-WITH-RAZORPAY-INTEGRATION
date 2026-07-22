import { printifyClient } from "./client";
import type { PrintifyOrderInput, PrintifyOrder } from "./types";

function getShopId(): string {
  const id = process.env.PRINTIFY_SHOP_ID;
  if (!id) throw new Error("PRINTIFY_SHOP_ID environment variable is not configured");
  return id;
}

export const printifyOrders = {
  async submit(data: PrintifyOrderInput) {
    return printifyClient.request<PrintifyOrder>({
      method: "POST",
      path: `/shops/${getShopId()}/orders.json`,
      body: data,
    });
  },

  async getStatus(orderId: string) {
    return printifyClient.request<PrintifyOrder>({
      method: "GET",
      path: `/shops/${getShopId()}/orders/${orderId}.json`,
    });
  },

  async calculateShipping(lineItems: Array<{ product_id: string; variant_id: number; quantity: number }>, address: { country: string }) {
    return printifyClient.request<{ standard: number; express: number }>({
      method: "POST",
      path: `/shops/${getShopId()}/orders/shipping.json`,
      body: { line_items: lineItems, address_to: address },
    });
  },
};

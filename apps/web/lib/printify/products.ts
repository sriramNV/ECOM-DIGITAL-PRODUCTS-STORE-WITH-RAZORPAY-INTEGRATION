import { printifyClient } from "./client";
import type { PrintifyProduct } from "./types";

const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

export const printifyProducts = {
  async list() {
    return printifyClient.request<{ data: PrintifyProduct[] }>({
      method: "GET",
      path: `/shops/${SHOP_ID}/products.json`,
    });
  },

  async create(data: {
    blueprint_id: number;
    print_provider_id: number;
    title: string;
    description: string;
    variants: Array<{ id: number; price: number }>;
    images: Array<{ src: string; position: string }>;
  }) {
    return printifyClient.request<PrintifyProduct>({
      method: "POST",
      path: `/shops/${SHOP_ID}/products.json`,
      body: data,
    });
  },

  async update(productId: string, data: Partial<{ title: string; description: string; variants: Array<{ id: number; price: number }> }>) {
    return printifyClient.request<PrintifyProduct>({
      method: "PUT",
      path: `/shops/${SHOP_ID}/products/${productId}.json`,
      body: data,
    });
  },

  async publish(productId: string) {
    return printifyClient.request({
      method: "POST",
      path: `/shops/${SHOP_ID}/products/${productId}/publish.json`,
    });
  },

  async delete(productId: string) {
    return printifyClient.request({
      method: "DELETE",
      path: `/shops/${SHOP_ID}/products/${productId}.json`,
    });
  },
};

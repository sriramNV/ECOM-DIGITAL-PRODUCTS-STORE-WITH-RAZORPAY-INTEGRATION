import { printifyClient } from "./client";
import type { PrintifyProduct } from "./types";

function getShopId(): string {
  const id = process.env.PRINTIFY_SHOP_ID;
  if (!id) throw new Error("PRINTIFY_SHOP_ID environment variable is not configured");
  return id;
}

export const printifyProducts = {
  async list() {
    return printifyClient.request<{ data: PrintifyProduct[] }>({
      method: "GET",
      path: `/shops/${getShopId()}/products.json`,
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
      path: `/shops/${getShopId()}/products.json`,
      body: data,
    });
  },

  async update(productId: string, data: Partial<{ title: string; description: string; variants: Array<{ id: number; price: number }> }>) {
    return printifyClient.request<PrintifyProduct>({
      method: "PUT",
      path: `/shops/${getShopId()}/products/${productId}.json`,
      body: data,
    });
  },

  async publish(productId: string) {
    return printifyClient.request({
      method: "POST",
      path: `/shops/${getShopId()}/products/${productId}/publish.json`,
    });
  },

  async delete(productId: string) {
    return printifyClient.request({
      method: "DELETE",
      path: `/shops/${getShopId()}/products/${productId}.json`,
    });
  },
};

import { printifyClient } from "./client";
import type { PrintifyShop } from "./types";

function getShopId(): string {
  const id = process.env.PRINTIFY_SHOP_ID;
  if (!id) throw new Error("PRINTIFY_SHOP_ID environment variable is not configured");
  return id;
}

export const printifyWebhooks = {
  async list() {
    return printifyClient.request<Array<{ id: string; topic: string; url: string }>>({
      method: "GET",
      path: `/shops/${getShopId()}/webhooks.json`,
    });
  },

  async create(topic: string, url: string) {
    return printifyClient.request<{ id: string }>({
      method: "POST",
      path: `/shops/${getShopId()}/webhooks.json`,
      body: { topic, url },
    });
  },

  async remove(webhookId: string) {
    return printifyClient.request({
      method: "DELETE",
      path: `/shops/${getShopId()}/webhooks/${webhookId}.json`,
    });
  },
};

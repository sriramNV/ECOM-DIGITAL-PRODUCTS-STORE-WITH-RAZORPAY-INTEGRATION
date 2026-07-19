import { printifyClient } from "./client";
import type { PrintifyShop } from "./types";

const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

export const printifyWebhooks = {
  async list() {
    return printifyClient.request<Array<{ id: string; topic: string; url: string }>>({
      method: "GET",
      path: `/shops/${SHOP_ID}/webhooks.json`,
    });
  },

  async create(topic: string, url: string) {
    return printifyClient.request<{ id: string }>({
      method: "POST",
      path: `/shops/${SHOP_ID}/webhooks.json`,
      body: { topic, url },
    });
  },

  async remove(webhookId: string) {
    return printifyClient.request({
      method: "DELETE",
      path: `/shops/${SHOP_ID}/webhooks/${webhookId}.json`,
    });
  },
};

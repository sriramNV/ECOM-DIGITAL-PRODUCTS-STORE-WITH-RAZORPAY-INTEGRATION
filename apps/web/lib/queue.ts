import Queue from "bull";

export const abandonedCartQueue = new Queue("abandoned-cart", { redis: process.env.REDIS_URL as string });
export const emailQueue = new Queue("email", { redis: process.env.REDIS_URL as string });
export const fulfillmentQueue = new Queue("fulfillment", { redis: process.env.REDIS_URL as string });

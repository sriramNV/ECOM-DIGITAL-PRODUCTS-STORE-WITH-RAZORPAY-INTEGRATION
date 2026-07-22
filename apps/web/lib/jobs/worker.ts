import { ensureAbandonedCartWorker } from "./abandoned-cart";
import { logger } from "@/lib/logger";

let workerQueue: ReturnType<typeof ensureAbandonedCartWorker>;

try {
  workerQueue = ensureAbandonedCartWorker();
  logger.info("Worker process ready — abandoned cart processor registered");
} catch (error) {
  logger.error({ error }, "Failed to initialize abandoned cart worker");
  process.exit(1);
}

async function shutdown(signal: string) {
  logger.info({ signal }, "Worker shutting down");
  await workerQueue.close();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

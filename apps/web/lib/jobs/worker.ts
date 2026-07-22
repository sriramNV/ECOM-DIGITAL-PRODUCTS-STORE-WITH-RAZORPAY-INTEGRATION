import { ensureAbandonedCartWorker } from "./abandoned-cart";
import { logger } from "@/lib/logger";

ensureAbandonedCartWorker();
logger.info("Worker process ready — abandoned cart processor registered");

process.on("SIGTERM", () => {
  logger.info("Worker received SIGTERM, shutting down");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("Worker received SIGINT, shutting down");
  process.exit(0);
});

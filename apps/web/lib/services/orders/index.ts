import { prisma } from "@/lib/db";
import { getProductDownloadUrl } from "@/lib/services/files";
import { rateLimit } from "@/lib/rate-limit";

const orderInclude = {
  items: true,
  payments: true,
  statusHistory: { orderBy: { createdAt: "desc" as const } },
};

export async function getUserOrders(userId: string, page = 1, limit = 20) {
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      include: { ...orderInclude, items: { include: { product: { select: { fileKey: true, fileVersion: true } } } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getUserOrder(userId: string, orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { ...orderInclude, items: { include: { product: { select: { fileKey: true, fileVersion: true } } } } },
  });
}

export async function generateDownloadUrl(
  userId: string,
  orderId: string,
  itemId: string
) {
  const { allowed, remaining } = await rateLimit(`download:${userId}`, 3, 3600);
  if (!allowed) {
    throw new Error("Download limit exceeded. Try again later.");
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });

  if (!order) throw new Error("Order not found");

  const item = order.items.find((i) => i.id === itemId);
  if (!item) throw new Error("Item not found in order");

  const product = await prisma.product.findUnique({
    where: { id: item.productId },
    select: { fileKey: true, fileVersion: true, fileName: true },
  });

  if (!product?.fileKey) throw new Error("No file available for this product");

  await prisma.download.create({
    data: {
      userId,
      productId: item.productId,
      orderId,
      fileVersion: product.fileVersion,
    },
  });

  const url = await getProductDownloadUrl(product.fileKey);
  return { url, fileName: product.fileName, remaining };
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProductDownloadUrl } from "@/lib/services/files";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = await rateLimit(`download-bulk:${session.user.id}`, 3, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Download limit exceeded. Try again later." }, { status: 429 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id, status: "PAID" },
    include: {
      items: {
        include: { product: { select: { fileKey: true, fileName: true, title: true } } },
      },
    },
  });

  const downloads: { title: string; url: string; fileName: string | null }[] = [];

  for (const order of orders) {
    for (const item of order.items) {
      if (item.product.fileKey) {
        const url = await getProductDownloadUrl(item.product.fileKey);
        downloads.push({ title: item.product.title, url, fileName: item.product.fileName });
      }
    }
  }

  return NextResponse.json({ downloads });
}

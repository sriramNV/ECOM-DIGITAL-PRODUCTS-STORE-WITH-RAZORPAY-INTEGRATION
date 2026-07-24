import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFileBuffer } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";

const KEY_PATTERN = /^products\/[a-zA-Z0-9]+\/v\d+\/.+\.zip$/;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = await rateLimit(`file-download:${session.user.id}`, 10, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Too many download requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const fileKey = searchParams.get("key");
  if (!fileKey) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  if (!KEY_PATTERN.test(fileKey)) {
    return NextResponse.json({ error: "Invalid file key" }, { status: 400 });
  }

  const parts = fileKey.split("/");
  const productId = parts[1];
  if (!productId) {
    return NextResponse.json({ error: "Invalid file key" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      status: "PAID",
      items: { some: { productId } },
    },
  });

  if (!order) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const buffer = await getFileBuffer(fileKey);
  if (!buffer) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const fileName = parts[parts.length - 1] || "download.zip";

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}

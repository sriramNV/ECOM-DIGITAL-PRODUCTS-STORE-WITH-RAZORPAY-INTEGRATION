import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFileBuffer } from "@/lib/storage";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileKey = searchParams.get("key");
  if (!fileKey) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
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

  const fileName = parts.slice(2).join("/") || "download.zip";

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}

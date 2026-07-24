import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { sanitizeFilename, validateZipFile, validateFileExtension, uploadProductFile } from "@/lib/services/files";

export async function POST(req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const guard = await adminGuard();
  if (guard) return guard;

  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!validateFileExtension(file.name)) {
    return NextResponse.json({ error: "File must be a .zip" }, { status: 400 });
  }

  if (file.size > 400 * 1024 * 1024) {
    return NextResponse.json({ error: "File exceeds 400MB limit" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!validateZipFile(buffer)) {
    return NextResponse.json({ error: "Invalid zip file (magic bytes check failed)" }, { status: 400 });
  }

  const safeName = sanitizeFilename(file.name);
  const newVersion = product.fileVersion + 1;
  const fileKey = await uploadProductFile(product.id, newVersion, safeName, buffer);

  const updated = await prisma.product.update({
    where: { slug: params.slug },
    data: {
      fileKey,
      fileName: safeName,
      fileSize: file.size,
      fileVersion: newVersion,
    },
  });

  return NextResponse.json({ fileKey: updated.fileKey, fileName: updated.fileName, fileSize: updated.fileSize, fileVersion: updated.fileVersion });
}

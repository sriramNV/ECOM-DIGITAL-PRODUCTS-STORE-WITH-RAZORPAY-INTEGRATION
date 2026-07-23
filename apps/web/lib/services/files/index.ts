import { uploadFile, getDownloadUrl } from "@/lib/storage";

const ZIP_MAGIC_BYTES = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

export function validateZipFile(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return buffer[0] === ZIP_MAGIC_BYTES[0] &&
         buffer[1] === ZIP_MAGIC_BYTES[1] &&
         buffer[2] === ZIP_MAGIC_BYTES[2] &&
         buffer[3] === ZIP_MAGIC_BYTES[3];
}

export function validateFileExtension(filename: string): boolean {
  return filename.toLowerCase().endsWith(".zip");
}

export function generateFileKey(productId: string, version: number, filename: string): string {
  return `products/${productId}/v${version}/${filename}`;
}

export async function uploadProductFile(
  productId: string,
  version: number,
  filename: string,
  buffer: Buffer
) {
  const fileKey = generateFileKey(productId, version, filename);
  await uploadFile(fileKey, buffer);
  return fileKey;
}

export function getProductDownloadUrl(fileKey: string) {
  return getDownloadUrl(fileKey);
}

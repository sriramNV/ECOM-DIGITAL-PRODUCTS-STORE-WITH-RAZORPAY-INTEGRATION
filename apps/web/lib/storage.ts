import { writeFile, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";

let uploadDir: string;

export function getUploadDir() {
  if (!uploadDir) {
    uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), "uploads");
  }
  return uploadDir;
}

export async function uploadFile(key: string, buffer: Buffer) {
  const filePath = join(getUploadDir(), key);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
}

export async function getFileBuffer(key: string) {
  const filePath = join(getUploadDir(), key);
  if (!existsSync(filePath)) return null;
  return readFile(filePath);
}

export async function getDownloadUrl(key: string) {
  return `/api/files/download?key=${encodeURIComponent(key)}`;
}

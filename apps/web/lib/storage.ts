import { writeFile, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname, resolve } from "path";

let uploadDir: string;

export function getUploadDir() {
  if (!uploadDir) {
    uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), "uploads");
  }
  return uploadDir;
}

export async function uploadFile(key: string, buffer: Buffer) {
  const safeKey = sanitizeKey(key);
  const filePath = join(getUploadDir(), safeKey);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
}

export async function getFileBuffer(key: string) {
  const safeKey = sanitizeKey(key);
  const filePath = join(getUploadDir(), safeKey);
  if (!existsSync(filePath)) return null;
  return readFile(filePath);
}

export async function getDownloadUrl(key: string) {
  const safeKey = sanitizeKey(key);
  return `/api/files/download?key=${encodeURIComponent(safeKey)}`;
}

function sanitizeKey(key: string): string {
  const resolved = resolve(getUploadDir(), key);
  const base = resolve(getUploadDir());
  if (!resolved.startsWith(base)) {
    throw new Error("Invalid file key: path traversal detected");
  }
  return key;
}

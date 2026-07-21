import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/admin-guard";
import { handleApiError } from "@/lib/api-error-handler";
import { validateBody, adminSettingsSchema } from "@/lib/schemas";

const DEFAULT_SETTINGS: Record<string, string> = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "POD Store",
  currency: process.env.NEXT_PUBLIC_CURRENCY ?? "INR",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "",
  itemsPerPage: process.env.NEXT_PUBLIC_ITEMS_PER_PAGE ?? "20",
};

async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const db: Record<string, string> = {};
  for (const row of rows) db[row.key] = row.value;
  return { ...DEFAULT_SETTINGS, ...db };
}

export async function GET() {
  try {
    const guard = await adminGuard();
    if (guard) return guard;
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return handleApiError(error, "admin/settings GET");
  }
}

export async function PATCH(request: Request) {
  try {
    const guard = await adminGuard();
    if (guard) return guard;
    const { data, error: validationError } = validateBody(adminSettingsSchema, await request.json());
    if (validationError) return validationError;
    const allowed = ["appName", "currency", "supportEmail", "itemsPerPage"];
    for (const key of allowed) {
      const value = data![key as keyof typeof data];
      if (value !== undefined) {
        await prisma.setting.upsert({
          where: { key },
          create: { key, value: String(value) },
          update: { value: String(value) },
        });
      }
    }
    const settings = await getSettings();
    return NextResponse.json({ message: "Settings updated.", settings });
  } catch (error) {
    return handleApiError(error, "admin/settings PATCH");
  }
}

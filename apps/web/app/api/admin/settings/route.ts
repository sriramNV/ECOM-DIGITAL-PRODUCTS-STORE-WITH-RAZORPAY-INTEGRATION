import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-guard";
import { handleApiError } from "@/lib/api-error-handler";
import { validateBody, adminSettingsSchema } from "@/lib/schemas";

let pendingSettings: Record<string, string> = {};

export async function GET() {
  try {
    const guard = await adminGuard();
    if (guard) return guard;
    return NextResponse.json({
      appName: pendingSettings.appName ?? process.env.NEXT_PUBLIC_APP_NAME ?? "POD Store",
      currency: pendingSettings.currency ?? process.env.NEXT_PUBLIC_CURRENCY ?? "INR",
      supportEmail: pendingSettings.supportEmail ?? process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "",
      itemsPerPage: pendingSettings.itemsPerPage ?? process.env.NEXT_PUBLIC_ITEMS_PER_PAGE ?? "20",
    });
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
      if (data![key as keyof typeof data] !== undefined) {
        pendingSettings[key] = String(data![key as keyof typeof data]);
      }
    }
    return NextResponse.json({
      message: "Settings updated. A server restart is required for them to take full effect.",
      settings: await GET().then((r) => r.json()),
    });
  } catch (error) {
    return handleApiError(error, "admin/settings PATCH");
  }
}

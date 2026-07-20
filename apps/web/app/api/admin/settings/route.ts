import { NextResponse } from "next/server";

let pendingSettings: Record<string, string> = {};

export async function GET() {
  return NextResponse.json({
    appName: pendingSettings.appName ?? process.env.NEXT_PUBLIC_APP_NAME ?? "POD Store",
    currency: pendingSettings.currency ?? process.env.NEXT_PUBLIC_CURRENCY ?? "INR",
    supportEmail: pendingSettings.supportEmail ?? process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "",
    itemsPerPage: pendingSettings.itemsPerPage ?? process.env.NEXT_PUBLIC_ITEMS_PER_PAGE ?? "20",
  });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const allowed = ["appName", "currency", "supportEmail", "itemsPerPage"];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      pendingSettings[key] = String(body[key]);
    }
  }
  return NextResponse.json({
    message: "Settings updated. A server restart is required for them to take full effect.",
    settings: await GET().then((r) => r.json()),
  });
}

import { NextResponse } from "next/server";
import { userGuard } from "@/lib/guard";
import { generateDownloadUrl } from "@/lib/services/orders";

export async function GET(req: Request, { params }: { params: { id: string; itemId: string } }) {
  const user = await userGuard();
  if (user instanceof NextResponse) return user;

  try {
    const result = await generateDownloadUrl(user.id, params.id, params.itemId);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message.includes("limit exceeded") ? 429 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}

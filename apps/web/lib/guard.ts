import { auth } from "./auth";
import { NextResponse } from "next/server";

export async function adminGuard() {
  const session = await auth();
  if (!session?.user) {
    console.error("adminGuard: Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as any).role !== "ADMIN") {
    console.error(`adminGuard: Forbidden — user ${session.user.id} is not ADMIN`);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function userGuard() {
  const session = await auth();
  if (!session?.user) {
    console.error("userGuard: Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session.user;
}

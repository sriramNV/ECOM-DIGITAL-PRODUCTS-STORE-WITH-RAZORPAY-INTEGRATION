import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/layout/admin-shell";
import { QueryProvider } from "@/providers/query-provider";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  return <AdminShell><QueryProvider>{children}</QueryProvider></AdminShell>;
}

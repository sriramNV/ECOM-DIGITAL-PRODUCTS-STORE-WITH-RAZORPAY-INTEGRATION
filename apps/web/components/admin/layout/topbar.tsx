"use client";
import { useSession } from "next-auth/react";

export function Topbar() {
  const { data: session } = useSession();
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-surface">
      <div />
      <span className="text-sm text-foreground-muted">{session?.user?.name ?? "Admin"}</span>
    </header>
  );
}

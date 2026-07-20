"use client";
import { useSession } from "next-auth/react";
import { User } from "lucide-react";

export function Topbar() {
  const { data: session } = useSession();
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background">
      <div />
      <div className="flex items-center gap-2 text-sm text-foreground-muted">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted">
          <User className="h-3.5 w-3.5" />
        </div>
        <span>{session?.user?.name ?? "Admin"}</span>
      </div>
    </header>
  );
}

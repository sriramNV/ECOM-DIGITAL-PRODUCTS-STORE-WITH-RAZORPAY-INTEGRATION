"use client";
import { auth } from "@/lib/auth";
import { useEffect, useState } from "react";

export function Topbar() {
  const [name, setName] = useState("Admin");
  useEffect(() => { fetch("/api/auth/session").then(r => r.json()).then(s => setName(s?.user?.name ?? "Admin")) }, []);
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-surface">
      <div />
      <span className="text-sm text-foreground-muted">{name}</span>
    </header>
  );
}

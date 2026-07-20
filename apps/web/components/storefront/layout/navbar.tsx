"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border h-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-full flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-foreground">
          POD Store
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/products" className="text-sm font-medium text-foreground-muted hover:text-foreground">
            Products
          </Link>
          <Link href="/about" className="text-sm font-medium text-foreground-muted hover:text-foreground">
            About
          </Link>
          <Link href="/contact" className="text-sm font-medium text-foreground-muted hover:text-foreground">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/cart" className="relative">
            <ShoppingCart className="h-5 w-5 text-foreground-muted hover:text-foreground" />
          </Link>

          {session ? (
            <div className="flex items-center gap-3">
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="text-sm font-medium text-foreground-muted hover:text-foreground">
                  Admin
                </Link>
              )}
              <Link href="/account" className="text-sm text-foreground-muted hover:text-foreground">
                {session.user.name ?? "Account"}
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

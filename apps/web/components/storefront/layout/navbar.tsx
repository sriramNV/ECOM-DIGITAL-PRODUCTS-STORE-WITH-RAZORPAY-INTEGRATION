"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/storefront/layout/mobile-menu";
import { useCartStore } from "@/stores/cart-store";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.items.length);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/products", label: "Products" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border h-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-full flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-foreground">
          POD Store
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "text-foreground bg-muted"
                    : "text-foreground-muted hover:text-foreground hover:bg-muted/50"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 text-foreground-muted hover:text-foreground transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/cart" className="relative p-1.5 text-foreground-muted hover:text-foreground transition-colors">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-xs font-medium rounded-full h-4.5 min-w-[18px] flex items-center justify-center px-1">{cartCount}</span>}
          </Link>

          {session ? (
            <div className="flex items-center gap-3">
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors">
                  Admin
                </Link>
              )}
              <Link href="/account" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
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
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/stores/cart-store";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, LogOut, Sun, Moon, Menu } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const totalItems = useCartStore((s) => s.totalItems());
  const clearCart = useCartStore((s) => s.clearCart);
  const { theme, toggle: toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl"
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">NEXUS</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
               className={`text-[15px] transition-colors hover:text-primary ${pathname === link.href ? "text-primary" : "text-muted-foreground"}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Button>
          </Link>

          {session?.user ? (
            <div className="flex items-center gap-2">
              <Link href="/account">
                <Button variant="ghost" size="icon"><User className="h-4 w-4" /></Button>
              </Link>
              {(session.user as any).role === "ADMIN" && (
                <Link href="/admin"><Button variant="ghost" size="sm">Admin</Button></Link>
              )}
              <Button variant="ghost" size="icon" onClick={() => { clearCart(); signOut(); }}><LogOut className="h-4 w-4" /></Button>
            </div>
          ) : (
            <Link href="/auth/login"><Button size="sm">Sign in</Button></Link>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-border px-4 pb-4 md:hidden"
        >
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="block py-2 text-[15px]" onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          ))}
        </motion.div>
      )}
    </motion.header>
  );
}

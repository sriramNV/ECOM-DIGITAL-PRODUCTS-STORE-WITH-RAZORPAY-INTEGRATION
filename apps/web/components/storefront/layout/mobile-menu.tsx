"use client";

import Link from "next/link";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function MobileMenu({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-150">
      <div className="fixed inset-0 bg-overlay" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-background shadow-xl animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="text-lg font-semibold text-foreground">Menu</span>
          <button onClick={onClose} aria-label="Close menu" className="p-1 text-foreground-muted hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          <Link href="/products" className="block px-3 py-3 rounded-lg text-base font-medium text-foreground hover:bg-muted transition-colors" onClick={onClose}>
            Products
          </Link>
          <Link href="/about" className="block px-3 py-3 rounded-lg text-base font-medium text-foreground hover:bg-muted transition-colors" onClick={onClose}>
            About
          </Link>
          <Link href="/contact" className="block px-3 py-3 rounded-lg text-base font-medium text-foreground hover:bg-muted transition-colors" onClick={onClose}>
            Contact
          </Link>
        </nav>
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-overlay" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-background shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="text-lg font-semibold">Menu</span>
          <button onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-4">
          <Link href="/products" className="block text-lg font-medium py-4 border-b border-border" onClick={onClose}>
            Products
          </Link>
          <Link href="/about" className="block text-lg font-medium py-4 border-b border-border" onClick={onClose}>
            About
          </Link>
          <Link href="/contact" className="block text-lg font-medium py-4" onClick={onClose}>
            Contact
          </Link>
        </nav>
      </div>
    </div>
  );
}

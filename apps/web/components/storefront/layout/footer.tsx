import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border px-4 md:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Shop</h3>
          <ul className="space-y-2">
            <li><Link href="/products" className="text-sm text-foreground-muted hover:text-foreground">All Products</Link></li>
            <li><Link href="/products?category=tshirts" className="text-sm text-foreground-muted hover:text-foreground">T-Shirts</Link></li>
            <li><Link href="/products?category=hoodies" className="text-sm text-foreground-muted hover:text-foreground">Hoodies</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Help</h3>
          <ul className="space-y-2">
            <li><Link href="/contact" className="text-sm text-foreground-muted hover:text-foreground">Contact</Link></li>
            <li><Link href="/faq" className="text-sm text-foreground-muted hover:text-foreground">FAQ</Link></li>
            <li><Link href="/size-guide" className="text-sm text-foreground-muted hover:text-foreground">Size Guide</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Company</h3>
          <ul className="space-y-2">
            <li><Link href="/about" className="text-sm text-foreground-muted hover:text-foreground">About</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Follow Us</h3>
          <p className="text-sm text-foreground-muted">Instagram &bull; Twitter</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-border text-center">
        <p className="text-sm text-foreground-faint">&copy; {new Date().getFullYear()} POD Store. All rights reserved.</p>
      </div>
    </footer>
  );
}

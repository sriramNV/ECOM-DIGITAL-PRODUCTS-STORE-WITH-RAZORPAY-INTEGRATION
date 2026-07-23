import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
        <Link href="/" className="text-sm font-bold text-primary">NEXUS</Link>
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Nexus Store. All rights reserved.</p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <Link href="/products" className="hover:text-primary">Products</Link>
        </div>
      </div>
    </footer>
  );
}

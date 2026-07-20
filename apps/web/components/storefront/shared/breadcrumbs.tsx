import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { label: string; href?: string };

type Props = {
  crumbs: Crumb[];
};

export function Breadcrumbs({ crumbs }: Props) {
  return (
    <nav className="flex items-center gap-2 text-sm text-foreground-faint py-4" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href ?? crumb.label} className="flex items-center gap-2">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-foreground">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

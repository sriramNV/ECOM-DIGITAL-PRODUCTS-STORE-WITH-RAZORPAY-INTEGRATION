import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";

type Props = {
  title: string;
  slug: string;
  imageUrl: string;
  imageAlt: string | null;
  minPrice: number;
};

export function ProductCard({ title, slug, imageUrl, imageAlt, minPrice }: Props) {
  return (
    <Link href={`/products/${slug}`} className="group block">
      <div className="bg-surface-raised border border-border rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="aspect-square relative overflow-hidden bg-surface">
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/5" />
        </div>
        <div className="p-4">
          <h3 className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors duration-200">{title}</h3>
          <p className="text-sm text-foreground-muted mt-1">From {formatCurrency(minPrice)}</p>
        </div>
      </div>
    </Link>
  );
}

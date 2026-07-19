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
    <Link href={`/products/${slug}`} className="group">
      <div className="bg-surface-raised border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="aspect-square relative overflow-hidden bg-surface">
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            className="object-cover group-hover:scale-102 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
        </div>
        <div className="p-4">
          <h3 className="text-sm font-medium text-foreground truncate">{title}</h3>
          <p className="text-sm text-foreground-muted mt-1">From {formatCurrency(minPrice)}</p>
        </div>
      </div>
    </Link>
  );
}

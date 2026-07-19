import { formatCurrency } from "@/lib/utils";

type Props = {
  price: number;
  originalPrice?: number;
  size?: "sm" | "md" | "lg";
};

export function PriceDisplay({ price, originalPrice, size = "md" }: Props) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg font-semibold",
    lg: "text-2xl font-bold",
  };

  return (
    <div className="flex items-baseline gap-2">
      <span className={`${sizeClasses[size]} text-foreground`}>{formatCurrency(price)}</span>
      {originalPrice && originalPrice > price && (
        <span className="text-sm text-foreground-faint line-through">{formatCurrency(originalPrice)}</span>
      )}
    </div>
  );
}

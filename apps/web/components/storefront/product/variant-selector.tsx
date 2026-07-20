"use client";

import { cn } from "@/lib/utils";

type Variant = {
  id: string;
  title: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  price: number;
};

type Props = {
  variants: Variant[];
  selectedId: string | null;
  onSelect: (variant: Variant) => void;
};

export function VariantSelector({ variants, selectedId, onSelect }: Props) {
  const colors = [...new Set(variants.filter((v) => v.color).map((v) => v.color!))];
  const sizes = [...new Set(variants.filter((v) => v.size).map((v) => v.size!))];

  return (
    <div className="space-y-5">
      {colors.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2.5 block">Color</label>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const variant = variants.find((v) => v.color === color);
              const isSelected = variant?.id === selectedId;
              return (
                <button
                  key={color}
                  onClick={() => variant && onSelect(variant)}
                  className={cn(
                    "relative flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm transition-all duration-150",
                    isSelected
                      ? "border-accent bg-accent-muted text-accent"
                      : "border-border text-foreground hover:border-foreground-faint hover:bg-muted/50"
                  )}
                  aria-label={color}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-border shrink-0"
                    style={{ backgroundColor: variant?.colorHex ?? "#ccc" }}
                  />
                  <span>{color}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2.5 block">Size</label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const variant = variants.find((v) => v.size === size);
              const isSelected = variant?.id === selectedId;
              return (
                <button
                  key={size}
                  onClick={() => variant && onSelect(variant)}
                  className={cn(
                    "px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-150",
                    isSelected
                      ? "bg-accent text-accent-foreground border-accent"
                      : "border-border text-foreground hover:border-foreground-faint hover:bg-muted/50"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

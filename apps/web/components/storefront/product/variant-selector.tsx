"use client";

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
    <div className="space-y-4">
      {colors.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Color</label>
          <div className="flex gap-2">
            {colors.map((color) => {
              const variant = variants.find((v) => v.color === color);
              return (
                <button
                  key={color}
                  onClick={() => variant && onSelect(variant)}
                  className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-colors ${
                    variant?.id === selectedId ? "border-accent ring-2 ring-accent" : "border-border"
                  }`}
                  style={{ backgroundColor: variant?.colorHex ?? "#ccc" }}
                  aria-label={color}
                />
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Size</label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const variant = variants.find((v) => v.size === size);
              return (
                <button
                  key={size}
                  onClick={() => variant && onSelect(variant)}
                  className={`px-4 py-2 rounded-md border text-sm cursor-pointer ${
                    variant?.id === selectedId
                      ? "bg-accent text-accent-foreground border-accent"
                      : "border-border text-foreground hover:bg-surface"
                  }`}
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

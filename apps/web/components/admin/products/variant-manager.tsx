"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type Variant = {
  id?: string;
  title: string;
  size: string;
  color: string;
  colorHex: string;
  price: number;
  stock: number;
};

type Props = {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
};

export function VariantManager({ variants, onChange }: Props) {
  function addVariant() {
    onChange([
      ...variants,
      { title: "", size: "", color: "", colorHex: "#000000", price: 0, stock: 999 },
    ]);
  }

  function removeVariant(index: number) {
    onChange(variants.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, field: keyof Variant, value: string | number) {
    const updated = variants.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Variants</h3>
        <Button type="button" variant="outline" size="sm" onClick={addVariant}>
          + Add Variant
        </Button>
      </div>
      {variants.length === 0 && (
        <p className="text-sm text-muted-foreground">No variants added yet.</p>
      )}
      <div className="grid grid-cols-[1fr_80px_120px_40px_100px_80px_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
        <span>Title</span>
        <span>Size</span>
        <span>Color</span>
        <span>Hex</span>
        <span>Price</span>
        <span>Stock</span>
        <span></span>
      </div>
      {variants.map((variant, i) => (
        <div key={i} className="grid grid-cols-[1fr_80px_120px_40px_100px_80px_auto] gap-2 items-center">
          <Input
            placeholder="e.g. Small Black"
            value={variant.title}
            onChange={(e) => updateVariant(i, "title", e.target.value)}
          />
          <Input
            placeholder="S, M, L"
            value={variant.size}
            onChange={(e) => updateVariant(i, "size", e.target.value)}
          />
          <Input
            placeholder="Black"
            value={variant.color}
            onChange={(e) => updateVariant(i, "color", e.target.value)}
          />
          <Input
            type="color"
            value={variant.colorHex}
            onChange={(e) => updateVariant(i, "colorHex", e.target.value)}
            className="h-8 p-0.5"
          />
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="299.00"
            value={variant.price}
            onChange={(e) => updateVariant(i, "price", Number(e.target.value))}
          />
          <Input
            type="number"
            min="0"
            placeholder="999"
            value={variant.stock}
            onChange={(e) => updateVariant(i, "stock", Number(e.target.value))}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => removeVariant(i)}
          >
            ✕
          </Button>
        </div>
      ))}
    </div>
  );
}

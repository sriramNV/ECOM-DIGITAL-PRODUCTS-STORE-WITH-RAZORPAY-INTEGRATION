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
};

type Props = {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
};

export function VariantManager({ variants, onChange }: Props) {
  function addVariant() {
    onChange([
      ...variants,
      { title: "", size: "", color: "", colorHex: "#000000", price: 0 },
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
      {variants.map((variant, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            placeholder="Title"
            value={variant.title}
            onChange={(e) => updateVariant(i, "title", e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Size"
            value={variant.size}
            onChange={(e) => updateVariant(i, "size", e.target.value)}
            className="w-20"
          />
          <Input
            placeholder="Color"
            value={variant.color}
            onChange={(e) => updateVariant(i, "color", e.target.value)}
            className="w-24"
          />
          <Input
            type="color"
            value={variant.colorHex}
            onChange={(e) => updateVariant(i, "colorHex", e.target.value)}
            className="w-10 h-8 p-0.5"
          />
          <Input
            type="number"
            placeholder="Price"
            value={variant.price}
            onChange={(e) => updateVariant(i, "price", Number(e.target.value))}
            className="w-24"
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

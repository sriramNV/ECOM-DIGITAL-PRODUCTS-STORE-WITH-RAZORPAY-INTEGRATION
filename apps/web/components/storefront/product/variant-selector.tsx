"use client";

import { useState, useMemo } from "react";
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
  const colors = useMemo(
    () => [...new Set(variants.filter((v) => v.color).map((v) => v.color!))],
    [variants]
  );
  const sizes = useMemo(
    () => [...new Set(variants.filter((v) => v.size).map((v) => v.size!))],
    [variants]
  );

  const selected = variants.find((v) => v.id === selectedId);

  const sortedColors = useMemo(
    () =>
      colors
        .filter((c) => !selected?.size || variants.some((v) => v.color === c && v.size === selected.size))
        .sort(),
    [colors, variants, selected?.size]
  );

  const sortedSizes = useMemo(
    () =>
      sizes
        .filter((s) => !selected?.color || variants.some((v) => v.size === s && v.color === selected.color))
        .sort(),
    [sizes, variants, selected?.color]
  );

  function selectColor(color: string) {
    const match = variants.find(
      (v) => v.color === color && (!selected?.size || v.size === selected.size)
    );
    if (match) onSelect(match);
  }

  function selectSize(size: string) {
    const match = variants.find(
      (v) => v.size === size && (!selected?.color || v.color === selected.color)
    );
    if (match) onSelect(match);
  }

  return (
    <div className="space-y-5">
      {colors.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2.5 block">Color</label>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const variant = variants.find((v) => v.color === color);
              const isSelected = selected?.color === color;
              const disabled = !sortedColors.includes(color);
              return (
                <button
                  key={color}
                  onClick={() => !disabled && selectColor(color)}
                  disabled={disabled}
                  className={cn(
                    "relative flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm transition-all duration-150",
                    isSelected
                      ? "border-accent bg-accent-muted text-accent"
                      : disabled
                        ? "border-border text-foreground-faint line-through opacity-40 cursor-not-allowed"
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
              const isSelected = selected?.size === size;
              const disabled = !sortedSizes.includes(size);
              return (
                <button
                  key={size}
                  onClick={() => !disabled && selectSize(size)}
                  disabled={disabled}
                  className={cn(
                    "px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-150",
                    isSelected
                      ? "bg-accent text-accent-foreground border-accent"
                      : disabled
                        ? "border-border text-foreground-faint line-through opacity-40 cursor-not-allowed"
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
"use client";

import { useState } from "react";
import Image from "next/image";

type GalleryImage = {
  url: string;
  alt: string | null;
};

type Props = {
  images: GalleryImage[];
};

export function ProductGallery({ images }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square relative bg-surface rounded-lg flex items-center justify-center text-foreground-faint">
        No image available
      </div>
    );
  }

  const selected = images[selectedIndex];

  return (
    <div className="space-y-4">
      <div className="aspect-square relative overflow-hidden bg-surface rounded-lg">
        <Image
          src={selected.url}
          alt={selected.alt ?? "Product image"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
                index === selectedIndex ? "border-accent" : "border-border hover:border-foreground-faint"
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt ?? "Thumbnail"}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

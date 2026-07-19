"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

type HeroContent = {
  heading?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
  backgroundColor?: string;
};

type Props = { content: HeroContent };

export function HeroBlock({ content }: Props) {
  const { heading, subtitle, ctaText, ctaLink, backgroundImage, backgroundColor } = content;

  return (
    <section
      className="relative min-h-[400px] md:min-h-[500px] lg:min-h-[600px] flex items-center overflow-hidden"
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      {backgroundImage && (
        <Image
          src={backgroundImage}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
      )}
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 w-full z-10">
        <div className="max-w-2xl text-white">
          {heading && (
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">{heading}</h1>
          )}
          {subtitle && (
            <p className="text-lg md:text-xl text-white/80 mt-4 max-w-xl">{subtitle}</p>
          )}
          {ctaText && ctaLink && (
            <Link href={ctaLink}>
              <Button size="lg" className="mt-8">{ctaText}</Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

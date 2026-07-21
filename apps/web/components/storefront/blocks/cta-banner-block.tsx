import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, "http://localhost");
    return parsed.protocol === "http:" || parsed.protocol === "https:" || url.startsWith("/");
  } catch {
    return url.startsWith("/");
  }
}

type CtaBannerContent = {
  heading?: string;
  body?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundImage?: string;
  backgroundColor?: string;
};

type Props = { content: CtaBannerContent };

export function CtaBannerBlock({ content }: Props) {
  const { heading, body, buttonText, buttonLink, backgroundImage, backgroundColor } = content;

  return (
    <section
      className="relative py-16 md:py-24 overflow-hidden flex items-center"
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
      <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 w-full z-10 text-center">
        {heading && (
          <h2 className="text-3xl md:text-4xl font-bold text-white">{heading}</h2>
        )}
        {body && (
          <p className="text-lg text-white/80 mt-4 max-w-2xl mx-auto">{body}</p>
        )}
        {buttonText && buttonLink && isSafeUrl(buttonLink) && (
          <Link href={buttonLink}>
            <Button size="lg" className="mt-8">{buttonText}</Button>
          </Link>
        )}
      </div>
    </section>
  );
}

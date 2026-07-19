import { HeroBlock } from "./blocks/hero-block";
import { TextBlock } from "./blocks/text-block";
import { ProductGridBlock } from "./blocks/product-grid-block";
import { CtaBannerBlock } from "./blocks/cta-banner-block";
import { NewsletterBlock } from "./blocks/newsletter-block";

type Block = {
  type: string;
  content: Record<string, unknown>;
};

type Props = { blocks: Block[] };

export function CmsPage({ blocks }: Props) {
  return (
    <div>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "hero": return <HeroBlock key={i} content={block.content as any} />;
          case "text": return <TextBlock key={i} content={block.content as any} />;
          case "product-grid": return <ProductGridBlock key={i} content={block.content as any} />;
          case "cta-banner": return <CtaBannerBlock key={i} content={block.content as any} />;
          case "newsletter": return <NewsletterBlock key={i} />;
          default: return null;
        }
      })}
    </div>
  );
}

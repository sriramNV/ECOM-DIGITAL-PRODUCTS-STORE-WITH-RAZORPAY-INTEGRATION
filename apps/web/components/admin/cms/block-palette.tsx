"use client";

type BlockType = "hero" | "text" | "product-grid" | "cta-banner" | "newsletter";

type BlockDef = { type: BlockType; label: string; icon: string; defaultContent: unknown };

const blockTypes: BlockDef[] = [
  { type: "hero", label: "Hero Banner", icon: "\uD83D\uDDBC\uFE0F", defaultContent: { heading: "", subtitle: "", ctaText: "", ctaLink: "" } },
  { type: "text", label: "Text Block", icon: "\uD83D\uDCDD", defaultContent: { content: "" } },
  { type: "product-grid", label: "Product Grid", icon: "\uD83D\uDCE6", defaultContent: { collectionSlug: "" } },
  { type: "cta-banner", label: "CTA Banner", icon: "\uD83C\uDFAF", defaultContent: { text: "", buttonText: "", buttonLink: "" } },
  { type: "newsletter", label: "Newsletter Signup", icon: "\uD83D\uDCE7", defaultContent: {} },
];

type Props = { onAddBlock: (type: BlockType) => void };

export function BlockPalette({ onAddBlock }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 p-4 border border-border rounded-lg bg-surface">
      {blockTypes.map((block) => (
        <button
          key={block.type}
          onClick={() => onAddBlock(block.type)}
          className="flex items-center gap-2 p-3 rounded-md border border-border hover:bg-surface-raised text-sm"
        >
          <span>{block.icon}</span>
          <span>{block.label}</span>
        </button>
      ))}
    </div>
  );
}

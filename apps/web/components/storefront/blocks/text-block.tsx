type TextContent = {
  body?: string;
};

type Props = { content: TextContent };

export function TextBlock({ content }: Props) {
  if (!content.body) return null;

  const paragraphs = content.body.split("\n").filter(Boolean);

  return (
    <section className="py-12 md:py-16 lg:py-24">
      <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8">
        {paragraphs.map((p, i) => (
          <p key={i} className="mb-4 last:mb-0">{p}</p>
        ))}
      </div>
    </section>
  );
}

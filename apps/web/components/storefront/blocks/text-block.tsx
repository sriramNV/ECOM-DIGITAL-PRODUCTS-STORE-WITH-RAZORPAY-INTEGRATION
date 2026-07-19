type TextContent = {
  body?: string;
};

type Props = { content: TextContent };

export function TextBlock({ content }: Props) {
  if (!content.body) return null;

  return (
    <section className="py-12 md:py-16 lg:py-24">
      <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8">
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: content.body }}
        />
      </div>
    </section>
  );
}

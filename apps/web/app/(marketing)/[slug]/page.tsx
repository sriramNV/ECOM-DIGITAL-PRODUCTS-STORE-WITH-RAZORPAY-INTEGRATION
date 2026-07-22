import type { Metadata } from "next";
import { cmsRepo } from "@/lib/repositories/cms-repo";
import { notFound } from "next/navigation";
import { CmsPage } from "@/components/storefront/cms-page";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await cmsRepo.getPageBySlug(slug);
  if (!page) return {};
  return {
    title: page.seoTitle || page.title,
    description: page.seoDesc || undefined,
  };
}

export async function generateStaticParams() {
  return [];
}

export default async function MarketingPage({ params }: Props) {
  const { slug } = await params;
  const page = await cmsRepo.getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const blocks = (page.content as Array<{ type: string; content: Record<string, unknown> }>) ?? [];

  return <CmsPage blocks={blocks} />;
}

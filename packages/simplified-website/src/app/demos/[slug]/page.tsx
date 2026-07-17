import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demos, getDemoBySlug } from "@/lib/demos";
import { getDemoCopy } from "@/lib/demos-copy";
import { DemoDetailLayout } from "@/components/demos/demo-detail-layout";
import { ResourceContextBanner } from "@/components/learning/resource-context-banner";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ source?: string }>;
}

export async function generateStaticParams() {
  return demos.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const demo = getDemoBySlug(slug);
  if (!demo) return { title: "Praxisbeispiel nicht gefunden" };
  const copy = getDemoCopy(slug);
  const description = copy?.ogSubtitle ?? demo.description;

  return {
    title: `${demo.title} ${demo.titleKicker} · Praxisbeispiel`,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: `https://loehrning.ai/demos/${demo.slug}` },
    openGraph: {
      title: `${demo.title} ${demo.titleKicker}`,
      description,
      url: `https://loehrning.ai/demos/${demo.slug}`,
      type: "article",
      // Machine-readable freshness from the catalog date (public-content contract)
      modifiedTime: demo.lastReviewed,
    },
    twitter: {
      card: "summary_large_image",
      title: `${demo.title} ${demo.titleKicker}`,
      description,
    },
  };
}

export default async function DemoDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const demo = getDemoBySlug(slug);
  if (!demo) notFound();
  const qs = searchParams ? await searchParams : undefined;
  const copy = getDemoCopy(slug);

  const jsonLd = {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Start", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Praxisbeispiele", item: `${SITE_URL}/demos` },
          {
            "@type": "ListItem",
            position: 3,
            name: `${demo.title} ${demo.titleKicker}`,
            item: `${SITE_URL}/demos/${demo.slug}`,
          },
        ],
      },
      {
        "@type": "CreativeWork",
        name: `${demo.title} ${demo.titleKicker}`,
        description: copy?.ogSubtitle ?? demo.description,
        url: `${SITE_URL}/demos/${demo.slug}`,
        provider: { "@id": ORG_ID },
        isAccessibleForFree: true,
        keywords: [demo.category, ...demo.tags, ...demo.industries].join(", "),
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} id={`demo-${demo.slug}-jsonld`} />
      <ResourceContextBanner nodeId={`demo:${demo.slug}`} />
      <DemoDetailLayout demo={demo} source={qs?.source} />
    </>
  );
}

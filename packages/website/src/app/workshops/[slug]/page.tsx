import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWorkshopBySlug, getWorkshopSlugs } from "@/lib/workshops";
import { WorkshopDetailContent } from "./workshop-detail-content";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getWorkshopSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const workshop = getWorkshopBySlug(slug);
  if (!workshop) return { title: "Workshop nicht gefunden" };

  return {
    title: `${workshop.title} · Workshop`,
    description: workshop.description,
    robots: { index: true, follow: true },
    alternates: { canonical: `https://loehrning.ai/workshops/${workshop.slug}` },
    openGraph: {
      title: workshop.title,
      description: workshop.description,
      url: `https://loehrning.ai/workshops/${workshop.slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: workshop.title,
      description: workshop.description,
    },
  };
}

export default async function WorkshopDetailPage({ params }: Props) {
  const { slug } = await params;
  const workshop = getWorkshopBySlug(slug);
  if (!workshop) notFound();

  const jsonLd = {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Start", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Workshops", item: `${SITE_URL}/workshops` },
          { "@type": "ListItem", position: 3, name: workshop.title, item: `${SITE_URL}/workshops/${workshop.slug}` },
        ],
      },
      {
        "@type": "LearningResource",
        name: workshop.title,
        description: workshop.description,
        url: `${SITE_URL}/workshops/${workshop.slug}`,
        inLanguage: "de-DE",
        isAccessibleForFree: true,
        learningResourceType: "Workshop",
        educationalUse: "self-study",
        publisher: { "@id": ORG_ID },
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} id={`workshop-${workshop.slug}-jsonld`} />
      <WorkshopDetailContent workshop={workshop} />
    </>
  );
}

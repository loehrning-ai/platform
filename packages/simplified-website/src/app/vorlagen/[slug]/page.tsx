import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getVorlageBySlug,
  getVorlagenSlugs,
  getRelatedVorlagen,
} from "@/lib/vorlagen";
import { VorlageDetailContent } from "./vorlage-detail-content";
import { ResourceContextBanner } from "@/components/learning/resource-context-banner";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getVorlagenSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const vorlage = getVorlageBySlug(slug);
  if (!vorlage) return { title: "Vorlage nicht gefunden" };

  const description = vorlage.jobToBeDone;

  return {
    title: `${vorlage.title} · Governance-Vorlage`,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: `https://loehrning.ai/vorlagen/${vorlage.slug}` },
    openGraph: {
      title: vorlage.title,
      description,
      url: `https://loehrning.ai/vorlagen/${vorlage.slug}`,
      type: "article",
      // Machine-readable freshness from the catalog date (public-content contract)
      modifiedTime: vorlage.lastReviewed || undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: vorlage.title,
      description,
    },
  };
}

export default async function VorlageDetailPage({ params }: Props) {
  const { slug } = await params;
  const vorlage = getVorlageBySlug(slug);
  if (!vorlage) notFound();
  const related = getRelatedVorlagen(slug);

  const jsonLd = {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Start", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Vorlagen", item: `${SITE_URL}/vorlagen` },
          { "@type": "ListItem", position: 3, name: vorlage.title, item: `${SITE_URL}/vorlagen/${vorlage.slug}` },
        ],
      },
      {
        "@type": "HowTo",
        name: vorlage.title,
        description: vorlage.jobToBeDone,
        totalTime: `PT${vorlage.estCompleteMinutes}M`,
        inLanguage: "de-DE",
        isAccessibleForFree: true,
        publisher: { "@id": ORG_ID },
        keywords: [...vorlage.articleRefs, ...vorlage.audience].join(", "),
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} id={`vorlage-${vorlage.slug}-jsonld`} />
      <ResourceContextBanner nodeId={`template:${vorlage.slug}`} />
      <VorlageDetailContent vorlage={vorlage} related={related} />
    </>
  );
}

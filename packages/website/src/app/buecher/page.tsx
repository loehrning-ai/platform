import type { Metadata } from "next";
import { BuecherContent } from "./buecher-content";
import { JsonLd, ORG_ID, PERSON_ID, SITE_URL } from "@/lib/seo/json-ld";
import { books } from "@/lib/books";
import { getRuntimeFeatures } from "@/lib/runtime-features";

export const metadata: Metadata = {
  title: "Bücher",
  description:
    books.length === 1
      ? "1 kostenlose Lesefassung und Buchnotizen zu KI-Kompetenz, Datenreife und praktischer Werkzeugauswahl."
      : `${books.length} kostenlose Lesefassungen und Buchnotizen zu KI-Kompetenz, Datenreife und praktischer Werkzeugauswahl.`,
  robots: { index: true, follow: true },
  alternates: { canonical: "/buecher" },
  openGraph: {
    title:
      books.length === 1
        ? "1 Lesefassung für KI-Kompetenz"
        : `${books.length} Lesefassungen für KI-Kompetenz`,
    description:
      "Buchnotizen, Vorschauseiten und Arbeitsfassungen für KI-Grundlagen, Datenreife und praktische Werkzeugauswahl im Lernbereich.",
  },
};

const BUECHER_GRAPH = {
  "@context": "https://schema.org" as const,
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Start", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Bücher", item: `${SITE_URL}/buecher` },
      ],
    },
    ...books.map((book) => ({
      "@type": "Book",
      name: book.title,
      alternateName: book.subtitle,
      description: book.description,
      author: { "@id": PERSON_ID },
      publisher: { "@id": ORG_ID },
      bookFormat: "https://schema.org/EBook",
      inLanguage: "de",
      isAccessibleForFree: true,
      educationalLevel: "Beginner",
      learningResourceType: book.resourceType,
      url: `${SITE_URL}${book.readerHref}`,
      workExample: {
        "@type": "CreativeWork",
        name: book.statusLabel,
        isAccessibleForFree: true,
        url: `${SITE_URL}${book.readerHref}`,
      },
    })),
  ],
};

export default function BuecherPage() {
  const { account: accountEnabled } = getRuntimeFeatures();
  return (
    <>
      <JsonLd data={BUECHER_GRAPH} id="buecher-jsonld" />
      <BuecherContent accountEnabled={accountEnabled} />
    </>
  );
}

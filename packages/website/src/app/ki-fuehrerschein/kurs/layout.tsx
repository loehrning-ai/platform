import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { ReadingProgressBar } from "@/components/progress/reading-progress-bar";
import { LernbegleiterStrip } from "@/components/learning/lernbegleiter-strip";

export const metadata: Metadata = {
  title: "KI im Alltag verstehen: kostenloser KI-Kurs auf Deutsch",
  description:
    "Kostenloser Kurs: KI im Alltag verstehen. 5 Blöcke, 18 Lektionen, ca. 1 Std. 40 Min., lokale Teilnahmebestätigung. Für Erwachsene ohne Vorkenntnisse. Auf Deutsch.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/ki-fuehrerschein/kurs" },
  openGraph: {
    title: "KI im Alltag: Was du wissen solltest (kostenlos)",
    description:
      "5 Blöcke, 18 Lektionen, ca. 1 Std. 40 Min. Keine Vorkenntnisse nötig. Lokale Teilnahmebestätigung. Kostenloses Lernkonto erforderlich. Auf Deutsch.",
    url: `${SITE_URL}/ki-fuehrerschein/kurs`,
    type: "website",
  },
};

const COURSE_GRAPH = {
  "@context": "https://schema.org" as const,
  "@type": "Course",
  name: "KI im Alltag: Was du wissen solltest",
  description:
    "Kostenloser, 5-blöckiger Online-Kurs zur KI-Kompetenz. 18 Lektionen, ca. 1 Std. 40 Min., lokale Teilnahmebestätigung. Für Erwachsene in Deutschland ohne Vorkenntnisse.",
  provider: { "@id": ORG_ID },
  inLanguage: "de",
  isAccessibleForFree: true,
  educationalLevel: "Beginner",
  audience: {
    "@type": "EducationalAudience",
    educationalRole: "student",
    audienceType: "Erwachsene in Deutschland ohne Vorkenntnisse",
  },
  hasCourseInstance: {
    "@type": "CourseInstance",
    courseMode: "online",
    courseWorkload: "PT1H40M",
    inLanguage: "de",
  },
};

export default function KursLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={COURSE_GRAPH} id="ki-fuehrerschein-course-jsonld" />
      <ReadingProgressBar />
      <div className="pb-16">
        {children}
      </div>
      <LernbegleiterStrip />
    </>
  );
}

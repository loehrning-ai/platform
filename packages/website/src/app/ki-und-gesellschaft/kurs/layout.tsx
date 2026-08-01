import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { ReadingProgressBar } from "@/components/progress/reading-progress-bar";
import { LernbegleiterStrip } from "@/components/learning/lernbegleiter-strip";

export const metadata: Metadata = {
  title: "KI und Gesellschaft: kostenloser Kurs über Arbeit, Deepfakes und Ethik",
  description:
    "Kostenloser Kurs: Wie KI Arbeit verändert, wie du Deepfakes erkennst und was KI-Ethik bedeutet. 3 Blöcke, 9 Lektionen, ca. 46 Min., lokale Teilnahmebestätigung.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/ki-und-gesellschaft/kurs" },
  openGraph: {
    title: "KI und Gesellschaft: Arbeit, Deepfakes, Ethik (kostenlos)",
    description:
      "3 Blöcke, 9 Lektionen, ca. 46 Min. Keine Vorkenntnisse nötig. Lokale Teilnahmebestätigung. Kostenloses Lernkonto erforderlich. Auf Deutsch.",
    url: `${SITE_URL}/ki-und-gesellschaft/kurs`,
    type: "website",
  },
};

const COURSE_GRAPH = {
  "@context": "https://schema.org" as const,
  "@type": "Course",
  name: "KI und Gesellschaft: Arbeit, Deepfakes, Ethik",
  description:
    "Kostenloser, 3-blöckiger Online-Kurs zu gesellschaftlichen KI-Themen. 9 Lektionen, ca. 46 Min., lokale Teilnahmebestätigung. Für alle ohne Vorkenntnisse.",
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
    courseWorkload: "PT46M",
    inLanguage: "de",
  },
};

export default function KursLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={COURSE_GRAPH} id="ki-und-gesellschaft-course-jsonld" />
      <ReadingProgressBar />
      <div className="pb-16">
        {children}
      </div>
      <LernbegleiterStrip />
    </>
  );
}

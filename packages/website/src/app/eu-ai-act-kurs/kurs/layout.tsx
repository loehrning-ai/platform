import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { ReadingProgressBar } from "@/components/progress/reading-progress-bar";
import { LernbegleiterStrip } from "@/components/learning/lernbegleiter-strip";

export const metadata: Metadata = {
  title: "EU AI Act Kurs: Hochrisiko und GPAI Vertiefung",
  description:
    "Kostenloser Vertiefungskurs zum EU AI Act für Verantwortliche im deutschen Mittelstand. 6 Blöcke zu Hochrisiko-KI, GPAI und Compliance-Anforderungen.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/eu-ai-act-kurs/kurs" },
  openGraph: {
    title: "EU AI Act Kurs: Hochrisiko und GPAI Vertiefung",
    description:
      "Kostenloser 6-Block-Vertiefungskurs zum EU AI Act. Hochrisiko-Klassifizierung, GPAI, Transparenz und Roadmap 2026-2028.",
    url: `${SITE_URL}/eu-ai-act-kurs/kurs`,
    type: "website",
  },
};

const COURSE_GRAPH = {
  "@context": "https://schema.org" as const,
  "@type": "Course",
  name: "EU AI Act: Was du wissen musst",
  description:
    "Kostenloser Kurs zu Grundlagen, Verboten und deinen Rechten nach der KI-Verordnung. Für alle, keine Vorkenntnisse nötig. 6 Blöcke, ca. 1 Std. 50 Min.",
  provider: { "@id": ORG_ID },
  inLanguage: "de",
  isAccessibleForFree: true,
  educationalLevel: "Beginner",
  hasCourseInstance: {
    "@type": "CourseInstance",
    courseMode: "online",
    courseWorkload: "PT1H50M",
    inLanguage: "de",
  },
};

export default function KursLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={COURSE_GRAPH} id="eu-ai-act-kurs-course-jsonld" />
      <ReadingProgressBar />
      <div className="pb-16">
        {children}
      </div>
      <LernbegleiterStrip />
    </>
  );
}

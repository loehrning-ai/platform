import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Github } from "lucide-react";
import { JsonLd, SITE_URL } from "@/lib/seo/json-ld";
import { COURSES_GRAPH } from "@/lib/seo/course-discovery";
import { Card, IconTile } from "@/components/ui/card";
import { BrandButton } from "@/components/ui/brand-button";
import { CourseGallery } from "./course-gallery";
import { PersonaCourseLinks } from "./persona-filter";

const KURSE_SOCIAL_TITLE = "Kurse: kostenlose KI-Lernplattform auf Deutsch";
const KURSE_SOCIAL_DESCRIPTION =
  "Vier deutsche Kernkurse mit Lernkonto und selbst ausgestellten Teilnahmebestätigungen oder Lernnachweisen, dazu sechs öffentliche technische Kurse auf Englisch.";
const KURSE_SOCIAL_IMAGE = {
  url: `${SITE_URL}/kurse/opengraph-image`,
  width: 1200,
  height: 630,
  alt: "loehrning.ai Kurse: vier deutsche Kernkurse und sechs Technikkurse auf Englisch",
};

export const metadata: Metadata = {
  title: KURSE_SOCIAL_TITLE,
  description: KURSE_SOCIAL_DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: "/kurse" },
  openGraph: {
    title: KURSE_SOCIAL_TITLE,
    description: KURSE_SOCIAL_DESCRIPTION,
    url: `${SITE_URL}/kurse`,
    siteName: "loehrning.ai",
    locale: "de_DE",
    type: "website",
    images: [KURSE_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: KURSE_SOCIAL_TITLE,
    description: KURSE_SOCIAL_DESCRIPTION,
    images: [{ url: KURSE_SOCIAL_IMAGE.url, alt: KURSE_SOCIAL_IMAGE.alt }],
  },
};

/** Two ideas, spelled out once so a person knows where to look. */
const TRACK_DIFF = [
  {
    icon: GraduationCap,
    accent: "kupfer" as const,
    label: "Der Lernpfad",
    text: "vier deutsche Kurse mit gespeichertem Fortschritt und Nachweis. Der KI-Check bestimmt deinen Einstieg.",
  },
  {
    icon: Github,
    accent: "sand" as const,
    label: "Tiefer gehen",
    text: "sechs technische Kurse auf Englisch, portiert von GitHub, mit Fortschritt und selbst ausgestelltem Certificate. Dazu angewandte Kurse aus Workshops.",
  },
];

export default function KursePage() {
  return (
    <>
      <JsonLd data={COURSES_GRAPH} id="kurse-hub-jsonld" />
      <div className="mx-auto max-w-[1180px] px-6 pb-32 pt-20">
        {/* Top rule: brand signature */}
        <div className="mb-9 h-[3px] w-[154px] bg-brand-orange" />

        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          § Freie KI-Lernplattform · ein Lernpfad, plus Vertiefung
        </div>

        <h1 className="mt-6 max-w-[1180px] text-[40px] font-bold leading-[0.94] tracking-[-0.05em] text-foreground sm:text-[56px] md:text-[80px]">
          KI lernen.<br />
          <span className="text-brand-orange">Schritt für Schritt.</span>
        </h1>

        <p className="mt-9 max-w-[720px] text-[18px] leading-[1.5] text-muted-foreground sm:text-[21px]">
          Vier deutsche Kurse bilden den Lernpfad: von der KI-Kompetenz über
          die gesellschaftliche Einordnung und den EU AI Act bis zum AI-nativen
          Arbeiten. Danach vertiefst du dein Wissen: sechs technische Kurse auf
          Englisch, portiert aus offenen GitHub-Repositories, plus angewandte
          Selbstlernkurse aus Workshop-Material.
        </p>

        {/* Beginner entry point */}
        <div className="mt-8 rounded-lg border border-border bg-card px-5 py-3 shadow-tile">
          <p className="text-[14px] text-muted-foreground">
            <span className="font-bold text-foreground">Dein erster Schritt:</span>{" "}
            <Link
              href="/ki-check"
              className="text-brand-orange underline underline-offset-4"
            >
              Der fünfminütige KI-Check
            </Link>
            {" "}ordnet deinen Stand ein und nennt den passenden Einstieg. Wenn du
            bei null beginnst, ist das Ergebnis der KI-Führerschein.
          </p>
        </div>

        {/* Was ist der Unterschied? The three tracks at a glance */}
        <section
          aria-label="Was ist der Unterschied zwischen den zwei Kursarten?"
          className="mt-10 rounded-2xl border border-border bg-kupfer-mist p-6 sm:p-7"
        >
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            Was ist der Unterschied?
          </p>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2">
            {TRACK_DIFF.map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <IconTile icon={item.icon} accent={item.accent} />
                <span className="text-[14px] leading-snug text-foreground">
                  <span className="font-bold">{item.label}:</span> {item.text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Direct course recommendations by learning goal */}
        <PersonaCourseLinks />

        {/* Three-track course gallery (client: progress dots + share + gamification) */}
        <section className="mt-16">
          <CourseGallery />
        </section>

        {/* Closing context */}
        <section className="mt-20">
          <Card accent="kupfer" className="bg-kupfer-mist p-8 sm:p-10">
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
              § Warum kostenlos
            </div>
            <h2 className="mt-3 max-w-[760px] text-[24px] font-bold tracking-[-0.02em] text-foreground sm:text-[30px]">
              KI-Kompetenz ist Pflicht. Der Lernpfad bleibt kostenlos.
            </h2>
            <p className="mt-5 max-w-[720px] text-[16px] leading-[1.6] text-muted-foreground">
              Der EU AI Act Artikel 4 verlangt seit 2. Februar 2025 angemessene
              KI-Kompetenzmaßnahmen für Anbieter und Betreiber. Der Lernbereich
              verbindet Schulung, Teilnahmebestätigung, Praxis und Ressourcen in
              einem kostenlosen Konto.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <BrandButton href="/ueber-die-plattform" variant="outline" size="md">
                Über die Plattform
                <span aria-hidden="true">→</span>
              </BrandButton>
              <BrandButton href="/ki-check" variant="outline" size="md">
                KI-Check
                <span aria-hidden="true">→</span>
              </BrandButton>
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}

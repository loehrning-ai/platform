import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandButton } from "@/components/ui/brand-button";
import {
  SectionShell,
  ClipHeading,
  Eyebrow,
  FadeBlock,
} from "@/components/ai-native/primitives";

export const metadata: Metadata = {
  title: "Capstone Gallery: AI-Native Arbeitskurs",
  description:
    "Veröffentlichungsregeln und aktueller leerer Stand der Capstone Gallery des AI-Native Arbeitskurses.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://loehrning.ai/ai-native/capstone-gallery" },
  openGraph: {
    title: "Capstone Gallery: AI-Native Arbeitskurs",
    description:
      "Noch keine veröffentlichten Einträge. Gezeigt werden nur belegte Capstones mit ausdrücklicher Freigabe.",
    url: "https://loehrning.ai/ai-native/capstone-gallery",
    type: "website",
  },
};

const RUBRIC: readonly (readonly [string, string])[] = [
  [
    "Problem ist echt",
    "Der Workflow löst ein Problem, das wirklich existiert, nicht eins, das für den Kurs erfunden wurde.",
  ],
  [
    "Scope realistisch",
    "Der Capstone ist in 7 Tagen / 10-15 Stunden als Pilot prüfbar. Kein Moonshot.",
  ],
  [
    "Claude-first Architektur",
    "Claude steht im Zentrum, nicht als Plugin neben anderer Logik.",
  ],
  [
    "Pilotiert im Arbeitsalltag",
    "Wird begrenzt eingesetzt oder anhand echter Arbeitsdaten nachgestellt. Keine reine Folienübung.",
  ],
  [
    "DSGVO-dokumentiert",
    "Datenklassifikation, AVV-Status, Zweckbindung klar benannt.",
  ],
  [
    "AI-Act-Check gemacht",
    "Annex-III-Klassifikation dokumentiert. Provider- vs. Deployer-Rolle bekannt.",
  ],
  [
    "Ablösbar",
    "Wenn morgen ein anderer Mitarbeiter das übernimmt, kommt er in 30 Minuten rein.",
  ],
];

export default function CapstoneGalleryPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background py-20 md:py-24">
        <div className="mx-auto max-w-[960px] px-6 lg:px-12">
          <nav
            aria-label="Breadcrumb"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
          >
            <Link href="/ai-native" className="hover:text-brand-orange">
              Kurs
            </Link>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-brand-orange">Capstone Gallery</span>
          </nav>

          <div className="mt-8 flex flex-wrap items-baseline gap-6">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
              Veröffentlichungsstatus · leer
            </span>
          </div>

          <ClipHeading
            as="h1"
            className="mt-4 bg-background font-bold leading-[0.92] tracking-[-0.04em] text-foreground"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
          >
            Noch keine
            <br />
            <span className="text-brand-orange">veröffentlichten Capstones.</span>
          </ClipHeading>

          <FadeBlock delay={2}>
            <p className="mt-8 max-w-[640px] text-[18px] leading-[1.6] text-muted-foreground">
              Diese Gallery bleibt leer, bis ein reales Projekt die Rubrik
              erfüllt und die Autorin oder der Autor der Veröffentlichung
              ausdrücklich zugestimmt hat.
            </p>
            <p className="mt-4 max-w-[640px] text-[15px] text-muted-foreground">
              Keine erfundenen Projekte, keine Beispielprofile und keine
              angekündigten Veröffentlichungsdaten.
            </p>
          </FadeBlock>
        </div>
      </section>

      {/* 7-point rubric */}
      <SectionShell num="R" label="Rubric">
        <Eyebrow>So wird bewertet</Eyebrow>
        <ClipHeading
          as="h2"
          className="mt-2.5 font-bold leading-none tracking-[-0.035em] text-foreground"
          style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
        >
          Der 7-Punkte-Rubric.
        </ClipHeading>
        <FadeBlock delay={1}>
          <p className="mt-5 max-w-[640px] text-[16px] leading-[1.65] text-muted-foreground">
            Jeder Capstone wird in 7 Punkten bewertet, binär, ohne
            Pseudo-Skalen. 5 von 7 = bestanden. 7 von 7 + Freigabe = Kandidat für
            die Gallery.
          </p>
        </FadeBlock>

        <ol className="mt-12 border-t border-foreground">
          {RUBRIC.map(([title, desc], i) => (
            <li
              key={title}
              className="grid grid-cols-[60px_1fr] gap-6 border-b border-border px-1 py-5"
            >
              <span className="font-mono text-[14px] font-bold tracking-[0.06em] text-brand-orange">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-[18px] font-bold tracking-[-0.02em] text-foreground">
                  {title}
                </h3>
                <p className="mt-1.5 text-[14.5px] leading-[1.55] text-muted-foreground">
                  {desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </SectionShell>

      {/* Truthful empty state */}
      <section className="border-y border-border bg-card/40 py-20 md:py-24">
        <div className="mx-auto max-w-[960px] px-6 lg:px-12">
          <Eyebrow>Aktueller Stand</Eyebrow>
          <ClipHeading
            as="h2"
            className="mt-2.5 font-bold leading-none tracking-[-0.035em] text-foreground"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
          >
            Noch keine Einträge.
          </ClipHeading>
          <FadeBlock delay={1}>
            <p className="mt-5 max-w-[640px] text-[16px] leading-[1.6] text-muted-foreground">
              Es liegen derzeit keine zur Veröffentlichung freigegebenen
              Capstones vor. Dieser leere Zustand ist absichtlich sichtbar.
            </p>
          </FadeBlock>
          <div
            role="status"
            className="mt-10 border border-dashed border-border bg-background px-7 py-10"
          >
            <p className="font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              0 veröffentlichte Capstones
            </p>
            <p className="mt-3 max-w-[620px] text-[15px] leading-[1.6] text-muted-foreground">
              Ein Eintrag erscheint erst nach Prüfung der sieben Kriterien,
              Entfernung personenbezogener Daten und dokumentierter Freigabe.
            </p>
          </div>
        </div>
      </section>

      {/* Course continuation */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-[720px] px-6 lg:px-12">
          <ClipHeading
            as="h2"
            className="bg-background font-bold leading-none tracking-[-0.035em] text-foreground"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
          >
            Capstone selbst entwickeln.
          </ClipHeading>
          <FadeBlock delay={1}>
            <p className="mt-5 text-[17px] leading-[1.6] text-muted-foreground">
              Der Kurs führt von der Problemdefinition bis zu einem begrenzten,
              prüfbaren Arbeitsprototyp. Eine Veröffentlichung ist davon
              getrennt und niemals Voraussetzung für den Kursabschluss.
            </p>
          </FadeBlock>
          <FadeBlock delay={2}>
            <div className="mt-8 flex flex-wrap gap-3.5">
              <BrandButton href="/ai-native/kurs/modul_1" variant="primary">
                Modul 1 starten <ArrowRight size={14} />
              </BrandButton>
              <BrandButton href="/ai-native#os-bundle" variant="outline">
                Lernmaterialien ansehen
              </BrandButton>
            </div>
          </FadeBlock>
        </div>
      </section>
    </>
  );
}

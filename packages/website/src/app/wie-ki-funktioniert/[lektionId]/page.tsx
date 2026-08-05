import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  WIE_KI_LEKTIONEN,
  WIE_KI_META,
  getLektionById,
  getPrevLektion,
  getNextLektion,
  formatGermanDate,
} from "@/lib/wie-ki-funktioniert";
import { ComprehensionCheck } from "@/components/wie-ki-funktioniert/ComprehensionCheck";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

// Comprehension check content per lektion
const COMPREHENSION_CHECKS: Record<string, { question: string; answer: string }> = {
  "lektion-1-vorhersage": {
    question:
      "Warum kann ein Sprachmodell eine Frage richtig beantworten, ohne die Antwort wirklich zu 'wissen'?",
    answer:
      "Weil die richtige Antwort in den Trainingsdaten statistisch sehr häufig auf diese Frage folgte. Das Modell hat Muster gelernt, keine Fakten gespeichert. Bei häufig vorkommenden Fakten funktioniert das gut. Bei seltenen oder sehr spezifischen Fakten kann die Vorhersage falsch sein.",
  },
  "lektion-2-trainingsdaten": {
    question:
      "Ein KI-Modell schreibt bei einem Text über Krankenpflege automatisch in der weiblichen Form. Ist das ein Programmierfehler?",
    answer:
      "Nein. Es ist ein Echo der Trainingsdaten. Wenn in den Texten, aus denen das Modell gelernt hat, Krankenpflege häufiger mit weiblichen Personen verknüpft war, hat das Modell dieses Muster übernommen. Das ist Bias aus den Daten, kein bewusst eingebauter Fehler.",
  },
  "lektion-3-halluzinationen": {
    question:
      "Du bittest ein KI-Modell, eine wissenschaftliche Quelle zu nennen, die deine These belegt. Das Modell nennt eine Studie mit Autor, Zeitschrift und Jahr. Was solltest du tun?",
    answer:
      "Die Quelle prüfen, bevor du sie verwendest. KI-Modelle können Quellen erfinden oder Angaben vermischen. Suche die Studie in einer Literaturdatenbank oder über eine Websuche. Wenn du sie nicht findest, gehe davon aus, dass sie nicht existiert.",
  },
  "lektion-4-grenzen": {
    question:
      "Du verwendest ein KI-Modell, um aktuelle Informationen zu einem Gesetz zu erhalten. Welche Grenze ist hier besonders relevant?",
    answer:
      "Der Trainings-Cutoff. Das Modell kennt nur Informationen bis zu dem Datum, an dem seine Trainingsdaten abgeschlossen wurden. Aktuelle Gesetzesänderungen kennt es möglicherweise nicht. Für rechtliche Fragen: immer aktuelle offizielle Quellen prüfen und eine Fachperson einbeziehen.",
  },
};

interface PageParams {
  lektionId: string;
}

export const dynamicParams = false;

export async function generateStaticParams(): Promise<PageParams[]> {
  return WIE_KI_LEKTIONEN.map((l) => ({ lektionId: l.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { lektionId } = await params;
  const lektion = getLektionById(lektionId);
  if (!lektion) return {};
  return createPublicPageMetadata({
    title: `${lektion.title} | Wie KI wirklich funktioniert`,
    description: lektion.subtitle,
    path: `/wie-ki-funktioniert/${lektionId}`,
  });
}

export default async function LektionPage({ params }: { params: Promise<PageParams> }) {
  const { lektionId } = await params;
  const lektion = getLektionById(lektionId);
  if (!lektion) notFound();

  const prev = getPrevLektion(lektionId);
  const next = getNextLektion(lektionId);
  const check = COMPREHENSION_CHECKS[lektionId];
  const standDate = formatGermanDate(WIE_KI_META.lastReviewed);
  const isLastLektion = !next;

  return (
    <div className="mx-auto max-w-[780px] px-6 pb-32 pt-20">
      {/* Breadcrumb */}
      <nav aria-label="Brotkrümelnavigation" className="mb-8">
        <ol className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground">
              Startseite
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href="/wie-ki-funktioniert" className="hover:text-foreground">
              Wie KI wirklich funktioniert
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li className="text-foreground" aria-current="page">
            Lektion {lektion.number}
          </li>
        </ol>
      </nav>

      {/* Lesson header */}
      <div className="mb-2">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
          Lektion {lektion.number} von {WIE_KI_LEKTIONEN.length} · {lektion.durationMinutes} Min.
        </span>
      </div>
      <h1 className="text-[28px] font-bold leading-[1.1] tracking-[-0.03em] text-foreground sm:text-[36px]">
        {lektion.title}
      </h1>
      <p className="mt-2 text-[16px] leading-[1.5] text-muted-foreground">{lektion.subtitle}</p>

      {/* Stand badge */}
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        <time dateTime={WIE_KI_META.lastReviewed}>Stand: {standDate}</time>
      </p>

      {/* Key concepts */}
      <div className="mt-5 flex flex-wrap gap-2">
        {lektion.keyConcepts.map((concept) => (
          <span
            key={concept}
            className="border border-border bg-card px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
          >
            {concept}
          </span>
        ))}
      </div>

      {/* Sections */}
      <div className="mt-10 space-y-14">
        {lektion.sections.map((section, idx) => (
          <section key={section.id} aria-labelledby={`section-${section.id}`}>
            <div className="mb-1 flex items-center gap-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brand-orange">
                Abschnitt {idx + 1}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {section.readTimeMinutes} Min. Lesezeit
              </span>
            </div>
            <h2
              id={`section-${section.id}`}
              className="mb-5 text-[22px] font-bold tracking-[-0.02em] text-foreground"
            >
              {section.title}
            </h2>

            {/* Content: split on double newlines */}
            <div className="space-y-4">
              {section.content.split("\n\n").map((para, pIdx) => (
                <p
                  key={pIdx}
                  className="text-[16px] leading-[1.7] text-foreground"
                >
                  {para}
                </p>
              ))}
            </div>

            {/* Key takeaway */}
            <div className="mt-6 border-l-4 border-brand-orange bg-brand-orange/5 py-3 pl-5 pr-4">
              <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-brand-orange">
                Das Wichtigste aus diesem Abschnitt
              </p>
              <p className="text-[15px] font-bold leading-[1.5] text-foreground">
                {section.keyTakeaway}
              </p>
            </div>

            {/* Comprehension check after last section */}
            {idx === lektion.sections.length - 1 && check && (
              <ComprehensionCheck
                id={lektion.id}
                question={check.question}
                answer={check.answer}
              />
            )}
          </section>
        ))}
      </div>

      {/* Bottom navigation */}
      <div className="mt-16 border-t border-border pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            {prev && (
              <Link
                href={`/wie-ki-funktioniert/${prev.id}`}
                className="inline-flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
              >
                <span aria-hidden="true">&#8592;</span> Vorherige Lektion
              </Link>
            )}
          </div>
          <div>
            {next && (
              <Link
                href={`/wie-ki-funktioniert/${next.id}`}
                className="inline-flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-brand-orange hover:text-foreground"
              >
                Nächste Lektion <span aria-hidden="true">&#8594;</span>
              </Link>
            )}
          </div>
        </div>

        {/* After last lesson: CTA to KI-Führerschein */}
        {isLastLektion && (
          <div className="mt-10 border-2 border-brand-orange bg-brand-orange/5 p-6">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              Gut gemacht
            </p>
            <p className="mt-2 text-[18px] font-bold tracking-[-0.02em] text-foreground">
              Du weißt jetzt, wie KI wirklich funktioniert.
            </p>
            <p className="mt-2 text-[15px] leading-[1.6] text-muted-foreground">
              Als nächster Schritt: der KI-Führerschein. Kostenlos, kein technisches
              Vorwissen nötig.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/ki-fuehrerschein"
                className="inline-flex items-center gap-2 bg-brand-orange px-5 py-3 font-mono text-[12px] font-bold text-white transition-colors hover:bg-brand-orange/90"
              >
                Zum KI-Führerschein &#8594;
              </Link>
              <Link
                href="/einstieg"
                className="inline-flex items-center gap-2 border border-border bg-background px-5 py-3 font-mono text-[12px] font-bold text-foreground transition-colors hover:bg-card"
              >
                Zum Einstieg zurück
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

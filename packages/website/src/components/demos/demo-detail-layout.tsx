import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpen } from "lucide-react";
import type { Demo, DemoLevel } from "@/lib/demos";
import { DEMO_LEVEL_LABELS, getNextDemo } from "@/lib/demos";
import { books } from "@/lib/books";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { getDemoCopy } from "@/lib/demos-copy";
import { DemoShell } from "./demo-shell";
import { AnimatedMetaTable } from "./animated-meta-table";
import { EvidenceBadge } from "./evidence-badge";

// ─── KI-Kompetenzweg Stufe mapping ─────────────────────────────────────────
const STUFE_LABELS: Readonly<Record<DemoLevel, string>> = {
  einstieg: "Stufe 3: Anwenden",
  mittel: "Stufe 4: Umsetzen",
  fortg: "Stufe 5: Gestalten",
};

/**
 * Derive a human-readable lesson label from a lessonId string.
 * Handles two patterns:
 *   - AI-Native:  "modul_3_lesson_5" → "Modul 3 · Lektion 5"
 *   - Block-based: "block_2" → "Block 2"
 */
function lessonLabel(lessonId: string): string {
  const moduleMatch = lessonId.match(/^modul_(\d+)_lesson_(\d+)$/);
  if (moduleMatch) return `Modul ${moduleMatch[1]} · Lektion ${moduleMatch[2]}`;
  const blockMatch = lessonId.match(/^block_(\d+)$/);
  if (blockMatch) return `Block ${blockMatch[1]}`;
  return lessonId;
}

/**
 * Derive the direct lesson URL from courseSlug + lessonId.
 * - ai-native:      /ai-native/kurs/modul_3/modul_3_lesson_5
 * - ki-fuehrerschein: /ki-fuehrerschein/kurs/block_2
 * - eu-ai-act-kurs: /eu-ai-act-kurs/kurs/block_2
 */
function lessonHref(courseSlug: string, basePath: string, lessonId: string): string {
  const moduleMatch = lessonId.match(/^(modul_\d+)_lesson_\d+$/);
  if (moduleMatch) return `${basePath}/kurs/${moduleMatch[1]}/${lessonId}`;
  return `${basePath}/kurs/${lessonId}`;
}

export function DemoDetailLayout({
  demo,
  source,
}: {
  demo: Demo;
  source?: string;
}) {
  const copy = getDemoCopy(demo.slug);
  const next = getNextDemo(demo);
  const course = COURSE_CATALOG.find((item) => item.slug === demo.courseSlug);
  const relatedBooks = demo.bookSlugs
    .map((slug) => books.find((book) => book.id === slug))
    .filter((book): book is (typeof books)[number] => book !== undefined);

  const stufe = STUFE_LABELS[demo.level];
  const lessonLink = demo.lessonId && course
    ? lessonHref(demo.courseSlug, course.href, demo.lessonId)
    : (course?.startHref ?? "/kurse");
  const lessonDisplay = demo.lessonId ? lessonLabel(demo.lessonId) : null;

  return (
    <article className="min-h-[100svh] pt-20">
      {/* Breadcrumb */}
      <div className="border-b border-border/40 bg-card/10 px-6 py-3 md:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <Link
            href="/demos"
            className="inline-flex items-center gap-2 hover:text-foreground"
          >
            <ArrowLeft size={12} strokeWidth={2.5} />
            Alle Praxisbeispiele
          </Link>
          <span>
            Praxisbeispiel {demo.n} · {demo.category} · {DEMO_LEVEL_LABELS[demo.level]}
          </span>
        </div>
      </div>

      {/* Kurskontext banner — visible without scrolling, primary navigation signal */}
      <div className="border-b border-brand-orange/30 bg-brand-orange/5 px-6 py-3 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BookOpen
              size={14}
              strokeWidth={2}
              className="shrink-0 text-brand-orange"
              aria-hidden="true"
            />
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Kurskontext
            </div>
            <div className="font-mono text-[11px] text-foreground">
              <span className="font-bold text-brand-orange">
                {course ? course.title : demo.courseSlug}
              </span>
              {lessonDisplay && (
                <span className="text-muted-foreground"> · {lessonDisplay}</span>
              )}
              <span className="ml-3 border border-border bg-card/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                KI-Kompetenzweg · {stufe}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={lessonLink}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-brand-orange hover:underline"
            >
              Zur Lektion
              <ArrowUpRight size={11} strokeWidth={2.5} />
            </Link>
            <Link
              href="/demos"
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground"
            >
              Zur Galerie
              <ArrowUpRight size={11} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="px-6 py-12 md:px-10 md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-brand-orange bg-brand-orange/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brand-orange">
              {demo.category}
            </span>
            <span className="border border-foreground/40 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-foreground">
              {DEMO_LEVEL_LABELS[demo.level]}
            </span>
            {demo.illustrative && (
              <span
                className="border border-foreground/20 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
                title="Zahlen sind illustrativ. Tatsächliche Ergebnisse variieren je Einsatzkontext."
              >
                ◆ Illustratives Beispiel
              </span>
            )}
          </div>
          <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-[-0.03em] md:text-5xl">
            {demo.title}{" "}
            <span className="text-brand-orange">{demo.titleKicker}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {demo.description}
          </p>
          <div className="mt-3 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
            ◆ {demo.background}
          </div>
        </div>
      </section>

      {/* Interactive demo */}
      <section className="border-y border-border/40 bg-card/10 px-4 py-10 md:px-10">
        <div className="mx-auto max-w-5xl">
          <EvidenceBadge
            evidenceMode={demo.evidenceMode}
            externalActionMode={demo.externalActionMode}
          />
          <DemoShell demo={demo} source={source} />
        </div>
      </section>

      {/* Learning CTAs */}
      <section className="border-b border-border/40 px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Weiterlernen
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={course?.startHref ?? "/kurse"}
              className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
            >
              {course ? `${course.title} öffnen` : "Passenden Kurs öffnen"}
              <ArrowUpRight size={14} strokeWidth={2.5} />
            </Link>
            <Link
              href="#demo-notes"
              className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-foreground shadow-[3px_3px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
            >
              Annahmen prüfen
              <ArrowUpRight size={14} strokeWidth={2.5} />
            </Link>
            {relatedBooks.slice(0, 1).map((book) => (
              <Link
                key={book.id}
                href={book.readerHref}
                className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-foreground shadow-[3px_3px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
              >
                Im Buch vertiefen
                <ArrowUpRight size={14} strokeWidth={2.5} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Meta + Why */}
      <section id="demo-notes" className="scroll-mt-24 px-6 py-12 md:px-10">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              Übungsdaten
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.02em]">
              Was das Praxisbeispiel liefert
            </h2>
            <div className="mt-5">
              <AnimatedMetaTable meta={demo.meta} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {demo.tags.map((t) => (
                <span
                  key={t}
                  className="border border-border bg-card/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              Lernkontext
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.02em]">
              Sandbox-Szenario
            </h2>
            {copy && (
              <>
                <p className="mt-5 text-base leading-relaxed text-foreground/90">{copy.why}</p>
                <div className="mt-6 border-l-4 border-brand-orange bg-card/30 p-4">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                    ◆ Illustratives Beispiel
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{copy.proof}</p>
                </div>
              </>
            )}
            <div className="mt-6 border border-border bg-background p-4">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                Sandbox-Grenze
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {demo.syntheticDataLabel}
              </p>
              {demo.riskNotes.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm leading-relaxed text-muted-foreground">
                  {demo.riskNotes.map((note) => (
                    <li key={note}>- {note}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-6">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Arbeitskontexte
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {demo.industries.map((i) => (
                  <Link
                    key={i}
                    href={`/demos?industry=${encodeURIComponent(i)}`}
                    className="border border-border bg-background px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-foreground hover:border-brand-orange hover:text-brand-orange"
                  >
                    {i}
                  </Link>
                ))}
              </div>
            </div>
            {relatedBooks.length > 0 && (
              <div className="mt-6 border border-border bg-background p-4">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  Vertiefende Bücher
                </div>
                <div className="mt-3 space-y-2">
                  {relatedBooks.map((book) => (
                    <Link
                      key={book.id}
                      href={book.readerHref}
                      className="flex items-center justify-between gap-3 border border-border bg-card/30 px-3 py-2 text-sm font-medium text-foreground hover:border-brand-orange hover:text-brand-orange"
                    >
                      <span>{book.title}</span>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                        Lernkonto
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Next demo */}
      <section className="border-t border-border/40 bg-card/10 px-6 py-10 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Nächstes Praxisbeispiel · {next.n}
            </div>
            <div className="mt-1 text-xl font-bold tracking-[-0.02em]">
              {next.title} <span className="text-brand-orange">{next.titleKicker}</span>
            </div>
          </div>
          <Link
            href={`/demos/${next.slug}?source=gallery`}
            className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
          >
            Weiter
            <ArrowUpRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </section>
    </article>
  );
}

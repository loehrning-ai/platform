import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Download,
  FileText,
  Layers,
  Presentation,
  Users,
} from "lucide-react";
import type { Workshop } from "@/lib/workshops";

interface Props {
  readonly workshop: Workshop;
}

const MATERIAL_ICONS: Record<Workshop["materials"][number]["kind"], typeof FileText> = {
  html: Presentation,
  zip: Download,
};

/** German ordinal words for the step-count heading; falls back to the digit beyond seven. */
const STEP_WORDS: Record<number, string> = {
  4: "vier", 5: "fünf", 6: "sechs", 7: "sieben", 8: "acht", 9: "neun",
};

export function WorkshopDetailContent({ workshop }: Props) {
  const { caseStudy, realWorldCase } = workshop;
  const stepWord = STEP_WORDS[workshop.steps.length] ?? String(workshop.steps.length);

  return (
    <article className="bg-background pb-24">
      {/* Back-link strip */}
      <nav
        aria-label="Workshopnavigation"
        className="border-b border-border/60 bg-card/20"
      >
        <div className="mx-auto max-w-5xl px-6 py-4">
          <Link
            href="/workshops"
            aria-label="Zurück zu allen Workshops"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-orange"
          >
            <ArrowLeft className="h-4 w-4" />
            Alle Workshops
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
          <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            {workshop.eyebrow}
          </p>

          <h1 className="mb-5 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            {workshop.title}
          </h1>

          <p className="mb-8 max-w-[62ch] text-lg leading-relaxed text-muted-foreground">
            {workshop.description}
          </p>

          {/* Metric row */}
          <div className="grid gap-4 border-y border-border py-4 sm:grid-cols-4">
            <Metric icon={Presentation} label="Format" value={workshop.format} />
            <Metric icon={Clock} label="Dauer" value={workshop.duration} />
            <Metric icon={Layers} label="Schritte" value={`${workshop.steps.length}`} />
            <Metric icon={Users} label="Zielgruppen" value={`${workshop.audience.length}`} />
          </div>

          {/* Materials */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {workshop.materials.map((material, i) => (
              <a
                key={material.href}
                href={material.href}
                {...(material.kind === "zip"
                  ? { download: `${workshop.slug}-kit.zip` }
                  : { target: "_blank", rel: "noopener noreferrer" })}
                className={
                  i === 0
                    ? "inline-flex items-center justify-center gap-2 rounded-none border-2 border-foreground bg-brand-orange px-5 py-3 font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-foreground)]"
                    : "inline-flex items-center justify-center gap-2 rounded-none border-2 border-foreground bg-background px-5 py-3 font-bold uppercase tracking-wide text-foreground shadow-[4px_4px_0_0_var(--color-foreground)] transition-[transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-foreground)]"
                }
              >
                {(() => {
                  const Icon = MATERIAL_ICONS[material.kind];
                  return <Icon className="h-4 w-4" aria-hidden="true" />;
                })()}
                {material.label}
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Kostenlos und ohne Anmeldung abrufbar. Die aktuelle Materialfassung ist Englisch.
          </p>
        </div>
      </header>

      {/* Audience strip */}
      {workshop.audience.length > 0 && (
        <section className="border-b border-border/60 bg-card/20">
          <div className="mx-auto max-w-5xl px-6 py-8">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Für wen
            </p>
            <ul className="space-y-1.5">
              {workshop.audience.map((line) => (
                <li key={line} className="flex gap-2 text-sm text-foreground/90">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-orange" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Materials detail */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="mb-6 text-2xl font-bold tracking-[-0.03em]">
            Material zum Mitnehmen
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workshop.materials.map((material) => {
              const Icon = MATERIAL_ICONS[material.kind];
              return (
                <a
                  key={material.href}
                  href={material.href}
                  {...(material.kind === "zip"
                    ? { download: `${workshop.slug}-kit.zip` }
                    : { target: "_blank", rel: "noopener noreferrer" })}
                  className="group flex flex-col rounded-none border border-border border-t-[3px] border-t-brand-orange bg-card/30 p-5 transition-colors hover:bg-card/60"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-brand-orange" aria-hidden="true" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      {material.kind === "zip" ? "Download" : "Öffnen im Browser"}
                    </span>
                  </div>
                  <h3 className="mb-2 text-base font-semibold leading-snug group-hover:text-brand-orange">
                    {material.label}
                  </h3>
                  <p className="text-sm leading-snug text-muted-foreground">
                    {material.description}
                  </p>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Case study */}
      <section className="border-b border-border/60 bg-card">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-[-0.03em]">
              Der Übungsfall
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-none border border-brand-orange/40 bg-brand-orange/5 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-brand-orange">
              {caseStudy.isFictional ? "Synthetisches Fallbeispiel" : "Echte Unternehmensdaten"}
            </span>
          </div>
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {caseStudy.isFictional ? (
              <>
                <span className="font-medium text-foreground">
                  {caseStudy.companyName} ist frei erfunden:
                </span>{" "}
                kein echtes Unternehmen, keine echten Geschäftszahlen. Die Werte sind
                realistisch gewählt, damit sich Berichte, Kennzahlen und die Entscheidung
                im Workshop wie ein echter Analysefall anfühlen.
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">
                  {caseStudy.companyName}, {caseStudy.period}:
                </span>{" "}
                echte, öffentlich zugängliche Zahlen — kein nachgestellter Fall. Du arbeitest
                mit dem, was das Unternehmen selbst veröffentlicht hat, samt der Grenzen, die
                solche Berichte mitbringen.
              </>
            )}
          </p>

          <p className="mb-8 max-w-3xl text-sm leading-relaxed text-foreground/90">
            {caseStudy.narrative}
          </p>

          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {caseStudy.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-none border border-border bg-card/40 p-4 text-center"
              >
                <p className="font-mono text-xl font-bold tabular-nums whitespace-nowrap sm:text-2xl">
                  {metric.value}
                </p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>

          <div className="mb-8 rounded-none border border-border border-l-[3px] border-l-brand-orange bg-background p-5">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-brand-orange">
              Die offene Entscheidung
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">
              {caseStudy.decisionQuestion}
            </p>
          </div>

          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Was die Daten nicht beantworten können
            </p>
            <ul className="space-y-2">
              {caseStudy.dataLimitations.map((limitation) => (
                <li
                  key={limitation}
                  className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-orange" />
                  {limitation}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Real-world second case — only when the workshop has one */}
      {realWorldCase && (
        <section className="dark-section border-b border-border/60">
          <div className="mx-auto max-w-5xl px-6 py-12">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold tracking-[-0.03em]">
                Und dann in echt
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-none border border-foreground/30 bg-foreground/5 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
                {realWorldCase.companyName}
              </span>
            </div>

            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-foreground/90">
              {realWorldCase.narrative}
            </p>

            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {realWorldCase.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-none border border-border bg-background p-4 text-center"
                >
                  <p className="font-mono text-xl font-bold tabular-nums whitespace-nowrap sm:text-2xl">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-6 rounded-none border border-border border-l-[3px] border-l-brand-orange bg-card/30 p-5">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-brand-orange">
                Die offene Entscheidung
              </p>
              <p className="text-sm leading-relaxed text-foreground/90">
                {realWorldCase.decisionQuestion}
              </p>
            </div>

            <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Quelle:</span>{" "}
              {realWorldCase.source}
            </p>
          </div>
        </section>
      )}

      {/* Steps */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="mb-2 text-2xl font-bold tracking-[-0.03em]">
            Die {stepWord} Schritte
          </h2>
          <p className="mb-8 max-w-2xl text-sm text-muted-foreground">
            Der Ablauf, den du Schritt für Schritt selbst nachbaust — vom ersten Blick in die
            Rohdaten bis zur begründeten Entscheidung.
          </p>
          <ol className="space-y-4">
            {workshop.steps.map((step) => (
              <li
                key={step.n}
                className="flex flex-col gap-3 border-l-2 border-brand-orange bg-card/30 p-5 sm:flex-row sm:items-start sm:gap-5"
              >
                <span className="font-mono text-xs font-bold text-brand-orange">
                  {step.n}
                </span>
                <div className="flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold leading-snug">
                      {step.title}
                    </h3>
                    <span className="rounded-none border border-border bg-card/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                      {step.tool}
                    </span>
                  </div>
                  <p className="max-w-[68ch] text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA / contact */}
      <section className="bg-card/40">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-none border border-border border-t-[3px] border-t-brand-orange bg-background p-8 sm:p-12">
            <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
              Einordnung
            </p>
            <h2 className="mb-4 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
              Selbstlern-Material, kein buchbarer Live-Termin.
            </h2>
            <p className="mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Diese Seite enthält eine geführte Übung und Downloads. Es gibt
              derzeit keinen Terminplan und keine Buchungsfunktion. Sachliche
              Fehler kannst du per E-Mail an{" "}
              <a
                href="mailto:tim@loehrning.ai"
                className="underline underline-offset-2 hover:text-foreground"
              >
                tim@loehrning.ai
              </a>{" "}
              melden.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/workshops"
                className="inline-flex items-center justify-center gap-2 rounded-none border-2 border-foreground bg-brand-orange px-6 py-3 font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-foreground)]"
              >
                Alle Workshops
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  readonly icon: typeof Clock;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-brand-orange" aria-hidden="true" />
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <p className="font-mono text-base font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

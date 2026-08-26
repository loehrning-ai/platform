import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileText,
  Presentation,
  ShieldCheck,
} from "lucide-react";
import type { Workshop } from "@/lib/workshops";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { materialLanguageLabel, WORKSHOP_PAGE_COPY } from "../workshop-copy";
import { WorkshopDecisionLab } from "./workshop-decision-lab";

interface Props {
  readonly workshop: Workshop;
  readonly locale: Locale;
}

const MATERIAL_ICONS: Record<
  Workshop["materials"][number]["kind"],
  typeof FileText
> = {
  html: Presentation,
  zip: Download,
};

const DETAIL_CLASS = "group border-t border-border bg-background";
const SUMMARY_CLASS =
  "flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 marker:hidden [&::-webkit-details-marker]:hidden";

function formatSourceDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function WorkshopDetailContent({ workshop, locale }: Props) {
  const { caseStudy, realWorldCase } = workshop;
  const copy = WORKSHOP_PAGE_COPY[locale].detail;

  return (
    <article className="bg-background pb-10">
      <nav aria-label={copy.navigation} className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Link
            href={localizeHref("/workshops", locale)}
            aria-label={copy.backAria}
            className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-brand-orange"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {copy.allWorkshops}
          </Link>
        </div>
      </nav>

      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5">
          <div className="border-l-[3px] border-brand-orange pl-4">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
              {workshop.eyebrow}
            </p>
            <h1 className="mt-2 max-w-4xl text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl lg:text-5xl">
              {workshop.title}
            </h1>
          </div>

          <div className="mt-3 flex max-w-4xl items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange"
              aria-hidden="true"
            />
            <p>
              <span className="font-semibold text-foreground">
                {copy.accessBoundary}:
              </span>{" "}
              {workshop.accessNote}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
        <WorkshopDecisionLab config={workshop.decisionLab} />
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <div className="flex gap-1.5">
            <dt className="font-semibold text-foreground">{copy.format}:</dt>
            <dd>{workshop.format}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="font-semibold text-foreground">{copy.duration}:</dt>
            <dd>{workshop.duration}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="font-semibold text-foreground">{copy.steps}:</dt>
            <dd>{workshop.steps.length}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="font-semibold text-foreground">
              {copy.materialsHeading}:
            </dt>
            <dd>{workshop.materials.length}</dd>
          </div>
        </dl>
      </div>

      <section
        aria-labelledby="workshop-materials-heading"
        className="border-y border-border bg-card/20"
      >
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2
              id="workshop-materials-heading"
              className="text-xl font-black tracking-[-0.025em] sm:text-2xl"
            >
              {copy.materialsHeading}
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-right">
              {copy.materialsAccess}
            </p>
          </div>

          <div className="mt-4 border-t border-border">
            {workshop.materials.map((material, index) => {
              const Icon = MATERIAL_ICONS[material.kind];
              return (
                <a
                  key={material.href}
                  href={material.href}
                  hrefLang={material.language}
                  {...(material.kind === "zip"
                    ? { download: `${workshop.slug}-kit.zip` }
                    : { target: "_blank", rel: "noopener noreferrer" })}
                  className="group grid min-h-16 gap-3 border-b border-border py-4 transition-colors hover:bg-background sm:grid-cols-[2rem_minmax(10rem,0.55fr)_minmax(0,1fr)_auto] sm:items-center sm:px-3"
                >
                  <span className="font-mono text-xs font-bold tabular-nums text-brand-orange">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-base font-bold leading-tight group-hover:text-brand-orange">
                    {material.label}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {material.description}
                  </p>
                  <p className="flex min-h-11 flex-wrap items-center gap-2 text-xs font-semibold text-foreground sm:justify-end">
                    <Icon
                      className="h-4 w-4 text-brand-orange"
                      aria-hidden="true"
                    />
                    <span>
                      {material.kind === "zip"
                        ? copy.download
                        : copy.openInBrowser}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {copy.language}:{" "}
                      {materialLanguageLabel(locale, material.language)}
                    </span>
                  </p>
                </a>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {copy.materialLanguageNote}
          </p>
        </div>
      </section>

      <section
        aria-labelledby="workshop-reference-heading"
        className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8"
      >
        <div className="border-l-[3px] border-brand-orange pl-4">
          <h2
            id="workshop-reference-heading"
            className="text-xl font-black tracking-[-0.025em] sm:text-2xl"
          >
            {copy.referenceHeading}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {copy.referenceIntroduction}
          </p>
        </div>

        <div className="mt-4 border-b border-border">
          <details className={DETAIL_CLASS}>
            <summary className={SUMMARY_CLASS}>
              <h3 className="text-base font-bold">{copy.forWhom}</h3>
              <SummaryMark />
            </summary>
            <ul className="grid gap-2 border-t border-border px-4 py-5 sm:grid-cols-3 sm:px-6">
              {workshop.audience.map((line) => (
                <li
                  key={line}
                  className="border-l-2 border-brand-orange pl-3 text-sm leading-relaxed text-muted-foreground"
                >
                  {line}
                </li>
              ))}
            </ul>
          </details>

          <details className={DETAIL_CLASS}>
            <summary className={SUMMARY_CLASS}>
              <h3 className="text-base font-bold">{copy.practiceCase}</h3>
              <SummaryMark />
            </summary>
            <div className="border-t border-border px-4 py-5 sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold">{caseStudy.companyName}</p>
                <span className="border border-brand-orange/40 bg-brand-orange/5 px-2 py-1 text-xs font-bold uppercase tracking-[0.08em] text-brand-orange">
                  {caseStudy.isFictional
                    ? copy.syntheticCase
                    : copy.realCompanyData}
                </span>
              </div>
              <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">
                {caseStudy.isFictional
                  ? copy.fictionalExplanation(caseStudy.companyName)
                  : copy.realExplanation(
                      caseStudy.companyName,
                      caseStudy.period,
                    )}
              </p>
              <p className="mt-3 max-w-4xl text-sm leading-relaxed text-foreground/85">
                {caseStudy.narrative}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4">
                {caseStudy.metrics.map((metric) => (
                  <div key={metric.label} className="bg-background p-3">
                    <p className="break-words font-mono text-lg font-bold tabular-nums">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-xs leading-snug text-muted-foreground">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-l-[3px] border-brand-orange bg-card/40 p-4">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                  {copy.openDecision}
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  {caseStudy.decisionQuestion}
                </p>
              </div>

              <h4 className="mt-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {copy.limitations}
              </h4>
              <ul className="mt-2 grid gap-2 md:grid-cols-2">
                {caseStudy.dataLimitations.map((limitation) => (
                  <li
                    key={limitation}
                    className="border-l border-border pl-3 text-xs leading-relaxed text-muted-foreground"
                  >
                    {limitation}
                  </li>
                ))}
              </ul>

              {realWorldCase ? (
                <div className="mt-7 border-t border-border pt-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-bold">
                      {copy.realWorldHeading}
                    </h4>
                    <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange">
                      {realWorldCase.companyName}
                    </span>
                  </div>
                  <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">
                    {realWorldCase.narrative}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4">
                    {realWorldCase.metrics.map((metric) => (
                      <div key={metric.label} className="bg-background p-3">
                        <p className="break-words font-mono text-lg font-bold tabular-nums">
                          {metric.value}
                        </p>
                        <p className="mt-1 text-xs leading-snug text-muted-foreground">
                          {metric.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed">
                    {realWorldCase.decisionQuestion}
                  </p>
                  <div className="mt-3 border-l border-border pl-3 text-xs leading-relaxed text-muted-foreground">
                    <p>
                      <span className="font-semibold text-foreground">
                        {copy.source}
                      </span>{" "}
                      <a
                        href={realWorldCase.sourceHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                      >
                        {realWorldCase.source}
                      </a>
                    </p>
                    <p>
                      {locale === "de" ? "Veröffentlicht" : "Published"}:{" "}
                      <time dateTime={realWorldCase.sourcePublishedAt}>
                        {formatSourceDate(
                          realWorldCase.sourcePublishedAt,
                          locale,
                        )}
                      </time>{" "}
                      · {locale === "de" ? "geprüft" : "reviewed"}:{" "}
                      <time dateTime={realWorldCase.sourceReviewedAt}>
                        {formatSourceDate(
                          realWorldCase.sourceReviewedAt,
                          locale,
                        )}
                      </time>
                    </p>
                    <p className="mt-1">{realWorldCase.sourceLimitation}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </details>

          <details className={DETAIL_CLASS}>
            <summary className={SUMMARY_CLASS}>
              <h3 className="text-base font-bold">
                {copy.stepsHeading(workshop.steps.length)}
              </h3>
              <SummaryMark />
            </summary>
            <div className="border-t border-border px-4 py-5 sm:px-6">
              <p className="text-sm text-muted-foreground">
                {copy.stepsIntroduction}
              </p>
              <ol className="mt-4 grid gap-3 lg:grid-cols-2">
                {workshop.steps.map((step) => (
                  <li
                    key={step.n}
                    className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-l-2 border-brand-orange bg-card/30 p-3"
                  >
                    <span className="font-mono text-xs font-bold text-brand-orange">
                      {step.n}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-start gap-2">
                        <h4 className="text-sm font-bold leading-snug">
                          {step.title}
                        </h4>
                        <span className="border border-border px-2 py-1 font-mono text-xs uppercase tracking-[0.06em] text-muted-foreground">
                          {step.tool}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </details>
        </div>
      </section>
    </article>
  );
}

function SummaryMark() {
  return (
    <span
      aria-hidden="true"
      className="flex h-7 w-7 shrink-0 items-center justify-center border border-border font-mono text-base text-brand-orange"
    >
      <span className="group-open:hidden">+</span>
      <span className="hidden group-open:inline">−</span>
    </span>
  );
}

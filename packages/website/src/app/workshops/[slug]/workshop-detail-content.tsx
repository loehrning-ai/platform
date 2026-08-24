import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Download,
  FileText,
  Layers,
  Presentation,
  ShieldCheck,
} from "lucide-react";
import type { Workshop } from "@/lib/workshops";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import {
  materialLanguageLabel,
  WORKSHOP_PAGE_COPY,
} from "../workshop-copy";
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

const DETAIL_CLASS =
  "group border-t border-border bg-background first:border-t-0";
const SUMMARY_CLASS =
  "flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 marker:hidden sm:px-6 [&::-webkit-details-marker]:hidden";

export function WorkshopDetailContent({ workshop, locale }: Props) {
  const { caseStudy, realWorldCase } = workshop;
  const copy = WORKSHOP_PAGE_COPY[locale].detail;

  return (
    <article className="bg-background pb-16">
      <nav
        aria-label={copy.navigation}
        className="border-b border-border/60 bg-card/20"
      >
        <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6 sm:py-3">
          <Link
            href={localizeHref("/workshops", locale)}
            aria-label={copy.backAria}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-orange"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {copy.allWorkshops}
          </Link>
        </div>
      </nav>

      <header className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-10">
          <div className="border-l-4 border-brand-orange pl-4 sm:pl-6">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-brand-orange">
              {workshop.eyebrow}
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.05em] sm:text-6xl">
              {workshop.title}
            </h1>
            <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
              {workshop.summary}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-px border-y border-border bg-border sm:mt-7 sm:[grid-template-columns:repeat(auto-fit,minmax(min(100%,10rem),1fr))]">
            <Metric icon={Presentation} label={copy.format} value={workshop.format} />
            <Metric icon={Clock} label={copy.duration} value={workshop.duration} />
            <Metric
              icon={Layers}
              label={copy.steps}
              value={`${workshop.steps.length}`}
              className="hidden sm:flex"
            />
            <Metric
              icon={Download}
              label={copy.materialsHeading}
              value={`${workshop.materials.length}`}
              className="hidden sm:flex"
            />
          </div>

          <div className="mt-3 flex max-w-4xl items-start gap-2 border-l-2 border-brand-orange bg-card/40 px-3 py-2 text-xs leading-snug text-muted-foreground sm:mt-4 sm:py-2.5 sm:leading-relaxed">
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

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-10">
        <WorkshopDecisionLab config={workshop.decisionLab} />
      </div>

      <section
        aria-labelledby="workshop-materials-heading"
        className="border-y border-border/60 bg-card/20"
      >
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2
              id="workshop-materials-heading"
              className="text-2xl font-black tracking-[-0.035em] sm:text-3xl"
            >
              {copy.materialsHeading}
            </h2>
            <p className="max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-right">
              {copy.materialsAccess}
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                  className="group flex min-h-36 flex-col border-2 border-foreground bg-background p-4 shadow-[4px_4px_0_0_var(--color-foreground)] motion-safe:transition-[opacity,transform] motion-safe:duration-150 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brand-orange">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {material.kind === "zip"
                        ? copy.download
                        : copy.openInBrowser}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold leading-tight group-hover:text-brand-orange">
                    {material.label}
                  </h3>
                  <p className="mt-2 text-xs leading-snug text-muted-foreground">
                    {material.description}
                  </p>
                  <p className="mt-auto pt-4 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-foreground">
                    {copy.language}: {materialLanguageLabel(locale, material.language)}
                  </p>
                </a>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {copy.materialLanguageNote}
          </p>
        </div>
      </section>

      <section
        aria-labelledby="workshop-reference-heading"
        className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
      >
        <div className="border-l-4 border-brand-orange pl-4 sm:pl-6">
          <h2
            id="workshop-reference-heading"
            className="text-2xl font-black tracking-[-0.035em]"
          >
            {copy.referenceHeading}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {copy.referenceIntroduction}
          </p>
        </div>

        <div className="mt-5 border-x border-b border-border">
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
                <span className="border border-brand-orange/40 bg-brand-orange/5 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-brand-orange">
                  {caseStudy.isFictional
                    ? copy.syntheticCase
                    : copy.realCompanyData}
                </span>
              </div>
              <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">
                {caseStudy.isFictional
                  ? copy.fictionalExplanation(caseStudy.companyName)
                  : copy.realExplanation(caseStudy.companyName, caseStudy.period)}
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
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-l-3 border-brand-orange bg-card/40 p-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  {copy.openDecision}
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  {caseStudy.decisionQuestion}
                </p>
              </div>

              <h4 className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
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
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-brand-orange">
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
                        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                          {metric.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed">
                    {realWorldCase.decisionQuestion}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {copy.source}
                    </span>{" "}
                    {realWorldCase.source}
                  </p>
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
                        <span className="border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
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
      className="flex h-7 w-7 shrink-0 items-center justify-center border border-border font-mono text-base text-brand-orange group-open:rotate-45 motion-safe:transition-transform motion-safe:duration-150 motion-reduce:transition-none"
    >
      +
    </span>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  readonly icon: typeof Clock;
  readonly label: string;
  readonly value: string;
  readonly className?: string;
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 bg-background px-3 py-3 ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0 text-brand-orange" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <p className="break-words font-mono text-sm font-semibold text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

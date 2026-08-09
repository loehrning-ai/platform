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
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import {
  materialLanguageLabel,
  WORKSHOP_PAGE_COPY,
} from "../workshop-copy";

interface Props {
  readonly workshop: Workshop;
  readonly locale: Locale;
}

const MATERIAL_ICONS: Record<Workshop["materials"][number]["kind"], typeof FileText> = {
  html: Presentation,
  zip: Download,
};

export function WorkshopDetailContent({ workshop, locale }: Props) {
  const { caseStudy, realWorldCase } = workshop;
  const copy = WORKSHOP_PAGE_COPY[locale].detail;

  return (
    <article className="bg-background pb-24">
      {/* Back-link strip */}
      <nav
        aria-label={copy.navigation}
        className="border-b border-border/60 bg-card/20"
      >
        <div className="mx-auto max-w-5xl px-6 py-4">
          <Link
            href={localizeHref("/workshops", locale)}
            aria-label={copy.backAria}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-orange"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.allWorkshops}
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
          <div className="grid gap-4 border-y border-border py-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,9rem),1fr))]">
            <Metric icon={Presentation} label={copy.format} value={workshop.format} />
            <Metric icon={Clock} label={copy.duration} value={workshop.duration} />
            <Metric icon={Layers} label={copy.steps} value={`${workshop.steps.length}`} />
            <Metric icon={Users} label={copy.audiences} value={`${workshop.audience.length}`} />
          </div>

          {/* Materials */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {workshop.materials.map((material, i) => (
              <a
                key={material.href}
                href={material.href}
                hrefLang={material.language}
                {...(material.kind === "zip"
                  ? { download: `${workshop.slug}-kit.zip` }
                  : { target: "_blank", rel: "noopener noreferrer" })}
                className={
                  i === 0
                    ? "inline-flex w-full min-w-0 items-center justify-center gap-2 break-words rounded-none border-2 border-foreground bg-brand-orange px-5 py-3 text-center font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-foreground)] sm:w-auto"
                    : "inline-flex w-full min-w-0 items-center justify-center gap-2 break-words rounded-none border-2 border-foreground bg-background px-5 py-3 text-center font-bold uppercase tracking-wide text-foreground shadow-[4px_4px_0_0_var(--color-foreground)] transition-[transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-foreground)] sm:w-auto"
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
            {copy.materialsAccess}
          </p>
        </div>
      </header>

      {/* Audience strip */}
      {workshop.audience.length > 0 && (
        <section className="border-b border-border/60 bg-card/20">
          <div className="mx-auto max-w-5xl px-6 py-8">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {copy.forWhom}
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
            {copy.materialsHeading}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workshop.materials.map((material) => {
              const Icon = MATERIAL_ICONS[material.kind];
              return (
                <a
                  key={material.href}
                  href={material.href}
                  hrefLang={material.language}
                  {...(material.kind === "zip"
                    ? { download: `${workshop.slug}-kit.zip` }
                    : { target: "_blank", rel: "noopener noreferrer" })}
                  className="group flex flex-col rounded-none border border-border border-t-[3px] border-t-brand-orange bg-card/30 p-5 transition-colors hover:bg-card/60"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-brand-orange" aria-hidden="true" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      {material.kind === "zip" ? copy.download : copy.openInBrowser}
                    </span>
                  </div>
                  <h3 className="mb-2 text-base font-semibold leading-snug group-hover:text-brand-orange">
                    {material.label}
                  </h3>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground">
                    {copy.language}: {materialLanguageLabel(locale, material.language)}
                  </p>
                  <p className="text-sm leading-snug text-muted-foreground">
                    {material.description}
                  </p>
                  <p className="mt-3 text-xs leading-snug text-muted-foreground">
                    {copy.materialLanguageNote}
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
              {copy.practiceCase}
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-none border border-brand-orange/40 bg-brand-orange/5 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-brand-orange">
              {caseStudy.isFictional ? copy.syntheticCase : copy.realCompanyData}
            </span>
          </div>
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {caseStudy.isFictional
              ? copy.fictionalExplanation(caseStudy.companyName)
              : copy.realExplanation(caseStudy.companyName, caseStudy.period)}
          </p>

          <p className="mb-8 max-w-3xl text-sm leading-relaxed text-foreground/90">
            {caseStudy.narrative}
          </p>

          <div className="mb-8 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-4">
            {caseStudy.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-none border border-border bg-card/40 p-4 text-center"
              >
                <p className="break-words font-mono text-xl font-bold tabular-nums sm:text-2xl">
                  {metric.value}
                </p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>

          <div className="mb-8 rounded-none border border-border border-l-[3px] border-l-brand-orange bg-background p-5">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-brand-orange">
              {copy.openDecision}
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">
              {caseStudy.decisionQuestion}
            </p>
          </div>

          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {copy.limitations}
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
                {copy.realWorldHeading}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-none border border-foreground/30 bg-foreground/5 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
                {realWorldCase.companyName}
              </span>
            </div>

            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-foreground/90">
              {realWorldCase.narrative}
            </p>

            <div className="mb-8 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-4">
              {realWorldCase.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-none border border-border bg-background p-4 text-center"
                >
                  <p className="break-words font-mono text-xl font-bold tabular-nums sm:text-2xl">
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
                {copy.openDecision}
              </p>
              <p className="text-sm leading-relaxed text-foreground/90">
                {realWorldCase.decisionQuestion}
              </p>
            </div>

            <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">{copy.source}</span>{" "}
              {realWorldCase.source}
            </p>
          </div>
        </section>
      )}

      {/* Steps */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="mb-2 text-2xl font-bold tracking-[-0.03em]">
            {copy.stepsHeading(workshop.steps.length)}
          </h2>
          <p className="mb-8 max-w-2xl text-sm text-muted-foreground">
            {copy.stepsIntroduction}
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
              {copy.classification}
            </p>
            <h2 className="mb-4 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
              {copy.classificationHeading}
            </h2>
            <p className="mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {copy.classificationBodyBeforeEmail}{" "}
              <a
                href="mailto:tim@loehrning.ai"
                className="underline underline-offset-2 hover:text-foreground"
              >
                tim@loehrning.ai
              </a>{" "}
              {copy.classificationBodyAfterEmail}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={localizeHref("/workshops", locale)}
                className="inline-flex items-center justify-center gap-2 rounded-none border-2 border-foreground bg-brand-orange px-6 py-3 font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-foreground)]"
              >
                {copy.allWorkshops}
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
    <div className="flex min-w-0 items-center gap-3">
      <Icon className="h-4 w-4 text-brand-orange" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <p className="break-words font-mono text-base font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

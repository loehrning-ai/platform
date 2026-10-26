import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type {
  ProjectArtifact,
  SoftwareArtifactProcedure,
  SoftwareArtifactStep,
  ToolArtifact,
} from "@/lib/open-source/artifacts";
import {
  localizeOpenSourceArtifact,
  SOFTWARE_GUIDE_COPY,
} from "@/lib/open-source/display-copy";
import { CommandBlock } from "./command-block";

/** Numbered steps, one style on every detail page: mono Mennige 01, 02, 03. */
function Steps({
  steps,
  locale,
}: {
  readonly steps: readonly SoftwareArtifactStep[];
  readonly locale: Locale;
}) {
  const copy = SOFTWARE_GUIDE_COPY[locale];
  return (
    <ol className="mt-4 space-y-4">
      {steps.map((step, index) => (
        <li key={step.title} className="min-w-0">
          <h3 className="font-semibold text-foreground">
            <span
              aria-hidden="true"
              className="mr-2 font-mono text-sm font-bold text-brand-orange"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            {step.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {step.detail}
          </p>
          {step.command ? (
            <div className="mt-3">
              <CommandBlock
                command={step.command}
                label={copy.copyCommand(step.title)}
                locale={locale}
              />
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function Procedure({
  id,
  title,
  procedure,
  locale,
}: {
  readonly id: string;
  readonly title: string;
  readonly procedure: SoftwareArtifactProcedure;
  readonly locale: Locale;
}) {
  return (
    <section className="border-t border-foreground pt-6 sm:pt-8" aria-labelledby={id}>
      <h2 id={id} className="text-xl font-bold tracking-[-0.03em] sm:text-2xl">
        {title}
      </h2>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        {procedure.summary}
      </p>
      <Steps steps={procedure.steps} locale={locale} />
    </section>
  );
}

export function SoftwareArtifactGuide({
  artifact,
  locale = "de",
}: {
  readonly artifact: ToolArtifact | ProjectArtifact;
  readonly locale?: Locale;
}) {
  const displayArtifact = localizeOpenSourceArtifact(artifact, locale);
  const { guide } = displayArtifact;
  const copy = SOFTWARE_GUIDE_COPY[locale];
  const idPrefix = `${displayArtifact.kind}-${displayArtifact.slug}`;

  return (
    <div className="space-y-8 sm:space-y-10">
      <section
        className="border-t border-foreground pt-6 sm:pt-8"
        aria-labelledby={`${idPrefix}-data-flow`}
      >
        <h2
          id={`${idPrefix}-data-flow`}
          className="text-xl font-bold tracking-[-0.03em] sm:text-2xl"
        >
          {copy.dataFlow}
        </h2>
        {/* One fact per line: the data flow reads as a short list, not a
            60-word paragraph of nested clauses. */}
        <ul className="mt-3 max-w-[68ch] list-disc space-y-1.5 pl-5 leading-relaxed text-muted-foreground marker:text-border">
          {dataFlowFacts(guide.dataFlow).map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </section>

      <section
        className="border-t border-foreground pt-6 sm:pt-8"
        aria-labelledby={`${idPrefix}-prerequisites`}
      >
        <h2
          id={`${idPrefix}-prerequisites`}
          className="text-xl font-bold tracking-[-0.03em] sm:text-2xl"
        >
          {copy.prerequisites}
        </h2>
        <ul className="mt-4 space-y-3">
          {guide.prerequisites.map((prerequisite) => (
            <li key={prerequisite.label}>
              <p className="font-semibold text-foreground">
                {prerequisite.href ? (
                  prerequisite.href.startsWith("https://") ? (
                    <a
                      href={prerequisite.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-1 underline-offset-4 hover:underline"
                    >
                      {prerequisite.label}
                      <span className="sr-only">{copy.externalTab}</span>
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  ) : (
                    <Link
                      href={localizeHref(prerequisite.href, locale)}
                      className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                    >
                      {prerequisite.label}
                    </Link>
                  )
                ) : (
                  prerequisite.label
                )}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {prerequisite.detail}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <Procedure
        id={`${idPrefix}-installation`}
        title={copy.installation}
        procedure={guide.installation}
        locale={locale}
      />
      <Procedure
        id={`${idPrefix}-usage`}
        title={copy.usage}
        procedure={guide.usage}
        locale={locale}
      />

      <section
        className="border-t border-foreground pt-6 sm:pt-8"
        aria-labelledby={`${idPrefix}-integration`}
      >
        <h2
          id={`${idPrefix}-integration`}
          className="text-xl font-bold tracking-[-0.03em] sm:text-2xl"
        >
          {copy.integration}
        </h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {guide.integration.summary}
        </p>
        <dl className="mt-5">
          <dt className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {copy.integrationTargets}
          </dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {guide.integration.targets.map((target) => (
              <span
                key={target}
                className="border border-foreground px-2.5 py-1 text-sm text-foreground"
              >
                {target}
              </span>
            ))}
          </dd>
        </dl>
        <Steps steps={guide.integration.steps} locale={locale} />
      </section>

      <section
        className="grid gap-6 border-t border-foreground pt-6 sm:grid-cols-2 sm:gap-8 sm:pt-8"
        aria-labelledby={`${idPrefix}-next`}
      >
        <div>
          <h2
            id={`${idPrefix}-next`}
            className="text-xl font-bold tracking-[-0.03em] sm:text-2xl"
          >
            {copy.documentation}
          </h2>
          {guide.documentation.href.startsWith("https://") ? (
            <a
              href={guide.documentation.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex min-h-11 items-center gap-1 font-semibold underline-offset-4 hover:underline"
            >
              {guide.documentation.label}
              <span className="sr-only">{copy.externalTab}</span>
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          ) : (
            <Link
              href={localizeHref(guide.documentation.href, locale)}
              className="mt-2 inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline"
            >
              {guide.documentation.label}
            </Link>
          )}
        </div>
        <ul className="space-y-4">
          {guide.relatedLearning.map((related) => (
            <li key={related.href}>
              <Link
                href={localizeHref(related.href, locale)}
                className="inline-flex min-h-11 items-center font-semibold text-foreground underline-offset-4 hover:underline"
              >
                {related.title}
              </Link>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {related.description}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/**
 * The data-flow statement split into its sentences and semicolon clauses,
 * one fact per list item. A period inside a token ("127.0.0.1",
 * "DEPLOY.md") is no break: a sentence ends at a period followed by a space
 * and a capital.
 */
export function dataFlowFacts(text: string): readonly string[] {
  return text
    .split(/(?<=\.)\s+(?=\p{Lu})|;\s+/u)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const sentence = part.charAt(0).toLocaleUpperCase() + part.slice(1);
      return /[.!?)]$/.test(sentence) ? sentence : `${sentence}.`;
    });
}

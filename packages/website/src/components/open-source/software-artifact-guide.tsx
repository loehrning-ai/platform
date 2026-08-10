import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type {
  ProjectArtifact,
  SoftwareArtifactProcedure,
  ToolArtifact,
} from "@/lib/open-source/artifacts";
import {
  localizeOpenSourceArtifact,
  OPEN_SOURCE_SHARED_COPY,
  SOFTWARE_GUIDE_COPY,
} from "@/lib/open-source/display-copy";
import { CommandCopyButton } from "./command-copy-button";

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
  const copy = SOFTWARE_GUIDE_COPY[locale];
  return (
    <section className="border-t border-border pt-8" aria-labelledby={id}>
      <h2 id={id} className="text-2xl font-bold tracking-[-0.03em]">
        {title}
      </h2>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        {procedure.summary}
      </p>
      <ol className="mt-5 space-y-5">
        {procedure.steps.map((step, index) => (
          <li key={step.title} className="grid gap-2 sm:grid-cols-[2rem_1fr]">
            <span
              aria-hidden="true"
              className="font-mono text-sm font-bold text-brand-orange"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {step.detail}
              </p>
              {step.command ? (
                <div className="mt-3 border border-border bg-card">
                  <div className="flex justify-end border-b border-border p-1.5">
                    <CommandCopyButton
                      command={step.command}
                      label={copy.copyCommand(step.title)}
                      locale={locale}
                    />
                  </div>
                  <pre
                    aria-label={copy.copyCommand(step.title)}
                    className="whitespace-pre-wrap break-words p-3 text-sm"
                  >
                    <code>{step.command}</code>
                  </pre>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
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
  const sharedCopy = OPEN_SOURCE_SHARED_COPY[locale];
  const idPrefix = `${displayArtifact.kind}-${displayArtifact.slug}`;

  return (
    <div className="mt-12 space-y-10">
      <section
        className="grid gap-6 border-y border-border py-8 sm:grid-cols-[1fr_2fr]"
        aria-labelledby={`${idPrefix}-status`}
      >
        <div>
          <h2
            id={`${idPrefix}-status`}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
          >
            {copy.publicationStatus}
          </h2>
          <p className="mt-2 font-semibold text-foreground">
            {sharedCopy.statuses[guide.status]}
          </p>
        </div>
        <p className="leading-relaxed text-muted-foreground">
          {guide.statusNote}
        </p>
      </section>

      <section
        className="border-b border-border pb-8"
        aria-labelledby={`${idPrefix}-data-flow`}
      >
        <h2
          id={`${idPrefix}-data-flow`}
          className="text-2xl font-bold tracking-[-0.03em]"
        >
          {copy.dataFlow}
        </h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {guide.dataFlow}
        </p>
      </section>

      <figure aria-labelledby={`${idPrefix}-screenshot-caption`}>
        <Image
          src={guide.screenshot.src}
          alt=""
          width={guide.screenshot.width}
          height={guide.screenshot.height}
          sizes="(min-width: 896px) 848px, calc(100vw - 48px)"
          className="h-auto w-full border border-border bg-card object-contain"
        />
        <figcaption
          id={`${idPrefix}-screenshot-caption`}
          className="mt-2 text-sm text-muted-foreground"
        >
          {guide.screenshot.alt}
        </figcaption>
      </figure>

      {guide.demo && guide.demo.length > 0 ? (
        <section
          className="border-t border-border pt-8"
          aria-labelledby={`${idPrefix}-demo`}
        >
          <h2
            id={`${idPrefix}-demo`}
            className="text-2xl font-bold tracking-[-0.03em]"
          >
            {copy.shortDemo}
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {copy.demoIntroduction}
          </p>
          <ol className="mt-6 space-y-8">
            {guide.demo.map((step, index) => (
              <li key={step.src}>
                <figure aria-labelledby={`${idPrefix}-demo-${index}-caption`}>
                  {/* The figcaption is a direct child of its figure, as the
                      HTML content model requires: a nested one would not be
                      the figure's caption at all. The frame number lives
                      inside it and is aria-hidden, so it is skipped when the
                      accessible name is computed from this element. */}
                  <figcaption
                    id={`${idPrefix}-demo-${index}-caption`}
                    className="flex items-baseline gap-3 text-[15px] font-semibold leading-snug text-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="font-mono text-[11px] font-bold text-brand-orange"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{step.caption}</span>
                  </figcaption>
                  {/* Empty alt: the caption above already labels the figure,
                      and the descriptive alt text is rendered below it, so a
                      screen reader hears each frame described exactly once. */}
                  <Image
                    src={step.src}
                    alt=""
                    width={step.width}
                    height={step.height}
                    sizes="(min-width: 896px) 848px, calc(100vw - 48px)"
                    className="mt-3 h-auto w-full border border-border bg-card object-contain"
                  />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {step.alt}
                  </p>
                </figure>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section
        className="border-t border-border pt-8"
        aria-labelledby={`${idPrefix}-prerequisites`}
      >
        <h2
          id={`${idPrefix}-prerequisites`}
          className="text-2xl font-bold tracking-[-0.03em]"
        >
          {copy.prerequisites}
        </h2>
        <ul className="mt-5 space-y-4">
          {guide.prerequisites.map((prerequisite) => (
            <li key={prerequisite.label}>
              <p className="font-semibold text-foreground">
                {prerequisite.href ? (
                  prerequisite.href.startsWith("https://") ? (
                    <a
                      href={prerequisite.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                    >
                      {prerequisite.label}
                      <span className="sr-only">
                        {copy.externalTab}
                      </span>
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  ) : (
                    <Link
                      href={localizeHref(prerequisite.href, locale)}
                      className="underline-offset-4 hover:underline"
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
        className="border-t border-border pt-8"
        aria-labelledby={`${idPrefix}-integration`}
      >
        <h2
          id={`${idPrefix}-integration`}
          className="text-2xl font-bold tracking-[-0.03em]"
        >
          {copy.integration}
        </h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {guide.integration.summary}
        </p>
        <dl className="mt-5">
          <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {copy.integrationTargets}
          </dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {guide.integration.targets.map((target) => (
              <span
                key={target}
                className="border border-border bg-card px-2.5 py-1 text-sm text-foreground"
              >
                {target}
              </span>
            ))}
          </dd>
        </dl>
        <ol className="mt-5 space-y-5">
          {guide.integration.steps.map((step, index) => (
            <li key={step.title}>
              <h3 className="font-semibold text-foreground">
                {index + 1}. {step.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {step.detail}
              </p>
              {step.command ? (
                <div className="mt-3 border border-border bg-card">
                  <div className="flex justify-end border-b border-border p-1.5">
                    <CommandCopyButton
                      command={step.command}
                      label={copy.copyCommand(step.title)}
                      locale={locale}
                    />
                  </div>
                  <pre
                    aria-label={copy.copyCommand(step.title)}
                    className="whitespace-pre-wrap break-words p-3 text-sm"
                  >
                    <code>{step.command}</code>
                  </pre>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section
        className="grid gap-8 border-t border-border pt-8 sm:grid-cols-2"
        aria-labelledby={`${idPrefix}-next`}
      >
        <div>
          <h2
            id={`${idPrefix}-next`}
            className="text-2xl font-bold tracking-[-0.03em]"
          >
            {copy.documentation}
          </h2>
          {guide.documentation.href.startsWith("https://") ? (
            <a
              href={guide.documentation.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline"
            >
              {guide.documentation.label}
              <span className="sr-only">{copy.externalTab}</span>
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          ) : (
            <Link
              href={localizeHref(guide.documentation.href, locale)}
              className="mt-4 inline-flex font-semibold underline-offset-4 hover:underline"
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
                className="font-semibold text-foreground underline-offset-4 hover:underline"
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

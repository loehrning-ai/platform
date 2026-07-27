import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type {
  ProjectArtifact,
  SoftwareArtifactProcedure,
  ToolArtifact,
} from "@/lib/open-source/artifacts";
import { STATUS_LABELS } from "./status-labels";

function Procedure({
  id,
  title,
  procedure,
}: {
  readonly id: string;
  readonly title: string;
  readonly procedure: SoftwareArtifactProcedure;
}) {
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
                <pre
                  tabIndex={0}
                  aria-label={`Befehl für ${step.title}`}
                  className="mt-3 overflow-x-auto border border-border bg-card p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
                >
                  <code>{step.command}</code>
                </pre>
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
}: {
  readonly artifact: ToolArtifact | ProjectArtifact;
}) {
  const { guide } = artifact;
  const idPrefix = `${artifact.kind}-${artifact.slug}`;

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
            Veröffentlichungsstatus
          </h2>
          <p className="mt-2 font-semibold text-foreground">
            {STATUS_LABELS[guide.status]}
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
          Datenfluss
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
            Kurzdemo
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Vier Aufnahmen aus dem Werkzeug, in der Reihenfolge, in der du es
            benutzt. Alle stammen aus dem gepinnten Quellstand.
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
          Voraussetzungen
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
                        , öffnet in neuem Tab
                      </span>
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  ) : (
                    <Link
                      href={prerequisite.href}
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
        title="Installation"
        procedure={guide.installation}
      />
      <Procedure
        id={`${idPrefix}-usage`}
        title="Verwendung"
        procedure={guide.usage}
      />

      <section
        className="border-t border-border pt-8"
        aria-labelledby={`${idPrefix}-integration`}
      >
        <h2
          id={`${idPrefix}-integration`}
          className="text-2xl font-bold tracking-[-0.03em]"
        >
          Integration
        </h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {guide.integration.summary}
        </p>
        <dl className="mt-5">
          <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Schnittstellen und Ziele
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
                <pre
                  tabIndex={0}
                  aria-label={`Befehl für ${step.title}`}
                  className="mt-3 overflow-x-auto border border-border bg-card p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
                >
                  <code>{step.command}</code>
                </pre>
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
            Dokumentation und Vertiefung
          </h2>
          {guide.documentation.href.startsWith("https://") ? (
            <a
              href={guide.documentation.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline"
            >
              {guide.documentation.label}
              <span className="sr-only">, öffnet in neuem Tab</span>
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          ) : (
            <Link
              href={guide.documentation.href}
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
                href={related.href}
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

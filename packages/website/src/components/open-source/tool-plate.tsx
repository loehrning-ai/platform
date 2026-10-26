import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import {
  OPEN_SOURCE_ARTIFACT_CANDIDATES,
  plateNumber,
  type ProjectArtifact,
  type ToolArtifact,
} from "@/lib/open-source/artifacts";
import {
  CV_ENGINE_SPECIMEN_COPY,
  OPEN_SOURCE_PAGE_COPY,
  OPEN_SOURCE_SHARED_COPY,
  SPECIMEN_COPY,
  STAGE_NOTES,
  localizeOpenSourceArtifact,
} from "@/lib/open-source/display-copy";
import { CV_ENGINE_DURATION_S, CV_ENGINE_TOY_P } from "./cv-engine-frame";
import { CvEngineStage, cvEngineChapters } from "./cv-engine-stage";
import { FilmStage } from "./film-stage";
import { SpecimenPlate, type PlateLayout } from "./specimen-plate";

type SoftwareArtifact = ToolArtifact | ProjectArtifact;

/** `EINGABE cv.yaml → AUSGABE cv.pdf, genau eine Seite`, arrow kept with its word. */
export function Formula({
  artifact,
  locale,
  className = "",
}: {
  readonly artifact: SoftwareArtifact;
  readonly locale: Locale;
  readonly className?: string;
}) {
  const formula = artifact.guide.formula;
  if (!formula) return null;
  const copy = OPEN_SOURCE_PAGE_COPY[locale].plate;
  return (
    <p className={`text-pretty leading-snug text-foreground ${className}`}>
      <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {copy.input}
      </span>{" "}
      <code className="font-mono font-semibold">{formula.input}</code>
      {" "}
      <span className="whitespace-nowrap">
        <span aria-hidden="true">→</span>
        {" "}
        <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {copy.output}
        </span>
      </span>{" "}
      <span className="font-semibold">{formula.output}</span>
    </p>
  );
}

/**
 * The plate's stage with its head and foot: the specimen, or the lead
 * screenshot when a tool has none.
 */
export function PlateStage({
  artifact,
  number,
  locale,
  layout,
  head,
  foot,
}: {
  readonly artifact: SoftwareArtifact;
  readonly number: string;
  readonly locale: Locale;
  readonly layout: PlateLayout;
  readonly head?: ReactNode;
  readonly foot?: ReactNode;
}) {
  const { specimen, screenshot } = artifact.guide;
  if (!specimen) {
    return (
      <div className="grid gap-5">
        {head}
        <figure className="min-w-0">
          <div className="relative aspect-square w-full overflow-hidden border border-foreground bg-[#121212]">
            <Image
              src={screenshot.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 40vw, calc(100vw - 32px)"
              className="object-contain"
            />
          </div>
          <figcaption className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {screenshot.alt}
          </figcaption>
        </figure>
        {foot}
      </div>
    );
  }
  const words = SPECIMEN_COPY[locale];
  const copy = {
    play: words.play,
    pause: words.pause,
    again: words.again,
    hint: words.hint,
    ruler: words.ruler(artifact.title),
    chapters: words.chapters(artifact.title),
  };
  const plate = {
    id: artifact.id,
    number: Number(number),
    title: artifact.title,
    locale,
    layout,
    copy,
    head,
    foot,
  };
  if (specimen.kind === "drawn") {
    const cv = CV_ENGINE_SPECIMEN_COPY[locale];
    return (
      <SpecimenPlate
        {...plate}
        stage={<CvEngineStage id={artifact.id} locale={locale} />}
        endS={CV_ENGINE_DURATION_S}
        chapters={cvEngineChapters(locale)}
        caption={cv.caption}
        toy={{
          atS: CV_ENGINE_TOY_P * CV_ENGINE_DURATION_S,
          on: cv.toy,
          back: cv.toyBack,
          saidOn: cv.twoPages,
          saidBack: cv.onePage,
        }}
      />
    );
  }
  const note = STAGE_NOTES[artifact.id]?.[locale];
  return (
    <SpecimenPlate
      {...plate}
      stage={<FilmStage id={artifact.id} film={specimen.film} />}
      endS={specimen.endS}
      beatS={specimen.beatS}
      chapters={specimen.chapters}
      caption={[specimen.film.alt, note].filter(Boolean).join(" ")}
    />
  );
}

/** Status, license, language, revision, how it runs: two columns, words wrap whole. */
export function Colophon({
  artifact,
  locale,
}: {
  readonly artifact: SoftwareArtifact;
  readonly locale: Locale;
}) {
  const copy = OPEN_SOURCE_PAGE_COPY[locale];
  const shared = OPEN_SOURCE_SHARED_COPY[locale];
  const link =
    "inline-flex min-h-11 min-w-11 items-center underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:decoration-2";
  const rows = [
    [copy.plate.status, shared.statuses[artifact.guide.status]],
    [
      copy.plate.license,
      <a key="license" href={artifact.license.href} className={link}>
        {artifact.license.licenseId ?? shared.license}
      </a>,
    ],
    [copy.plate.language, artifact.language],
    [
      copy.plate.revision,
      <a
        key="revision"
        href={artifact.source.revisionHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${link} font-mono text-sm`}
      >
        {artifact.source.revision.slice(0, 7)}
        <span className="sr-only">{copy.externalTab}</span>
      </a>,
    ],
    [copy.plate.runs, copy.plate.delivery[artifact.delivery]],
  ] as const;
  return (
    <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] border-t border-foreground text-sm">
      {rows.map(([term, value]) => (
        <div key={term} className="contents">
          <dt className="flex min-h-11 items-center border-b border-[var(--color-hairline)] pr-4 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
            {term}
          </dt>
          <dd className="flex min-h-11 min-w-0 items-center border-b border-[var(--color-hairline)] leading-5 text-foreground">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const ACTION =
  "inline-flex min-h-11 items-center justify-center gap-2 border-2 border-foreground px-4 text-sm font-semibold transition-colors duration-100";

export function ToolPlate({
  artifact: registryArtifact,
  number,
  locale,
}: {
  readonly artifact: SoftwareArtifact;
  readonly number: string;
  readonly locale: Locale;
}) {
  const artifact = localizeOpenSourceArtifact(registryArtifact, locale);
  const copy = OPEN_SOURCE_PAGE_COPY[locale];
  const shared = OPEN_SOURCE_SHARED_COPY[locale];
  const titleId = `nr-${number}-title`;
  const head = (
    <header>
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id={titleId}
          className="min-w-0 text-[1.75rem] font-bold leading-none tracking-[-0.04em] sm:text-[2.25rem]"
        >
          <Link
            href={localizeHref(artifact.href, locale)}
            className="underline-offset-[6px] hover:underline focus-visible:underline"
          >
            {artifact.title}
          </Link>
        </h2>
        <p className="shrink-0 font-mono text-xs font-bold uppercase tracking-[0.12em]">
          <span className="hidden text-muted-foreground sm:inline">
            {shared.kinds[artifact.kind]}
            {artifact.license.licenseId ? ` · ${artifact.license.licenseId} · ` : " · "}
          </span>
          <span className="text-brand-orange">{`${copy.plate.number} ${number}`}</span>
        </p>
      </div>
      <Formula artifact={artifact} locale={locale} className="mt-1.5 text-sm sm:mt-3 sm:text-base" />
    </header>
  );
  const foot = (
    <div>
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        {artifact.description}
      </p>
      <Colophon artifact={artifact} locale={locale} />
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={localizeHref(artifact.href, locale)}
          className={`${ACTION} bg-foreground text-background hover:bg-background hover:text-foreground focus-visible:bg-background focus-visible:text-foreground active:bg-background active:text-foreground`}
        >
          {copy.plate.view}
          <span className="sr-only">{`: ${artifact.title}`}</span>
        </Link>
        <a
          href={artifact.source.revisionHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${ACTION} bg-background text-foreground hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background active:bg-foreground active:text-background`}
        >
          {copy.plate.source}
          <span className="sr-only">{`: ${artifact.title}${copy.externalTab}`}</span>
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
  return (
    <li
      id={`nr-${number}`}
      className="min-w-0 scroll-mt-24 border border-foreground bg-background p-3 sm:p-6"
    >
      <article aria-labelledby={titleId}>
        <PlateStage
          artifact={artifact}
          number={number}
          locale={locale}
          layout="stack"
          head={head}
          foot={foot}
        />
      </article>
    </li>
  );
}

/**
 * The wall of plates, newest first. Numbers come from the append-only
 * candidate order; the column count follows the number of tools.
 */
export function ToolWall({
  artifacts,
  locale,
  order = OPEN_SOURCE_ARTIFACT_CANDIDATES,
}: {
  readonly artifacts: readonly SoftwareArtifact[];
  readonly locale: Locale;
  readonly order?: readonly { readonly id: string }[];
}) {
  const plates = plateEntries(artifacts, order);
  const count = plates.length;
  const columns =
    count >= 5
      ? "lg:grid-cols-2 xl:grid-cols-3"
      : count >= 2
        ? "lg:grid-cols-2"
        : "";
  return (
    <ol
      aria-label={OPEN_SOURCE_PAGE_COPY[locale].wall}
      data-entry-count={count}
      className={`grid gap-6 ${columns}`}
    >
      {plates.map(({ artifact, number }) => (
        <ToolPlate
          key={artifact.id}
          artifact={artifact}
          number={number}
          locale={locale}
        />
      ))}
    </ol>
  );
}

/** Plates with their numbers, newest first. */
export function plateEntries(
  artifacts: readonly SoftwareArtifact[],
  order: readonly { readonly id: string }[] = OPEN_SOURCE_ARTIFACT_CANDIDATES,
) {
  return artifacts
    .map((artifact) => ({ artifact, number: plateNumber(artifact.id, order) }))
    .sort((a, b) => b.number.localeCompare(a.number));
}

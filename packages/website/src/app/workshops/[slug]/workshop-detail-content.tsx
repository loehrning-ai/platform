import Link from "next/link";
import type { ReactNode } from "react";
import type {
  Workshop,
  WorkshopMaterial,
  WorkshopMaterialRole,
  WorkshopPhase,
} from "@/lib/workshops";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import {
  ArrowGlyph,
  BUTTON_CLASSES,
  Callout,
  Chip,
  CoverBand,
  cx,
  Kicker,
  Pictogram,
  QuestionCard,
  Route,
  SectionHead,
  StatRow,
  type PictogramName,
} from "@/components/werk";
import { materialLanguageLabel, WORKSHOP_PAGE_COPY } from "../workshop-copy";
import { splitTitle } from "../workshop-title";
import { WorkshopDecisionLab } from "./workshop-decision-lab";
import { WorkshopMaterialLink } from "./workshop-material-link";

interface Props {
  readonly workshop: Workshop;
  readonly locale: Locale;
}

type DetailCopy = (typeof WORKSHOP_PAGE_COPY)[Locale]["detail"];

const CONTAINER = "mx-auto max-w-[75rem] px-4 sm:px-6";
// Phones get a tighter rhythm; sm hands back the reviewed spacing.
const SECTION = "pt-10 sm:pt-20";
const MATERIAL_ANCHOR = "material";

/** One pictogram family on the page: every material role maps to a deck glyph. */
const ROLE_PICTOGRAM: Readonly<Record<WorkshopMaterialRole, PictogramName>> = {
  deck: "deck",
  presenter: "person",
  demo: "demo",
  guide: "guide",
  lab: "chart",
  case: "calendar",
  card: "checklist",
  exercise: "canvas",
  kit: "download",
  data: "table",
  hub: "export",
  builder: "database",
};

const PHASE_ORDER: readonly WorkshopPhase[] = ["before", "during", "after"];

/** Anchor of the decision lab band, linked from the agenda. */
const LAB_ANCHOR = "workshop-lab";

/**
 * Agenda station the decision lab mirrors, per workshop. Until the registry
 * carries this on decisionLab, the page keeps the mapping; a workshop without
 * an entry still gets the link under the Route, just no marked station.
 */
const LAB_STATION: Readonly<Record<string, number>> = {
  "ki-prognosen-einschaetzen": 0,
  "geschaeftsberichte-mit-ki-lesen": 5,
  "datenbereitschaft-fuer-ki": 1,
  "esg-berichte-mit-ki": 1,
};

/** Roles that make a sensible second cover button next to the primary one. */
const SECONDARY_ROLES: readonly WorkshopMaterialRole[] = [
  "demo",
  "lab",
  "case",
];

function formatDate(value: string, locale: Locale): string {
  // Provenance dates may be a month ("2026-08") or a day ("2026-09-25").
  const monthOnly = /^\d{4}-\d{2}$/.test(value);
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    ...(monthOnly
      ? { month: "long", year: "numeric" }
      : { day: "numeric", month: "long", year: "numeric" }),
    timeZone: "UTC",
  }).format(new Date(`${monthOnly ? `${value}-01` : value}T00:00:00Z`));
}

/** Caption lines join facts that start lowercase mid-line; the line itself starts upper case. */
function sentenceStart(text: string): string {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

/** "HTML · EN", "ZIP · 1,1 MB", "CSV · 1,6 KB": format and size as data. */
function materialMeta(material: WorkshopMaterial): string {
  const parts = [material.kind.toUpperCase()];
  parts.push(material.sizeLabel ?? material.language.toUpperCase());
  return parts.join(" · ");
}

/** Characters that fit two phone lines at 14px on a 320px screen. */
const PHONE_DESCRIPTION_BUDGET = 72;

/**
 * A material description cut to its first clause for a phone row: the first
 * sentence, without parentheses and without what follows a semicolon. A
 * sentence still longer than two phone lines ends at its last comma (or
 * word) within the budget, with an ellipsis, so it never stops mid-word. The
 * meta line under it already says format, language and "optional".
 */
export function phoneDescription(text: string): string {
  let first = text.split(/(?<=[.!?])\s+(?=\p{Lu})/u)[0] ?? text;
  first = first.replace(/\s*\([^)]*\)/g, "");
  const semicolon = first.indexOf(";");
  if (semicolon > 0) first = `${first.slice(0, semicolon).trimEnd()}.`;
  first = first.trim();
  if (first.length <= PHONE_DESCRIPTION_BUDGET) return first;
  const head = first.slice(0, PHONE_DESCRIPTION_BUDGET);
  const comma = head.lastIndexOf(", ");
  const cut = comma > 30 ? comma : head.lastIndexOf(" ");
  return `${head.slice(0, cut).replace(/[\s,:;]+$/, "")} …`;
}

/** The single most limiting need, shown in the cover caption. */
function limitingNeed(
  workshop: Workshop,
  copy: DetailCopy,
): string | undefined {
  const noAccount = workshop.notNeeded.some((item) =>
    /KI-Konto|AI account/i.test(item),
  );
  return noAccount ? copy.browserOnly : workshop.needs[0];
}

function SquareList({
  items,
  className,
}: {
  readonly items: readonly ReactNode[];
  readonly className?: string;
}) {
  return (
    <ul className={cx("grid gap-1.5 sm:gap-3", className)}>
      {items.map((item, index) => (
        <li
          key={index}
          className="grid grid-cols-[0.625rem_minmax(0,1fr)] items-baseline gap-3 text-[0.9375rem]/[1.5] text-foreground sm:text-body"
        >
          <span
            aria-hidden="true"
            className="size-2.5 -translate-y-px bg-foreground"
          />
          <span className="max-w-[60ch] text-pretty">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function MaterialRow({
  workshopSlug,
  material,
  copy,
  locale,
}: {
  readonly workshopSlug: string;
  readonly material: WorkshopMaterial;
  readonly copy: DetailCopy;
  readonly locale: Locale;
}) {
  const download = material.kind !== "html";
  const shortDescription = phoneDescription(material.description);
  const notes = [
    material.primary ? copy.startHere : null,
    // Skip the minutes when the label already carries them ("Browserlabor · 12 Min.").
    material.minutes && !material.label.includes(copy.minutes(material.minutes))
      ? copy.minutes(material.minutes)
      : null,
    material.optional ? copy.optional : null,
  ].filter((note): note is string => Boolean(note));

  return (
    <li
      data-material-row=""
      data-material-role={material.role}
      className={cx(
        "group relative grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-x-3 border-b border-hairline py-3 transition-colors duration-[120ms] hover:bg-card-hover has-[a:active]:bg-card-hover sm:grid-cols-[2rem_minmax(0,1fr)_8.5rem_7.5rem] sm:items-start sm:gap-x-6 sm:gap-y-2 sm:py-5",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-orange [&_a:focus-visible]:outline-none",
      )}
    >
      <Pictogram
        name={ROLE_PICTOGRAM[material.role]}
        strokeWidth={2}
        className="mt-0.5 size-6 text-foreground sm:-mt-1 sm:size-8"
      />
      <div className="min-w-0">
        <h4 className="text-base font-bold leading-snug text-foreground max-sm:pr-8 sm:text-[1.0625rem]">
          {material.primary ? (
            <span
              aria-hidden="true"
              className="mr-2 inline-block size-2.5 -translate-y-0.5 bg-foreground"
            />
          ) : null}
          {material.label}
        </h4>
        {/* A phone row shows the first clause, so a clamp never cuts a
            sentence mid-word; the full text returns from sm. */}
        {shortDescription === material.description ? (
          <p className="mt-0.5 line-clamp-2 max-w-[62ch] text-[0.875rem] leading-normal text-muted-foreground text-pretty sm:mt-1 sm:line-clamp-none sm:text-[0.9375rem]">
            {material.description}
          </p>
        ) : (
          <>
            <p
              data-material-short=""
              className="mt-0.5 line-clamp-2 text-[0.875rem] leading-normal text-muted-foreground text-pretty sm:hidden"
            >
              {shortDescription}
            </p>
            <p className="mt-1 hidden max-w-[62ch] text-[0.9375rem] leading-normal text-muted-foreground text-pretty sm:block">
              {material.description}
            </p>
          </>
        )}
        {/* Phones: format and size join the notes line instead of a chip. */}
        {notes.length > 0 ? (
          <p className="mt-1 text-caption text-muted-foreground tabular-nums sm:mt-1.5">
            {notes.join(" · ")}
            <span className="sm:hidden"> · {materialMeta(material)}</span>
          </p>
        ) : (
          <p className="mt-1 text-caption text-muted-foreground tabular-nums sm:hidden">
            {materialMeta(material)}
          </p>
        )}
      </div>
      {/* Phones: the link covers the row and shows only the arrow, top
          right beside the title, so the text keeps the full width; the label
          stays its accessible name. From sm chip and labelled action sit on
          the title line in their own columns. */}
      <div className="contents">
        <div
          className="hidden sm:col-start-auto sm:-mt-0.5 sm:block sm:justify-self-start"
          aria-hidden="true"
        >
          <Chip className="tabular-nums">{materialMeta(material)}</Chip>
        </div>
        <WorkshopMaterialLink
          workshopSlug={workshopSlug}
          material={material}
          className="-mt-2.5 inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 font-semibold text-foreground underline decoration-border underline-offset-4 [-webkit-tap-highlight-color:transparent] after:absolute after:inset-0 after:content-[''] group-hover:decoration-foreground max-sm:absolute max-sm:inset-0 max-sm:mt-0 max-sm:items-start max-sm:justify-end max-sm:pt-[0.9375rem] sm:min-w-0 sm:justify-start sm:self-start"
        >
          <span className="max-sm:sr-only">
            {download ? copy.downloadAction : copy.openAction}
          </span>
          <span className="sr-only">{`: ${material.label}, `}</span>
          <span className="sr-only">
            {`${copy.language}: ${materialLanguageLabel(locale, material.language)}`}
          </span>
          <ArrowGlyph direction={download ? "down" : "right"} />
        </WorkshopMaterialLink>
      </div>
    </li>
  );
}

export function WorkshopDetailContent({ workshop, locale }: Props) {
  const copy = WORKSHOP_PAGE_COPY[locale].detail;
  const { caseStudy, realWorldCase, provenance } = workshop;

  // The "all in English" note is derived from the data, so it disappears as
  // soon as one material is published in another language.
  const allMaterialsEnglish = workshop.materials.every(
    (material) => material.language === "en",
  );
  const primary =
    workshop.materials.find((material) => material.primary) ??
    workshop.materials[0];
  const secondary = workshop.materials.find(
    (material) =>
      material !== primary && SECONDARY_ROLES.includes(material.role),
  );
  const need = limitingNeed(workshop, copy);
  const title = splitTitle(workshop.title);

  const coverFacts = [
    workshop.minutesLive ? copy.minutesLive(workshop.minutesLive) : null,
    copy.minutesSelfStudy(workshop.minutesSelfStudy),
    caseStudy.isFictional
      ? realWorldCase
        ? copy.coverFacts.publicFigures
        : copy.coverFacts.fictionalCase
      : copy.realCompanyData,
    allMaterialsEnglish && locale === "de"
      ? copy.coverFacts.materialsInEnglish
      : null,
    copy.coverFacts.free,
  ].filter((fact): fact is string => Boolean(fact));
  // The leading minute facts, which the agenda caption repeats one block later.
  const minuteFacts = (workshop.minutesLive ? 1 : 0) + 1;

  const agendaMinutes = workshop.minutesLive ?? workshop.minutesSelfStudy;
  const agendaCaption = [
    workshop.minutesLive ? copy.minutesLive(workshop.minutesLive) : null,
    copy.minutesSelfStudy(workshop.minutesSelfStudy),
  ]
    .filter(Boolean)
    .join(" · ");
  const agendaCaptionLine = sentenceStart(agendaCaption);
  // Minutes on one line, activity and flags on the next, so a narrow station
  // never breaks mid-pair with a dangling separator.
  const labStation = LAB_STATION[workshop.slug];
  const labStationItem =
    labStation === undefined ? undefined : workshop.agenda[labStation];
  const stations = workshop.agenda.map((item, index) => {
    const detail = [
      item.activity ? copy.activityLabels[item.activity] : null,
      item.mode === "live" ? copy.liveOnly : null,
      item.optional ? copy.optional : null,
    ].filter(Boolean);
    const isLab = index === labStation;
    return {
      label: isLab ? (
        <span className="font-bold" data-lab-station="">
          {item.label}
        </span>
      ) : (
        item.label
      ),
      caption: (
        <>
          <span className="block tabular-nums">
            {copy.minutes(item.minutes)}
          </span>
          {detail.length > 0 ? (
            <span className="hidden sm:block">{detail.join(" · ")}</span>
          ) : null}
          {isLab ? (
            <span className="block font-semibold text-foreground">
              {copy.labStation}
            </span>
          ) : null}
        </>
      ),
    };
  });

  const phases = PHASE_ORDER.map((phase) => ({
    phase,
    materials: workshop.materials.filter(
      (material) => material.phase === phase,
    ),
  })).filter((group) => group.materials.length > 0);
  const hasPresenter = workshop.materials.some(
    (material) => material.role === "presenter",
  );

  const provenanceFacts = [
    `${copy.provenanceLabels.author} ${provenance.author}`,
    `${copy.provenanceLabels.reviewedAt} ${formatDate(provenance.reviewedAt, locale)}`,
    provenance.aiOutputsRecordedAt
      ? `${copy.provenanceLabels.aiOutputsRecordedAt} ${formatDate(provenance.aiOutputsRecordedAt, locale)}`
      : null,
    provenance.liveRunAt
      ? `${copy.provenanceLabels.liveRunAt} ${formatDate(provenance.liveRunAt, locale)}`
      : null,
    `${copy.provenanceLabels.data}: ${copy.provenanceData[provenance.data]}`,
  ].filter((fact): fact is string => Boolean(fact));

  return (
    <article className="bg-background pb-16 sm:pb-24">
      {/* Phones carry the back link in the cover's kicker line instead, so
          the cover starts right under the compact header. */}
      <nav
        aria-label={copy.navigation}
        className="border-b border-hairline max-sm:hidden"
      >
        <div className={CONTAINER}>
          <Link
            href={localizeHref("/workshops", locale)}
            aria-label={copy.backAria}
            className="inline-flex min-h-11 items-center gap-2 text-label text-muted-foreground underline decoration-transparent underline-offset-4 transition-colors duration-[120ms] hover:text-foreground hover:decoration-foreground"
          >
            <BackGlyph />
            {copy.allWorkshops}
          </Link>
        </div>
      </nav>

      <CoverBand
        labelledBy="workshop-title"
        phoneGlobe
        contentClassName="pt-5 pb-6 sm:py-10 lg:py-12"
      >
        <div className="flex flex-wrap items-center gap-x-2">
          <Link
            href={localizeHref("/workshops", locale)}
            aria-label={copy.backAria}
            data-cover-back=""
            className="-my-3 inline-flex min-h-11 items-center gap-1.5 text-label text-muted-foreground underline decoration-transparent underline-offset-4 [-webkit-tap-highlight-color:transparent] active:text-foreground sm:hidden"
          >
            <BackGlyph />
            {copy.workshopsShort}
          </Link>
          <span aria-hidden="true" className="text-label text-muted sm:hidden">
            ·
          </span>
          {/* Phones keep the breadcrumb on one line: "← Workshops · 04". The
              topic follows in the h1 right below. */}
          <Kicker>
            <span className="max-sm:hidden">{workshop.eyebrow}</span>
            <span className="sm:hidden">{workshop.number}</span>
          </Kicker>
        </div>
        <h1
          id="workshop-title"
          className="mt-2 max-w-[22ch] text-[1.875rem]/[1.1] font-bold text-balance text-foreground max-sm:tracking-[-0.01em] sm:mt-3 sm:text-fluid-h1 lg:max-w-[18ch] lg:text-display"
        >
          {title.head}
          {title.subtitle ? (
            <>
              {/* The colon stays visible, so the text, the accessible name
                  and the search snippet all read as the full title. */}
              :{" "}
              <span
                data-title-subtitle=""
                className="mt-1 block text-[1.1875rem]/[1.2] sm:mt-2 sm:text-fluid-h2 lg:mt-3"
              >
                {title.subtitle}
              </span>
            </>
          ) : null}
        </h1>
        <p className="mt-2.5 max-w-[60ch] text-[0.9375rem]/[1.5] text-muted-foreground text-pretty sm:mt-4 sm:text-body">
          {workshop.summary}
        </p>
        {/* Phones show the start action first and let the q-card drop just
            below it (workshop-standard 4.1); from sm the q-card leads, as on
            the deck cover. The q-card holds no focusable element, so the
            visual reorder never changes the focus order. */}
        <div className="flex flex-col">
          <QuestionCard
            tone="dark"
            label={copy.questionLabel}
            question={workshop.question}
            density="compact"
            className="order-last mt-4 max-w-[42rem] sm:order-none sm:mt-6 md:max-w-[34rem] lg:max-w-[36rem] xl:max-w-[42rem]"
          />
          {/* Below 360px both buttons span the column in one even stack. */}
          <div className="mt-4 flex flex-wrap items-center gap-2 max-[359px]:grid max-[359px]:grid-cols-1 max-[359px]:[&>*]:w-full max-[359px]:[&>*]:justify-between sm:mt-6 sm:gap-3">
            {primary ? (
              <WorkshopMaterialLink
                workshopSlug={workshop.slug}
                material={primary}
                className={BUTTON_CLASSES.dark.primary}
              >
                <span>{copy.primaryAction[primary.role]}</span>
                <ArrowGlyph
                  direction={primary.kind === "html" ? "right" : "down"}
                />
              </WorkshopMaterialLink>
            ) : null}
            {secondary ? (
              <WorkshopMaterialLink
                workshopSlug={workshop.slug}
                material={secondary}
                className={BUTTON_CLASSES.dark.secondary}
              >
                <span>{copy.primaryAction[secondary.role]}</span>
                <ArrowGlyph
                  direction={secondary.kind === "html" ? "right" : "down"}
                />
              </WorkshopMaterialLink>
            ) : (
              <a
                href={`#${MATERIAL_ANCHOR}`}
                className={BUTTON_CLASSES.dark.secondary}
              >
                <span>{copy.seeMaterials}</span>
                <ArrowGlyph direction="down" />
              </a>
            )}
          </div>
          {/* Phones leave the minutes to the agenda caption right below the
              cover; they stay in the text, so the facts read the same. */}
          <p className="mt-3 max-w-[48rem] text-caption text-muted-foreground tabular-nums sm:mt-5">
            {coverFacts.map((fact, index) => {
              const minutes = index < minuteFacts;
              const first = index === 0 || (index === minuteFacts && minuteFacts > 0);
              return (
                <span
                  key={fact}
                  className={minutes ? "hidden sm:inline" : undefined}
                >
                  {index > 0 ? (
                    <span className={first ? "hidden sm:inline" : undefined}>
                      {" · "}
                    </span>
                  ) : null}
                  <span
                    className={cx(
                      "whitespace-nowrap",
                      first &&
                        index > 0 &&
                        "max-sm:inline-block max-sm:first-letter:uppercase",
                    )}
                  >
                    {index === 0 ? sentenceStart(fact) : fact}
                  </span>
                </span>
              );
            })}
          </p>
          <dl className="mt-2 grid max-w-[48rem] grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-caption text-muted-foreground sm:mt-3 sm:gap-x-3 sm:gap-y-1">
            {need ? (
              <div className="contents">
                <dt className="font-semibold text-foreground">
                  {copy.needLabel}
                </dt>
                <dd>{need}</dd>
              </div>
            ) : null}
            <div className="contents">
              <dt className="font-semibold text-foreground">
                {copy.leaveWith}
              </dt>
              <dd>{workshop.outcome}</dd>
            </div>
          </dl>
        </div>
      </CoverBand>

      <section
        aria-labelledby="workshop-agenda-heading"
        className="pb-3 pt-6 sm:py-10"
      >
        <div className={CONTAINER}>
          <SectionHead
            id="workshop-agenda-heading"
            title={copy.agendaHeading}
            caption={agendaCaptionLine || copy.minutes(agendaMinutes)}
            size="compact"
          />
          {/* Phones: one scroll-snapped rail with label, minutes and the lab
              marker per station; the activity line returns from sm, where the
              rail is the reviewed horizontal agenda. */}
          <Route
            stations={stations}
            mode="description"
            label={copy.agendaHeading}
            locale={locale}
            layout="rail"
            className="mt-4 sm:mt-6"
          />
          <div className="mt-1 flex flex-wrap items-center justify-between gap-x-6 sm:mt-4">
            <p className="text-caption text-muted-foreground">
              {copy.agendaSource[workshop.agendaSource]}
            </p>
            <a
              href={`#${LAB_ANCHOR}`}
              className="inline-flex min-h-11 items-center gap-1.5 text-caption font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
            >
              {copy.tryBelow(labStationItem?.label)}
              <ArrowGlyph direction="down" className="size-3.5" />
            </a>
          </div>
        </div>
      </section>

      <WorkshopDecisionLab
        id={LAB_ANCHOR}
        config={workshop.decisionLab}
        locale={locale}
      />

      <section
        id={MATERIAL_ANCHOR}
        aria-labelledby="workshop-materials-heading"
        className={cx(SECTION, "scroll-mt-20")}
      >
        <div className={CONTAINER}>
          <SectionHead
            id="workshop-materials-heading"
            title={copy.materialHeading}
            size="compact"
          />
          <div className="mt-3 grid gap-6 sm:mt-6 sm:gap-10">
            {phases.map((group) => (
              <div key={group.phase}>
                <h3 className="text-label text-muted-foreground">
                  {copy.phaseLabels[group.phase]}
                </h3>
                <ul className="mt-2 border-t border-hairline">
                  {group.materials.map((material) => (
                    <MaterialRow
                      key={material.href}
                      workshopSlug={workshop.slug}
                      material={material}
                      copy={copy}
                      locale={locale}
                    />
                  ))}
                </ul>
                {group.phase === "during" && hasPresenter ? (
                  <p className="mt-4 max-w-[64ch] text-caption text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {copy.selfHostHeading}:
                    </span>{" "}
                    {copy.selfHostBody}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="workshop-case-heading" className={SECTION}>
        <div className={CONTAINER}>
          <SectionHead
            size="compact"
            id="workshop-case-heading"
            title={copy.caseHeading}
            caption={
              caseStudy.isFictional ? copy.syntheticCase : copy.realCompanyData
            }
          />
          <div className="mt-4 grid gap-5 sm:mt-8 sm:gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
            <div className="min-w-0">
              <h3 className="text-[1.125rem]/[1.2] font-bold text-foreground sm:text-fluid-h3">
                {caseStudy.companyName}
              </h3>
              <p className="mt-1 text-caption text-muted-foreground">
                {[caseStudy.sector, caseStudy.period].join(" · ")}
              </p>
              <p className="mt-2 max-w-[64ch] text-[0.9375rem]/[1.55] text-foreground text-pretty sm:mt-4 sm:text-body">
                {caseStudy.narrative}
              </p>
              {/* An invented case is named once, in the section caption. */}
              {caseStudy.isFictional ? null : (
                <p className="mt-3 max-w-[64ch] text-caption text-muted-foreground">
                  {copy.realExplanation(caseStudy.companyName, caseStudy.period)}
                </p>
              )}
              <h4 className="mt-4 text-label text-muted-foreground sm:mt-6">
                {copy.openDecision}
              </h4>
              <p className="mt-1 max-w-[64ch] text-[0.9375rem]/[1.5] font-semibold text-foreground text-pretty sm:text-body">
                {caseStudy.decisionQuestion}
              </p>
            </div>
            <Callout
              variant="gap"
              title={copy.limitations}
              className="self-start px-4 py-3 sm:px-5 sm:py-4"
            >
              <ul className="mt-1 grid gap-1.5 text-[0.875rem] leading-normal text-muted-foreground sm:gap-2 sm:text-[0.9375rem]">
                {caseStudy.dataLimitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </Callout>
          </div>
          {/* justify-between keeps the values on one line when a label wraps. */}
          <StatRow
            className="mt-6 gap-y-4 border-t border-hairline pt-4 sm:mt-10 sm:gap-y-6 sm:pt-6 [&>div]:justify-between"
            stats={caseStudy.metrics.map((metric) => ({
              label: metric.label,
              value: <StatValue>{metric.value}</StatValue>,
            }))}
          />

          {realWorldCase ? (
            <div className="mt-8 border-t border-hairline pt-5 sm:mt-14 sm:pt-8">
              <h3 className="text-[1.125rem]/[1.2] font-bold text-foreground sm:text-fluid-h3">
                {copy.realWorldHeading}
              </h3>
              <p className="mt-1 text-caption text-muted-foreground">
                {realWorldCase.companyName}
              </p>
              <p className="mt-2 max-w-[64ch] text-[0.9375rem]/[1.55] text-foreground text-pretty sm:mt-4 sm:text-body">
                {realWorldCase.narrative}
              </p>
              <StatRow
                className="mt-5 gap-y-4 sm:mt-8 sm:gap-y-6 [&>div]:justify-between"
                stats={realWorldCase.metrics.map((metric) => ({
                  label: metric.label,
                  value: <StatValue>{metric.value}</StatValue>,
                }))}
              />
              <p className="mt-5 max-w-[64ch] text-[0.9375rem]/[1.5] font-semibold text-foreground text-pretty sm:mt-8 sm:text-body">
                {realWorldCase.decisionQuestion}
              </p>
              <p className="mt-3 max-w-[80ch] sm:mt-4 text-caption text-muted-foreground">
                {copy.source}:{" "}
                <a
                  href={realWorldCase.sourceHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
                >
                  {realWorldCase.source}
                  <ArrowGlyph direction="external" className="size-3.5" />
                  <span className="sr-only">
                    {locale === "de"
                      ? " (öffnet neues Fenster)"
                      : " (opens in a new window)"}
                  </span>
                </a>{" "}
                · {copy.published}{" "}
                <time dateTime={realWorldCase.sourcePublishedAt}>
                  {formatDate(realWorldCase.sourcePublishedAt, locale)}
                </time>{" "}
                · {copy.reviewed}{" "}
                <time dateTime={realWorldCase.sourceReviewedAt}>
                  {formatDate(realWorldCase.sourceReviewedAt, locale)}
                </time>
                . {realWorldCase.sourceLimitation}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <div className={cx(CONTAINER, SECTION)}>
        <div className="grid gap-8 sm:gap-14 md:grid-cols-2 md:gap-12">
          <section aria-labelledby="workshop-audience-heading">
            <MinorHead id="workshop-audience-heading" title={copy.forWhom} />
            <SquareList items={workshop.audience} className="mt-3 sm:mt-6" />
            <p className="mt-3 max-w-[60ch] sm:mt-5 text-caption text-muted-foreground">
              {workshop.notForYou}
            </p>
          </section>
          <section aria-labelledby="workshop-outcomes-heading">
            <MinorHead id="workshop-outcomes-heading" title={copy.outcomesHeading} />
            <SquareList items={workshop.outcomes} className="mt-3 sm:mt-6" />
          </section>
        </div>
      </div>

      <div className={cx(CONTAINER, SECTION)}>
        <div className="grid gap-8 sm:gap-14 md:grid-cols-2 md:gap-12">
          <section aria-labelledby="workshop-needs-heading">
            <MinorHead id="workshop-needs-heading" title={copy.needsHeading} />
            <SquareList items={workshop.needs} className="mt-3 sm:mt-6" />
            <h3 className="mt-5 sm:mt-8 text-label text-muted-foreground">
              {copy.notNeededHeading}
            </h3>
            <ul className="mt-2 grid gap-1.5 text-[0.9375rem] leading-normal text-muted-foreground">
              {workshop.notNeeded.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Callout variant="boundary" className="mt-4 max-w-[64ch] sm:mt-6">
              {workshop.accessNote}
            </Callout>
          </section>
          <section aria-labelledby="workshop-not-covered-heading">
            <MinorHead id="workshop-not-covered-heading" title={copy.notCoveredHeading} />
            <ul className="mt-3 border-t border-hairline sm:mt-6">
              {workshop.notCovered.map((item) => (
                <li
                  key={item}
                  className="border-b border-hairline py-2 text-[0.9375rem]/[1.5] text-foreground sm:py-3 sm:text-body"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <footer
        aria-label={copy.provenanceHeading}
        className={cx(CONTAINER, "pt-10 sm:pt-20")}
      >
        <div className="border-t border-hairline pt-5">
          <p className="text-caption text-muted-foreground tabular-nums">
            {provenanceFacts.join(" · ")}
          </p>
          <p className="mt-1 max-w-[80ch] text-caption text-muted-foreground">
            {provenance.note}
          </p>
        </div>
      </footer>
    </article>
  );
}

/**
 * Kopflinie head for the short two-column blocks (Für wen, Das brauchst du):
 * still an h2 in the outline, but set at h3 size so the page keeps a clear
 * step between the main sections and these lists.
 */
function MinorHead({
  id,
  title,
}: {
  readonly id: string;
  readonly title: ReactNode;
}) {
  return (
    <header className="border-t-2 border-foreground pt-3 sm:pt-4">
      <h2
        id={id}
        className="text-[1.125rem]/[1.2] font-bold text-foreground sm:text-fluid-h3"
      >
        {title}
      </h2>
    </header>
  );
}

/** Stat values like "21,69 Mio. €" are long; step the size so they never overflow a column. */
function StatValue({ children }: { readonly children: ReactNode }) {
  return (
    <span className="block text-[1.375rem] leading-tight [overflow-wrap:anywhere] sm:text-[1.625rem] lg:text-num-lg">
      {children}
    </span>
  );
}

/** Left arrow for the back link, drawn like ArrowGlyph (square caps, miter joins). */
function BackGlyph() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className="size-4 shrink-0"
    >
      <path d="M17 10H4M9 5l-5 5 5 5" />
    </svg>
  );
}

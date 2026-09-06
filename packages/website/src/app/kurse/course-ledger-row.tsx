import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Github } from "@/components/icons/brand";
import type { CatalogCourse, ImportedCourse } from "@/lib/courses/catalog";
import { COURSE_LEVEL_LABELS_BY_LOCALE } from "@/lib/courses/catalog-copy";
import { COURSE_GALLERY_COPY } from "@/lib/courses/course-gallery-copy";
import { demosForCourse } from "@/lib/demos";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import type { CourseAccess } from "@/lib/courses/access";

/**
 * One row of the /kurse ledger. The atlas owns goal, level and progress
 * state and hands each row the resolved facts; the row renders them in the
 * flat ledger idiom at every width.
 */

export interface CourseStat {
  readonly completed: number;
  readonly certified: boolean;
  readonly started: boolean;
  readonly resumeHref: string;
}

export type Course = CatalogCourse | ImportedCourse;

/** The atlas copy a ledger row reads. `ATLAS_COPY[locale]` satisfies it. */
export interface LedgerRowCopy {
  readonly tryDemo: (count: number) => string;
  readonly sourceCode: string;
  readonly sourceCommit: string;
  readonly start: string;
  readonly continue: string;
  readonly viewRecord: string;
  readonly pathCourse: string;
  readonly accountRequired: string;
  readonly unavailable: string;
  readonly unavailableAction: string;
}

// Cover-art wash per row, cycling across all ten courses -- kept light (10%)
// since ten consecutive tinted rows read as noisy at higher opacity, unlike
// the four-card home-page spine.
const ROW_TONES = [
  "bg-brand-acid/10",
  "bg-brand-sky/10",
  "bg-brand-pink/10",
  "bg-brand-peach/10",
  "bg-brand-teal/10",
  "bg-brand-cobalt/10",
] as const;

// Below lg each row borrows the home page's side-artwork structure: a tinted
// plate rail beside the copy, printing the row's own hue at plate strength.
// The rail carries the row's number and its action button, never artwork (the
// ledger stays image-free, see the test). From lg both rail cells go
// transparent and the row keeps its flat 10% wash, so the desktop ledger does
// not move.
const PLATE_TONES = [
  "bg-brand-acid/45",
  "bg-brand-sky/45",
  "bg-brand-pink/40",
  "bg-brand-peach/45",
  "bg-brand-teal/20",
  "bg-brand-cobalt/15",
] as const;

export function isLiveCourse(course: Course): course is CatalogCourse {
  return course.nativeStatus === "live";
}

export function defaultStat(course: CatalogCourse): CourseStat {
  return {
    completed: 0,
    certified: false,
    started: false,
    resumeHref: course.startHref,
  };
}

export function courseAction(
  course: CatalogCourse,
  stat: CourseStat,
  locale: Locale,
  copy: LedgerRowCopy,
  access: CourseAccess,
): { readonly href: string; readonly label: string } {
  if (access === "unavailable") {
    return {
      href: localizeHref(course.href, locale),
      label: copy.unavailableAction,
    };
  }
  const label = stat.certified
    ? copy.viewRecord
    : stat.started
      ? copy.continue
      : copy.start;
  return {
    href: localizeHref(
      stat.certified || stat.started ? stat.resumeHref : course.startHref,
      locale,
    ),
    label:
      access === "account-required"
        ? `${label} · ${copy.accountRequired}`
        : label,
  };
}

interface SourceRepository {
  readonly owner: string;
  readonly name: string;
}

function sourceRepository(sourceHref: string): SourceRepository {
  try {
    const [owner = "", name = ""] = new URL(sourceHref).pathname
      .split("/")
      .filter(Boolean);
    return { owner, name };
  } catch {
    return { owner: "", name: sourceHref };
  }
}

export function CourseLedgerRow({
  course,
  index,
  inPath,
  visible,
  stat,
  locale,
  copy,
  access,
}: {
  readonly course: Course;
  readonly index: number;
  readonly inPath: boolean;
  /**
   * Level-filter result. A row that does not match leaves the phone list
   * only (`hidden lg:list-item`); the desktop ledger stays complete.
   */
  readonly visible: boolean;
  readonly stat?: CourseStat;
  readonly locale: Locale;
  readonly copy: LedgerRowCopy;
  readonly access: CourseAccess;
}) {
  const galleryCopy = COURSE_GALLERY_COPY[locale];
  const levelLabel = COURSE_LEVEL_LABELS_BY_LOCALE[locale][course.level];
  const live = isLiveCourse(course);
  const liveStat = live ? (stat ?? defaultStat(course)) : null;
  const action =
    live && liveStat
      ? courseAction(course, liveStat, locale, copy, access)
      : null;
  const sourceHref = course.sourceHref;
  const sourceCommitHref = course.sourceCommitHref;
  const sourceCommit = course.sourceCommit;
  const source = sourceHref ? sourceRepository(sourceHref) : null;
  const tone = ROW_TONES[index % ROW_TONES.length];
  const plate = PLATE_TONES[index % PLATE_TONES.length];
  // Seven of the ten courses have no demo. Rather than substituting one from
  // another course, those rows simply omit the teaser.
  const courseDemos = live ? demosForCourse(course.slug) : [];
  const courseDemo = courseDemos[0];
  const demoCount = courseDemos.length;

  return (
    <li
      className={cn(
        "border border-border",
        tone,
        inPath && "border-l-[3px] border-l-brand-orange",
        !visible && "hidden lg:list-item",
      )}
      data-course-slug={course.slug}
      data-course-level={course.level}
      data-course-access={access}
      data-in-path={inPath ? "true" : "false"}
      data-course-status={
        !live
          ? "external"
          : liveStat?.certified
            ? "complete"
            : liveStat?.started
              ? "started"
              : "open"
      }
    >
      {/* No cover thumbnail. The course artwork is a wide illustration; at the
          ~56px this dense ledger row allows it crops to unreadable mush, and
          the six imported courses have only site screenshots, which read as
          grey noise at that size. The art earns its space where it renders
          large, on the home cards and the account catalog. */}
      {/* Below lg the row is the home page's side-artwork row in the ledger's
          flat idiom: a tinted plate rail on the left, the copy on the right,
          and the level plus duration as the eyebrow in place of the desktop
          duration cell. The rail is two grid cells that carry the same tone
          and share an edge, so it paints as one continuous strip: the row
          number sits at its top and the action button at its bottom, which is
          what keeps the action out of the copy column and off a line of its
          own. Every `lg:` variant restores the reviewed four-column row.

          Auto-placement does the below-lg layout on its own: the copy column
          spans both rows, so the second rail cell is the only place left for
          the action. No cell is positioned by hand at either width. */}
      <div className="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] lg:grid-cols-[3rem_minmax(0,1fr)_minmax(180px,220px)_auto] lg:items-center lg:gap-3 lg:p-4">
        <span
          data-course-plate
          className={cn(
            "flex items-start justify-center border-r border-border/40 pt-3 lg:block lg:self-start lg:border-r-0 lg:bg-transparent lg:pt-0",
            plate,
          )}
        >
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center border font-mono text-xs font-bold tabular-nums",
              liveStat?.certified || inPath
                ? "border-brand-orange bg-kupfer-mist text-brand-orange"
                : "border-border bg-background text-muted-foreground",
            )}
            aria-hidden="true"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        </span>
        <div className="row-span-2 min-w-0 p-3 lg:row-span-1 lg:p-0">
          <p
            data-course-level-label
            className="font-mono text-xs font-bold tracking-[0.08em] text-muted-foreground lg:hidden"
          >
            <span className="uppercase text-brand-orange">{levelLabel}</span>
            {" · "}
            {course.duration}
          </p>
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <h4 className="min-w-0 text-[17px] font-bold leading-tight tracking-[-0.02em] text-foreground">
              <Link
                href={localizeHref(course.href, locale)}
                className="inline-flex min-h-11 items-center underline decoration-transparent underline-offset-4 transition-[text-decoration-color,color] duration-150 hover:decoration-brand-orange focus-visible:decoration-brand-orange motion-reduce:transition-none"
              >
                {course.title}
              </Link>
            </h4>
            {/* Below lg the marker would wrap the title onto a second line for
                every course in the selected path. The row already prints path
                membership twice over there -- the orange left edge and the
                orange number badge -- so only the label leaves the phone; the
                sentence stays in the accessibility tree at every width. */}
            {inPath ? (
              <span className="sr-only font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange lg:not-sr-only">
                {copy.pathCourse}
              </span>
            ) : null}
          </div>
          <p className="mt-1 max-w-[68ch] text-sm leading-snug text-muted-foreground">
            {course.tagline}
          </p>
          {live && access !== "open" ? (
            <p
              data-course-access-label
              className="mt-1 text-xs font-semibold text-foreground"
            >
              {access === "account-required"
                ? copy.accountRequired
                : copy.unavailable}
            </p>
          ) : null}
          {courseDemo ? (
            <Link
              href={localizeHref(
                `/demos/${courseDemo.slug}?source=gallery`,
                locale,
              )}
              prefetch={false}
              className="mt-1 inline-flex min-h-11 items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              {copy.tryDemo(demoCount)}
              <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </Link>
          ) : null}
          {/* Attribution for the imported MIT courses. This is the only place
              the repository and pinned commit are rendered as page content
              anywhere on the site: every other reference is machine-readable
              (the knowledge-graph endpoint and the course-discovery metadata),
              and the technical landing pages render none. It therefore stays
              visible on the row itself rather than behind a disclosure. */}
          {/* Below lg the visible label drops the owner and the word "Commit"
              so both links share one 44px line in the 276px copy column; the
              accessible name and the href keep the full repository path and
              the commit at every width. */}
          {sourceHref && source ? (
            <p
              data-course-source
              className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-xs text-muted-foreground"
            >
              <a
                href={sourceHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                <Github className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {source.owner ? (
                    <span className="sr-only lg:not-sr-only">
                      {source.owner}/
                    </span>
                  ) : null}
                  {source.name}
                </span>
                <span className="sr-only">
                  : {copy.sourceCode}, {course.title}
                </span>
              </a>
              {sourceCommitHref && sourceCommit ? (
                <a
                  href={sourceCommitHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                >
                  <span>
                    <span className="sr-only lg:not-sr-only">
                      {copy.sourceCommit}
                    </span>{" "}
                    #{sourceCommit.slice(0, 7)}
                  </span>
                </a>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="hidden min-w-0 lg:block">
          <span className="inline-flex min-h-11 w-full items-center border border-border bg-background px-3 font-mono text-xs text-muted-foreground">
            {course.duration}
          </span>
        </div>
        {/* Second rail cell below lg. It repeats the plate tone deliberately:
            two cells of the same colour with no gap between them read as one
            strip, which is what lets the action sit inside the rail instead of
            on its own 64px line. Below lg the button is a 44x44 square with
            only its arrow drawn; its wording stays in the accessible name and
            returns as visible text from lg. */}
        <div
          className={cn(
            "flex min-w-0 items-end justify-center border-r border-border/40 pb-3 lg:items-center lg:border-r-0 lg:bg-transparent lg:p-0 lg:justify-self-end",
            plate,
          )}
          data-course-action
        >
          {live && action ? (
            <Link
              href={action.href}
              prefetch={false}
              className="inline-flex h-11 w-11 min-w-0 shrink-0 items-center justify-center border border-brand-orange bg-paper text-sm font-bold text-foreground transition-[background-color,border-color] duration-150 hover:bg-kupfer-mist focus-visible:bg-kupfer-mist motion-reduce:transition-none lg:h-auto lg:min-h-11 lg:w-auto lg:justify-between lg:gap-3 lg:px-4 lg:py-2"
            >
              <span className="sr-only lg:not-sr-only lg:break-words">
                {action.label}
              </span>
              <span className="sr-only">: {course.title}</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          ) : course.launchHref ? (
            <a
              href={course.launchHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-11 min-w-0 shrink-0 items-center justify-center border border-brand-orange bg-paper text-sm font-bold text-foreground transition-colors duration-150 hover:bg-kupfer-mist focus-visible:bg-kupfer-mist motion-reduce:transition-none lg:h-auto lg:min-h-11 lg:w-auto lg:justify-between lg:gap-3 lg:px-4 lg:py-2"
            >
              <span className="sr-only lg:not-sr-only lg:break-words">
                {galleryCopy.openCourse}
              </span>
              <span className="sr-only">
                : {course.title}, {galleryCopy.externalNewTab}
              </span>
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}

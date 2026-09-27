import Link from "next/link";
import type { CatalogCourse, ImportedCourse } from "@/lib/courses/catalog";
import { COURSE_LEVEL_LABELS_BY_LOCALE } from "@/lib/courses/catalog-copy";
import { COURSE_GALLERY_COPY } from "@/lib/courses/course-gallery-copy";
import {
  courseDurationShort,
  coursePromise,
  coursePromiseShort,
} from "@/lib/courses/course-hub-copy";
import { demosForCourse } from "@/lib/demos";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type { CourseAccess } from "@/lib/courses/access";
import { ArrowGlyph } from "@/components/werk/arrow-glyph";
import { BUTTON_CLASSES } from "@/components/werk/button-link";
import { cx } from "@/components/werk/cx";
import { Pictogram } from "@/components/werk/pictogram";
import { PosterThumb } from "@/components/plakat";
import { coursePlakat } from "@/lib/plakat/palettes";

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
  /**
   * The end of `tryDemo` a phone leaves out of the visible label (" ansehen"),
   * so the demo link fits beside the action. It stays in the accessible name.
   */
  readonly tryDemoPhoneTail: string;
  readonly sourceCode: string;
  readonly sourceCommit: string;
  readonly start: string;
  readonly continue: string;
  readonly viewRecord: string;
  readonly pathCourse: string;
  readonly completedLabel: string;
  readonly levelTerm: string;
  readonly accountRequired: string;
  readonly unavailable: string;
  readonly unavailableAction: string;
  readonly overview: string;
  readonly accessTerm: string;
}

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
): {
  readonly href: string;
  /** The full label with the access state, as the next-step sheet prints it. */
  readonly label: string;
  /** The verb alone, as a ledger row prints it next to its access column. */
  readonly verb: string;
  /**
   * Screen-reader text before and after the verb, so the row's accessible
   * name equals `label`. The row renders the separating spaces.
   */
  readonly before: string;
  readonly after: string;
} {
  if (access === "unavailable") {
    return {
      href: localizeHref(course.href, locale),
      label: copy.unavailableAction,
      verb: copy.overview,
      before: `${copy.unavailable} ·`,
      after: "",
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
    verb: label,
    before: "",
    after: access === "account-required" ? `· ${copy.accountRequired}` : "",
  };
}

export interface SourceRepository {
  readonly owner: string;
  readonly name: string;
}

export function sourceRepository(sourceHref: string): SourceRepository {
  try {
    const [owner = "", name = ""] = new URL(sourceHref).pathname
      .split("/")
      .filter(Boolean);
    return { owner, name };
  } catch {
    return { owner: "", name: sourceHref };
  }
}


/**
 * One ledger row (design direction 6.6; Werkzeichnung v2, SPEC §3.4): the
 * course's poster thumbnail, title, the one-line promise, duration, level
 * and access as plain text, and the action as a text link. Rows are
 * separated by hairlines; there is no tonal fill and no row tint. Colour
 * lives only in the thumbnail, in the track's scene (Grundlagenpfad Lemons
 * with its numerals 01 to 04; Technikkurse IDEA and Bloom without one). A
 * course in the selected path gets an ink square before its title, so the
 * state never rests on colour.
 *
 * The tracks are fixed so every row of both groups lines up: from xl the
 * facts and the action are two columns, at lg they share one right-hand cell
 * (the wrapper switches between flex and `display: contents`), below lg the
 * facts print as a caption under the promise.
 */
export function CourseLedgerRow({
  course,
  inPath,
  visible,
  stat,
  locale,
  copy,
  access,
  accessInGroupHead = false,
  sourceInGroupHead = false,
}: {
  readonly course: Course;
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
  /**
   * The group head already states this row's access word (every course in
   * the group shares it), so the phone caption leaves it out.
   */
  readonly accessInGroupHead?: boolean;
  /**
   * The group head carries the shared repository and commit below lg, so the
   * row's own attribution prints from lg only.
   */
  readonly sourceInGroupHead?: boolean;
}) {
  const galleryCopy = COURSE_GALLERY_COPY[locale];
  const poster = coursePlakat(course.slug);
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
  const promise = coursePromise(course.slug, locale) ?? course.tagline;
  const promiseShort = coursePromiseShort(course.slug, locale);
  const durationShort = courseDurationShort(course.slug, locale);
  const accessWord =
    live && access !== "open"
      ? access === "account-required"
        ? copy.accountRequired
        : copy.unavailable
      : null;
  // Seven of the ten courses have no demo. Rather than substituting one from
  // another course, those rows simply omit the link.
  const courseDemos = live ? demosForCourse(course.slug) : [];
  const courseDemo = courseDemos[0];
  const demoCount = courseDemos.length;
  const demoLabel = copy.tryDemo(demoCount);
  const demoTail =
    copy.tryDemoPhoneTail && demoLabel.endsWith(copy.tryDemoPhoneTail)
      ? copy.tryDemoPhoneTail
      : "";

  const links =
    courseDemo || (sourceHref && source) ? (
      <div
        data-course-links
        className="contents lg:col-start-2 lg:row-start-2 lg:mt-1 lg:flex lg:flex-wrap lg:items-center lg:gap-x-5"
      >
        {courseDemo ? (
          <Link
            href={localizeHref(
              `/demos/${courseDemo.slug}?source=gallery`,
              locale,
            )}
            prefetch={false}
            className="inline-flex min-h-11 items-center text-label text-foreground underline decoration-border underline-offset-4 transition-colors duration-[120ms] hover:decoration-foreground motion-reduce:transition-none"
          >
            {/* One inline wrapper, so the space before the tail stays: in
                the inline-flex link a bare whitespace node between two
                flex items would be dropped ("Praxisbeispielansehen"). */}
            {demoTail ? (
              <span>
                {demoLabel.slice(0, -demoTail.length)}{" "}
                <span className="max-sm:sr-only">{demoTail.trim()}</span>
              </span>
            ) : (
              demoLabel
            )}
          </Link>
        ) : null}
        {/* Attribution for the imported MIT courses. Mono because it is
            a code identifier. From lg it prints on every row. Below lg,
            when all rows of the group share one repository and commit, the
            group head prints it once and the row leaves it out; otherwise
            it stays here, with the owner and the word "Commit" left to the
            accessible name. */}
        {sourceHref && source ? (
          <p
            data-course-source
            className={cx(
              "flex flex-wrap items-center gap-x-3 font-mono text-caption text-muted-foreground",
              sourceInGroupHead && "max-lg:hidden",
            )}
          >
            <a
              href={sourceHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center underline decoration-border underline-offset-4 hover:decoration-foreground"
            >
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
                className="inline-flex min-h-11 items-center underline decoration-border underline-offset-4 hover:decoration-foreground"
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
    ) : null;

  return (
    <li
      className={cx(
        "border-b border-hairline px-1 py-2.5 transition-colors duration-[120ms] hover:bg-card-hover motion-reduce:transition-none sm:px-2 sm:py-5",
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
      {/* The poster thumbnail replaces the number column (SPEC §3.4): an
          aria-hidden SVG, never an <img>, never focusable. Below lg a row is
          a dense list item: thumbnail, title, one line of promise, one
          caption of facts, then one wrapping line of links with the action
          first. From lg the links line is the second grid row under the
          title and the facts and action sit in the right-hand columns,
          spanning both rows so the links stay under the promise. */}
      <div className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-x-5 lg:grid-cols-[6rem_minmax(0,1fr)_15rem] lg:gap-x-6 xl:grid-cols-[6rem_minmax(0,1fr)_10rem_15rem]">
        {poster ? (
          <PosterThumb
            plakat={poster.plakat}
            motif={poster.motif}
            numeral={poster.numeral}
            size="sm"
            className="col-start-1 row-span-2 row-start-1 self-start"
          />
        ) : (
          <span aria-hidden="true" className="col-start-1 row-span-2 row-start-1" />
        )}

        <div className="min-w-0 lg:col-start-2 lg:row-start-1">
          {/* The title link keeps its 44px target on a phone but gives 6px
              of it back above and below, into the row padding and the
              promise, which are not interactive. */}
          <h4 className="flex items-center gap-2 text-[1.0625rem] font-bold leading-snug text-foreground sm:text-[1.25rem]">
            {/* The path marker, inline before the title: the ink square
                keys "in your path" without colour; the words follow for
                screen readers. */}
            {inPath ? (
              <span
                aria-hidden="true"
                data-path-marker
                className="size-2.5 shrink-0 bg-foreground"
              />
            ) : null}
            <Link
              href={localizeHref(course.href, locale)}
              className="-my-1.5 flex min-h-11 min-w-0 items-center underline decoration-transparent underline-offset-4 transition-colors duration-[120ms] hover:decoration-foreground motion-reduce:transition-none sm:my-0 sm:inline-flex"
            >
              {course.title}
            </Link>
          </h4>
          {inPath ? (
            <p className="sr-only">{copy.pathCourse}</p>
          ) : null}
          {liveStat?.certified ? (
            <p className="mt-1 flex items-center gap-1.5 text-caption font-semibold text-pass">
              <Pictogram name="pass" className="size-3.5" />
              {copy.completedLabel}
            </p>
          ) : null}
          {/* On a phone the row prints the short promise, one clause that
              ends where it should instead of mid-sentence; the full promise
              stays in the accessibility tree and prints from sm. Two lines
              at most, also for a course without a short form. */}
          <p className="mt-0.5 line-clamp-2 max-w-[62ch] text-[0.9375rem]/[1.45] text-muted-foreground text-pretty sm:mt-1 sm:line-clamp-none sm:text-body">
            {promiseShort ? (
              <>
                <span aria-hidden="true" data-promise-short className="sm:hidden">
                  {promiseShort}
                </span>
                <span className="max-sm:sr-only">{promise}</span>
              </>
            ) : (
              promise
            )}
          </p>
          {/* Below lg the facts column is absent, so level, duration and
              access print as one caption after the promise. */}
          <p
            data-course-level-label
            className="mt-1 text-caption text-muted-foreground tabular-nums lg:hidden"
          >
            {levelLabel} ·{" "}
            {durationShort ? (
              <>
                <span className="sm:hidden">{durationShort}</span>
                <span className="max-sm:hidden">{course.duration}</span>
              </>
            ) : (
              course.duration
            )}
            {accessWord && !accessInGroupHead ? (
              <>
                {" · "}
                <span data-course-access-label>{accessWord}</span>
              </>
            ) : null}
          </p>
        </div>

        {/* One wrapping line of links on a phone, the action first; from lg
            this wrapper dissolves and its cells take their grid places. The
            DOM keeps the desktop reading order (demo and source under the
            promise, then the right-hand action); only the phone moves the
            action forward. The 44px targets reach 4px up and 8px down into
            the row's padding, which is not interactive. */}
        <div className="col-start-2 flex min-w-0 flex-wrap items-center gap-x-5 max-lg:-mb-2 max-lg:-mt-1 lg:contents">
          {links}
          <div className="contents lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:flex lg:min-w-0 lg:flex-col lg:gap-1 xl:contents">
            <dl
              data-course-meta
              className="hidden text-caption text-muted-foreground tabular-nums lg:block lg:pt-3 xl:col-start-3 xl:row-span-2 xl:row-start-1"
            >
              <dt className="sr-only">{galleryCopy.duration}</dt>
              <dd className="text-foreground">{course.duration}</dd>
              <dt className="sr-only">{copy.levelTerm}</dt>
              <dd>{levelLabel}</dd>
              {accessWord ? (
                <>
                  <dt className="sr-only">{copy.accessTerm}</dt>
                  <dd className="text-foreground">{accessWord}</dd>
                </>
              ) : null}
            </dl>

            <div
              data-course-action
              className="min-w-0 max-lg:order-first xl:col-start-4 xl:row-span-2 xl:row-start-1"
            >
              {live && action ? (
                <Link
                  href={action.href}
                  prefetch={false}
                  className={BUTTON_CLASSES.paper.text}
                >
                  {/* The whitespace text nodes keep the spaces in the accessible
                      name; a flex container drops them from the layout. */}
                  {action.before ? (
                    <>
                      <span className="sr-only">{action.before}</span>{" "}
                    </>
                  ) : null}
                  <span>{action.verb}</span>
                  {action.after ? (
                    <>
                      {" "}
                      <span className="sr-only">{action.after}</span>
                    </>
                  ) : null}
                  <span className="sr-only">: {course.title}</span>
                  <ArrowGlyph />
                </Link>
              ) : course.launchHref ? (
                <a
                  href={course.launchHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={BUTTON_CLASSES.paper.text}
                >
                  <span>{galleryCopy.openCourse}</span>
                  <span className="sr-only">
                    : {course.title}, {galleryCopy.externalNewTab}
                  </span>
                  <ArrowGlyph direction="external" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

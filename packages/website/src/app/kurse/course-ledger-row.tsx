import Link from "next/link";
import type { CatalogCourse, ImportedCourse } from "@/lib/courses/catalog";
import { COURSE_LEVEL_LABELS_BY_LOCALE } from "@/lib/courses/catalog-copy";
import { COURSE_GALLERY_COPY } from "@/lib/courses/course-gallery-copy";
import { coursePromise } from "@/lib/courses/course-hub-copy";
import { demosForCourse } from "@/lib/demos";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type { CourseAccess } from "@/lib/courses/access";
import { ArrowGlyph } from "@/components/werk/arrow-glyph";
import { BUTTON_CLASSES } from "@/components/werk/button-link";
import { cx } from "@/components/werk/cx";
import { Pictogram } from "@/components/werk/pictogram";

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


/**
 * One ledger row (design direction 6.6): number, title, the one-line promise,
 * duration, level and access as plain text, and the action as a text link.
 * Rows are separated by hairlines; there is no tonal fill. A course in the
 * selected path gets an ink square before its number instead of a coloured
 * edge.
 *
 * The tracks are fixed so every row of both groups lines up: from xl the
 * facts and the action are two columns, at lg they share one right-hand cell
 * (the wrapper switches between flex and `display: contents`), below lg the
 * facts print as a caption under the promise.
 */
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
  const promise = coursePromise(course.slug, locale) ?? course.tagline;
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

  return (
    <li
      className={cx(
        "border-b border-hairline px-1 py-5 transition-colors duration-[120ms] hover:bg-card-hover motion-reduce:transition-none sm:px-2",
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
      {/* No cover thumbnail: the ledger stays image-free (see the test). */}
      <div className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-x-2 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-x-3 lg:grid-cols-[3.5rem_minmax(0,1fr)_15rem] lg:gap-x-6 xl:grid-cols-[3.5rem_minmax(0,1fr)_10rem_15rem]">
        <span
          data-course-number
          aria-hidden="true"
          className="flex h-11 items-center gap-1.5 text-label text-muted tabular-nums sm:gap-2"
        >
          <span
            data-path-marker
            className={cx("size-2.5 shrink-0", inPath && "bg-foreground")}
          />
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0">
          <h4 className="text-[1.25rem] font-bold leading-snug text-foreground">
            <Link
              href={localizeHref(course.href, locale)}
              className="inline-flex min-h-11 items-center underline decoration-transparent underline-offset-4 transition-colors duration-[120ms] hover:decoration-foreground motion-reduce:transition-none"
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
          <p className="mt-1 max-w-[62ch] text-body text-muted-foreground text-pretty">
            {promise}
          </p>
          {/* Below lg the facts column is absent, so level, duration and
              access print as one caption after the promise. */}
          <p
            data-course-level-label
            className="mt-1 text-caption text-muted-foreground tabular-nums lg:hidden"
          >
            {levelLabel} · {course.duration}
            {accessWord ? (
              <>
                {" · "}
                <span data-course-access-label className="text-foreground">
                  {accessWord}
                </span>
              </>
            ) : null}
          </p>
          {courseDemo || (sourceHref && source) ? (
            <div className="mt-1 flex flex-wrap items-center gap-x-5">
              {courseDemo ? (
                <Link
                  href={localizeHref(
                    `/demos/${courseDemo.slug}?source=gallery`,
                    locale,
                  )}
                  prefetch={false}
                  className="inline-flex min-h-11 items-center text-label text-foreground underline decoration-border underline-offset-4 transition-colors duration-[120ms] hover:decoration-foreground motion-reduce:transition-none"
                >
                  {copy.tryDemo(demoCount)}
                </Link>
              ) : null}
              {/* Attribution for the imported MIT courses. This is the only
                  place the repository and pinned commit render as page
                  content, so it stays visible on the row. Mono because it is
                  a code identifier. Below lg the owner and the word "Commit"
                  leave the visible label; the accessible name keeps both. */}
              {sourceHref && source ? (
                <p
                  data-course-source
                  className="flex flex-wrap items-center gap-x-3 font-mono text-caption text-muted-foreground"
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
          ) : null}
        </div>

        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-1 xl:contents">
        <dl
          data-course-meta
          className="hidden text-caption text-muted-foreground tabular-nums lg:block lg:pt-3"
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

        <div data-course-action className="col-start-2 min-w-0 lg:col-start-auto">
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
    </li>
  );
}

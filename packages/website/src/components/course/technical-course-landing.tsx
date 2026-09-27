import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type JSX,
  type ReactElement,
  type ReactNode,
} from "react";
import { Kicker } from "@/components/werk";
import { cx } from "@/components/werk/cx";
import { CapsLine, PosterArt } from "@/components/plakat";
import { coursePlakat, type CoursePlakat } from "@/lib/plakat/palettes";
import { posterTitleStyle } from "@/lib/plakat/fit";

interface TechnicalCourseFrameProps {
  readonly children: ReactNode;
  readonly courseId: string;
  readonly lang?: string;
}

interface TechnicalCourseHeaderProps {
  /**
   * The course's `TechnicalCourseFrame` id. The frame passes it to its
   * header, so pages do not repeat it; it picks the band's poster art.
   */
  readonly courseId?: string;
  readonly eyebrow: string;
  /** A string, or inline markup that only controls line breaks. */
  readonly title: ReactNode;
  readonly intro: string;
  readonly primaryAction: ReactNode;
  readonly secondaryAction?: ReactNode;
  readonly facts: readonly string[];
  readonly factsLabel: string;
  readonly progress?: ReactNode;
  /**
   * An optional drawing under the facts, such as a course's working cycle
   * (design direction 7.4). It must carry information, not decoration.
   */
  readonly figure?: ReactNode;
}

interface TechnicalCourseSectionHeadingProps {
  /**
   * Optional factual note shown at the right of the Kopflinie. Section heads
   * get no kicker in Werkzeichnung, so this renders as a quiet caption.
   */
  readonly eyebrow?: string;
  readonly title: string;
  readonly intro?: string;
  readonly id?: string;
  /** Id for the h2 itself, for a section that is `aria-labelledby` it. */
  readonly headingId?: string;
}

/**
 * The course landing kit renders the course landings (Werkzeichnung v2,
 * SPEC §3.13): a full-bleed poster band in the track's scene (Lemons for the
 * Grundlagenpfad, IDEA and Bloom for the Technikkurse) with one caps line,
 * the poster title, a 17px lead and one primary action; below the band the
 * page is paper, and sections open with a 2px Kopflinie in the scene line.
 * Lists are hairline rows. No boxes, no offset shadows, no radius.
 */

/**
 * The page's one primary action. It keeps `bg-brand-orange` because the
 * landing tests and e2e specs locate the primary action by that class. The
 * label is `text-background`, so the same class reads right on every ground:
 * Kalkweiß on Mennige (5.08:1, 6.72:1 on the Mennige-tief hover) on paper,
 * and the ground on the ink inside a scene (Ultramarin on Butter 10.97,
 * Kreide on Kobalt 6.78, Sand on Aubergine 9.74). Never `text-paper` here:
 * Bogen on Butter would be 1.09:1. In a scene the fill does not change on
 * hover, so the label underlines.
 */
export const TECHNICAL_COURSE_PRIMARY_ACTION_CLASS =
  "inline-flex min-h-12 max-w-full min-w-0 items-center justify-center gap-2 bg-brand-orange px-5 py-3 text-center text-[1.0625rem] font-semibold text-background decoration-2 underline-offset-4 transition-colors duration-[120ms] hover:bg-kupfer-dark hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange motion-reduce:transition-none";

/**
 * Secondary action: square ink outline, same height as the primary. A
 * landing whose secondary action only jumps to its own syllabus adds
 * `max-sm:hidden`: on a phone the syllabus follows the hero directly, and at
 * 320 the second button took its own row.
 */
export const TECHNICAL_COURSE_SECONDARY_ACTION_CLASS =
  "inline-flex min-h-12 max-w-full min-w-0 items-center justify-center gap-2 border border-foreground bg-transparent px-5 py-3 text-center text-[1.0625rem] font-semibold text-foreground transition-colors duration-[120ms] hover:bg-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange motion-reduce:transition-none";

/**
 * Ledger row link: the whole row is one link, separated by a hairline, with a
 * tonal hover. Consumers add their own grid columns.
 */
export const TECHNICAL_COURSE_LEDGER_LINK_CLASS =
  "group relative grid min-h-14 min-w-0 items-center gap-2 border-b border-hairline bg-transparent px-0 py-4 transition-colors duration-[120ms] hover:bg-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange motion-reduce:transition-none";

/**
 * Lesson number cell of a ledger row. From sm it reads "Lektion 1" in a
 * 4.75rem column; on a phone the column is 2rem and shows "01", which gives
 * the title about 44px more width. The full label stays in the accessibility
 * tree at every width, and neither form is mono caps.
 */
export function TechnicalCourseLessonNumber({
  label,
  number,
}: {
  /** The full label, for example "Lektion 1". */
  readonly label: string;
  readonly number: number;
}): JSX.Element {
  return (
    <p className="text-label text-muted-foreground tabular-nums">
      <span aria-hidden="true" className="sm:hidden">
        {String(number).padStart(2, "0")}
      </span>
      <span className="max-sm:sr-only">{label}</span>
    </p>
  );
}

/** Grid columns for a ledger row that starts with a lesson number. */
export const TECHNICAL_COURSE_LESSON_ROW_COLUMNS =
  "grid-cols-[2rem_minmax(0,1fr)_1rem] sm:grid-cols-[4.75rem_minmax(0,1fr)_1rem]";

/** Legal-document "§ " prefixes are dropped from labels on the landing. */
function plainLabel(label: string): string {
  return label.replace(/^§\s*/, "");
}

/**
 * Kicker text for the hero. A no-break space ties each "·" to the part before
 * it, so a narrow screen breaks after the separator and never starts a line
 * with it; `text-balance` on the kicker then keeps a short last part such as
 * "kostenlos" from standing alone on the second line.
 */
function kickerLabel(label: string): string {
  return plainLabel(label).replace(/ · /g, "\u00a0· ");
}

/**
 * The words of a headline that may be inline markup (line-break spans or a
 * small heading component), for the poster fit rule. Only the longest
 * unbreakable word matters there, so order and joins do not: strings are
 * collected from children, and from the string props of an element that
 * has no children (such as `<KfHeading lead accent />`).
 */
const NON_TEXT_PROPS = new Set(["className", "id", "style", "href", "key", "role"]);

function titleText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(titleText).join(" ");
  if (!isValidElement(node)) return "";
  const props = node.props as Record<string, unknown>;
  if (props.children !== undefined) return titleText(props.children as ReactNode);
  return Object.entries(props)
    .filter(([name, value]) => !NON_TEXT_PROPS.has(name) && typeof value === "string")
    .map(([, value]) => value as string)
    .join(" ");
}

/** Hands the frame's course id to its header (also inside a fragment). */
function withCourseId(children: ReactNode, courseId: string): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    if (child.type === TechnicalCourseHeader) {
      const header = child as ReactElement<TechnicalCourseHeaderProps>;
      return header.props.courseId ? header : cloneElement(header, { courseId });
    }
    if (child.type === Fragment) {
      const fragment = child as ReactElement<{ readonly children?: ReactNode }>;
      return cloneElement(fragment, {}, withCourseId(fragment.props.children, courseId));
    }
    return child;
  });
}

/**
 * The landing page: a full-bleed grid whose middle track is the 72rem
 * column. Every child sits in that track; the header spans all three and
 * paints the band edge to edge (no viewport units, no negative margins).
 * `data-plakat-page` names the track's scene, so the header band, the
 * Kopflinien below it and the tab-bar marker all take it (SPEC §1.3, §1.4).
 * A course without a scene (the AI-Native demos, glossary and fluency test)
 * stays paper.
 */
export function TechnicalCourseFrame({
  children,
  courseId,
  lang,
}: TechnicalCourseFrameProps): JSX.Element {
  const scene = coursePlakat(courseId);
  return (
    <div
      className="grid w-full min-w-0 grid-cols-[minmax(1rem,1fr)_minmax(0,72rem)_minmax(1rem,1fr)] overflow-x-clip pb-12 sm:grid-cols-[minmax(1.5rem,1fr)_minmax(0,72rem)_minmax(1.5rem,1fr)] [&>*:not([data-technical-course-header])]:col-start-2"
      data-technical-course={courseId}
      data-plakat-page={scene?.plakat}
      lang={lang}
    >
      {withCourseId(children, courseId)}
    </div>
  );
}

/** The course's poster in the band's right track, from lg (SPEC §3.13). */
function HeaderArt({ scene }: { readonly scene: CoursePlakat }): JSX.Element {
  return (
    <div
      aria-hidden="true"
      data-plakat-art=""
      className="pointer-events-none hidden aspect-[4/5] w-full max-w-[15rem] lg:block"
    >
      <PosterArt plakat={scene.plakat} motif={scene.motif} numeral={scene.numeral} format="portrait" />
    </div>
  );
}

export function TechnicalCourseHeader({
  courseId,
  eyebrow,
  title,
  intro,
  primaryAction,
  secondaryAction,
  facts,
  factsLabel,
  progress,
  figure,
}: TechnicalCourseHeaderProps): JSX.Element {
  const scene = courseId ? coursePlakat(courseId) : undefined;
  // The band (SPEC §3.13). It picks up the page's scene through the
  // `[data-plakat-page] [data-plakat-band]` scope, spans the frame's three
  // tracks and puts its content back in the middle one. Type budget: the
  // caps line, the poster title and 17px for the lead, the actions and the
  // facts (14px on a phone, the caps line's size). There is no phone art:
  // the action stays in the first screen. From lg the right track holds the
  // course's poster over the ruled facts.
  return (
    <header
      className="col-span-full grid min-w-0 grid-cols-subgrid"
      data-technical-course-header
      data-plakat-band=""
    >
      <div className="col-start-2 grid min-w-0 gap-x-12 gap-y-5 pb-7 pt-6 sm:gap-y-8 sm:pb-10 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:pb-14 lg:pt-14">
        <div className="@container min-w-0">
          {scene ? (
            <CapsLine className="text-balance">{kickerLabel(eyebrow)}</CapsLine>
          ) : (
            <Kicker className="text-balance">{kickerLabel(eyebrow)}</Kicker>
          )}
          <h1
            className="poster-title mt-3 max-w-[16ch] break-words text-foreground sm:mt-4"
            style={posterTitleStyle(titleText(title))}
          >
            {title}
          </h1>
          <p className="mt-4 max-w-[48ch] break-words text-[1.0625rem]/[1.5] text-foreground text-pretty sm:mt-6">
            {intro}
          </p>
          <div
            className="mt-5 flex min-w-0 flex-wrap items-center gap-3 sm:mt-8"
            data-course-entry-actions
          >
            {primaryAction}
            {secondaryAction}
          </div>
        </div>

        <div className="min-w-0 lg:flex lg:flex-col lg:gap-8">
          {scene ? <HeaderArt scene={scene} /> : null}
          <aside
            aria-label={factsLabel}
            className="min-w-0 self-start border-t-2 border-foreground pt-4 max-lg:border-t-0 max-lg:pt-0 lg:self-stretch"
          >
            <p className="text-label text-foreground max-lg:sr-only">
              {plainLabel(factsLabel)}
            </p>
            <ul
              className="mt-3 min-w-0 max-lg:mt-0 max-lg:flex max-lg:flex-wrap"
              data-course-onboarding-checklist
            >
              {facts.map((fact) => (
                <li
                  key={fact}
                  className={cx(
                    "min-w-0 break-words border-b border-hairline py-2.5 text-body text-foreground tabular-nums",
                    "max-lg:border-0 max-lg:py-0 max-lg:text-[0.875rem] max-lg:leading-normal max-lg:after:mx-2 max-lg:after:content-['·'_/_''] max-lg:last:after:content-none",
                  )}
                >
                  {fact}
                </li>
              ))}
            </ul>
            {figure ? <div className="mt-8 min-w-0">{figure}</div> : null}
            {progress ? (
              <div className="mt-5 empty:hidden" data-course-progress-card>
                {progress}
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </header>
  );
}

export function TechnicalCourseSectionHeading({
  eyebrow,
  title,
  intro,
  id,
  headingId,
}: TechnicalCourseSectionHeadingProps): JSX.Element {
  const note = eyebrow ? plainLabel(eyebrow) : "";
  return (
    <div
      className="min-w-0 border-t-2 border-scene-line pt-4"
      id={id}
      data-technical-section-heading
    >
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2
          id={headingId}
          className="min-w-0 max-w-[40ch] break-words text-fluid-h2 font-bold text-foreground text-balance"
        >
          {title}
        </h2>
        {/* On a phone the note wrapped under the heading like a stray
            footnote; the heading already names the section. */}
        {note ? (
          <p className="text-caption text-muted-foreground max-sm:hidden">
            {note}
          </p>
        ) : null}
      </div>
      {intro ? (
        <p className="mt-2 max-w-[64ch] break-words text-body text-muted-foreground text-pretty">
          {intro}
        </p>
      ) : null}
    </div>
  );
}

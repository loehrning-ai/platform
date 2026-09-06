import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Compact reader bar of the mobile companion shell (docs/experience-system.md,
 * "Reader focus mode").
 *
 * A reader route hides the bottom tab bar below `lg` by carrying
 * `data-reader="focus"` on the wrapper it owns inside `<main>`. This bar takes
 * the band the tab bar leaves behind: it is the same `--tabbar-h` tall plus the
 * device inset, so exchanging one for the other shifts no layout, and the band
 * `<body>` reserves at the end of the document stays exactly right. At `lg` and
 * above it is `display: none` and the desktop reader is unchanged.
 *
 * The file declares no client boundary of its own, so it renders in whichever
 * tree imports it: the chapter reader renders it on the server with a link
 * action, the lesson shell renders it inside its client tree with a button
 * action. That is why the two action kinds are not interchangeable. A `link`
 * works anywhere; a `button` carries a callback, so only a caller that already
 * sits inside a client tree may pass one.
 *
 * It states the position and the next action and nothing else: the global scroll
 * thread stays the only progress indicator, and this bar never draws a second
 * one. The position is optional so a shell that owns the band without knowing
 * the position can still fill it with an action.
 */

export type ReaderFocusBarAction =
  | {
      readonly kind: "link";
      readonly label: string;
      readonly href: string;
      /** A richer accessible name. It must begin with the visible label. */
      readonly ariaLabel?: string;
    }
  | {
      readonly kind: "button";
      readonly label: string;
      readonly onSelect: () => void;
      /** Accessible detail for a compact visible action. */
      readonly ariaLabel?: string;
    };

export interface ReaderFocusBarProps {
  /**
   * Visible position, for example "3 / 12" or "Lektion 3 von 12".
   *
   * Optional because a reader shell may own the band without owning the
   * position: the lesson shell is generic over course structures and is handed
   * an opaque sidebar, so it can state where the learner is only when a course
   * reader tells it. The row then keeps the same geometry and the action stays
   * on the trailing edge, where the thumb is.
   */
  readonly position?: string;
  /**
   * Spoken position for a visible text that is a bare fraction. When given,
   * assistive technology reads this sentence and skips the visible text. It is
   * only read when there is a visible `position` to replace.
   */
  readonly positionLabel?: string;
  /** Extra controls between the position and the action, such as a contents sheet. */
  readonly children?: ReactNode;
  /** The next action. Omitted when a reader has nowhere further to go. */
  readonly action?: ReaderFocusBarAction;
}

const ACTION_CLASS_NAME =
  "inline-flex min-h-11 min-w-11 shrink-0 items-center gap-1.5 border border-foreground bg-brand-orange px-3 font-mono text-xs font-bold uppercase tracking-[0.08em] text-white outline-none transition-colors duration-150 hover:bg-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none";

function ReaderFocusAction({
  action,
  reserveContextSpace,
}: {
  readonly action: ReaderFocusBarAction;
  readonly reserveContextSpace: boolean;
}) {
  const arrow = <ArrowRight aria-hidden="true" className="size-4 shrink-0" />;
  // Reserve room for real position/contents controls, not an empty leading cell.
  // Long labels wrap within their allocation rather than hiding the action.
  const actionClassName = cn(
    ACTION_CLASS_NAME,
    reserveContextSpace ? "max-w-[60%]" : "max-w-full",
  );
  const labelClassName = "min-w-0 whitespace-normal [overflow-wrap:anywhere]";

  if (action.kind === "link") {
    return (
      <Link
        href={action.href}
        aria-label={action.ariaLabel}
        data-reader-focus-action
        className={actionClassName}
      >
        <span className={labelClassName}>{action.label}</span>
        {arrow}
      </Link>
    );
  }

  // A button only works with scripting, so the no-script sheet removes it
  // (`js-shell-only`) instead of leaving a dead control in the bar.
  return (
    <button
      type="button"
      onClick={action.onSelect}
      aria-label={action.ariaLabel}
      data-reader-focus-action
      className={cn(actionClassName, "js-shell-only")}
    >
      <span className={labelClassName}>{action.label}</span>
      {arrow}
    </button>
  );
}

export function ReaderFocusBar({
  position,
  positionLabel,
  children,
  action,
}: ReaderFocusBarProps) {
  const reserveContextSpace = position !== undefined || children != null;
  return (
    <div
      data-reader-focus-bar
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-safe pb-safe lg:hidden"
    >
      <div
        data-reader-focus-bar-row
        className="flex h-[var(--tabbar-h)] min-w-0 items-center justify-end gap-2 px-3 sm:px-4"
      >
        {position === undefined ? (
          // Controls without a position still align to the trailing edge. A
          // standalone action needs no empty flex item or its extra gap.
          reserveContextSpace || !action ? (
            <span aria-hidden="true" className="min-w-0 flex-1" />
          ) : null
        ) : (
          <p
            data-reader-focus-position
            className="min-w-0 flex-1 truncate font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground"
          >
            {positionLabel ? (
              <>
                <span aria-hidden="true">{position}</span>
                <span className="sr-only">{positionLabel}</span>
              </>
            ) : (
              position
            )}
          </p>
        )}
        {children}
        {action ? (
          <ReaderFocusAction
            action={action}
            reserveContextSpace={reserveContextSpace}
          />
        ) : null}
      </div>
    </div>
  );
}

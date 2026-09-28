import type { ReactNode } from "react";
import { cx } from "./cx";

export type RouteStation = {
  readonly label: ReactNode;
  readonly caption?: ReactNode;
  readonly minutes?: number;
};

export type RouteMode = "progress" | "description";

export type RouteStationState = "past" | "current" | "future" | "solid";

export type RouteProps = {
  readonly stations: readonly RouteStation[];
  /**
   * Index of the current station (progress mode). Stations before it are
   * past, after it future. Without it every station is future.
   */
  readonly current?: number;
  /**
   * progress: outlined future stations and dashed line after the current one.
   * description: an agenda where every station and segment is solid.
   */
  readonly mode?: RouteMode;
  /**
   * Description mode only: index of the station the page itself mirrors
   * ("Übung unten"). It gets the inset "here" square and aria-current="step";
   * from it on the line runs dashed and the squares are outlined
   * (design-direction 6.10, 7.2). The stations stay an agenda: labels keep
   * their ink and no state words are read.
   */
  readonly here?: number;
  /** Accessible name for the list ("Ablauf"). */
  readonly label?: string;
  readonly locale?: "de" | "en";
  /**
   * stack (default): vertical on phones, horizontal from sm.
   * rail: horizontal at every width. Below sm the stations sit in a
   * scroll-snapped rail that bleeds to the screen edge, inside a focusable
   * region so keyboard users can scroll it; from sm it is the stack layout's
   * horizontal row. With rail, className goes on the region, not the list.
   */
  readonly layout?: "stack" | "rail";
  /**
   * rail only: the width up to which the rail scrolls. "sm" (default) is the
   * phone rail. "lg" keeps it through tablet widths, for a long route (more
   * than six stations) whose equal columns would wrap labels into three or
   * four lines there. Assumes the page container's px-4 sm:px-6 gutter.
   */
  readonly railUntil?: "sm" | "lg";
  readonly className?: string;
};

/** Rail classes per breakpoint, written out so Tailwind sees every class. */
const RAIL_CLASSES = {
  sm: {
    list: "flex w-max sm:grid sm:w-auto sm:grid-flow-col sm:auto-cols-fr",
    item: "relative w-[9.5rem] shrink-0 snap-start pr-5 sm:w-auto sm:shrink sm:pr-4",
    label: "mt-2.5 min-w-0 sm:mt-3",
    group:
      "-mx-4 snap-x snap-mandatory max-sm:[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] scroll-px-4 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] focus-visible:outline focus-visible:outline-[3px] focus-visible:-outline-offset-[3px] focus-visible:outline-brand-orange sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden",
  },
  lg: {
    list: "flex w-max lg:grid lg:w-auto lg:grid-flow-col lg:auto-cols-fr",
    item: "relative w-[9.5rem] shrink-0 snap-start pr-5 lg:w-auto lg:shrink lg:pr-4",
    label: "mt-2.5 min-w-0 sm:mt-3",
    group:
      "-mx-4 snap-x snap-mandatory max-lg:[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] scroll-px-4 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] focus-visible:outline focus-visible:outline-[3px] focus-visible:-outline-offset-[3px] focus-visible:outline-brand-orange sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden",
  },
} as const;

const STATE_WORDS: Record<"de" | "en", Record<"past" | "current" | "future", string>> = {
  de: { past: "erledigt", current: "aktuell", future: "offen" },
  en: { past: "done", current: "current", future: "open" },
};

const MINUTES: Record<"de" | "en", (minutes: number) => string> = {
  de: (minutes) => `${minutes} Min.`,
  en: (minutes) => `${minutes} min`,
};

export function routeStationState(
  index: number,
  current: number | undefined,
  mode: RouteMode,
): RouteStationState {
  if (mode === "description") return "solid";
  if (current === undefined) return "future";
  if (index < current) return "past";
  if (index === current) return "current";
  return "future";
}

function StationSquare({
  state,
  here = false,
}: {
  readonly state: RouteStationState;
  readonly here?: boolean;
}) {
  if (here) {
    return (
      <span
        data-route-here=""
        className="flex size-4 shrink-0 items-center justify-center bg-foreground"
      >
        <span className="size-1.5 bg-card" />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center bg-foreground">
        <span className="size-2 bg-card" />
      </span>
    );
  }
  if (state === "future") {
    return <span className="size-4 shrink-0 border-2 border-foreground bg-card" />;
  }
  return <span className="size-4 shrink-0 bg-foreground" />;
}

/**
 * The deck's Route (story.css .route): square stations on a 2px line.
 * Serves as agenda, path and stepper. Horizontal from sm, vertical on phones
 * (or a horizontal scroll rail with layout="rail"), with the same <ol>. The final state renders without JS; there is no motion
 * here, so a page may add a one-time line draw with a reduced-motion fallback.
 */
export function Route({
  stations,
  current,
  mode = "progress",
  here,
  label,
  locale = "de",
  layout = "stack",
  railUntil = "sm",
  className,
}: RouteProps) {
  const rail = layout === "rail";
  const railClasses = RAIL_CLASSES[railUntil];
  const list = (
    <ol
      aria-label={label}
      data-route-mode={mode}
      data-route-layout={rail ? "rail" : undefined}
      className={
        rail
          ? railClasses.list
          : cx("grid grid-cols-1 sm:grid-flow-col sm:auto-cols-fr", className)
      }
    >
      {stations.map((station, index) => {
        const state = routeStationState(index, current, mode);
        const last = index === stations.length - 1;
        const marked = mode === "description" && here !== undefined;
        const isHere = marked && index === here;
        const solidLine =
          (state === "past" || state === "solid") && !(marked && index >= here);
        return (
          <li
            key={index}
            data-state={state}
            aria-current={state === "current" || isHere ? "step" : undefined}
            className={
              rail
                ? railClasses.item
                : cx(
                    "relative grid grid-cols-[1rem_minmax(0,1fr)] gap-x-4 sm:block sm:pr-4",
                    last ? undefined : "pb-6 sm:pb-0",
                  )
            }
          >
            <span aria-hidden="true" className="relative z-10 flex size-4 items-center justify-center">
              <StationSquare
                state={marked && index > here ? "future" : state}
                here={isHere}
              />
            </span>
            {last ? null : (
              <span
                aria-hidden="true"
                data-route-line={solidLine ? "solid" : "dashed"}
                className={cx(
                  rail
                    ? "absolute left-4 right-0 top-[7px] border-t-2"
                    : "absolute bottom-0 left-[7px] top-4 border-l-2 sm:bottom-auto sm:left-4 sm:right-0 sm:top-[7px] sm:border-l-0 sm:border-t-2",
                  solidLine ? "border-foreground" : "border-dashed border-muted",
                )}
              />
            )}
            <div className={rail ? railClasses.label : "min-w-0 sm:mt-3"}>
              <p
                className={cx(
                  "text-label text-balance",
                  state === "future" ? "text-muted" : "text-foreground",
                  state === "current" && "font-bold",
                )}
              >
                {station.label}
                {mode === "progress" ? (
                  <span className="sr-only">, {STATE_WORDS[locale][state === "solid" ? "past" : state]}</span>
                ) : null}
              </p>
              {station.minutes !== undefined ? (
                <p className="mt-0.5 text-caption text-muted-foreground tabular-nums">
                  {MINUTES[locale](station.minutes)}
                </p>
              ) : null}
              {station.caption ? (
                <p className="mt-0.5 text-caption text-muted-foreground">{station.caption}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );

  if (!rail) return list;

  // The rail scrolls on phones only (through tablets with railUntil="lg");
  // from there on it is a plain row. The negative
  // margin lets the rail run to the screen edge inside a px-4 container. A
  // group, not a region: the surrounding section is already the landmark.
  // Stations have one fixed phone width, so the last visible one is always
  // cut partway, and the right edge fades over the gutter: both say "scroll".
  return (
    <div
      role="group"
      aria-label={label}
      tabIndex={0}
      data-route-rail={railUntil}
      className={cx(railClasses.group, className)}
    >
      {list}
    </div>
  );
}

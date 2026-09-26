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
  readonly className?: string;
};

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

function StationSquare({ state }: { readonly state: RouteStationState }) {
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
  label,
  locale = "de",
  layout = "stack",
  className,
}: RouteProps) {
  const rail = layout === "rail";
  const list = (
    <ol
      aria-label={label}
      data-route-mode={mode}
      data-route-layout={rail ? "rail" : undefined}
      className={
        rail
          ? "flex w-max sm:grid sm:w-auto sm:grid-flow-col sm:auto-cols-fr"
          : cx("grid grid-cols-1 sm:grid-flow-col sm:auto-cols-fr", className)
      }
    >
      {stations.map((station, index) => {
        const state = routeStationState(index, current, mode);
        const last = index === stations.length - 1;
        const solidLine = state === "past" || state === "solid";
        return (
          <li
            key={index}
            data-state={state}
            aria-current={state === "current" ? "step" : undefined}
            className={
              rail
                ? "relative w-[9.5rem] shrink-0 snap-start pr-5 sm:w-auto sm:shrink sm:pr-4"
                : cx(
                    "relative grid grid-cols-[1rem_minmax(0,1fr)] gap-x-4 sm:block sm:pr-4",
                    last ? undefined : "pb-6 sm:pb-0",
                  )
            }
          >
            <span aria-hidden="true" className="relative z-10 flex size-4 items-center justify-center">
              <StationSquare state={state} />
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
            <div className={rail ? "mt-2.5 min-w-0 sm:mt-3" : "min-w-0 sm:mt-3"}>
              <p
                className={cx(
                  "text-label",
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

  // The rail scrolls on phones only; from sm it is a plain row. The negative
  // margin lets the rail run to the screen edge inside a px-4 container. A
  // group, not a region: the surrounding section is already the landmark.
  // Stations have one fixed phone width, so the last visible one is always
  // cut partway, and the right edge fades over the gutter: both say "scroll".
  return (
    <div
      role="group"
      aria-label={label}
      tabIndex={0}
      data-route-rail=""
      className={cx(
        "-mx-4 snap-x snap-mandatory max-sm:[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] scroll-px-4 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] focus-visible:outline focus-visible:outline-[3px] focus-visible:-outline-offset-[3px] focus-visible:outline-brand-orange sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {list}
    </div>
  );
}

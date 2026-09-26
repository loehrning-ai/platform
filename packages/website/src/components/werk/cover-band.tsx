import type { ReactNode } from "react";
import { cx } from "./cx";
import { GlobeLines, type GlobeLinesProps } from "./globe-lines";

export type CoverBandProps = {
  readonly children: ReactNode;
  /** id of the band's heading, for aria-labelledby. */
  readonly labelledBy?: string;
  /** Show the line globe on the right (md and up). Defaults to true. */
  readonly globe?: boolean;
  readonly globeProps?: Omit<GlobeLinesProps, "className">;
  /**
   * Also draw a small, cropped globe in the top-right corner below md, where
   * the full globe is hidden, so a phone cover does not read as a flat slab.
   * Static, aria-hidden and masked away from the text. Defaults to false.
   */
  readonly phoneGlobe?: boolean;
  /** Extra classes for the inner content container. */
  readonly contentClassName?: string;
  readonly className?: string;
};

/**
 * Graphit cover band, as on the workshop deck cover: a full-width in-flow
 * <section> (no viewport-width units, no negative margins) scoped with .dark-section, with
 * a static line globe on the right, cut off by the band edge. The globe is
 * aria-hidden, hidden below md, masked in from the left, and absolutely
 * positioned behind the text, so the heading stays the LCP element.
 *
 * Put the kicker, the h1 (text-display), an optional dark QuestionCard and
 * dark-tone ButtonLinks inside.
 */
export function CoverBand({
  children,
  labelledBy,
  globe = true,
  globeProps,
  phoneGlobe = false,
  contentClassName,
  className,
}: CoverBandProps) {
  return (
    <section
      aria-labelledby={labelledBy}
      data-cover-band=""
      className={cx("dark-section relative isolate overflow-hidden", className)}
    >
      {globe ? (
        <div
          aria-hidden="true"
          data-cover-globe=""
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[min(62vw,60rem)] [mask-image:linear-gradient(to_right,transparent,black_35%)] md:block"
        >
          <GlobeLines
            {...globeProps}
            className="absolute right-[-24rem] top-1/2 h-auto w-[68rem] max-w-none -translate-y-[37%] lg:right-[-22rem] lg:w-[78rem]"
          />
        </div>
      ) : null}
      {phoneGlobe ? (
        <div
          aria-hidden="true"
          data-cover-globe-phone=""
          className="pointer-events-none absolute -right-36 -top-6 -z-10 size-[21rem] [mask-image:linear-gradient(to_right,transparent_8%,black_58%)] md:hidden"
        >
          <GlobeLines {...globeProps} className="size-full" />
        </div>
      ) : null}
      <div
        className={cx(
          "relative mx-auto max-w-[75rem] px-4 py-16 sm:px-6 lg:py-24",
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

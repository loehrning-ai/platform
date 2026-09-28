import type { ReactNode } from "react";
import { cx } from "@/components/werk/cx";
import { plakatClass, type PlakatKey } from "@/lib/plakat/palettes";
import { CornerDots } from "./corner-dots";

export type PlakatBandProps = {
  readonly children: ReactNode;
  readonly plakat: PlakatKey;
  /** id of the band's heading, for aria-labelledby. */
  readonly labelledBy?: string;
  /**
   * The lg art column, right, full band height: `<PosterArt format="portrait"
   * cornerDots={false} />` or `<PosterNumeral />`. The text column stops 3rem
   * before it, so no text ever sits on a shape.
   */
  readonly art?: ReactNode;
  /**
   * The phone and tablet art, a 128px strip after the last control:
   * `<PosterArt format="strip" />` or `<PosterNumeral format="strip" />`.
   * Its left padding matches the text column, so a strip numeral lines up
   * with the headline.
   */
  readonly artPhone?: ReactNode;
  /**
   * strip (default): the 128px strip above, for a key numeral (the hub).
   * poster: a full-bleed 16:9 row for `<PosterArt format="landscape" />`, the
   * numeral and the motif at full column width (219px at 390), capped at
   * 18rem on a tablet. The reference posters give the art 40 to 70% of the
   * area; a strip left a phone band nearly all type.
   */
  readonly artPhoneLayout?: "strip" | "poster";
  /**
   * The IDEA poster's four corner dots, 16px inside the band's own corners
   * (the /demos band). Poster art inside the band then takes
   * `cornerDots={false}`, so the dots mark the band, not a poster in it.
   * With `artPhone`, the bottom pair shows only from lg: below lg it would
   * sit on the strip numeral's baseline (a Kobalt dot beside a Himbeere
   * "02" reads as ".02"). The content then starts 36px down on phones, so
   * the top dots stay clear of the caps line.
   */
  readonly cornerDots?: boolean;
  /** Extra classes for the inner content container (an inline-size container). */
  readonly contentClassName?: string;
  readonly className?: string;
};

/**
 * The poster band (Werkzeichnung v2, SPEC §3.1): a full-width in-flow
 * section in one scene (`plakat-*`), with the scene's ground, ink and ring.
 * It supersedes the graphit CoverBand on workshops, courses, demos and the
 * blog; CoverBand stays for the home fallback scene.
 *
 * Type budget: two or three sizes per band. The caps line (14px, 17px in
 * autumn), the poster title (`.poster-title` with `posterTitleFallbackStyle()`), and
 * one body size of 17px for the lede, subtitle, buttons (`tone="scene"`) and
 * a short access line. No hairline, box, card, question card, meta list,
 * `text-caption` or `text-label` inside a band: facts move to paper below.
 *
 * The H1 is the LCP element: never animated, never under art. `data-cover-band`
 * stays for the tests and e2e specs that select a cover.
 */
export function PlakatBand({
  children,
  plakat,
  labelledBy,
  art,
  artPhone,
  artPhoneLayout = "strip",
  cornerDots = false,
  contentClassName,
  className,
}: PlakatBandProps) {
  return (
    <section
      aria-labelledby={labelledBy}
      data-cover-band=""
      data-plakat={plakat}
      className={cx(plakatClass(plakat), "relative isolate overflow-hidden", className)}
    >
      {cornerDots ? (
        artPhone ? (
          <>
            <CornerDots corners="top" />
            <CornerDots corners="bottom" className="hidden lg:block" />
          </>
        ) : (
          <CornerDots />
        )
      ) : null}
      {art ? (
        <div
          aria-hidden="true"
          data-plakat-art=""
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[min(36vw,30rem)] lg:block"
        >
          {art}
        </div>
      ) : null}
      <div
        className={cx(
          "@container relative mx-auto max-w-[75rem] px-4 sm:px-6 sm:pt-10 lg:py-16",
          cornerDots ? "pt-9" : "pt-5",
          art && "lg:pr-[calc(min(36vw,30rem)+3rem)]",
          contentClassName,
        )}
      >
        {children}
      </div>
      {artPhone ? (
        <div
          aria-hidden="true"
          data-plakat-art-phone=""
          data-plakat-art-phone-layout={artPhoneLayout}
          className={cx(
            "pointer-events-none mt-6 w-full lg:hidden",
            artPhoneLayout === "poster" ? "aspect-[16/9] max-h-72" : "h-32 pl-4 sm:pl-6",
          )}
        >
          {artPhone}
        </div>
      ) : (
        <div className="h-6 lg:hidden" />
      )}
    </section>
  );
}

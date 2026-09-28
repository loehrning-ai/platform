"use client";

import { m, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { HOME_COPY } from "@/components/home/home-copy";
import { GlobeToggle } from "@/components/home/globe-toggle";
import {
  LG_QUERY,
  PhoneGlobeToggle,
  usePhoneGlobe,
} from "@/components/home/phone-globe";
import { CapsLine } from "@/components/plakat/caps-line";
import { ArrowGlyph } from "@/components/werk/arrow-glyph";
import { cx } from "@/components/werk/cx";
import { BrandButton } from "@/components/ui/brand-button";
import { withMotionProvider } from "@/components/motion/with-motion-provider";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { noBreakFirstLine, posterTitleFallbackStyle } from "@/lib/plakat/fit";
import { HOME_SCENE } from "@/lib/plakat/palettes";
import "./phone-hero.css";

/**
 * The home scene (SPEC D7): the lemons poster band, or the graphit fallback
 * behind the one constant in src/lib/plakat/palettes.ts.
 */
const LEMONS = HOME_SCENE === "lemons";

/**
 * The poster title's fit: the first two headline parts are one unbreakable
 * line (joined by a no-break space in the markup), so the title shrinks until
 * that line fits its column. The line runs to the column edge at 320, so it
 * takes the fallback headroom (the Arial-metric face sets about 4.4% wider).
 */
function heroTitleStyle(headline: readonly string[]): CSSProperties {
  return posterTitleFallbackStyle(noBreakFirstLine(headline));
}

const HeroNetwork = dynamic(
  () =>
    import("@/components/home/hero-network").then(
      (module) => module.HeroNetwork,
    ),
  { ssr: false },
);

function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return prefersReduced;
}

/* ──────────────────────────────────────────────────────────────────────────
   Desktop globe (lg and up)
   ────────────────────────────────────────────────────────────────────────── */

/**
 * The desktop projection and its scroll scene. Mounted only once the desktop
 * query has matched, so phones run no scroll-linked JavaScript and never
 * download hero-network.
 *
 * It is positioned against the section, not the content column, so the
 * sphere runs off the viewport edge like the workshop cover globe instead of
 * stopping at a hard vertical edge. Purely decorative and never a target: the
 * visible pause control sits beside the primary action.
 */
function DesktopHeroGlobe({
  locale,
  sectionRef,
  prefersReduced,
  paused,
}: {
  readonly locale: Locale;
  readonly sectionRef: React.RefObject<HTMLElement | null>;
  readonly prefersReduced: boolean;
  readonly paused: boolean;
}) {
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  // Only the globe responds to the scene transition. Text follows normal
  // document scrolling so reduced motion and reading position remain stable.
  const globeY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const globeOpacity = useTransform(
    scrollYProgress,
    [0, 0.6, 1.0],
    [1, 0.85, 0],
  );
  const frozen = useTransform(scrollYProgress, [0.08, 0.15], [0, 1]);

  return (
    <m.div
      id="home-hero-network"
      data-hero-globe-motion={
        prefersReduced ? "static" : paused ? "paused" : "running"
      }
      className={cx(
        "pointer-events-none absolute z-0 block overflow-visible",
        // Lemons: the flat disc starts 2rem right of the 40rem text column
        // and bleeds off the right edge, never by more than half, so Germany
        // (near its centre) stays in view from 1024 up; the band's foot strip
        // cuts it below, so on wide screens it rises as a dome. Its width is
        // the section's --hero-globe-w, which also sets the band body's
        // min-height, so the strip never rises over the country (a shorter
        // English lead included). No fade (a fade is off-poster).
        // Graphit: the masked line globe of the fallback scene.
        LEMONS
          ? "left-[calc(max(3rem,50vw_-_36rem)_+_42rem)] top-24 aspect-square w-(--hero-globe-w)"
          : "home-hero-network-mask bottom-0 right-0 h-[110%] w-[70vw]",
      )}
    >
      <m.div
        className="h-full w-full"
        style={
          !prefersReduced ? { y: globeY, opacity: globeOpacity } : undefined
        }
      >
        <HeroNetwork
          locale={locale}
          scrollProgress={scrollYProgress}
          frozen={frozen}
          paused={paused}
          reducedMotion={prefersReduced}
          scene={HOME_SCENE}
          className="h-full w-full opacity-100"
        />
      </m.div>
    </m.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Section
   ────────────────────────────────────────────────────────────────────────── */

export type HeroSectionProps = {
  readonly locale?: Locale;
  /**
   * Below lg only: the server-rendered first frame of the horizon globe
   * (werk/HorizonGlobeFrame). Passed in from the server page so its geometry
   * is computed on the server and never ships in this client chunk.
   */
  readonly phoneGlobe?: ReactNode;
  /** Below lg only: the continue seat, docked as the band's last row. */
  readonly continueSlot?: ReactNode;
};

/*
 * Two layouts, one tree, one poster band.
 *
 * The hero is the lemons band at every width (phone-hero.css sets the band's
 * tokens: Butter on Ultramarin, the Mennige globe), with one caps line, the
 * promise as the poster title, one lead sentence and one square Butter
 * action. HOME_SCENE "graphit" keeps the earlier graphit band as a fallback.
 *
 * From lg the band is the cover: the text column on the left, the projection
 * globe running off the right edge behind it, a visible pause control beside
 * the action and the pillar register as a hairline index row at the foot.
 *
 * Below lg (phone-hero.css) the same section is laid out between the compact
 * top bar and the tab bar: caps line, title, lead, the Butter action and the
 * continue row, then the horizon globe fills the rest of the band down to
 * the tab bar (the poster's one big shape). The
 * wrappers that exist for the desktop grid are `display: contents` there, so
 * kicker, heading, lead, actions, globe and continue row are placed on one
 * grid. Nothing about the layout is decided in JavaScript.
 */
function HeroSectionContent({
  locale = "de",
  phoneGlobe,
  continueSlot,
}: HeroSectionProps) {
  const copy = HOME_COPY[locale].hero;
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReduced = usePrefersReducedMotion();
  const phoneGlobeState = usePhoneGlobe();
  const [networkMode, setNetworkMode] = useState<"desktop" | "mobile" | null>(
    null,
  );
  const [networkPaused, setNetworkPaused] = useState(false);

  useEffect(() => {
    // The same query as Tailwind lg, phone-hero.css and the phone renderer's
    // eligibility, so the two globes can never run at once (a rem query
    // follows the browser's default font size; a px query would not).
    const media = window.matchMedia(LG_QUERY);
    const updateMode = () =>
      setNetworkMode(media.matches ? "desktop" : "mobile");
    updateMode();
    media.addEventListener("change", updateMode);
    return () => {
      media.removeEventListener("change", updateMode);
    };
  }, []);

  const desktopGlobe = networkMode === "desktop";

  return (
    <section
      data-plakat-band={LEMONS ? "" : undefined}
      data-home-scene={HOME_SCENE}
      ref={sectionRef}
      data-section="hero"
      className={cx(
        "relative -mt-16 flex flex-col overflow-hidden px-6 pb-6 pt-24 max-lg:mt-0 max-lg:p-0 md:px-12 md:pb-10 md:pt-24 lg:min-h-[38rem] lg:pb-12",
        LEMONS &&
          "[--hero-globe-w:min(62vw,56rem,calc(2*(100vw_-_max(3rem,50vw_-_36rem)_-_46rem)))]",
      )}
    >
      {/* The globe is the hero's only animated signal.

          The headline size lives here rather than in a utility because it has
          two values: the two-line promise on the companion shell, and the
          cover band's display size from lg. The short-viewport padding
          override is scoped to lg too; below it phone-hero.css owns the band. */}
      {LEMONS ? (
        // The lemons title is a .poster-title: its size is the word-fit
        // rule in globals.css, never an override here.
        <style>{`
        @media (min-width: 64rem) and (max-height: 680px) {
          [data-section="hero"] { padding-top: 4.5rem !important; padding-bottom: 1.25rem !important; }
        }
      `}</style>
      ) : (
        <style>{`
        [data-section="hero"] h1 { font-size: clamp(2rem, 11.5vw - 0.25rem, 3rem); }
        @media (min-width: 64rem) {
          [data-section="hero"] h1 { font-size: var(--text-display); }
        }
        @media (min-width: 64rem) and (max-height: 680px) {
          [data-section="hero"] { padding-top: 4.5rem !important; padding-bottom: 1.25rem !important; }
        }
      `}</style>
      )}

      {desktopGlobe ? (
        <DesktopHeroGlobe
          locale={locale}
          sectionRef={sectionRef}
          prefersReduced={prefersReduced}
          paused={networkPaused}
        />
      ) : null}

      {/* Lemons from lg: the body starts level with the disc (both 6rem
          under the band top) and is at least half the disc tall, so the
          foot strip (2.5rem below the body) starts under the disc's centre
          and never cuts the country framed above it. */}
      <div
        data-hero-body
        className={cx(
          "relative z-10 mx-auto w-full max-w-6xl",
          LEMONS && "lg:min-h-[calc(var(--hero-globe-w)*0.5)]",
        )}
      >
        <div
          data-hero-grid
          className="grid grid-cols-1 items-start gap-0 lg:grid-cols-[minmax(0,40rem)_1fr]"
        >
          <div data-hero-copy className="relative z-10">
            {/* The band's one caps line (lemons) or the facts as its label
                (graphit) opens the band at every width. */}
            {LEMONS ? (
              <div data-hero-kicker className="lg:mt-2">
                <CapsLine>{copy.capsLine}</CapsLine>
              </div>
            ) : (
              <p
                data-hero-kicker
                className="text-label text-muted-foreground lg:mt-6"
              >
                {copy.introduction.facts}
              </p>
            )}

            {/* The title column is an inline-size container, so the poster
                title's word-fit rule (100cqi / --fit) measures it. */}
            <div data-hero-title className="@container lg:mt-5">
            <h1
              aria-label={copy.headline.join(" ")}
              className={
                LEMONS
                  ? "poster-title text-foreground"
                  : "font-bold leading-none tracking-[-0.015em] text-foreground"
              }
              style={LEMONS ? heroTitleStyle(copy.headline) : undefined}
            >
              {/* One lockup for every width: the first two parts joined on
                  the first line, the last on the second, in one colour. The
                  accessible name is the aria-label. */}
              {copy.headline.map((line, index) => (
                <span key={line}>
                  <span>{line}</span>
                  {index === 0 ? (
                    // Lemons: the first line never breaks ("KI verstehen.",
                    // "Understand AI."), so no word is stranded at 320.
                    LEMONS ? "\u00a0" : " "
                  ) : index < copy.headline.length - 1 ? (
                    <br />
                  ) : null}
                </span>
              ))}
            </h1>
            </div>

            <p
              data-hero-lead
              className={cx(
                "max-w-xl text-muted-foreground",
                LEMONS
                  ? "mt-7 text-[1.0625rem] leading-normal"
                  : "mt-6 text-lead",
              )}
            >
              {copy.introduction.lead}
              <span className="max-lg:hidden">{copy.introduction.detail}</span>.
            </p>

            <div
              data-hero-actions
              className="mt-8 flex items-center gap-4"
            >
              <BrandButton
                href={localizeHref("/kurse", locale)}
                variant="primary"
                surface="dark"
                prefetch={false}
              >
                {copy.primaryCta} <ArrowRight size={15} aria-hidden="true" />
              </BrandButton>
              {desktopGlobe && !prefersReduced ? (
                <GlobeToggle
                  variant="desktop"
                  paused={networkPaused}
                  label={copy.globeToggle}
                  controls="home-hero-network"
                  onToggle={() => setNetworkPaused((current) => !current)}
                />
              ) : (
                <PhoneGlobeToggle
                  globe={phoneGlobeState}
                  label={copy.globeToggle}
                />
              )}
            </div>
          </div>
        </div>

        {/* Below lg: the horizon globe. The server frame is the globe at
            first paint; the canvas stays empty until the live renderer takes
            over (phone-globe.tsx). Decorative, so hidden from assistive tech
            and never focusable. The projection module is desktop-only:
            mobile receives no hidden SVG tree, no atmosphere mask, and no
            projection startup cost. */}
        {phoneGlobe ? (
          <div
            ref={phoneGlobeState.slotRef}
            data-home-globe=""
            data-home-globe-motion="static"
            aria-hidden="true"
            className="lg:hidden"
          >
            <canvas ref={phoneGlobeState.canvasRef} />
            <canvas ref={phoneGlobeState.staticCanvasRef} data-home-globe-static="" />
            {phoneGlobe}
          </div>
        ) : null}

        {continueSlot}
      </div>

      {/* Three direct uses of the platform as one hairline index row.

          Hidden below lg: Lernen, Prüfen and Anwenden point at the same three
          destinations the companion shell already gives a rail and a tab, so on
          a phone this register spent a third of the first screen repeating
          them.

          On the lemons band the row is the poster's foot: a full-bleed
          Ultramarin strip (the ::before) on which the Mennige disc sets, so
          no text ever sits on the shape, and every size is the band's one
          body size. */}
      <ol
        className={cx(
          "relative z-10 mx-auto mt-6 grid w-full max-w-6xl grid-cols-1 border-t border-hairline max-lg:hidden sm:grid-cols-3 md:mt-8 lg:mt-10",
          LEMONS &&
            "before:absolute before:-bottom-12 before:left-1/2 before:top-0 before:-z-10 before:w-screen before:-translate-x-1/2 before:bg-background before:content-['']",
        )}
      >
        {copy.pillars.map((pillar, index) => {
          const href = pillar.href;
          const entry = (
            <>
              <span className="flex items-baseline gap-3">
                <span
                  aria-hidden="true"
                  className={cx(
                    "tabular-nums text-muted",
                    LEMONS ? "text-[1.0625rem] font-semibold" : "text-label",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[1.0625rem] font-semibold text-foreground underline decoration-transparent underline-offset-4 transition-[text-decoration-color] duration-[120ms] group-hover:decoration-current motion-reduce:transition-none">
                  {pillar.title}
                </span>
                {href ? (
                  <ArrowGlyph className="ml-auto self-center text-muted-foreground group-hover:text-foreground" />
                ) : null}
              </span>
              <p
                className={cx(
                  "mt-1.5 text-muted-foreground",
                  LEMONS ? "text-[1.0625rem] leading-snug" : "text-caption",
                )}
              >
                {pillar.body}
              </p>
            </>
          );
          return (
            <li
              key={pillar.title}
              className="min-w-0 border-hairline sm:border-l sm:px-5 sm:first:border-l-0 sm:first:pl-0 sm:last:pr-0"
            >
              {href ? (
                <Link
                  href={localizeHref(href, locale)}
                  prefetch={false}
                  className="group block h-full py-4 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
                >
                  {entry}
                </Link>
              ) : (
                <div className="py-4">{entry}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export const HeroSection = withMotionProvider(HeroSectionContent);

"use client";

import { m, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { HOME_COPY } from "@/components/home/home-copy";
import { GlobeToggle } from "@/components/home/globe-toggle";
import {
  LG_QUERY,
  PhoneGlobeToggle,
  usePhoneGlobe,
} from "@/components/home/phone-globe";
import { ArrowGlyph } from "@/components/werk/arrow-glyph";
import { BrandButton } from "@/components/ui/brand-button";
import { withMotionProvider } from "@/components/motion/with-motion-provider";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import "./phone-hero.css";

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
      className="home-hero-network-mask pointer-events-none absolute bottom-0 right-0 z-0 block h-[110%] w-[70vw] overflow-visible"
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
 * Two layouts, one tree, one graphit band.
 *
 * The hero is a graphit band at every width (phone-hero.css sets the band's
 * tokens), with the facts as its label, the promise in two lines, one lead
 * sentence and one square primary action.
 *
 * From lg the band is the cover: the text column on the left, the projection
 * globe running off the right edge behind it, a visible pause control beside
 * the action and the pillar register as a hairline index row at the foot.
 *
 * Below lg (phone-hero.css) the same section is laid out between the compact
 * top bar and the tab bar: the horizon globe fills the band behind everything
 * below the lead, the primary action sits on the ground in the thumb zone,
 * and the continue row is docked as the last row above the tab bar. The
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
      ref={sectionRef}
      data-section="hero"
      className="relative -mt-16 flex flex-col overflow-hidden px-6 pb-6 pt-24 max-lg:mt-0 max-lg:p-0 md:px-12 md:pb-10 md:pt-24 lg:min-h-[38rem] lg:pb-12"
    >
      {/* The globe is the hero's only animated signal.

          The headline size lives here rather than in a utility because it has
          two values: the two-line promise on the companion shell, and the
          cover band's display size from lg. The short-viewport padding
          override is scoped to lg too; below it phone-hero.css owns the band. */}
      <style>{`
        [data-section="hero"] h1 { font-size: clamp(2rem, 11.5vw - 0.25rem, 3rem); }
        @media (min-width: 64rem) {
          [data-section="hero"] h1 { font-size: var(--text-display); }
        }
        @media (min-width: 64rem) and (max-height: 680px) {
          [data-section="hero"] { padding-top: 4.5rem !important; padding-bottom: 1.25rem !important; }
        }
      `}</style>

      {desktopGlobe ? (
        <DesktopHeroGlobe
          locale={locale}
          sectionRef={sectionRef}
          prefersReduced={prefersReduced}
          paused={networkPaused}
        />
      ) : null}

      <div data-hero-body className="relative z-10 mx-auto w-full max-w-6xl">
        <div
          data-hero-grid
          className="grid grid-cols-1 items-start gap-0 lg:grid-cols-[minmax(0,40rem)_1fr]"
        >
          <div data-hero-copy className="relative z-10">
            {/* The facts open the band as its label at every width. */}
            <p
              data-hero-kicker
              className="text-label text-muted-foreground lg:mt-6"
            >
              {copy.introduction.facts}
            </p>

            <h1
              aria-label={copy.headline.join(" ")}
              className="font-bold leading-none tracking-[-0.015em] text-foreground lg:mt-4"
            >
              {/* One lockup for every width: the first two parts joined on
                  the first line, the last on the second, in one colour. The
                  accessible name is the aria-label. */}
              {copy.headline.map((line, index) => (
                <span key={line}>
                  <span>{line}</span>
                  {index === 0 ? (
                    " "
                  ) : index < copy.headline.length - 1 ? (
                    <br />
                  ) : null}
                </span>
              ))}
            </h1>

            <p
              data-hero-lead
              className="mt-6 max-w-xl text-lead text-muted-foreground"
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
          them. */}
      <ol className="relative z-10 mx-auto mt-6 grid w-full max-w-6xl grid-cols-1 border-t border-hairline max-lg:hidden sm:grid-cols-3 md:mt-8 lg:mt-10">
        {copy.pillars.map((pillar, index) => {
          const href = pillar.href;
          const entry = (
            <>
              <span className="flex items-baseline gap-3">
                <span
                  aria-hidden="true"
                  className="text-label tabular-nums text-muted"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-base font-semibold text-foreground underline decoration-transparent underline-offset-4 transition-[text-decoration-color] duration-[120ms] group-hover:decoration-current motion-reduce:transition-none">
                  {pillar.title}
                </span>
                {href ? (
                  <ArrowGlyph className="ml-auto self-center text-muted-foreground group-hover:text-foreground" />
                ) : null}
              </span>
              <p className="mt-1.5 text-caption text-muted-foreground">
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
                  className="group block h-full py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
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

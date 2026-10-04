"use client";

import { m, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { HOME_COPY } from "@/components/home/home-copy";
import { GlobeToggle } from "@/components/home/globe-toggle";
import {
  LG_QUERY,
  PhoneGlobeToggle,
  usePhoneGlobe,
} from "@/components/home/phone-globe";
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

/** One tilted pastel block per hero fact, in the pillar cards' palette. */
const FACT_MARKS = [
  "bg-brand-acid rotate-12",
  "bg-brand-sky -rotate-6",
  "bg-brand-pink rotate-6",
] as const;

/* ──────────────────────────────────────────────────────────────────────────
   Tiny decorative atoms
   ────────────────────────────────────────────────────────────────────────── */

/** Print-shop registration crosshair. Place at section corners. */
function RegisterMark({ className }: { className: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={`pointer-events-none absolute text-foreground/15 ${className}`}
    >
      <line
        x1="6"
        y1="0"
        x2="6"
        y2="12"
        stroke="currentColor"
        strokeWidth="0.6"
      />
      <line
        x1="0"
        y1="6"
        x2="12"
        y2="6"
        stroke="currentColor"
        strokeWidth="0.6"
      />
      <circle
        cx="6"
        cy="6"
        r="1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Desktop globe (lg and up)
   ────────────────────────────────────────────────────────────────────────── */

/**
 * The desktop projection and its scroll scene. Mounted only once the desktop
 * query has matched, so phones run no scroll-linked JavaScript and never
 * mount this projection (they get their own window onto the same globe).
 * Purely decorative and never a target: the visible pause control sits
 * beside the primary action.
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
      className="home-hero-network-mask pointer-events-none absolute bottom-0 right-0 block h-[110%] w-[70vw] overflow-visible"
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
   * Below lg only: the server-rendered first frame of the phone globe
   * (home/hero-globe-frame.tsx). Passed in from the server page so its
   * geometry is computed on the server and never ships in this client chunk.
   */
  readonly phoneGlobe?: ReactNode;
  /** Below lg only: the continue seat, the band's first row. */
  readonly continueSlot?: ReactNode;
};

/*
 * Two layouts, one tree, one paper hero.
 *
 * From lg: the headline lockup in ink, cobalt and Kupfer on paper with its
 * print shadow, the introduction card, the cobalt action and its pause
 * control, the thin line globe touring the six countries behind the right
 * half, the pink tilted block and the registration marks, and the three
 * pastel step cards at the foot.
 *
 * Below lg (phone-hero.css) the same section is laid out between the top bar
 * and the tab bar: the continue card, the two-line promise, the lead card,
 * the action, then a window onto the same line globe fills the rest of the
 * band. The wrappers that exist for the desktop grid are `display: contents`
 * there, so every row is placed on one grid. Nothing about the layout is
 * decided in JavaScript.
 */
function HeroSectionContent({
  locale = "de",
  phoneGlobe,
  continueSlot,
}: HeroSectionProps) {
  const copy = HOME_COPY[locale].hero;
  const headlineColors = [
    "text-foreground",
    "text-brand-cobalt",
    "text-brand-orange",
  ] as const;
  const pillarTones = [
    "bg-brand-acid/65",
    "bg-brand-peach/55",
    "bg-brand-sky/60",
  ] as const;
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReduced = usePrefersReducedMotion();
  const phoneGlobeState = usePhoneGlobe();
  const PhoneNetwork = phoneGlobeState.Network;
  const [networkMode, setNetworkMode] = useState<"desktop" | "mobile" | null>(
    null,
  );
  const [networkPaused, setNetworkPaused] = useState(false);

  useEffect(() => {
    // The same query as Tailwind lg, phone-hero.css and the phone globe's
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
      className="berlin-grain berlin-hero relative -mt-16 flex flex-col overflow-hidden px-6 pb-6 pt-24 max-lg:mt-0 max-lg:p-0 md:px-12 md:pb-10 md:pt-24 lg:min-h-[38rem] lg:pb-12"
    >
      {/* ── Geometry: the pastel blocks of the paper hero ─────────────── */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-10 top-32 hidden size-32 -rotate-12 rounded-[2rem] border border-foreground/15 bg-brand-pink/50 lg:block"
      />
      <span
        aria-hidden="true"
        data-hero-shape="pink"
        className="pointer-events-none absolute -right-6 top-[8.25rem] size-16 rotate-12 rounded-[1.25rem] border border-foreground/15 bg-brand-pink/50 lg:hidden"
      />
      <span
        aria-hidden="true"
        data-hero-shape="sky"
        className="pointer-events-none absolute -left-9 bottom-20 size-24 -rotate-6 rounded-[1.75rem] border border-foreground/10 bg-brand-sky/45 lg:hidden"
      />

      {/* ── Print-shop registration marks at the four corners ─────────── */}
      <RegisterMark className="left-3 top-20 hidden lg:block" />
      <RegisterMark className="right-3 top-20 hidden lg:block" />
      <RegisterMark className="bottom-4 left-3 hidden lg:block" />
      <RegisterMark className="bottom-4 right-3 hidden lg:block" />

      {/* The globe is the hero's only animated signal.

          The headline size lives here rather than in an inline style because
          it has two reviewed values: the two-line promise on the companion
          shell, the three-line lockup from lg. The short-viewport padding
          override is scoped to lg too; below it phone-hero.css owns the
          band. */}
      <style>{`
        [data-section="hero"] h1 { font-size: clamp(1.875rem, 9.6vw - 0.125rem, 2.75rem); }
        @media (min-width: 64rem) {
          [data-section="hero"] h1 { font-size: clamp(2.25rem, min(8.4vw, 12.5svh), 8rem); }
        }
        @media (min-width: 64rem) and (max-height: 680px) {
          [data-section="hero"] { padding-top: 4.5rem !important; padding-bottom: 1.25rem !important; }
        }
      `}</style>

      <div data-hero-body className="relative z-10 mx-auto w-full max-w-6xl">
        {/* Below lg only (the slot is lg:hidden): the continue seat. It is
            the band's first row on screen (grid-area: continue in
            phone-hero.css), so it is first in the source too, and focus and
            reading order run card, promise, action, pause control (WCAG
            2.4.3). */}
        {continueSlot}

        <div
          data-hero-grid
          className="grid grid-cols-1 items-start gap-0 lg:grid-cols-[1fr_minmax(0,440px)] xl:grid-cols-[1fr_520px]"
        >
          <div data-hero-copy className="relative z-10">
            <h1
              data-hero-title
              aria-label={copy.headline.join(" ")}
              className="font-bold leading-[0.94] text-foreground"
              style={{ letterSpacing: "0" }}
            >
              {/* One lockup for every width, in the paper hero's three inks:
                  "KI" / "verstehen." / "Sicher anwenden." from lg, the first
                  two parts on one line below it. The accessible name is the
                  aria-label. */}
              {copy.headline.map((line, index) => (
                <span key={line}>
                  <span
                    className={
                      "drop-shadow-[0_3px_0_rgba(255,255,255,0.45)] " +
                      headlineColors[index]
                    }
                  >
                    {line}
                  </span>
                  {index === 0 ? (
                    <>
                      <span className="lg:hidden"> </span>
                      <br className="max-lg:hidden" />
                    </>
                  ) : index < copy.headline.length - 1 ? (
                    <br />
                  ) : null}
                </span>
              ))}
            </h1>

            <p
              data-hero-lead
              className="mt-6 max-w-xl rounded-2xl border border-foreground/10 bg-paper px-4 py-3 text-[1.125rem] leading-relaxed text-muted-foreground shadow-card"
            >
              {copy.introduction.lead}
              <span className="max-lg:hidden">{copy.introduction.detail}</span>.
              {/* From lg: the facts as one tag line under the sentence, each
                  behind a small tilted block in the hero's pastel geometry.
                  A phone keeps the one sentence. */}
              <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-ui-mono text-xs font-bold uppercase tracking-[0.08em] text-kupfer-dark max-lg:hidden">
                {copy.introduction.facts.map((fact, index) => (
                  <Fragment key={fact}>
                    {/* Apart only visually: a screen reader hears a comma,
                        never "PaywallDeutsch" run together. Absolute, so it
                        takes no flex gap. */}
                    {index > 0 ? <span className="sr-only">, </span> : null}
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`size-2.5 rounded-[3px] border border-foreground/20 ${FACT_MARKS[index] ?? FACT_MARKS[0]}`}
                      />
                      {fact}
                    </span>
                  </Fragment>
                ))}
              </span>
            </p>

            <div data-hero-actions className="mt-7 flex items-center gap-3">
              <BrandButton
                href={localizeHref("/kurse", locale)}
                variant="primary"
                surface="light"
                prefetch={false}
                className="border-brand-cobalt bg-brand-cobalt text-white hover:border-brand-teal hover:bg-brand-teal hover:text-white"
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

          {/* Globe placeholder to keep grid layout */}
          <div className="hidden lg:block" />
        </div>

        {/* The projection module mounts from lg only; below it the phone
            window onto the same globe takes over. */}
        {desktopGlobe ? (
          <DesktopHeroGlobe
            locale={locale}
            sectionRef={sectionRef}
            prefersReduced={prefersReduced}
            paused={networkPaused}
          />
        ) : null}

        {/* Below lg: a window onto the same line globe. The server frame is
            the globe at first paint; the live globe mounts over it once the
            browser is eligible (phone-globe.tsx) and its first frame hides
            the frame. Decorative, so hidden from assistive tech and never
            focusable. */}
        {phoneGlobe ? (
          <div
            id="home-phone-globe"
            ref={phoneGlobeState.slotRef}
            data-home-globe=""
            data-home-globe-motion={phoneGlobeState.state}
            aria-hidden="true"
            className="lg:hidden"
          >
            {phoneGlobe}
            {PhoneNetwork ? (
              <PhoneNetwork
                locale={locale}
                compact
                idPrefix="hp"
                paused={phoneGlobeState.paused}
                onLive={phoneGlobeState.onLive}
                className="h-full w-full"
              />
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Three direct uses of the platform in one compact register.

          Hidden below lg: Lernen, Prüfen and Anwenden point at the same three
          destinations the companion shell already gives a rail and a tab, so on
          a phone this register spent a third of the first screen repeating
          them. Visibility only; the register itself is unchanged. */}
      <ol className="relative z-10 mx-auto mt-6 grid w-full max-w-6xl grid-cols-1 gap-2 max-lg:hidden sm:grid-cols-3 sm:gap-3 md:mt-8 lg:mt-10">
        {copy.pillars.map((pillar, index) => {
          const href = pillar.href;
          const entry = (
            <>
              <span className="flex items-baseline gap-3">
                <span
                  aria-hidden="true"
                  className="font-ui-mono text-xs font-bold leading-none tracking-[0.14em] text-brand-orange"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-base font-bold tracking-[-0.02em] text-foreground group-hover:text-brand-orange">
                  {pillar.title}
                </span>
              </span>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                {pillar.body}
              </p>
            </>
          );
          return (
            <li
              key={pillar.title}
              className={
                "min-w-0 rounded-2xl border border-foreground/10 p-4 shadow-card transition-[box-shadow,translate] duration-200 hover:-translate-y-1 hover:shadow-card-hover motion-reduce:translate-none motion-reduce:transition-none sm:p-5 " +
                (pillarTones[index] ?? pillarTones[0])
              }
            >
              {href ? (
                <Link
                  href={localizeHref(href, locale)}
                  prefetch={false}
                  className="group block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                >
                  {entry}
                </Link>
              ) : (
                entry
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export const HeroSection = withMotionProvider(HeroSectionContent);

"use client";

import { m, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Pause, Play } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HOME_COPY } from "@/components/home/home-copy";
import { BrandButton } from "@/components/ui/brand-button";
import { withMotionProvider } from "@/components/motion/with-motion-provider";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

// Code-split: hero-network.tsx is a ~35 kB SVG/rAF globe animation that also
// pulls in the ~26 kB COUNTRY_POLYLINES_3D dataset. It's purely decorative
// (aria-hidden, pointer-events-none) and renders inside an already-sized
// wrapper (fixed vw/height on desktop, fixed px on mobile), so deferring it
// out of the initial bundle cannot cause layout shift.
const HeroNetwork = dynamic(
  () => import("@/components/home/hero-network").then((mod) => mod.HeroNetwork),
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

/**
 * Lightweight server-rendered brand landmark. The detailed projection replaces
 * it after viewport detection; without JavaScript the globe still exists.
 */
function StaticHeroGlobePoster() {
  return (
    <svg
      data-hero-globe-poster
      viewBox="0 0 480 480"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="h-[300px] w-[280px] text-foreground opacity-40 lg:h-full lg:w-full lg:opacity-70"
    >
      <circle
        cx="240"
        cy="240"
        r="188"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {[64, 112, 156].map((radius) => (
        <ellipse
          key={`longitude-${radius}`}
          cx="240"
          cy="240"
          rx={radius}
          ry="188"
          stroke="currentColor"
          strokeOpacity="0.32"
        />
      ))}
      {[58, 112, 160].map((radius) => (
        <ellipse
          key={`latitude-${radius}`}
          cx="240"
          cy="240"
          rx="188"
          ry={radius}
          stroke="currentColor"
          strokeOpacity="0.25"
        />
      ))}
      <path
        d="M114 286C151 220 200 180 265 166C314 155 354 167 382 201"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="2"
        strokeDasharray="5 8"
      />
      <path
        d="M129 191C165 206 191 209 217 198C247 185 278 190 300 212C320 232 346 239 371 228"
        stroke="currentColor"
        strokeOpacity="0.46"
        strokeWidth="2"
      />
      <circle cx="269" cy="177" r="5" fill="#C4431A" />
      <circle cx="269" cy="177" r="11" stroke="#C4431A" strokeOpacity="0.45" />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Section
   ────────────────────────────────────────────────────────────────────────── */

function HeroSectionContent({ locale = "de" }: { readonly locale?: Locale }) {
  const copy = HOME_COPY[locale].hero;
  const headlineColors = [
    "text-muted-foreground",
    "text-foreground",
    "text-brand-orange",
  ] as const;
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReduced = usePrefersReducedMotion();
  const [networkPaused, setNetworkPaused] = useState(false);
  const [networkMode, setNetworkMode] = useState<"desktop" | "mobile" | null>(
    null,
  );
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

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const updateMode = () =>
      setNetworkMode(media.matches ? "desktop" : "mobile");
    updateMode();
    media.addEventListener("change", updateMode);
    return () => media.removeEventListener("change", updateMode);
  }, []);

  return (
    <section
      ref={sectionRef}
      data-section="hero"
      className="relative -mt-16 flex min-h-[34rem] flex-col overflow-hidden bg-background px-6 pb-8 pt-24 md:px-12 md:pb-10 md:pt-24"
    >
      {/* Mask out the global grid overlay behind the hero (desktop only — mobile keeps grid) */}
      <div className="pointer-events-none absolute inset-0 z-[1] hidden bg-background lg:block" />

      {/* ── Print-shop registration marks at the four corners ─────────── */}
      <RegisterMark className="left-3 top-20 hidden md:block" />
      <RegisterMark className="right-3 top-20 hidden md:block" />
      <RegisterMark className="bottom-4 left-3 hidden md:block" />
      <RegisterMark className="bottom-4 right-3 hidden md:block" />

      {/* The globe is the hero's only animated signal. */}
      <style>{`
        @media (max-height: 680px) {
          [data-section="hero"] { padding-top: 4.5rem !important; padding-bottom: 1.25rem !important; }
        }
      `}</style>

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 items-start gap-0 lg:grid-cols-[1fr_minmax(0,440px)] xl:grid-cols-[1fr_520px]">
          <div className="relative z-10">
            <p className="mb-4 border-l-[3px] border-brand-orange pl-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {copy.platformLabel}
            </p>

            <h1
              aria-label={copy.headline.join(" ")}
              className="font-bold leading-[0.88] text-foreground"
              style={{
                fontSize: "clamp(3rem, min(8.4vw, 12.5svh), 8rem)",
                letterSpacing: "0",
              }}
            >
              {copy.headline.map((line, index) => (
                <span key={line} className="block pb-2">
                  <span className={"block " + headlineColors[index]}>
                    {line}
                  </span>
                </span>
              ))}
            </h1>

            <p className="mt-6 max-w-xl text-[1.125rem] leading-relaxed text-muted-foreground">
              {copy.introduction}
            </p>

            <div className="mt-7">
              <BrandButton
                href={localizeHref("/kurse", locale)}
                variant="primary"
                surface="light"
              >
                {copy.primaryCta} <ArrowRight size={15} aria-hidden="true" />
              </BrandButton>
            </div>
          </div>

          {/* Globe placeholder to keep grid layout */}
          <div className="hidden lg:block" />
        </div>

        {/* Only one expensive projection tree mounts at a time. CSS-hidden
            responsive duplicates still execute React and SVG work. */}
        {networkMode === null ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center lg:inset-auto lg:bottom-0 lg:right-0 lg:h-[110%] lg:w-[70vw]">
            <StaticHeroGlobePoster />
          </div>
        ) : networkMode === "desktop" ? (
          <m.div
            id="home-hero-network"
            data-hero-globe-motion={
              prefersReduced ? "static" : networkPaused ? "paused" : "running"
            }
            className="home-hero-network-mask pointer-events-none absolute bottom-0 right-0"
            style={{
              width: "70vw",
              height: "110%",
              ...(prefersReduced ? {} : { y: globeY, opacity: globeOpacity }),
              overflow: "visible",
            }}
          >
            <HeroNetwork
              locale={locale}
              scrollProgress={scrollYProgress}
              className="h-full w-full"
              frozen={frozen}
              paused={networkPaused}
              reducedMotion={prefersReduced}
            />
          </m.div>
        ) : networkMode === "mobile" ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <HeroNetwork
              locale={locale}
              scrollProgress={scrollYProgress}
              mobile
              reducedMotion={prefersReduced}
              className="h-[300px] w-[280px] opacity-40"
            />
          </div>
        ) : null}

        {networkMode === "desktop" && !prefersReduced ? (
          <button
            type="button"
            aria-controls="home-hero-network"
            aria-label={
              networkPaused
                ? locale === "de"
                  ? "Globus fortsetzen"
                  : "Resume globe motion"
                : locale === "de"
                  ? "Globus anhalten"
                  : "Pause globe motion"
            }
            aria-pressed={networkPaused}
            onClick={() => setNetworkPaused((current) => !current)}
            className="absolute bottom-0 right-0 z-20 hidden min-h-11 items-center gap-2 border border-border bg-background px-3 font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground outline-none transition-[border-color,color] duration-150 hover:border-brand-orange hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:hidden lg:inline-flex"
          >
            {networkPaused ? (
              <Play size={14} aria-hidden="true" />
            ) : (
              <Pause size={14} aria-hidden="true" />
            )}
            {networkPaused
              ? locale === "de"
                ? "Fortsetzen"
                : "Resume"
              : locale === "de"
                ? "Anhalten"
                : "Pause"}
          </button>
        ) : null}
      </div>

      {/* Three direct uses of the platform in one compact register. */}
      <ol className="relative z-10 mx-auto mt-8 grid w-full max-w-6xl grid-cols-1 divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:mt-10">
        {copy.pillars.map((pillar, index) => {
          const href = pillar.href;
          const entry = (
            <>
              <span className="flex items-baseline gap-3">
                <span
                  aria-hidden="true"
                  className="font-mono text-xs font-bold leading-none tracking-[0.14em] text-brand-orange"
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
              className="py-4 transition-colors hover:bg-card/60 sm:px-5 sm:py-5 sm:first:pl-0 sm:last:pr-0"
            >
              {href ? (
                <Link
                  href={localizeHref(href, locale)}
                  className="group block outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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

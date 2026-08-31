"use client";

import { m, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HOME_COPY } from "@/components/home/home-copy";
import {
  HERO_GLOBE_INTRO_MS,
  HeroNetwork,
} from "@/components/home/hero-network";
import { BrandButton } from "@/components/ui/brand-button";
import { withMotionProvider } from "@/components/motion/with-motion-provider";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

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

/* ──────────────────────────────────────────────────────────────────────────
   Section
   ────────────────────────────────────────────────────────────────────────── */

function HeroSectionContent({ locale = "de" }: { readonly locale?: Locale }) {
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
  const globeIntroDeadlineRef = useRef<number | null>(null);
  const prefersReduced = usePrefersReducedMotion();
  const [globeSettled, setGlobeSettled] = useState(false);
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
    return () => {
      media.removeEventListener("change", updateMode);
    };
  }, []);

  useEffect(() => {
    if (networkMode !== "desktop" || prefersReduced || globeSettled) return;
    const now = window.performance.now();
    const deadline =
      globeIntroDeadlineRef.current ?? now + HERO_GLOBE_INTRO_MS;
    globeIntroDeadlineRef.current = deadline;
    const remaining = Math.max(0, deadline - now);
    if (remaining === 0) {
      setGlobeSettled(true);
      return;
    }
    const timer = window.setTimeout(() => setGlobeSettled(true), remaining);
    return () => window.clearTimeout(timer);
  }, [globeSettled, networkMode, prefersReduced]);

  return (
    <section
      ref={sectionRef}
      data-section="hero"
      className="berlin-grain berlin-hero relative -mt-16 flex min-h-[38rem] flex-col overflow-hidden px-6 pb-9 pt-24 md:px-12 md:pb-12 md:pt-24"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-10 top-32 size-32 -rotate-12 rounded-[2rem] border border-foreground/15 bg-brand-pink/50"
      />

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
            <h1
              aria-label={copy.headline.join(" ")}
              className="font-bold leading-[0.94] text-foreground"
              style={{
                fontSize: "clamp(3rem, min(8.4vw, 12.5svh), 8rem)",
                letterSpacing: "0",
              }}
            >
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
                  {index < copy.headline.length - 1 ? <br /> : null}
                </span>
              ))}
            </h1>

            <p className="mt-6 max-w-xl rounded-2xl border border-foreground/10 bg-paper px-4 py-3 text-[1.125rem] leading-relaxed text-muted-foreground shadow-card">
              {copy.introduction}
            </p>

            <div className="mt-7">
              <BrandButton
                href={localizeHref("/kurse", locale)}
                variant="primary"
                surface="light"
                prefetch={false}
                className="border-brand-cobalt bg-brand-cobalt text-white hover:border-brand-teal hover:bg-brand-teal hover:text-white"
              >
                {copy.primaryCta} <ArrowRight size={15} aria-hidden="true" />
              </BrandButton>
            </div>
          </div>

          {/* Globe placeholder to keep grid layout */}
          <div className="hidden lg:block" />
        </div>

        {/* One real projection tree is present in the server response. A
            lightweight first-frame shell makes the same globe visible before
            hydration; viewport mode only decides whether it animates. */}
        <m.div
          data-hero-globe-motion={
            prefersReduced || networkMode !== "desktop"
              ? "static"
              : globeSettled
                ? "settled"
                : "running"
          }
          className="home-hero-network-mask pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-brand-peach/20 lg:inset-auto lg:bottom-0 lg:right-0 lg:block lg:h-[110%] lg:w-[70vw] lg:overflow-visible lg:rounded-none lg:bg-transparent"
        >
          <m.div
            className="flex h-full w-full items-center justify-center lg:block"
            style={
              networkMode === "desktop" && !prefersReduced
                ? { y: globeY, opacity: globeOpacity }
                : undefined
            }
          >
            <HeroNetwork
              locale={locale}
              scrollProgress={scrollYProgress}
              mobile={networkMode === "mobile"}
              frozen={frozen}
              paused={globeSettled || networkMode !== "desktop"}
              reducedMotion={prefersReduced}
              className="h-[300px] w-[280px] opacity-40 lg:h-full lg:w-full lg:opacity-100"
            />
          </m.div>
        </m.div>

      </div>

      {/* Three direct uses of the platform in one compact register. */}
      <ol className="relative z-10 mx-auto mt-8 grid w-full max-w-6xl grid-cols-1 gap-3 sm:grid-cols-3 md:mt-10">
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
                "min-w-0 rounded-2xl border border-foreground/10 p-5 shadow-card transition-[box-shadow,transform] duration-200 hover:-translate-y-1 hover:shadow-card-hover motion-reduce:transform-none motion-reduce:transition-none " +
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

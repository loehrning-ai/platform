"use client";

import {
  m,
  useScroll,
  useTransform,
  useMotionValue,
  useMotionValueEvent,
} from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { heroNetworkSteps } from "@/components/home/hero-network-steps";
import { HOME_COPY } from "@/components/home/home-copy";
import { BrandButton } from "@/components/ui/brand-button";
import { withMotionProvider } from "@/components/motion/with-motion-provider";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

// Code-split: hero-network.tsx is a ~35 kB SVG/rAF globe animation that also
// pulls in the ~26 kB COUNTRY_POLYLINES_3D dataset. It's purely decorative
// (aria-hidden, pointer-events-none) and renders inside an already-sized
// wrapper (fixed vw/height on desktop, fixed px on mobile), so deferring it
// out of the initial bundle cannot cause layout shift. STEPS is imported
// eagerly above from the lightweight hero-network-steps module instead of
// from hero-network.tsx, so this dynamic import is the only thing that pulls
// in the heavy module.
const HeroNetwork = dynamic(
  () => import("@/components/home/hero-network").then((mod) => mod.HeroNetwork),
  { ssr: false },
);

/* ──────────────────────────────────────────────────────────────────────────
   Formatters & geo math
   ────────────────────────────────────────────────────────────────────────── */

/** `52.520° N` */
function fmtLat(v: number): string {
  return `${Math.abs(v).toFixed(3)}° ${v >= 0 ? "N" : "S"}`;
}

/** `13.405° E` */
function fmtLon(v: number): string {
  return `${Math.abs(v).toFixed(3)}° ${v >= 0 ? "E" : "W"}`;
}

/** Great-circle distance in km (Haversine). */
function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** German thousand-separator + arrow prefix. */
function fmtKm(km: number, locale: Locale): string {
  return `→ ${Math.round(km).toLocaleString(locale === "de" ? "de-DE" : "en-GB")} km`;
}

/* Berlin reference point — anchor for the distance readout. */
const BERLIN_LAT = 52.52;
const BERLIN_LON = 13.405;

/* ──────────────────────────────────────────────────────────────────────────
   Headline
   ────────────────────────────────────────────────────────────────────────── */

const EASE = EASE_OUT_EXPO;

/* ──────────────────────────────────────────────────────────────────────────
   Tiny decorative atoms
   ────────────────────────────────────────────────────────────────────────── */

/** Small Bauhaus north-arrow + N letter. Static, decorative. */
function CompassRose() {
  return (
    <svg
      width="14"
      height="22"
      viewBox="0 0 14 22"
      aria-hidden="true"
      className="text-foreground/40"
    >
      {/* Arrow head */}
      <path d="M7 1 L11 8 L7 6 L3 8 Z" fill="currentColor" />
      {/* Shaft */}
      <line
        x1="7"
        y1="6"
        x2="7"
        y2="14"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      {/* N label */}
      <text
        x="7"
        y="21"
        fontFamily="var(--font-geist-mono), monospace"
        fontSize="7"
        fontWeight="700"
        textAnchor="middle"
        fill="currentColor"
        letterSpacing="0.1em"
      >
        N
      </text>
    </svg>
  );
}

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

function HeroSectionContent({
  locale = "de",
}: {
  readonly locale?: Locale;
}) {
  const copy = HOME_COPY[locale].hero;
  const steps = heroNetworkSteps(locale);
  const headlineColors = [
    "text-muted-foreground",
    "text-foreground",
    "text-brand-orange",
  ] as const;
  const sectionRef = useRef<HTMLElement>(null);
  const [networkMode, setNetworkMode] = useState<
    "desktop" | "mobile" | null
  >(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  // Subtle parallax rise only. The hero content must NOT fade out on scroll —
  // fading the main headline to opacity 0 partway down the hero read as a
  // glitch (text vanishes, then the next section fades in). It now scrolls off
  // the top naturally, staying fully visible the whole way.
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  // Globe scroll transforms
  const globeY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const globeOpacity = useTransform(
    scrollYProgress,
    [0, 0.6, 1.0],
    [1, 0.85, 0],
  );
  const frozen = useTransform(scrollYProgress, [0.08, 0.15], [0, 1]);

  // ── Live globe state piped to sidebar instruments ────────────────────────
  // Direct DOM mutation via refs avoids re-rendering the hero each animation
  // frame.  Three signals: lat, lon, stepIdx.
  const latMV = useMotionValue(BERLIN_LAT);
  const lonMV = useMotionValue(BERLIN_LON);
  const stepIdxMV = useMotionValue(0);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const updateMode = () =>
      setNetworkMode(media.matches ? "desktop" : "mobile");
    updateMode();
    media.addEventListener("change", updateMode);
    return () => media.removeEventListener("change", updateMode);
  }, []);

  const latRef = useRef<HTMLSpanElement>(null);
  const lonRef = useRef<HTMLSpanElement>(null);
  const distRef = useRef<HTMLSpanElement>(null);
  const cityRef = useRef<HTMLSpanElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);

  useMotionValueEvent(latMV, "change", (v) => {
    if (latRef.current) latRef.current.textContent = fmtLat(v);
    if (distRef.current) {
      distRef.current.textContent = fmtKm(
        distanceKm(BERLIN_LAT, BERLIN_LON, v, lonMV.get()), locale,
      );
    }
  });
  useMotionValueEvent(lonMV, "change", (v) => {
    if (lonRef.current) lonRef.current.textContent = fmtLon(v);
    if (distRef.current) {
      distRef.current.textContent = fmtKm(
        distanceKm(BERLIN_LAT, BERLIN_LON, latMV.get(), v), locale,
      );
    }
  });
  useMotionValueEvent(stepIdxMV, "change", (v) => {
    const idx = Math.max(0, Math.min(steps.length - 1, Math.floor(v)));
    if (cityRef.current) cityRef.current.textContent = steps[idx].city;
  });

  // ── Live MEZ / MESZ clock ────────────────────────────────────────────────
  // Ticks every second, written via ref. Timezone-aware (handles MEZ↔MESZ
  // cutover automatically via Intl).
  useEffect(() => {
    const intlLocale = locale === "de" ? "de-DE" : "en-GB";
    const fmtTime = new Intl.DateTimeFormat(intlLocale, {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const fmtZone = new Intl.DateTimeFormat(intlLocale, {
      timeZone: "Europe/Berlin",
      timeZoneName: "short",
    });

    const tick = () => {
      if (!clockRef.current) return;
      const now = new Date();
      const tz =
        fmtZone.formatToParts(now).find((p) => p.type === "timeZoneName")
          ?.value ?? (locale === "de" ? "MEZ" : "CET");
      clockRef.current.textContent = `${fmtTime.format(now)} ${tz}`;
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [locale]);

  return (
    <section
      ref={sectionRef}
      data-section="hero"
      className="relative -mt-16 flex min-h-[36rem] flex-col overflow-hidden bg-background px-6 pb-10 pt-24 md:px-12 md:pb-12 md:pt-28"
    >
      {/* Mask out the global grid overlay behind the hero (desktop only — mobile keeps grid) */}
      <div className="pointer-events-none absolute inset-0 z-[1] hidden bg-background lg:block" />

      {/* ── Print-shop registration marks at the four corners ─────────── */}
      <RegisterMark className="left-3 top-20 hidden md:block" />
      <RegisterMark className="right-3 top-20 hidden md:block" />
      <RegisterMark className="bottom-4 left-3 hidden md:block" />
      <RegisterMark className="bottom-4 right-3 hidden md:block" />

      {/* ────────────────────────────────────────────────────────────────
          LEFT INSTRUMENT, geographic readout
          compass · live coords · brand stamp · distance · current city
          ──────────────────────────────────────────────────────────── */}
      <m.aside
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1.0, ease: EASE }}
        className="pointer-events-none absolute bottom-32 left-4 top-28 z-10 hidden flex-col items-start gap-3 text-foreground/65 md:flex"
      >
        <CompassRose />

        <div className="flex flex-col gap-1 leading-none">
          <span
            ref={latRef}
            className="font-mono text-[12px] font-semibold tabular-nums tracking-[0.14em]"
          >
            {fmtLat(BERLIN_LAT)}
          </span>
          <span
            ref={lonRef}
            className="font-mono text-[12px] font-semibold tabular-nums tracking-[0.14em]"
          >
            {fmtLon(BERLIN_LON)}
          </span>
        </div>

        {/* Hairline + ticks + rotated brand stamp */}
        <div className="relative w-px flex-1 bg-current">
          {[0.18, 0.42, 0.66, 0.9].map((p) => (
            <span
              key={p}
              className="absolute left-0 h-px w-2.5 bg-current"
              style={{ top: `${p * 100}%` }}
            />
          ))}
          <span className="absolute left-3 top-1/2 origin-top-left -translate-y-1/2 rotate-90 whitespace-nowrap font-mono text-[10px] font-semibold tracking-[0.22em] text-foreground/65">
            //&nbsp;{copy.mapStamp.replaceAll(" ", "\u00a0")}
          </span>
        </div>

        {/* Distance + current city — the two readouts that change with the globe */}
        <div className="flex flex-col gap-1 leading-tight">
          <span
            ref={distRef}
            className="font-mono text-[11px] font-semibold tabular-nums tracking-[0.12em] text-foreground/65"
          >
            → 0 km
          </span>
          <span
            ref={cityRef}
            className="font-mono text-[13px] font-bold tracking-[0.16em] text-foreground/65"
          >
            BERLIN
          </span>
        </div>
      </m.aside>

      {/* ────────────────────────────────────────────────────────────────
          RIGHT INSTRUMENT, operational readout
          edition · brand stamp · status · clock
          ──────────────────────────────────────────────────────────── */}
      <m.aside
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1.0, ease: EASE }}
        className="pointer-events-none absolute bottom-32 right-4 top-28 z-10 hidden flex-col items-end gap-3 text-foreground/65 md:flex"
      >
        <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-foreground/65">
          //&nbsp;{copy.edition.replaceAll(" ", "\u00a0")}
        </span>

        <span className="font-mono text-[12px] font-bold tabular-nums tracking-[0.16em] text-foreground/65">
          BERLIN&nbsp;·&nbsp;2026
        </span>

        {/* Hairline + ticks + rotated stamp (mirrored — ticks point left) */}
        <div className="relative w-px flex-1 bg-current">
          {[0.18, 0.42, 0.66, 0.9].map((p) => (
            <span
              key={p}
              className="absolute right-0 h-px w-2.5 bg-current"
              style={{ top: `${p * 100}%` }}
            />
          ))}
          <span className="absolute right-3 top-1/2 origin-top-right -translate-y-1/2 -rotate-90 whitespace-nowrap font-mono text-[10px] font-semibold tracking-[0.22em] text-foreground/65">
            {copy.resourcesStamp.replaceAll(" ", "\u00a0")}
          </span>
        </div>

        {/* Status pill — single brand-orange hit on the entire hero */}
        <div className="flex flex-col items-end gap-1 leading-tight">
          <div className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-full bg-brand-orange"
              style={{
                animation: "hero-status-pulse 2.4s ease-in-out infinite",
              }}
            />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-brand-orange">
              {copy.online}
            </span>
          </div>
          <span
            ref={clockRef}
            className="mt-1 font-mono text-[10px] font-semibold tabular-nums tracking-[0.14em] text-foreground/65"
          >
            00:00:00&nbsp;{locale === "de" ? "MEZ" : "CET"}
          </span>
        </div>
      </m.aside>

      {/* Local CSS — status dot pulse, respects prefers-reduced-motion */}
      <style>{`
        @keyframes hero-status-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.35; transform: scale(0.7); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-section="hero"] [style*="hero-status-pulse"] { animation: none !important; }
        }
        /* Height-responsive: reclaim the fold on short viewports (landscape phones,
           low laptops) by trimming the hero's generous top/bottom padding. */
        @media (max-height: 680px) {
          [data-section="hero"] { padding-top: 4.5rem !important; padding-bottom: 1.25rem !important; }
        }
      `}</style>

      <m.div
        style={{ y: contentY }}
        className="relative z-10 mx-auto w-full max-w-6xl"
      >
        <div className="grid grid-cols-1 items-start gap-0 lg:grid-cols-[1fr_minmax(0,440px)] xl:grid-cols-[1fr_520px]">
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 shadow-card">
              <span
                className="h-2 w-2 rounded-full bg-brand-orange"
                aria-hidden="true"
              />
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-foreground/60">
                {copy.platformLabel}
              </span>
            </div>

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

            <div className="mt-5 flex max-w-2xl flex-wrap gap-2">
              {copy.trustSignals.map((signal) => (
                <span
                  key={signal}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70 shadow-tile"
                >
                  <Check
                    size={12}
                    strokeWidth={2.5}
                    className="text-brand-orange"
                    aria-hidden="true"
                  />
                  {signal}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <BrandButton href={localizeHref("/ki-check", locale)} variant="primary" surface="light">
                {copy.primaryCta} <ArrowRight size={15} />
              </BrandButton>
              <BrandButton
                href={localizeHref("/open-source", locale)}
                variant="outline"
                surface="light"
              >
                {copy.secondaryCta} <ArrowRight size={15} />
              </BrandButton>
            </div>
          </div>

          {/* Globe placeholder to keep grid layout */}
          <div className="hidden lg:block" />
        </div>

        {/* Only one expensive projection tree mounts at a time. CSS-hidden
            responsive duplicates still execute React and SVG work. */}
        {networkMode === "desktop" ? (
          <m.div
            className="home-hero-network-mask pointer-events-none absolute bottom-0 right-0"
            style={{
              width: "70vw",
              height: "110%",
              y: globeY,
              opacity: globeOpacity,
              overflow: "visible",
            }}
          >
            <HeroNetwork
              locale={locale}
              scrollProgress={scrollYProgress}
              className="h-full w-full"
              frozen={frozen}
              latOut={latMV}
              lonOut={lonMV}
              stepIdxOut={stepIdxMV}
            />
          </m.div>
        ) : networkMode === "mobile" ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <HeroNetwork
              locale={locale}
              scrollProgress={scrollYProgress}
              mobile
              className="h-[300px] w-[280px] opacity-40"
            />
          </div>
        ) : null}
      </m.div>

      {/* The three uses of the platform, as a hairline register in the same
          instrument language as the side rails — no card surface. The list
          carries the sequence, so the printed numeral is decorative. */}
      <ol className="relative z-10 mx-auto mt-12 grid w-full max-w-6xl grid-cols-1 divide-y divide-border border-t border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:mt-16">
        {copy.pillars.map((pillar, index) => {
          const href = pillar.href;
          const entry = (
            <>
              <span className="flex items-baseline gap-3">
                <span
                  aria-hidden="true"
                  className="font-mono text-[11px] font-bold leading-none tracking-[0.14em] text-brand-orange"
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
              className="py-5 transition-colors hover:bg-card/60 sm:px-6 sm:py-6 sm:first:pl-0 sm:last:pr-0"
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

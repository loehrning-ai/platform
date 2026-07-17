"use client";

import {
  m,
  useScroll,
  useTransform,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  Check,
  FileText,
  FlaskConical,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { STEPS } from "@/components/home/hero-network-steps";
import { BrandButton } from "@/components/ui/brand-button";
import { IconTile, type CardAccent } from "@/components/ui/card";
import { EASE_OUT_EXPO } from "@/lib/animations";

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
function fmtKm(km: number): string {
  return `→ ${Math.round(km).toLocaleString("de-DE")} km`;
}

/* Berlin reference point — anchor for the distance readout. */
const BERLIN_LAT = 52.52;
const BERLIN_LON = 13.405;

/* ──────────────────────────────────────────────────────────────────────────
   Headline
   ────────────────────────────────────────────────────────────────────────── */

const EASE = EASE_OUT_EXPO;
const headlineLines = [
  { text: "KI", color: "text-muted-foreground" },
  { text: "lernen.", color: "text-foreground" },
  { text: "Kostenlos.", color: "text-brand-orange" },
];

const trustSignals = [
  "von Tim Löhr",
  "kostenlos",
  "technische Labore",
  "Fortschritt optional",
] as const;

// The three ways the platform is used, shown as warm icon cards under the hero.
const heroPillars: ReadonlyArray<{
  readonly title: string;
  readonly body: string;
  readonly icon: LucideIcon;
  readonly accent: CardAccent;
}> = [
  {
    title: "Lernen",
    body: "Kurse und Bücher schaffen gemeinsame Sprache.",
    icon: GraduationCap,
    accent: "kupfer",
  },
  {
    title: "Üben",
    body: "Demos und Selbsttests machen Annahmen sichtbar.",
    icon: FlaskConical,
    accent: "sand",
  },
  {
    title: "Dokumentieren",
    body: "Vorlagen und Blogposts halten Entscheidungen fest.",
    icon: FileText,
    accent: "amber",
  },
];

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

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

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

  const latRef = useRef<HTMLSpanElement>(null);
  const lonRef = useRef<HTMLSpanElement>(null);
  const distRef = useRef<HTMLSpanElement>(null);
  const cityRef = useRef<HTMLSpanElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);

  useMotionValueEvent(latMV, "change", (v) => {
    if (latRef.current) latRef.current.textContent = fmtLat(v);
    if (distRef.current) {
      distRef.current.textContent = fmtKm(
        distanceKm(BERLIN_LAT, BERLIN_LON, v, lonMV.get()),
      );
    }
  });
  useMotionValueEvent(lonMV, "change", (v) => {
    if (lonRef.current) lonRef.current.textContent = fmtLon(v);
    if (distRef.current) {
      distRef.current.textContent = fmtKm(
        distanceKm(BERLIN_LAT, BERLIN_LON, latMV.get(), v),
      );
    }
  });
  useMotionValueEvent(stepIdxMV, "change", (v) => {
    const idx = Math.max(0, Math.min(STEPS.length - 1, Math.floor(v)));
    if (cityRef.current) cityRef.current.textContent = STEPS[idx].city;
  });

  // ── Live MEZ / MESZ clock ────────────────────────────────────────────────
  // Ticks every second, written via ref. Timezone-aware (handles MEZ↔MESZ
  // cutover automatically via Intl).
  useEffect(() => {
    const fmtTime = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const fmtZone = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      timeZoneName: "short",
    });

    const tick = () => {
      if (!clockRef.current) return;
      const now = new Date();
      const tz =
        fmtZone.formatToParts(now).find((p) => p.type === "timeZoneName")
          ?.value ?? "MEZ";
      clockRef.current.textContent = `${fmtTime.format(now)} ${tz}`;
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

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
            //&nbsp;ÖFFENTLICHE&nbsp;LERNKARTE&nbsp;v3.0
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
          //&nbsp;AUSGABE&nbsp;Nr.&nbsp;014&nbsp;/&nbsp;2026
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
            KURSE&nbsp;·&nbsp;VORLAGEN&nbsp;·&nbsp;DEMOS&nbsp;·&nbsp;BLOG&nbsp;//
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
              Online
            </span>
          </div>
          <span
            ref={clockRef}
            className="mt-1 font-mono text-[10px] font-semibold tabular-nums tracking-[0.14em] text-foreground/65"
          >
            00:00:00&nbsp;MEZ
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
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto w-full max-w-6xl"
      >
        <div className="grid grid-cols-1 items-start gap-0 lg:grid-cols-[1fr_minmax(0,440px)] xl:grid-cols-[1fr_520px]">
          <div className="relative z-10">
            <m.div
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 shadow-card"
              initial={prefersReduced ? false : { opacity: 0, y: 6 }}
              animate={
                prefersReduced
                  ? { opacity: 1, y: 0 }
                  : {
                      opacity: 1,
                      y: 0,
                      borderColor: [
                        "rgba(11,9,8,0.2)",
                        "rgba(165,55,15,0.4)",
                        "rgba(11,9,8,0.2)",
                      ],
                    }
              }
              transition={
                prefersReduced
                  ? { duration: 0 }
                  : {
                      opacity: { duration: 0.5, delay: 0.05, ease: EASE },
                      y: { duration: 0.5, delay: 0.05, ease: EASE },
                      borderColor: {
                        duration: 3,
                        delay: 1.5,
                        repeat: 2,
                        ease: "easeInOut",
                      },
                    }
              }
            >
              <span
                className="h-2 w-2 rounded-full bg-brand-orange"
                aria-hidden="true"
              />
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-foreground/60">
                Freie KI-Lernplattform
              </span>
            </m.div>

            <h1
              className="font-bold leading-[0.88] text-foreground"
              style={{
                fontSize: "clamp(3rem, min(8.4vw, 12.5svh), 8rem)",
                letterSpacing: "0",
              }}
            >
              {headlineLines.map((line, i) => (
                <span key={line.text} className="block pb-2">
                  <m.span
                    className={"block " + line.color}
                    initial={
                      prefersReduced
                        ? false
                        : { clipPath: "inset(0 0 100% 0)", y: 10 }
                    }
                    animate={{ clipPath: "inset(0 0 -0.3em 0)", y: 0 }}
                    transition={{
                      delay: 0.2 + i * 0.12,
                      duration: 0.7,
                      ease: EASE,
                    }}
                  >
                    {line.text}
                  </m.span>
                </span>
              ))}
            </h1>

            <div className="mt-6 overflow-hidden">
              <m.p
                className="max-w-xl text-[1.125rem] leading-relaxed text-muted-foreground"
                initial={
                  prefersReduced ? false : { clipPath: "inset(0 100% 0 0)" }
                }
                animate={{ clipPath: "inset(0 0% 0 0)" }}
                transition={{ delay: 0.78, duration: 0.7, ease: EASE }}
              >
                Kurse, Demos, Vorlagen, Bücher und Arbeitsnotizen zu
                KI-Kompetenz, EU AI Act, Dateninfrastruktur und Automatisierung.
                Gebaut von Tim Löhr, mit öffentlichen Kursprojekten und
                optionalem Konto für Fortschritt.
              </m.p>
            </div>

            <m.div
              className="mt-5 flex max-w-2xl flex-wrap gap-2"
              initial={prefersReduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: prefersReduced ? 0 : 0.9,
                duration: 0.55,
                ease: EASE,
              }}
            >
              {trustSignals.map((signal) => (
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
            </m.div>

            <m.div
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              initial={prefersReduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: prefersReduced ? 0 : 0.95,
                duration: 0.6,
                ease: EASE,
              }}
            >
              <BrandButton href="/kurse" variant="primary" surface="light">
                Lernpfad öffnen <ArrowRight size={15} />
              </BrandButton>
              <BrandButton
                href="/open-source"
                variant="outline"
                surface="light"
              >
                Open Source <ArrowRight size={15} />
              </BrandButton>
            </m.div>
          </div>

          {/* Globe placeholder to keep grid layout */}
          <div className="hidden lg:block" />
        </div>

        {/* Globe: position absolute, touching right + bottom edges */}
        <m.div
          className="home-hero-network-mask pointer-events-none absolute bottom-0 right-0 hidden lg:block"
          style={{
            width: "70vw",
            height: "110%",
            y: globeY,
            opacity: globeOpacity,
            overflow: "visible",
          }}
        >
          <HeroNetwork
            scrollProgress={scrollYProgress}
            className="h-full w-full"
            frozen={frozen}
            latOut={latMV}
            lonOut={lonMV}
            stepIdxOut={stepIdxMV}
          />
        </m.div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center lg:hidden">
          <HeroNetwork
            scrollProgress={scrollYProgress}
            mobile
            className="h-[300px] w-[280px] opacity-40"
          />
        </div>
      </m.div>

      <m.div
        className="relative z-10 mx-auto mt-12 w-full max-w-6xl md:mt-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.05, duration: 0.6, ease: "easeOut" }}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {heroPillars.map((pillar, i) => (
            <m.div
              key={pillar.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 + i * 0.08, duration: 0.45, ease: EASE }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <div className="flex items-center justify-between">
                <IconTile icon={pillar.icon} accent={pillar.accent} />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="text-base font-bold tracking-[-0.02em] text-foreground">
                {pillar.title}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {pillar.body}
              </p>
            </m.div>
          ))}
        </div>
      </m.div>
    </section>
  );
}

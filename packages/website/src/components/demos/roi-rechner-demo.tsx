"use client";

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DEMO } from "@/lib/demo-tokens";
import { DEMO_HEIGHT, usePrefersReducedMotion } from "./demo-utils";
import { useDemoLocale } from "./demo-locale";
import type { Locale } from "@/lib/i18n/locale";

interface Inputs {
  headcount: number;
  hourly: number;
  adoption: number; // percent
  hoursPerWeek: number;
}

const INITIAL: Inputs = {
  headcount: 180,
  hourly: 85,
  adoption: 55,
  hoursPerWeek: 4,
};

const WEEKS_PER_YEAR = 46;
const LICENSE_PER_USER_PER_MONTH = 18;

/**
 * Detects viewport <640px so inputs stack above the output box on mobile.
 * Runs only on the client; SSR-safe default is "desktop".
 */
function useIsNarrow(breakpoint = 640): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = () => setNarrow(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return narrow;
}

/**
 * Animates a number toward `target` over `durationMs` using requestAnimationFrame.
 * Respects prefers-reduced-motion (snaps to target immediately).
 */
function useAnimatedNumber(
  target: number,
  durationMs = 300,
  reduced = false,
): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) {
      setDisplay(target);
      return;
    }
    fromRef.current = display;
    startRef.current = null;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);

    const tick = (ts: number) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const value = fromRef.current + (target - fromRef.current) * eased;
      setDisplay(value);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // display intentionally excluded: starting value is captured via fromRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs, reduced]);

  return display;
}

export default function RoiRechnerDemo() {
  const { locale, text } = useDemoLocale();
  const [v, setV] = useState<Inputs>(INITIAL);
  const [annahmenOpen, setAnnahmenOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const isNarrow = useIsNarrow(640);

  const yearly = useMemo(() => {
    const users = v.headcount * (v.adoption / 100);
    const hours = users * v.hoursPerWeek * WEEKS_PER_YEAR;
    return Math.round(hours * v.hourly);
  }, [v]);

  const licenseCost = useMemo(() => {
    const users = v.headcount * (v.adoption / 100);
    return Math.round(users * LICENSE_PER_USER_PER_MONTH * 12);
  }, [v]);

  const net = yearly - licenseCost;
  const roi = licenseCost > 0 ? Math.round((net / licenseCost) * 100) : 0;

  // Animated display values (count up/down over 300ms).
  const yearlyAnim = useAnimatedNumber(yearly, 300, reducedMotion);
  const licenseAnim = useAnimatedNumber(licenseCost, 300, reducedMotion);
  const netAnim = useAnimatedNumber(net, 300, reducedMotion);
  const roiAnim = useAnimatedNumber(roi, 300, reducedMotion);

  function set<K extends keyof Inputs>(k: K, val: number) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  // For the inline formula display — non-animated, reflects current inputs.
  const adoptionDecimal = (v.adoption / 100)
    .toFixed(2)
    .replace(".", locale === "de" ? "," : ".");
  const numberLocale = locale === "de" ? "de-DE" : "en-GB";

  return (
    <div
      data-demo-id="roi-rechner"
      role="region"
      aria-label={text("Annahmen-Rechner", "Assumptions calculator")}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
        minHeight: DEMO_HEIGHT,
      }}
    >
      {/* Craftsman slider styles — scoped via data-demo-id attribute */}
      <style>{craftsmanSliderCss}</style>

      <div>
        <div
          style={{
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            color: "var(--color-brand-orange)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {text(
            "Annahmen-Rechner · Transparente Formel",
            "Assumptions calculator · explicit formula",
          )}
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            marginTop: 6,
          }}
        >
          {text("Zahlen statt", "Inspect the")}{" "}
          <span style={{ color: "var(--color-brand-orange)" }}>
            {text("Bauchgefühl.", "assumptions.")}
          </span>
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Slider
            label={text("Teamgröße", "Team size")}
            value={v.headcount}
            min={10}
            max={500}
            step={5}
            unit={text("MA", "people")}
            locale={locale}
            onChange={(x) => set("headcount", x)}
          />
          <Slider
            label={text("Stundensatz", "Hourly cost")}
            value={v.hourly}
            min={35}
            max={160}
            step={5}
            unit="€/h"
            locale={locale}
            onChange={(x) => set("hourly", x)}
          />
          <Slider
            label={text("Adoption", "Adoption")}
            value={v.adoption}
            min={10}
            max={90}
            step={5}
            unit="%"
            locale={locale}
            onChange={(x) => set("adoption", x)}
          />
          <Slider
            label={text(
              "Gesparte Std. / Woche / Person",
              "Hours saved / week / person",
            )}
            value={v.hoursPerWeek}
            min={1}
            max={12}
            step={1}
            unit="h"
            locale={locale}
            onChange={(x) => set("hoursPerWeek", x)}
          />
        </div>

        <div
          style={{
            background: DEMO.ink,
            color: DEMO.kalk,
            padding: 20,
            borderTop: `3px solid var(--color-brand-orange)`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              color: "rgba(243,240,233,0.6)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            {text("Szenario-Wert pro Jahr", "Annual scenario value")}
          </div>
          <div
            aria-live="polite"
            style={{
              fontFamily: DEMO.font.mono,
              fontSize: isNarrow ? 40 : 48,
              lineHeight: 1.02,
              fontWeight: 800,
              color: "var(--color-brand-orange)",
              letterSpacing: "-0.045em",
              marginTop: 6,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.round(yearlyAnim).toLocaleString(numberLocale)} €
          </div>
          <div
            style={{
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              color: "rgba(243,240,233,0.45)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            {text("/ Jahr", "/ year")}
          </div>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <Row
              label={text(
                `Lizenzen (€${LICENSE_PER_USER_PER_MONTH}/Person/Monat)`,
                `Licences (€${LICENSE_PER_USER_PER_MONTH}/user/month)`,
              )}
              value={`− ${Math.round(licenseAnim).toLocaleString(numberLocale)} €`}
            />
            <Row
              label={text(
                "Szenario nach Lizenzkosten",
                "Scenario after licence cost",
              )}
              value={`${Math.round(netAnim).toLocaleString(numberLocale)} €`}
              highlight
            />
            <Row
              label={text(
                "Verhältnis Netto/Lizenzkosten",
                "Net-to-licence-cost ratio",
              )}
              value={`${Math.round(roiAnim).toLocaleString(numberLocale)} %`}
              highlight
            />
          </div>

          {/* Transparent inline formula */}
          <div
            style={{
              marginTop: 20,
              paddingTop: 14,
              borderTop: "1px solid rgba(243,240,233,0.14)",
            }}
          >
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                color: "rgba(243,240,233,0.45)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              {text("Rechnung", "Formula")}
            </div>
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                lineHeight: 1.7,
                color: "rgba(243,240,233,0.75)",
                letterSpacing: "0.01em",
                wordBreak: "break-word",
              }}
            >
              <span style={{ color: DEMO.kalk, fontWeight: 700 }}>
                {v.headcount}
              </span>
              <span style={{ color: "rgba(243,240,233,0.4)" }}>
                {" "}
                {text("MA", "people")}{" "}
              </span>
              <span style={{ color: "rgba(243,240,233,0.5)" }}>×</span>
              <span style={{ color: DEMO.kalk, fontWeight: 700 }}>
                {" "}
                {v.hourly} €
              </span>
              <span style={{ color: "rgba(243,240,233,0.4)" }}>/h </span>
              <span style={{ color: "rgba(243,240,233,0.5)" }}>×</span>
              <span style={{ color: DEMO.kalk, fontWeight: 700 }}>
                {" "}
                {v.hoursPerWeek} h
              </span>
              <span style={{ color: "rgba(243,240,233,0.4)" }}>
                {text("/Wo", "/wk")}{" "}
              </span>
              <span style={{ color: "rgba(243,240,233,0.5)" }}>×</span>
              <span style={{ color: DEMO.kalk, fontWeight: 700 }}>
                {" "}
                {adoptionDecimal}
              </span>
              <span style={{ color: "rgba(243,240,233,0.4)" }}>
                {" "}
                {text("Adoption", "adoption")}{" "}
              </span>
              <span style={{ color: "rgba(243,240,233,0.5)" }}>×</span>
              <span style={{ color: DEMO.kalk, fontWeight: 700 }}>
                {" "}
                {WEEKS_PER_YEAR}
              </span>
              <span style={{ color: "rgba(243,240,233,0.4)" }}>
                {" "}
                {text("Wochen", "weeks")}{" "}
              </span>
              <span style={{ color: "rgba(243,240,233,0.5)" }}> = </span>
              <span
                style={{ color: "var(--color-brand-orange)", fontWeight: 700 }}
              >
                {yearly.toLocaleString(numberLocale)} €
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Annahmen — collapsible transparency block */}
      <div
        style={{
          borderTop: `1px solid ${DEMO.stroke.active}`,
          paddingTop: 12,
        }}
      >
        <button
          type="button"
          onClick={() => setAnnahmenOpen((o) => !o)}
          aria-expanded={annahmenOpen}
          aria-controls="roi-annahmen-panel"
          style={{
            all: "unset",
            display: "flex",
            minHeight: 44,
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            cursor: "pointer",
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: DEMO.schiefer,
            padding: "4px 0",
          }}
        >
          <span>{text("Annahmen & Methodik", "Assumptions and method")}</span>
          <span
            aria-hidden
            style={{
              fontFamily: DEMO.font.mono,
              color: "var(--color-brand-orange)",
              fontSize: 14,
              transition: reducedMotion ? "none" : "transform 200ms ease",
              transform: annahmenOpen ? "rotate(45deg)" : "rotate(0deg)",
              display: "inline-block",
              lineHeight: 1,
            }}
          >
            +
          </span>
        </button>

        {annahmenOpen && (
          <ul
            id="roi-annahmen-panel"
            style={{
              margin: "10px 0 0",
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              lineHeight: 1.55,
              color: DEMO.schiefer,
              letterSpacing: "0.01em",
            }}
          >
            <Assumption
              k={text("Adoption", "Adoption")}
              d={text(
                "Beispielband 30–80 %. Unter 30 % → Rollout scheitert. Der Wert muss mit tatsächlicher Nutzung ersetzt werden.",
                "Sample range: 30–80%. Replace it with measured usage.",
              )}
            />
            <Assumption
              k={text("Stundensatz", "Hourly cost")}
              d={text(
                "Vollkosten einschließlich Nebenkosten. Rolle, Land und Branche bestimmen den Wert.",
                "Use the fully loaded employment cost. Role, country, and industry determine the value.",
              )}
            />
            <Assumption
              k={text("Gesparte Stunden", "Hours saved")}
              d={text(
                "Nur gemessene, tatsächlich frei gewordene Zeit ansetzen. Das Beispiel startet mit 4 Stunden.",
                "Use measured time that is actually freed. The example starts at four hours.",
              )}
            />
            <Assumption
              k={text("Arbeitswochen", "Working weeks")}
              d={text(
                `${WEEKS_PER_YEAR} Wochen pro Jahr nach einer pauschalen Abwesenheitsannahme.`,
                `${WEEKS_PER_YEAR} weeks per year after a simplified absence assumption.`,
              )}
            />
            <Assumption
              k={text("Lizenzkosten", "Licence cost")}
              d={text(
                `€${LICENSE_PER_USER_PER_MONTH} pro Person und Monat ist ein Beispielwert. Reale Vertragskosten separat eintragen.`,
                `€${LICENSE_PER_USER_PER_MONTH} per user per month is a sample value. Enter the actual contract cost separately.`,
              )}
            />
            <Assumption
              k={text("Nicht enthalten", "Excluded")}
              d={text(
                "Einrichtung, Prozessänderung, Infrastruktur, Sicherheit und laufende Kontrolle sind nicht enthalten.",
                "Setup, process change, infrastructure, security, and ongoing review are excluded.",
              )}
            />
          </ul>
        )}
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  locale,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  locale: Locale;
  onChange: (value: number) => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span
          style={{
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            color: DEMO.schiefer,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: DEMO.font.mono,
            fontSize: 15,
            fontWeight: 800,
            color: "var(--color-brand-orange)",
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value.toLocaleString(locale === "de" ? "de-DE" : "en-GB")} {unit}
        </span>
      </div>
      <input
        type="range"
        className="roi-craftsman-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        style={
          {
            minHeight: 44,
            ["--roi-fill" as string]: `${((value - min) / (max - min)) * 100}%`,
          } as CSSProperties
        }
      />
    </label>
  );
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "6px 0",
        borderTop: "1px solid rgba(243,240,233,0.12)",
      }}
    >
      <span
        style={{
          fontFamily: DEMO.font.mono,
          fontSize: 12,
          color: "rgba(243,240,233,0.6)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: DEMO.font.mono,
          fontSize: highlight ? 17 : 13,
          fontWeight: 700,
          color: highlight ? "var(--color-brand-orange)" : DEMO.kalk,
          letterSpacing: highlight ? "-0.01em" : undefined,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Assumption({ k, d }: { k: string; d: string }) {
  return (
    <li
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        alignItems: "baseline",
      }}
    >
      <span
        style={{
          color: "var(--color-brand-orange)",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontSize: 12,
          flex: "1 1 128px",
          overflowWrap: "anywhere",
        }}
      >
        {k}
      </span>
      <span
        style={{
          color: DEMO.text.primary,
          flex: "2 1 220px",
          overflowWrap: "anywhere",
        }}
      >
        {d}
      </span>
    </li>
  );
}

/**
 * Craftsman-knob slider styling. Scoped to `.roi-craftsman-slider` so it
 * only affects this demo. Thick track + chunky thumb with visible grooves,
 * touch-target >= 28px, keyboard focus ring, reduced-motion aware.
 */
const craftsmanSliderCss = `
  .roi-craftsman-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 28px;
    background: transparent;
    cursor: pointer;
    touch-action: pan-y;
  }
  .roi-craftsman-slider:focus {
    outline: none;
  }
  .roi-craftsman-slider:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px rgba(249,115,22,0.35), 0 2px 4px rgba(11,9,8,0.25);
  }
  .roi-craftsman-slider:focus-visible::-moz-range-thumb {
    box-shadow: 0 0 0 3px rgba(249,115,22,0.35), 0 2px 4px rgba(11,9,8,0.25);
  }

  /* Track — WebKit */
  .roi-craftsman-slider::-webkit-slider-runnable-track {
    height: 8px;
    background: linear-gradient(
      to right,
      var(--color-brand-orange) 0%,
      var(--color-brand-orange) var(--roi-fill, 50%),
      rgba(11,9,8,0.12) var(--roi-fill, 50%),
      rgba(11,9,8,0.12) 100%
    );
    border: 1px solid rgba(11,9,8,0.18);
    border-radius: 0;
  }
  /* Track — Firefox */
  .roi-craftsman-slider::-moz-range-track {
    height: 8px;
    background: rgba(11,9,8,0.12);
    border: 1px solid rgba(11,9,8,0.18);
    border-radius: 0;
  }
  .roi-craftsman-slider::-moz-range-progress {
    height: 8px;
    background: var(--color-brand-orange);
    border-radius: 0;
  }

  /* Thumb — WebKit (craftsman knob: chunky square with grooves) */
  .roi-craftsman-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    margin-top: -8px;
    background:
      repeating-linear-gradient(
        90deg,
        rgba(11,9,8,0.18) 0 1px,
        transparent 1px 4px
      ),
      var(--color-brand-orange);
    border: 1.5px solid #0B0908;
    border-radius: 2px;
    box-shadow: 0 2px 0 rgba(11,9,8,0.25);
    cursor: grab;
    transition: transform 120ms ease, box-shadow 120ms ease;
  }
  .roi-craftsman-slider::-webkit-slider-thumb:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 0 rgba(11,9,8,0.3);
  }
  .roi-craftsman-slider::-webkit-slider-thumb:active {
    cursor: grabbing;
    transform: translateY(0);
    box-shadow: 0 1px 0 rgba(11,9,8,0.35);
  }

  /* Thumb — Firefox */
  .roi-craftsman-slider::-moz-range-thumb {
    width: 22px;
    height: 22px;
    background:
      repeating-linear-gradient(
        90deg,
        rgba(11,9,8,0.18) 0 1px,
        transparent 1px 4px
      ),
      var(--color-brand-orange);
    border: 1.5px solid #0B0908;
    border-radius: 2px;
    box-shadow: 0 2px 0 rgba(11,9,8,0.25);
    cursor: grab;
    transition: transform 120ms ease, box-shadow 120ms ease;
  }
  .roi-craftsman-slider::-moz-range-thumb:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 0 rgba(11,9,8,0.3);
  }
  .roi-craftsman-slider::-moz-range-thumb:active {
    cursor: grabbing;
    transform: translateY(0);
    box-shadow: 0 1px 0 rgba(11,9,8,0.35);
  }

  @media (prefers-reduced-motion: reduce) {
    .roi-craftsman-slider::-webkit-slider-thumb,
    .roi-craftsman-slider::-moz-range-thumb {
      transition: none;
    }
  }
`;

"use client";

import { useEffect, useState } from "react";
import { DEMO } from "@/lib/demo-tokens";

/** Status colours for text on paper: the DEMO status fills are 1.6-2:1 as text. */
const STATUS_TEXT = { green: "#166534", amber: "#854d0e" } as const;
/** Befund grün: the pass colour, always next to a tick or a word. */
const PASS = "#205b46";
import {
  DEMO_HEIGHT,
  usePrefersReducedMotion,
  useVisibleAutoplay,
} from "./demo-utils";
import { useDemoLocale } from "./demo-locale";

interface Position {
  readonly pos: string;
  readonly t: string;
  readonly menge: number;
  readonly ep: string;
  readonly sum: string;
  readonly conf: number;
}

interface Extracted {
  readonly nr: string;
  readonly company: string;
  readonly cityLine: string;
  readonly file: string;
  readonly datum: string;
  readonly von: string;
  readonly faellig: string;
  readonly ustId: string;
  readonly iban: string;
  readonly netto: string;
  readonly ust: string;
  readonly brutto: string;
  readonly positionen: readonly Position[];
  readonly confidence: number;
  readonly needsReview: boolean;
}

const DATA: Extracted = {
  nr: "RE-2026-04211",
  company: "FIKTIVWERK-BEISPIEL AG",
  cityLine: "00000 Musterstadt (DUMMY)",
  file: "fiktivwerk_re-2026-04211.pdf · 284 KB",
  datum: "14.04.2026",
  von: "FIKTIVWERK-BEISPIEL AG · Musterstadt (rein fiktiv)",
  faellig: "28.04.2026",
  ustId: "DE000000000 (DUMMY)",
  iban: "DE00 0000 0000 0000 0000 00 (DUMMY)",
  netto: "84.300,00 €",
  ust: "16.017,00 €",
  brutto: "100.317,00 €",
  positionen: [
    {
      pos: "01",
      t: "Industrie-Sensoren Typ S-2200",
      menge: 12,
      ep: "4.850,00",
      sum: "58.200,00",
      conf: 0.98,
    },
    {
      pos: "02",
      t: "Installation + Einweisung",
      menge: 1,
      ep: "18.400,00",
      sum: "18.400,00",
      conf: 0.92,
    },
    {
      pos: "03",
      t: "Wartungsvertrag 12M",
      menge: 1,
      ep: "7.700,00",
      sum: "7.700,00",
      conf: 0.97,
    },
  ],
  confidence: 0.97,
  needsReview: false,
};

const DATA_EN: Extracted = {
  ...DATA,
  datum: "14 Apr 2026",
  von: "FIKTIVWERK-BEISPIEL AG · Sample City (entirely fictional)",
  cityLine: "00000 Sample City (DUMMY)",
  faellig: "28 Apr 2026",
  netto: "€84,300.00",
  ust: "€16,017.00",
  brutto: "€100,317.00",
  positionen: [
    {
      pos: "01",
      t: "Industrial sensors, type S-2200",
      menge: 12,
      ep: "4,850.00",
      sum: "58,200.00",
      conf: 0.98,
    },
    {
      pos: "02",
      t: "Installation and briefing",
      menge: 1,
      ep: "18,400.00",
      sum: "18,400.00",
      conf: 0.92,
    },
    {
      pos: "03",
      t: "12-month maintenance agreement",
      menge: 1,
      ep: "7,700.00",
      sum: "7,700.00",
      conf: 0.97,
    },
  ],
};

// A second scenario where OCR confidence is genuinely low on one line (a
// handwritten discount note) — the pipeline runs the same four stages but
// lands on "needs review" instead of a clean export, so the one control that
// picks between DATA and DATA_FLAGGED is an input that changes the outcome,
// not just the numbers on screen.
const DATA_FLAGGED: Extracted = {
  nr: "RE-2026-04298",
  company: "NORDLICHT-MUSTER GMBH",
  cityLine: "00000 Musterhafen (DUMMY)",
  file: "nordlicht_re-2026-04298.pdf · 191 KB",
  datum: "22.04.2026",
  von: "NORDLICHT-MUSTER GMBH · Musterhafen (rein fiktiv)",
  faellig: "06.05.2026",
  ustId: "DE111111111 (DUMMY)",
  iban: "DE11 1111 1111 1111 1111 11 (DUMMY)",
  netto: "12.480,00 €",
  ust: "2.371,20 €",
  brutto: "14.851,20 €",
  positionen: [
    {
      pos: "01",
      t: "Ersatzteil-Kontingent Q2",
      menge: 40,
      ep: "245,00",
      sum: "9.800,00",
      conf: 0.96,
    },
    {
      pos: "02",
      t: "Expressversand",
      menge: 1,
      ep: "680,00",
      sum: "680,00",
      conf: 0.74,
    },
    {
      pos: "03",
      t: "Sonderrabatt (handschriftlich)",
      menge: 1,
      ep: "2.000,00",
      sum: "2.000,00",
      conf: 0.58,
    },
  ],
  confidence: 0.76,
  needsReview: true,
};

const DATA_FLAGGED_EN: Extracted = {
  ...DATA_FLAGGED,
  datum: "22 Apr 2026",
  von: "NORDLICHT-MUSTER GMBH · Sample Harbor (entirely fictional)",
  cityLine: "00000 Sample Harbor (DUMMY)",
  faellig: "6 May 2026",
  netto: "€12,480.00",
  ust: "€2,371.20",
  brutto: "€14,851.20",
  positionen: [
    {
      pos: "01",
      t: "Spare-parts allotment, Q2",
      menge: 40,
      ep: "245.00",
      sum: "9,800.00",
      conf: 0.96,
    },
    {
      pos: "02",
      t: "Express shipping",
      menge: 1,
      ep: "680.00",
      sum: "680.00",
      conf: 0.74,
    },
    {
      pos: "03",
      t: "Special discount (handwritten)",
      menge: 1,
      ep: "2,000.00",
      sum: "2,000.00",
      conf: 0.58,
    },
  ],
};

const STAGES = [
  { s: 1, t: "OCR", d: "Azure Form Recognizer" },
  { s: 2, t: "Struktur-Parsing", d: "Claude Opus 4.5 · tool_use" },
  { s: 3, t: "Validierung", d: "UStG §14 · SKR03" },
  { s: 4, t: "SAP-Export vorbereiten", d: "IDoc INVOIC02 · Entwurf" },
] as const;

const STAGES_EN = [
  { s: 1, t: "OCR", d: "Azure Form Recognizer" },
  { s: 2, t: "Structure parsing", d: "Claude Opus 4.5 · tool use" },
  { s: 3, t: "Validation", d: "Sample tax and account rules" },
  { s: 4, t: "Prepare SAP export", d: "IDoc INVOIC02 · draft" },
] as const;

// Abstract line-block pattern (like preview thumbnail), sized so that readable
// key labels overlay a grayscale document silhouette.
const BLOCK_LINES: ReadonlyArray<{ w: string; dim?: boolean }> = [
  { w: "72%" },
  { w: "58%", dim: true },
  { w: "40%", dim: true },
  { w: "90%" },
  { w: "78%", dim: true },
  { w: "66%", dim: true },
  { w: "84%" },
  { w: "70%", dim: true },
];

export default function RechnungZuSapDemo() {
  const { locale, text } = useDemoLocale();
  const [scenario, setScenario] = useState<"clean" | "flagged">("clean");
  const data =
    locale === "de"
      ? scenario === "clean"
        ? DATA
        : DATA_FLAGGED
      : scenario === "clean"
        ? DATA_EN
        : DATA_FLAGGED_EN;
  const stages = locale === "de" ? STAGES : STAGES_EN;
  const reduced = usePrefersReducedMotion();
  const { ref, visible } = useVisibleAutoplay<HTMLDivElement>();
  // Final state first: the extracted IDoc draft renders on load, and "Neu
  // abspielen" is the only way into a replay.
  const [stage, setStage] = useState<0 | 1 | 2 | 3 | 4>(4);
  const [autoplay, setAutoplay] = useState(false);
  const [replayNonce, setReplayNonce] = useState(0);

  useEffect(() => {
    if (reduced) {
      setStage(4);
      return;
    }
    // Manual step-through (autoplay=false) must survive regardless of
    // visibility — otherwise every autoplay-state change re-fires this
    // effect and the "!visible" branch below silently resets a step the
    // user just took (visible is permanently false in jsdom, and can be
    // false in a real browser too right after a manual click scrolls the
    // demo to the edge of the viewport).
    if (!autoplay) return;
    if (!visible) {
      setStage(0);
      return;
    }
    setStage(0);
    const timers = [
      setTimeout(() => setStage(1), 300),
      setTimeout(() => setStage(2), 1600),
      setTimeout(() => setStage(3), 2700),
      // The run ends at rest: scrolling away afterwards must not rewind
      // the finished extract.
      setTimeout(() => {
        setStage(4);
        setAutoplay(false);
      }, 3600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [visible, reduced, autoplay, replayNonce]);

  const goBack = () => {
    setAutoplay(false);
    setStage((s) => (s > 0 ? ((s - 1) as 0 | 1 | 2 | 3 | 4) : s));
  };
  const goNext = () => {
    setAutoplay(false);
    setStage((s) => (s < 4 ? ((s + 1) as 0 | 1 | 2 | 3 | 4) : s));
  };
  const replay = () => {
    setAutoplay(true);
    setReplayNonce((n) => n + 1);
  };
  // Another document opens on its own final state; replay stays separate.
  const selectScenario = (next: "clean" | "flagged") => {
    setScenario(next);
    setAutoplay(false);
    setStage(4);
  };

  return (
    <div
      ref={ref}
      data-demo-id="rechnung-zu-sap"
      role="region"
      aria-label={text("Rechnung-zu-SAP-Beispiel", "Invoice-to-SAP example")}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: DEMO_HEIGHT,
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
      }}
    >
      {/* The page H1 and lead name the demo; this heading only gives
          screen-reader users a landmark into the instrument. */}
      <h2 className="sr-only">
        {text("Rechnung zum SAP-Importentwurf", "Invoice to SAP import draft")}
      </h2>
      <p className="text-caption text-muted-foreground" style={{ margin: 0, maxWidth: 720 }}>
          {text(
            "Laufzeit und Fehlerquote hängen von Belegqualität, Regeln und Review ab. Hier werden nur feste Beispieldaten verarbeitet.",
            "Runtime and error rate depend on document quality, rules, and review. This interface processes fixed sample data only.",
          )}
        </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            onClick={goBack}
            disabled={stage === 0}
            style={{
              minHeight: 44,
              minWidth: 44,
              padding: "0 12px",
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              fontWeight: 700,
              background: DEMO.kalk,
              color: stage === 0 ? DEMO.leinen : DEMO.ink,
              border: `1px solid ${DEMO.leinen}`,
              cursor: stage === 0 ? "not-allowed" : "pointer",
            }}
          >
            {text("◀ Zurück", "◀ Back")}
          </button>
          <span
            style={{
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              color: DEMO.schiefer,
              whiteSpace: "nowrap",
            }}
          >
            {text(
              `Schritt ${stage} / ${stages.length}`,
              `Step ${stage} / ${stages.length}`,
            )}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={stage === 4}
            style={{
              minHeight: 44,
              minWidth: 44,
              padding: "0 12px",
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              fontWeight: 700,
              background: DEMO.kalk,
              color: stage === 4 ? DEMO.leinen : DEMO.ink,
              border: `1px solid ${DEMO.leinen}`,
              cursor: stage === 4 ? "not-allowed" : "pointer",
            }}
          >
            {text("Weiter ▶", "Next ▶")}
          </button>
          <button
            type="button"
            onClick={replay}
            style={{
              minHeight: 44,
              padding: "0 12px",
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              fontWeight: 700,
              background: DEMO.kalk,
              color: DEMO.ink,
              border: `1px solid ${DEMO.ink}`,
              cursor: "pointer",
            }}
          >
            {text("↻ Neu abspielen", "↻ Replay")}
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          <button
            type="button"
            onClick={() => selectScenario("clean")}
            aria-pressed={scenario === "clean"}
            style={{
              minHeight: 44,
              padding: "0 10px",
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              fontWeight: 700,
              background: scenario === "clean" ? DEMO.ink : DEMO.kalk,
              color: scenario === "clean" ? DEMO.kalk : DEMO.ink,
              border: `1px solid ${scenario === "clean" ? DEMO.ink : DEMO.leinen}`,
              cursor: "pointer",
            }}
          >
            {text("Beleg A · sauber", "Document A · clean")}
          </button>
          <button
            type="button"
            onClick={() => selectScenario("flagged")}
            aria-pressed={scenario === "flagged"}
            style={{
              minHeight: 44,
              padding: "0 10px",
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              fontWeight: 700,
              background: scenario === "flagged" ? DEMO.ink : DEMO.kalk,
              color: scenario === "flagged" ? DEMO.kalk : DEMO.ink,
              border: `1px solid ${scenario === "flagged" ? DEMO.ink : DEMO.leinen}`,
              cursor: "pointer",
            }}
          >
            {text("Beleg B · Abweichung", "Document B · flagged")}
          </button>
        </div>
      </div>

      <div
        className="rechnung-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: 16,
        }}
      >
        {/* Invoice visual — abstract A4-ish document with readable anchor labels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 300,
              aspectRatio: "210/297",
              background: DEMO.kalk,
              border: `1px solid ${
                stage === 4
                  ? data.needsReview
                    ? DEMO.statusAmber
                    : DEMO.statusGreen
                  : DEMO.leinen
              }`,
              padding: "16px 18px",
              overflow: "hidden",
              transition: "border-color 300ms ease",
            }}
          >
            {/* Header — company name readable, subtle meta below */}
            <div
              style={{
                fontFamily: DEMO.font.sans,
                fontSize: 13,
                fontWeight: 700,
                color: DEMO.ink,
                letterSpacing: "-0.01em",
                lineHeight: 1.15,
              }}
            >
              {data.company}
            </div>
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                color: DEMO.schiefer,
                marginTop: 2,
              }}
            >
              {data.cityLine}
            </div>

            <div
              style={{
                ...DEMO.label,
                marginTop: 12,
                color: "var(--color-muted-foreground)",
              }}
            >
              {text("Rechnung", "Invoice")}
            </div>
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                fontWeight: 600,
                color: DEMO.ink,
                marginTop: 2,
              }}
            >
              {data.nr}
            </div>

            {/* Abstract body lines — grayscale bars simulating paragraph content */}
            <div
              style={{
                marginTop: 14,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {BLOCK_LINES.map((line, i) => (
                <div
                  key={i}
                  style={{
                    width: line.w,
                    height: 4,
                    background: line.dim ? DEMO.leinen : "rgba(11,9,8,0.22)",
                  }}
                />
              ))}
            </div>

            {/* BRUTTO stamp — anchor number that ties the invoice to the extract */}
            <div
              style={{
                position: "absolute",
                bottom: 14,
                left: 18,
                right: 18,
                borderTop: `1px solid ${DEMO.leinen}`,
                paddingTop: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                fontFamily: DEMO.font.mono,
              }}
            >
              <span
                style={{
                  ...DEMO.label,
                  color: DEMO.schiefer,
                }}
              >
                {text("Brutto", "Gross")}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: DEMO.ink }}>
                {data.brutto}
              </span>
            </div>

            {/* OCR scanline — only while stages 1-3 active */}
            {stage >= 1 && stage < 4 && visible && !reduced && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  // One pass of an ink scan line per replay; no loop.
                  background:
                    "linear-gradient(180deg, rgba(11,9,8,0) 0%, rgba(11,9,8,0.10) 50%, rgba(11,9,8,0) 100%)",
                  backgroundSize: "100% 40%",
                  backgroundRepeat: "no-repeat",
                  animation: "rechnung-scan 1.2s cubic-bezier(0.16,1,0.3,1) 1 both",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>

          {/* Filename pill */}
          <div
            style={{
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              color: DEMO.schiefer,
              letterSpacing: "0.02em",
            }}
          >
            {data.file}
          </div>

          <style>{`
            @keyframes rechnung-scan {
              0% { background-position: 0 -40%; }
              100% { background-position: 0 140%; }
            }
            @media (min-width: 640px) {
              [data-demo-id="rechnung-zu-sap"] .rechnung-grid {
                grid-template-columns: 260px minmax(0, 1fr) !important;
              }
            }
            @media (max-width: 479px) {
              [data-demo-id="rechnung-zu-sap"] .rechnung-fields-grid {
                grid-template-columns: minmax(0, 1fr) !important;
              }
            }
            @media (prefers-reduced-motion: reduce) {
              [data-demo-id="rechnung-zu-sap"] * {
                animation: none !important;
              }
            }
          `}</style>
        </div>

        {/* Stages + Extracted */}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              marginBottom: 12,
            }}
          >
            {stages.map((st, idx) => {
              const done = stage > st.s;
              const active = stage === st.s;
              const payoff = st.s === 4 && stage >= 4;
              const payoffColor = data.needsReview
                ? DEMO.statusAmber
                : DEMO.statusGreen;
              return (
                <div
                  key={st.s}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 10px",
                    // Flat: state is the border, the number square and a
                    // word, never a pastel wash.
                    background: done || payoff ? DEMO.birke : "transparent",
                    border: `1px solid ${
                      payoff
                        ? payoffColor
                        : active
                          ? "var(--color-brand-orange)"
                          : DEMO.leinen
                    }`,
                    opacity: stage >= st.s ? 1 : 0.55,
                    transition: reduced
                      ? "none"
                      : "background-color 280ms ease, border-color 280ms ease, opacity 280ms ease",
                  }}
                >
                  {/* Connector line below (except last) */}
                  {idx < stages.length - 1 && (
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        left: 19,
                        bottom: -4,
                        width: 2,
                        height: 4,
                        background: done ? PASS : DEMO.leinen,
                      }}
                    />
                  )}
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      background: done
                        ? PASS
                        : active
                          ? "var(--color-brand-orange)"
                          : DEMO.leinen,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: DEMO.font.mono,
                      fontSize: 12,
                      fontWeight: 700,
                      color: done || active ? "#f9f7f2" : DEMO.ink,
                      transition: reduced ? "none" : "background-color 200ms ease",
                    }}
                  >
                    {done ? "✓" : st.s}
                  </div>
                  <span
                    style={{ fontSize: 12, fontWeight: 600, color: DEMO.ink }}
                  >
                    {st.t}
                  </span>
                  <span
                    style={{
                      fontFamily: DEMO.font.mono,
                      fontSize: 12,
                      color: DEMO.schiefer,
                      marginLeft: "auto",
                      textAlign: "right",
                    }}
                  >
                    {active && !done ? (
                      <span style={{ color: DEMO.ink, fontWeight: 700 }}>
                        {text("läuft…", "running…")}
                      </span>
                    ) : (
                      st.d
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {stage >= 4 ? (
            <div
              style={{
                background: DEMO.kalk,
                border: `1px solid ${DEMO.leinen}`,
                borderTop: `2px solid ${DEMO.ink}`,
                padding: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    aria-hidden
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 16,
                      height: 16,
                      background: data.needsReview
                        ? STATUS_TEXT.amber
                        : STATUS_TEXT.green,
                      color: "#f9f7f2",
                      fontFamily: DEMO.font.mono,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {data.needsReview ? "!" : "✓"}
                  </span>
                  <div
                    style={{
                      ...DEMO.label,
                      color: data.needsReview
                        ? STATUS_TEXT.amber
                        : STATUS_TEXT.green,
                    }}
                  >
                    {data.needsReview
                      ? text(
                          "Manuelle Prüfung erforderlich",
                          "Manual review required",
                        )
                      : `IDoc INVOIC02 · ${text("Entwurf", "draft")}`}
                  </div>
                </div>
                <span
                  style={{
                    border: `1px solid ${data.needsReview ? STATUS_TEXT.amber : STATUS_TEXT.green}`,
                    color: data.needsReview
                      ? STATUS_TEXT.amber
                      : STATUS_TEXT.green,
                    padding: "2px 8px",
                    fontFamily: DEMO.font.mono,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {text("Beispiel-Score", "Sample score")}{" "}
                  {Math.round(data.confidence * 100)}%
                </span>
              </div>
              <div
                className="rechnung-fields-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px 12px",
                  fontFamily: DEMO.font.mono,
                  fontSize: 12,
                  marginBottom: 10,
                }}
              >
                {(
                  [
                    [text("Nr.", "No."), data.nr],
                    [text("Datum", "Date"), data.datum],
                    [text("Von", "From"), data.von],
                    [text("Fällig", "Due"), data.faellig],
                    [text("USt-ID", "Tax ID"), data.ustId],
                    ["IBAN", data.iban],
                  ] as const
                ).map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      gap: 8,
                      padding: "3px 0",
                      borderBottom: `1px solid ${DEMO.leinen}`,
                    }}
                  >
                    <span style={{ color: DEMO.schiefer, minWidth: 56 }}>
                      {k}
                    </span>
                    <span
                      style={{
                        minWidth: 0,
                        overflowWrap: "anywhere",
                        fontWeight: 600,
                        color: DEMO.ink,
                      }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
              <div
                data-course-horizontal-scroll
                role="region"
                aria-label={text(
                  "Extrahierte Rechnungspositionen",
                  "Extracted invoice line items",
                )}
                tabIndex={0}
                className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
                style={{
                  width: "100%",
                  minWidth: 0,
                  maxWidth: "100%",
                  overflowX: "auto",
                  overscrollBehaviorX: "contain",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 12,
                    fontFamily: DEMO.font.mono,
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${DEMO.ink}` }}>
                      {[
                        { h: "Pos", align: "left" as const },
                        { h: text("Leistung", "Item"), align: "left" as const },
                        { h: text("Menge", "Qty"), align: "right" as const },
                        { h: text("Summe", "Total"), align: "right" as const },
                        { h: "Conf.", align: "right" as const },
                      ].map(({ h, align }) => (
                        <th
                          key={h}
                          style={{
                            ...DEMO.label,
                            textAlign: align,
                            padding: "6px 4px",
                            color: DEMO.schiefer,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.positionen.map((p) => {
                      const low = p.conf < 0.95;
                      return (
                        <tr
                          key={p.pos}
                          style={{
                            // A low-confidence row is marked by a dashed
                            // underline (an open gap), not an amber wash.
                            background: "transparent",
                            borderBottom: low
                              ? `1px dashed ${DEMO.ink}`
                              : `1px solid ${DEMO.leinen}`,
                          }}
                        >
                          <td
                            style={{ padding: "6px 4px", color: DEMO.schiefer }}
                          >
                            {p.pos}
                          </td>
                          <td style={{ padding: "6px 4px", color: DEMO.ink }}>
                            {p.t}
                          </td>
                          <td
                            style={{
                              padding: "6px 4px",
                              textAlign: "right",
                              color: DEMO.ink,
                            }}
                          >
                            {p.menge}
                          </td>
                          <td
                            style={{
                              padding: "6px 4px",
                              textAlign: "right",
                              fontWeight: 700,
                              color: DEMO.ink,
                            }}
                          >
                            {p.sum}
                          </td>
                          <td
                            style={{
                              padding: "6px 4px",
                              textAlign: "right",
                              fontWeight: 700,
                              color: low ? STATUS_TEXT.amber : STATUS_TEXT.green,
                            }}
                          >
                            {Math.round(p.conf * 100)}%
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ borderTop: `2px solid ${DEMO.ink}` }}>
                      <td
                        colSpan={3}
                        style={{
                          ...DEMO.label,
                          padding: "8px 4px",
                          textAlign: "right",
                          color: "var(--color-muted-foreground)",
                        }}
                      >
                        {text("Brutto", "Gross")}
                      </td>
                      <td
                        style={{
                          padding: "8px 4px",
                          textAlign: "right",
                          fontWeight: 700,
                          color: DEMO.ink,
                          fontSize: 12,
                        }}
                      >
                        {data.brutto}
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: DEMO.birke,
                border: `1px dashed ${DEMO.leinen}`,
                padding: "24px 16px",
                textAlign: "center",
                color: DEMO.schiefer,
                fontSize: 12,
                fontFamily: DEMO.font.sans,
              }}
            >
              <div
                style={{
                  ...DEMO.label,
                  color: "var(--color-muted-foreground)",
                  marginBottom: 4,
                }}
              >
                {text("Pipeline läuft", "Pipeline running")}
              </div>
              {text(
                "Extrahierte Felder erscheinen nach UStG-Validierung.",
                "Extracted fields appear after the rule checks.",
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

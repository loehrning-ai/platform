"use client";

import { useEffect, useState } from "react";
import { DEMO } from "@/lib/demo-tokens";
import { DEMO_HEIGHT, usePrefersReducedMotion, useVisibleAutoplay } from "./demo-utils";

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
}

const DATA: Extracted = {
  nr: "RE-2026-04211",
  datum: "14.04.2026",
  von: "FIKTIVWERK-BEISPIEL AG · Musterstadt (rein fiktiv)",
  faellig: "28.04.2026",
  ustId: "DE000000000 (DUMMY)",
  iban: "DE00 0000 0000 0000 0000 00 (DUMMY)",
  netto: "84.300,00 €",
  ust: "16.017,00 €",
  brutto: "100.317,00 €",
  positionen: [
    { pos: "01", t: "Industrie-Sensoren Typ S-2200", menge: 12, ep: "4.850,00", sum: "58.200,00", conf: 0.98 },
    { pos: "02", t: "Installation + Einweisung", menge: 1, ep: "18.400,00", sum: "18.400,00", conf: 0.92 },
    { pos: "03", t: "Wartungsvertrag 12M", menge: 1, ep: "7.700,00", sum: "7.700,00", conf: 0.97 },
  ],
  confidence: 0.97,
};

const STAGES = [
  { s: 1, t: "OCR", d: "Azure Form Recognizer" },
  { s: 2, t: "Struktur-Parsing", d: "Claude Opus 4.5 · tool_use" },
  { s: 3, t: "Validierung", d: "UStG §14 · SKR03" },
  { s: 4, t: "SAP-Export vorbereiten", d: "IDoc INVOIC02 · Entwurf" },
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
  const reduced = usePrefersReducedMotion();
  const { ref, visible } = useVisibleAutoplay<HTMLDivElement>();
  const [stage, setStage] = useState<0 | 1 | 2 | 3 | 4>(0);

  // Extracted so the effect dependency array references a stable variable
  // rather than an inline expression (react-hooks/exhaustive-deps).
  const isIdle = stage === 0;

  useEffect(() => {
    if (reduced) {
      setStage(4);
      return;
    }
    if (!visible) return;
    const timers = [
      setTimeout(() => setStage(1), 300),
      setTimeout(() => setStage(2), 1600),
      setTimeout(() => setStage(3), 2700),
      setTimeout(() => setStage(4), 3600),
      setTimeout(() => setStage(0), 8500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [visible, reduced, isIdle]);

  return (
    <div
      ref={ref}
      data-demo-id="rechnung-zu-sap"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: DEMO_HEIGHT,
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: DEMO.font.mono,
            fontSize: 10,
            color: "var(--color-brand-orange)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          Rechnungs-Automatisierung
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 6 }}>
          Vom Scan zum <span style={{ color: "var(--color-brand-orange)" }}>SAP-Importentwurf</span>.
        </h2>
        <p style={{ fontSize: 12, color: DEMO.schiefer, marginTop: 4 }}>
          Beispiel-Laufzeit und Fehlerquote hängen von Belegqualität, Regeln und Review ab.
        </p>
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
              border: `1px solid ${stage === 4 ? DEMO.statusGreen : DEMO.leinen}`,
              boxShadow: "0 1px 0 rgba(11,9,8,0.04)",
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
              FIKTIVWERK-BEISPIEL AG
            </div>
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 9,
                color: DEMO.schiefer,
                marginTop: 2,
              }}
            >
              00000 Musterstadt (DUMMY)
            </div>

            <div
              style={{
                marginTop: 12,
                fontFamily: DEMO.font.mono,
                fontSize: 10,
                color: "var(--color-brand-orange)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Rechnung
            </div>
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 11,
                fontWeight: 600,
                color: DEMO.ink,
                marginTop: 2,
              }}
            >
              RE-2026-04211
            </div>

            {/* Abstract body lines — grayscale bars simulating paragraph content */}
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
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
              <span style={{ fontSize: 9, color: DEMO.schiefer, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Brutto
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: DEMO.ink }}>100.317,00 €</span>
            </div>

            {/* OCR scanline — only while stages 1-3 active */}
            {stage >= 1 && stage < 4 && !reduced && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(249,115,22,0) 0%, rgba(249,115,22,0.18) 50%, rgba(249,115,22,0) 100%)",
                  backgroundSize: "100% 40%",
                  backgroundRepeat: "no-repeat",
                  animation: "rechnung-scan 1.6s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
            )}
            {stage >= 1 && stage < 4 && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(249,115,22,0.06)",
                  pointerEvents: "none",
                }}
              />
            )}
            {stage === 4 && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(34,197,94,0.08)",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>

          {/* Filename pill */}
          <div
            style={{
              fontFamily: DEMO.font.mono,
              fontSize: 9,
              color: DEMO.schiefer,
              letterSpacing: "0.02em",
            }}
          >
            siemens_re-2026-04211.pdf · 284 KB
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
            @media (prefers-reduced-motion: reduce) {
              [data-demo-id="rechnung-zu-sap"] * {
                animation: none !important;
              }
            }
          `}</style>
        </div>

        {/* Stages + Extracted */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
            {STAGES.map((st, idx) => {
              const done = stage > st.s;
              const active = stage === st.s;
              const payoff = st.s === 4 && stage >= 4;
              return (
                <div
                  key={st.s}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 10px",
                    background: payoff
                      ? "rgba(34,197,94,0.08)"
                      : active
                        ? "rgba(249,115,22,0.08)"
                        : done
                          ? DEMO.birke
                          : "transparent",
                    border: `1px solid ${
                      payoff
                        ? DEMO.statusGreen
                        : active
                          ? "var(--color-brand-orange)"
                          : DEMO.leinen
                    }`,
                    opacity: stage >= st.s ? 1 : 0.55,
                    transition: "all 280ms ease",
                  }}
                >
                  {/* Connector line below (except last) */}
                  {idx < STAGES.length - 1 && (
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        left: 19,
                        bottom: -4,
                        width: 2,
                        height: 4,
                        background: done ? DEMO.statusGreen : DEMO.leinen,
                      }}
                    />
                  )}
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      background: done
                        ? DEMO.statusGreen
                        : active
                          ? "var(--color-brand-orange)"
                          : DEMO.leinen,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: DEMO.font.mono,
                      fontSize: 10,
                      fontWeight: 700,
                      color: DEMO.kalk,
                      boxShadow: active && !reduced ? "0 0 0 3px rgba(249,115,22,0.18)" : "none",
                      transition: "background 280ms ease, box-shadow 280ms ease",
                    }}
                  >
                    {done ? "✓" : st.s}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: DEMO.ink }}>{st.t}</span>
                  <span
                    style={{
                      fontFamily: DEMO.font.mono,
                      fontSize: 9,
                      color: DEMO.schiefer,
                      marginLeft: "auto",
                      textAlign: "right",
                    }}
                  >
                    {active && !done ? (
                      <span style={{ color: "var(--color-brand-orange)", fontWeight: 700 }}>
                        läuft…
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
                borderTop: `3px solid ${DEMO.statusGreen}`,
                borderRight: `1px solid ${DEMO.leinen}`,
                borderBottom: `1px solid ${DEMO.leinen}`,
                borderLeft: `1px solid ${DEMO.leinen}`,
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
                      background: DEMO.statusGreen,
                      color: DEMO.kalk,
                      fontFamily: DEMO.font.mono,
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </span>
                  <div
                    style={{
                      fontFamily: DEMO.font.mono,
                      fontSize: 10,
                      color: DEMO.statusGreen,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    IDoc INVOIC02 · Entwurf
                  </div>
                </div>
                <span
                  style={{
                    background: "rgba(34,197,94,0.12)",
                    color: DEMO.statusGreen,
                    padding: "2px 8px",
                    fontFamily: DEMO.font.mono,
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  Beispiel-Score {Math.round(DATA.confidence * 100)}%
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px 12px",
                  fontFamily: DEMO.font.mono,
                  fontSize: 10,
                  marginBottom: 10,
                }}
              >
                {(
                  [
                    ["Nr", DATA.nr],
                    ["Datum", DATA.datum],
                    ["Von", DATA.von],
                    ["Fällig", DATA.faellig],
                    ["USt-ID", DATA.ustId],
                    ["IBAN", DATA.iban],
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
                    <span style={{ color: DEMO.schiefer, minWidth: 56 }}>{k}</span>
                    <span style={{ fontWeight: 600, color: DEMO.ink }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 10,
                    fontFamily: DEMO.font.mono,
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${DEMO.ink}` }}>
                      {[
                        { h: "Pos", align: "left" as const },
                        { h: "Leistung", align: "left" as const },
                        { h: "Menge", align: "right" as const },
                        { h: "Summe", align: "right" as const },
                        { h: "Conf.", align: "right" as const },
                      ].map(({ h, align }) => (
                        <th
                          key={h}
                          style={{
                            textAlign: align,
                            padding: "6px 4px",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            fontSize: 8,
                            color: DEMO.schiefer,
                            fontWeight: 600,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DATA.positionen.map((p) => {
                      const low = p.conf < 0.95;
                      return (
                        <tr
                          key={p.pos}
                          style={{
                            borderBottom: `1px solid ${DEMO.leinen}`,
                            background: low ? "rgba(234,179,8,0.08)" : "transparent",
                          }}
                        >
                          <td style={{ padding: "6px 4px", color: DEMO.schiefer }}>{p.pos}</td>
                          <td style={{ padding: "6px 4px", color: DEMO.ink }}>{p.t}</td>
                          <td style={{ padding: "6px 4px", textAlign: "right", color: DEMO.ink }}>
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
                              color: low ? DEMO.statusAmber : DEMO.statusGreen,
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
                          padding: "8px 4px",
                          textAlign: "right",
                          fontWeight: 700,
                          color: "var(--color-brand-orange)",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          fontSize: 9,
                        }}
                      >
                        Brutto
                      </td>
                      <td
                        style={{
                          padding: "8px 4px",
                          textAlign: "right",
                          fontWeight: 700,
                          color: "var(--color-brand-orange)",
                          fontSize: 11,
                        }}
                      >
                        {DATA.brutto}
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
                  fontFamily: DEMO.font.mono,
                  fontSize: 9,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--color-brand-orange)",
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                Pipeline läuft
              </div>
              Extrahierte Felder erscheinen nach UStG-Validierung.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

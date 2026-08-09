"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { m, AnimatePresence } from "framer-motion";
import { DemoOverline } from "./_shared";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";

/**
 * DocDemo — Invoice extraction pipeline with rAF-driven scan-line animation.
 *
 * Four stages: OCR sweep → Struktur-Parsing (staggered field highlights)
 * → Validierung (check marks appear) → Export (confirmation flash + data panel).
 *
 * Provenance: first-party loehrning.ai implementation by Tim Löhr.
 * Ported 2026-04-21 with explicit cleanup of rAF + timeouts on unmount.
 * See AI-native demo gallery implementation.
 */

type Stage = 0 | 1 | 2 | 3 | 4;

interface Field {
  readonly id: string;
  readonly top: number;
  readonly height: number;
  readonly label: string;
}

const FIELDS: readonly Field[] = [
  { id: "nr", top: 29, height: 6, label: "Rechn.-Nr" },
  { id: "datum", top: 35, height: 6, label: "Datum" },
  { id: "pos", top: 44, height: 15, label: "Positionen" },
  { id: "ust", top: 75, height: 6, label: "USt 19%" },
  { id: "brutto", top: 81, height: 7, label: "Brutto" },
];

const STAGE_META: readonly {
  readonly stage: 1 | 2 | 3 | 4;
  readonly title: string;
  readonly detail: string;
}[] = [
  { stage: 1, title: "OCR", detail: "Azure Form Recognizer" },
  { stage: 2, title: "Struktur-Parsing", detail: "Schema-Extraktion · simuliert" },
  { stage: 3, title: "Validierung", detail: "UStG §14 · SKR03" },
  { stage: 4, title: "Export-Entwurf", detail: "Beispieldatensatz" },
];

interface ExtractedData {
  readonly nr: string;
  readonly von: string;
  readonly datum: string;
  readonly faellig: string;
  readonly netto: string;
  readonly ust: string;
  readonly brutto: string;
  readonly iban: string;
  readonly ustId: string;
  readonly confidence: number;
  readonly positionen: readonly {
    readonly pos: string;
    readonly text: string;
    readonly menge: number;
    readonly ep: string;
    readonly sum: string;
  }[];
}

const SAMPLE_DATA: ExtractedData = {
  nr: "RE-2026-04211",
  von: "FIKTIVWERK-BEISPIEL AG · Musterstadt (rein fiktiv)",
  datum: "14.04.2026",
  faellig: "28.04.2026",
  netto: "84.300,00 €",
  ust: "16.017,00 €",
  brutto: "100.317,00 €",
  iban: "DE00 0000 0000 0000 0000 00 (DUMMY)",
  ustId: "DE000000000 (DUMMY)",
  confidence: 0.97,
  positionen: [
    {
      pos: "01",
      text: "Industrie-Sensoren Typ S-2200",
      menge: 12,
      ep: "4.850,00",
      sum: "58.200,00",
    },
    {
      pos: "02",
      text: "Installation + Einweisung",
      menge: 1,
      ep: "18.400,00",
      sum: "18.400,00",
    },
    {
      pos: "03",
      text: "Wartungsvertrag 12M",
      menge: 1,
      ep: "7.700,00",
      sum: "7.700,00",
    },
  ],
};

export function DocDemo(): JSX.Element {
  const [stage, setStage] = useState<Stage>(0);
  const [scanY, setScanY] = useState(0);
  const [fieldsHit, setFieldsHit] = useState(0);
  const [fieldsOk, setFieldsOk] = useState(0);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef<number | null>(null);

  const clearAll = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  useEffect(() => () => clearAll(), []);

  function run() {
    clearAll();
    setExtracted(null);
    setStage(1);
    setScanY(0);
    setFieldsHit(0);
    setFieldsOk(0);

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scale = reducedMotion ? 0.1 : 1;

    if (reducedMotion) {
      setScanY(1);
    } else {
      const sweepDurMs = 1300;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / sweepDurMs);
        setScanY(p);
        if (p < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }

    const later = (fn: () => void, delayMs: number) => {
      timeouts.current.push(setTimeout(fn, delayMs * scale));
    };

    later(() => setStage(2), 1500);
    for (let i = 0; i < 5; i++) {
      later(() => setFieldsHit(i + 1), 1550 + i * 150);
    }
    later(() => setStage(3), 2500);
    for (let i = 0; i < 5; i++) {
      later(() => setFieldsOk(i + 1), 2550 + i * 130);
    }
    later(() => setStage(4), 3400);
    later(() => setExtracted(SAMPLE_DATA), 3700);
  }

  const running = stage > 0 && stage < 4;

  return (
    <div
      className="flex flex-col gap-4 overflow-hidden"
      role="region"
      aria-label="Praxisbeispiel: Rechnungserkennung"
    >
      <div>
        <DemoOverline>Rechnungs-Automatisierung</DemoOverline>
        <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-foreground md:text-[26px]">
          Vom Scan zum{" "}
          <span className="text-brand-orange">Buchungsentwurf</span>.
        </h3>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          Simulierter Ablauf: Extraktion, Plausibilitätscheck und
          Exportvorschlag.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr] md:gap-5">
        {/* Doc panel */}
        <div>
          <div
            className="relative aspect-[210/297] overflow-hidden border border-border bg-card/60 p-3"
            aria-label="Rechnungs-Preview"
          >
            <div className="relative z-[1] font-mono text-[8px] leading-[1.3] text-foreground">
              FIKTIVWERK-BEISPIEL AG
              <br />
              Beispielweg 0 (DUMMY)
              <br />
              00000 Musterstadt
              <br />
              ─────────────
              <br />
              <br />
              <strong>RECHNUNG</strong>
              <br />
              Nr. RE-2026-04211
              <br />
              Datum: 14.04.2026
              <br />
              <br />
              Pos 01 · Sensoren S-2200
              <br />
              12 × 4.850,00 = 58.200,00
              <br />
              Pos 02 · Installation
              <br />
              1 × 18.400,00
              <br />
              Pos 03 · Wartung 12M
              <br />
              1 × 7.700,00
              <br />
              <br />
              Netto 84.300,00
              <br />
              USt 19% 16.017,00
              <br />
              BRUTTO 100.317,00 €
            </div>

            {/* OCR scan tint — fades during parse stages */}
            {stage >= 1 && (
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-x-0 top-0 z-[2] bg-gradient-to-b from-brand-orange/5 to-brand-orange/10",
                  stage > 1 && "opacity-0 transition-opacity duration-400",
                )}
                style={{ height: stage === 1 ? `${scanY * 100}%` : "100%" }}
              />
            )}

            {/* Scan line */}
            {stage === 1 && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-0.5 z-[4] h-0.5 bg-brand-orange"
                style={{
                  top: `${scanY * 100}%`,
                  boxShadow:
                    "0 0 14px 2px var(--color-brand-orange), 0 -8px 16px -4px var(--color-brand-orange)",
                }}
              />
            )}

            {/* Field highlights */}
            {stage >= 2 &&
              FIELDS.map((f, i) => {
                const revealed = fieldsHit > i;
                const validated = fieldsOk > i;
                if (!revealed) return null;
                return (
                  <m.div
                    key={f.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute z-[3] border",
                      validated
                        ? "border-risk-green bg-risk-green/10"
                        : "border-brand-orange bg-brand-orange/12",
                    )}
                    style={{
                      left: 6,
                      right: 6,
                      top: `${f.top}%`,
                      height: `${f.height}%`,
                    }}
                  >
                    {validated && (
                      <m.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 15,
                        }}
                        className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center bg-risk-green font-mono text-[9px] font-bold text-white"
                      >
                        ✓
                      </m.div>
                    )}
                  </m.div>
                );
              })}

            {/* Export confirm flash */}
            {stage === 4 && (
              <m.div
                aria-hidden="true"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0.3 }}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                className="pointer-events-none absolute inset-0 z-[5] border-2 border-risk-green bg-risk-green/6"
              />
            )}
          </div>
          <button
            type="button"
            onClick={run}
            disabled={running}
            className={cn(
              "mt-3 w-full border-2 border-foreground px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-[background-color,border-color,color,opacity,transform,box-shadow]",
              running
                ? "cursor-wait bg-muted-foreground opacity-75"
                : stage === 4
                  ? "bg-risk-green shadow-[4px_4px_0_0_var(--color-foreground)]"
                  : "bg-foreground shadow-[4px_4px_0_0_var(--color-foreground)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-foreground)]",
            )}
          >
            {stage === 0
              ? "▶ Extrahieren"
              : stage === 4
                ? "✓ Fertig · Neu starten"
                : "Verarbeitet…"}
          </button>
        </div>

        {/* Stages + data */}
        <div>
          <div className="mb-3.5 flex flex-col gap-1.5">
            {STAGE_META.map((st) => {
              const active = stage === st.stage;
              const done = stage > st.stage;
              const inactive = stage < st.stage;
              return (
                <div
                  key={st.stage}
                  className={cn(
                    "flex items-center gap-3 border px-3 py-2 transition-[background-color,border-color,color,opacity,transform,box-shadow]",
                    active
                      ? "border-brand-orange bg-card/60"
                      : inactive
                        ? "border-border opacity-40"
                        : "border-border bg-card/60",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center font-mono text-[10px] font-bold text-white",
                      done
                        ? "bg-risk-green"
                        : active
                          ? "animate-pulse bg-brand-orange"
                          : "bg-border text-muted-foreground",
                    )}
                    aria-hidden="true"
                  >
                    {done ? "✓" : st.stage}
                  </div>
                  <span className="text-[13px] font-semibold text-foreground">
                    {st.title}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    {st.detail}
                  </span>
                </div>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {extracted ? (
              <m.div
                key="data"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                className="border border-border border-t-[3px] border-t-brand-orange bg-background p-3.5"
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <DemoOverline>Extrahierte Daten</DemoOverline>
                  <span className="inline-flex items-center gap-1 border border-risk-green/40 bg-risk-green/10 px-2 py-0.5 font-mono text-[10px] text-risk-green">
                    <span className="h-1.5 w-1.5 rounded-full bg-risk-green" />
                    Simulationswert {Math.round(extracted.confidence * 100)} % ·
                    nicht kalibriert
                  </span>
                </div>
                <div className="mb-2.5 grid grid-cols-1 gap-x-3 gap-y-1 font-mono text-[11px] md:grid-cols-2">
                  {[
                    ["Nr", extracted.nr],
                    ["Datum", extracted.datum],
                    ["Von", extracted.von],
                    ["Fällig", extracted.faellig],
                    ["USt-ID", extracted.ustId],
                    ["IBAN", extracted.iban],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex gap-2 border-b border-border py-0.5"
                    >
                      <span className="min-w-[56px] text-muted-foreground">
                        {k}
                      </span>
                      <span className="font-semibold text-foreground">{v}</span>
                    </div>
                  ))}
                </div>
                <table className="w-full border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-foreground">
                      {["Pos", "Leistung", "Menge", "EP", "Summe"].map(
                        (h, i) => (
                          <th
                            key={h}
                            className={cn(
                              "px-1 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground",
                              i === 1 ? "text-left" : "text-right",
                            )}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {extracted.positionen.map((p) => (
                      <tr key={p.pos} className="border-b border-border">
                        <td className="px-1 py-1.5">{p.pos}</td>
                        <td className="px-1 py-1.5">{p.text}</td>
                        <td className="px-1 py-1.5 text-right">{p.menge}</td>
                        <td className="px-1 py-1.5 text-right">{p.ep}</td>
                        <td className="px-1 py-1.5 text-right font-bold">
                          {p.sum}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-foreground">
                      <td
                        colSpan={4}
                        className="px-1 py-2 text-right font-bold text-brand-orange"
                      >
                        BRUTTO
                      </td>
                      <td className="px-1 py-2 text-right font-bold text-brand-orange">
                        {extracted.brutto}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </m.div>
            ) : (
              <m.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border border-dashed border-border bg-card/40 p-10 text-center text-[13px] text-muted-foreground"
              >
                Klick „Extrahieren" um die Verarbeitung zu starten.
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default DocDemo;

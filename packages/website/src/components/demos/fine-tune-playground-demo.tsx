"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { DEMO } from "@/lib/demo-tokens";
import { DEMO_HEIGHT } from "./demo-utils";
import { useDemoLocale } from "./demo-locale";

interface Prompt {
  readonly q: string;
  readonly base: string;
  readonly tuned: string;
  readonly baseSpec: number;
  readonly tunedSpec: number;
  readonly baseConf: number;
  readonly tunedConf: number;
}

const FT_PROMPTS: readonly Prompt[] = [
  {
    q: "Wie lange ist die Standardgarantie auf Motor XR-2200?",
    base: "Die Garantie für einen Motor hängt vom Hersteller ab. In der Regel liegt sie zwischen 12 und 36 Monaten. Für spezifische Informationen kontaktieren Sie bitte den Hersteller.",
    tuned:
      "Auf den Motor XR-2200 gewähren wir 36 Monate Garantie ab Inbetriebnahme, gemäß AGB §14.2. Verschleißteile (Lager, Dichtungen) sind ausgenommen. Verlängerung auf 60 Monate über Wartungsvertrag WV-Premium möglich.",
    baseSpec: 22,
    tunedSpec: 94,
    baseConf: 41,
    tunedConf: 88,
  },
  {
    q: "Welche Werkstoffe sind für Offshore-Anwendungen freigegeben?",
    base: "Für Offshore-Anwendungen werden üblicherweise korrosionsbeständige Materialien wie Edelstahl 316L oder Duplex-Stähle verwendet. Die genaue Wahl hängt von der Anwendung ab.",
    tuned:
      "Freigegeben sind 1.4462 (Duplex), 1.4529 (Super-Austenit) und Hastelloy C-276. Für Zone 3 ab Nordsee (H2S-haltig) zwingend Duplex plus Schutzanstrich System SP-3B. Dokumentiert in internem Standard WST-OFF-01.",
    baseSpec: 18,
    tunedSpec: 96,
    baseConf: 37,
    tunedConf: 91,
  },
  {
    q: "Wie bepreisen wir Express-Aufträge?",
    base: "Express-Aufträge haben in der Regel einen Zuschlag. Die genaue Höhe variiert je nach Unternehmen und Dringlichkeit.",
    tuned:
      "Express <72h: Priorität hoch. Express <24h: Priorität kritisch. Wochenend-Rush: zusätzliche Freigabe nötig. Materialkosten separat prüfen. Ausnahme Rahmenvertrag-Stufe A laut interner Freigabematrix.",
    baseSpec: 14,
    tunedSpec: 92,
    baseConf: 33,
    tunedConf: 89,
  },
];

const FT_PROMPTS_EN: readonly Prompt[] = [
  {
    q: "What is the standard warranty for the XR-2200 motor?",
    base: "Motor warranties depend on the manufacturer and commonly range from 12 to 36 months. Contact the manufacturer for the applicable terms.",
    tuned:
      "The fictional XR-2200 policy states 36 months from commissioning under sample clause 14.2. Bearings and seals are excluded. A sample maintenance plan extends coverage to 60 months.",
    baseSpec: 22,
    tunedSpec: 94,
    baseConf: 41,
    tunedConf: 88,
  },
  {
    q: "Which materials are approved for offshore applications?",
    base: "Offshore applications commonly use corrosion-resistant materials such as 316L stainless steel or duplex steel. Selection depends on the environment.",
    tuned:
      "The fictional standard WST-OFF-01 lists 1.4462, 1.4529, and Hastelloy C-276. The seeded Zone 3 example requires duplex steel plus coating system SP-3B.",
    baseSpec: 18,
    tunedSpec: 96,
    baseConf: 37,
    tunedConf: 91,
  },
  {
    q: "How do we price express orders?",
    base: "Express orders commonly carry a surcharge. The amount depends on urgency and company policy.",
    tuned:
      "The fictional policy marks delivery under 72 hours as high priority and under 24 hours as critical. Weekend work requires approval; material cost is checked separately.",
    baseSpec: 14,
    tunedSpec: 92,
    baseConf: 33,
    tunedConf: 89,
  },
];

const EPOCH_MAX = 10;

function confLabel(pct: number): "niedrig" | "mittel" | "hoch" {
  if (pct < 45) return "niedrig";
  if (pct < 75) return "mittel";
  return "hoch";
}

const CONF_LABEL_CONFIG = {
  niedrig: { label: "Niedrig", color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
  mittel: { label: "Mittel", color: "#d97706", bg: "rgba(217,119,6,0.1)" },
  hoch: { label: "Hoch", color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
} as const;

function ConfChip({ pct, accentColor }: { pct: number; accentColor?: string }) {
  const { locale, text } = useDemoLocale();
  const level = confLabel(pct);
  const cfg = CONF_LABEL_CONFIG[level];
  return (
    <span
      title={text(
        "Konfidenz zeigt hier nur, wie stark ein fiktives Modell Wörter aus dem Trainingssatz wiedererkennt. Das ist kein standardisiertes Maß.",
        "Confidence only represents how strongly a fictional model recognizes vocabulary from the sample training set. It is not a standardized metric.",
      )}
      style={{
        padding: "2px 7px",
        fontSize: 12,
        fontFamily: "var(--font-geist-mono, ui-monospace, monospace)",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: accentColor ?? cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}30`,
        cursor: "help",
      }}
    >
      {locale === "de"
        ? cfg.label
        : ({ niedrig: "Low", mittel: "Medium", hoch: "High" } as const)[level]}
    </span>
  );
}

export default function FineTunePlaygroundDemo() {
  const { locale, text } = useDemoLocale();
  const prompts = locale === "de" ? FT_PROMPTS : FT_PROMPTS_EN;
  const [selIdx, setSelIdx] = useState(0);
  const [epoch, setEpoch] = useState(6);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const prompt = prompts[selIdx] ?? prompts[0];
  const accuracyDelta = prompt.tunedSpec - prompt.baseSpec;

  const metrics = useMemo(() => {
    const e = epoch;
    // Loss decays logarithmically: 2.8 at e=0 down to ~0.35 at e=10
    const loss = Math.max(0.32, 2.8 - Math.log(1 + e * 0.85) * 1.02);
    const acc = Math.min(97, 42 + e * 5.6 + Math.sin(e * 0.7) * 1.5);
    const specificity = Math.min(96, 18 + e * 8);
    return {
      loss: loss.toFixed(3),
      acc: acc.toFixed(1),
      specificity: specificity.toFixed(0),
    };
  }, [epoch]);

  // Generate loss curve points for SVG
  const curvePoints = useMemo(() => {
    const points: { x: number; y: number; loss: number }[] = [];
    for (let e = 0; e <= EPOCH_MAX; e++) {
      const loss = Math.max(0.32, 2.8 - Math.log(1 + e * 0.85) * 1.02);
      const x = (e / EPOCH_MAX) * 280;
      // Map loss [0.32..2.8] to y [54..4] (inverted)
      const y = 54 - ((2.8 - loss) / (2.8 - 0.32)) * 50;
      points.push({ x, y, loss });
    }
    return points;
  }, []);

  const accPoints = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    for (let e = 0; e <= EPOCH_MAX; e++) {
      const acc = Math.min(97, 42 + e * 5.6 + Math.sin(e * 0.7) * 1.5);
      const x = (e / EPOCH_MAX) * 280;
      // Map acc [42..97] to y [54..4]
      const y = 54 - ((acc - 42) / (97 - 42)) * 50;
      points.push({ x, y });
    }
    return points;
  }, []);

  const lossPath = curvePoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  const accPath = accPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  const currentX = (epoch / EPOCH_MAX) * 280;
  const currentLossY = curvePoints[epoch]?.y ?? 30;
  const currentAccY = accPoints[epoch]?.y ?? 30;

  const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = (i + 1) % prompts.length;
      setSelIdx(next);
      tabRefs.current[next]?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (i - 1 + prompts.length) % prompts.length;
      setSelIdx(prev);
      tabRefs.current[prev]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      setSelIdx(0);
      tabRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      const last = prompts.length - 1;
      setSelIdx(last);
      tabRefs.current[last]?.focus();
    }
  };

  return (
    <div
      data-demo-id="fine-tune-playground"
      role="region"
      aria-label={text("Fine-Tuning-Beispiel", "Fine-tuning example")}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: DEMO_HEIGHT,
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
      }}
    >
      <style>{`
        @media (max-width: 767px) {
          [data-demo-id="fine-tune-playground"] [data-ft-compare] {
            grid-template-columns: 1fr !important;
          }
          [data-demo-id="fine-tune-playground"] [data-ft-tabs] {
            flex-direction: column !important;
          }
          [data-demo-id="fine-tune-playground"] [data-ft-tabs] button {
            min-width: 0 !important;
            width: 100% !important;
          }
        }
        [data-demo-id="fine-tune-playground"] [data-ft-slider]::-webkit-slider-runnable-track {
          height: 4px;
          background: linear-gradient(
            to right,
            var(--color-brand-orange) 0%,
            var(--color-brand-orange) var(--ft-progress, 60%),
            ${DEMO.leinen} var(--ft-progress, 60%),
            ${DEMO.leinen} 100%
          );
          border: 1px solid ${DEMO.ink};
        }
        [data-demo-id="fine-tune-playground"] [data-ft-slider]::-moz-range-track {
          height: 4px;
          background: ${DEMO.leinen};
          border: 1px solid ${DEMO.ink};
        }
        [data-demo-id="fine-tune-playground"] [data-ft-slider]::-moz-range-progress {
          height: 4px;
          background: var(--color-brand-orange);
        }
        [data-demo-id="fine-tune-playground"] [data-ft-slider]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: var(--color-brand-orange);
          border: 2px solid ${DEMO.ink};
          margin-top: -7px;
          cursor: grab;
          box-shadow: 2px 2px 0 0 ${DEMO.ink};
        }
        [data-demo-id="fine-tune-playground"] [data-ft-slider]::-webkit-slider-thumb:active {
          cursor: grabbing;
        }
        [data-demo-id="fine-tune-playground"] [data-ft-slider]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          background: var(--color-brand-orange);
          border: 2px solid ${DEMO.ink};
          border-radius: 0;
          cursor: grab;
          box-shadow: 2px 2px 0 0 ${DEMO.ink};
        }
        [data-demo-id="fine-tune-playground"] [data-ft-slider]:focus-visible {
          outline: 2px solid var(--color-brand-orange);
          outline-offset: 2px;
        }
        [data-demo-id="fine-tune-playground"] [data-ft-tab]:focus-visible {
          outline: 2px solid var(--color-brand-orange);
          outline-offset: 2px;
        }
      `}</style>
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
          Fine-Tuning Playground
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            marginTop: 6,
          }}
        >
          {text("Generische Antwort vs.", "Generic answer versus")}{" "}
          <span style={{ color: "var(--color-brand-orange)" }}>
            {text("Domänenbeispiel.", "domain example.")}
          </span>
        </h2>
      </div>

      <div
        data-ft-tabs
        role="tablist"
        aria-label={text("Prompt-Auswahl", "Prompt selection")}
        style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
      >
        {prompts.map((p, i) => {
          const active = selIdx === i;
          return (
            <button
              key={i}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              data-ft-tab
              type="button"
              role="tab"
              id={`ft-tab-${i}`}
              aria-selected={active}
              aria-controls="ft-compare-panel"
              tabIndex={active ? 0 : -1}
              onClick={() => setSelIdx(i)}
              onKeyDown={(e) => handleTabKeyDown(e, i)}
              style={{
                minHeight: 44,
                padding: "8px 10px",
                background: active ? DEMO.ink : "transparent",
                color: active ? DEMO.kalk : DEMO.ink,
                border: `1px solid ${active ? DEMO.ink : DEMO.leinen}`,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                flex: 1,
                minWidth: 180,
              }}
            >
              <span
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 12,
                  color: active ? DEMO.kupferLight : DEMO.schiefer,
                  letterSpacing: "0.12em",
                  fontWeight: 700,
                }}
              >
                PROMPT {String(i + 1).padStart(2, "0")}
              </span>
              <div style={{ marginTop: 3 }}>
                {p.q.slice(0, 50)}
                {p.q.length > 50 ? "…" : ""}
              </div>
            </button>
          );
        })}
      </div>

      <div
        id="ft-compare-panel"
        role="tabpanel"
        aria-labelledby={`ft-tab-${selIdx}`}
        data-ft-compare
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
      >
        <div
          style={{
            background: DEMO.birke,
            border: `1px solid ${DEMO.leinen}`,
            padding: 14,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                background: "rgba(11,9,8,0.08)",
                color: DEMO.ink,
                padding: "2px 8px",
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.12em",
              }}
            >
              {text("BASISMODELL", "BASE MODEL")}
            </span>
            <span
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                color: DEMO.schiefer,
              }}
            >
              Claude Haiku 4.5
            </span>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.55, color: DEMO.schiefer }}>
            {prompt.base}
          </div>
          <div
            style={{
              marginTop: 10,
              paddingTop: 8,
              borderTop: `1px solid ${DEMO.leinen}`,
              display: "flex",
              gap: 12,
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              color: DEMO.schiefer,
              flexWrap: "wrap",
            }}
          >
            <span>
              <strong style={{ color: DEMO.ink }}>{prompt.baseSpec} %</strong>{" "}
              {text("Spezifität", "specificity")}
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              {text("Konfidenz (Vokabelabgleich)", "Confidence (vocabulary match)")}{" "}
              <ConfChip pct={prompt.baseConf} />
            </span>
          </div>
        </div>
        <div
          style={{
            background: DEMO.kalk,
            borderTop: `4px solid var(--color-brand-orange)`,
            borderRight: `2px solid var(--color-brand-orange)`,
            borderBottom: `2px solid var(--color-brand-orange)`,
            borderLeft: `2px solid var(--color-brand-orange)`,
            padding: 14,
            boxShadow: `3px 3px 0 0 ${DEMO.ink}`,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -10,
              right: 10,
              background: "var(--color-brand-orange)",
              color: DEMO.kalk,
              padding: "2px 8px",
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              border: `1px solid ${DEMO.ink}`,
              boxShadow: `1px 1px 0 0 ${DEMO.ink}`,
            }}
          >
            +{accuracyDelta} {text("Punkte · Beispiel", "points · sample")}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                background: "var(--color-brand-orange)",
                color: DEMO.kalk,
                padding: "2px 8px",
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.12em",
              }}
            >
              {text(
                "DOMÄNENBEISPIEL · SIMULIERT",
                "DOMAIN EXAMPLE · SIMULATED",
              )}
            </span>
            <span
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                color: DEMO.schiefer,
              }}
            >
              {text(
                "+ fiktive Domänendokumente",
                "+ fictional domain documents",
              )}
            </span>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.55, color: DEMO.ink }}>
            {prompt.tuned}
          </div>
          <div
            style={{
              marginTop: 10,
              paddingTop: 8,
              borderTop: `1px solid ${DEMO.leinen}`,
              display: "flex",
              gap: 12,
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              color: DEMO.schiefer,
              flexWrap: "wrap",
            }}
          >
            <span>
              <strong style={{ color: "var(--color-brand-orange)" }}>
                {prompt.tunedSpec} %
              </strong>{" "}
              {text("Spezifität", "specificity")}
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              {text("Konfidenz (Vokabelabgleich)", "Confidence (vocabulary match)")}{" "}
              <ConfChip
                pct={prompt.tunedConf}
                accentColor="var(--color-brand-orange)"
              />
            </span>
          </div>
        </div>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
            flexWrap: "wrap",
            gap: 6,
          }}
        >
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
            {text("Trainingsmetriken · Epoche", "Training metrics · epoch")}{" "}
            {String(epoch).padStart(2, "0")}/{EPOCH_MAX}
          </div>
          <div
            style={{
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              color: DEMO.schiefer,
            }}
          >
            LoRA rank 16 · batch 32
          </div>
        </div>
        <div
          style={{
            background: DEMO.ink,
            color: DEMO.kalk,
            padding: 12,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 14,
          }}
        >
          {(
            [
              ["Loss", metrics.loss, "↓"],
              ["Accuracy", `${metrics.acc} %`, "↑"],
              [
                text("Domänenspezifität", "Domain specificity"),
                `${metrics.specificity} %`,
                "↑",
              ],
            ] as const
          ).map(([l, v, dir]) => (
            <div key={l}>
              <div
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 12,
                  color: "rgba(243,240,233,0.55)",
                  letterSpacing: "0.14em",
                }}
              >
                {l}
              </div>
              <div
                style={{
                  fontFamily: DEMO.font.mono,
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  marginTop: 3,
                  color: dir === "↑" ? "var(--color-brand-orange)" : DEMO.kalk,
                }}
              >
                {v}
              </div>
            </div>
          ))}
        </div>

        {/* Live training curves */}
        <div
          style={{
            background: DEMO.birke,
            borderTop: "none",
            borderRight: `1px solid ${DEMO.leinen}`,
            borderBottom: `1px solid ${DEMO.leinen}`,
            borderLeft: `1px solid ${DEMO.leinen}`,
            padding: "10px 12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              color: DEMO.schiefer,
              letterSpacing: "0.12em",
            }}
          >
            <span>LOSS ↓ · ACCURACY ↑</span>
            <span style={{ display: "flex", gap: 12 }}>
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 2,
                    background: DEMO.ink,
                  }}
                />
                LOSS
              </span>
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 2,
                    background: "var(--color-brand-orange)",
                  }}
                />
                ACC
              </span>
            </span>
          </div>
          <svg
            viewBox="0 0 280 60"
            preserveAspectRatio="none"
            style={{ width: "100%", height: 60, display: "block" }}
            role="img"
            aria-label={
              locale === "de"
                ? `Trainingsverlauf bei Epoche ${epoch}: Loss ${metrics.loss}, Accuracy ${metrics.acc} Prozent`
                : `Training series at epoch ${epoch}: loss ${metrics.loss}, accuracy ${metrics.acc} percent`
            }
          >
            {/* Grid */}
            {[0, 15, 30, 45].map((y) => (
              <line
                key={y}
                x1={0}
                y1={y + 4}
                x2={280}
                y2={y + 4}
                stroke={DEMO.leinen}
                strokeWidth={0.5}
                strokeDasharray="2 3"
              />
            ))}
            {/* Accuracy curve (orange) */}
            <path
              d={accPath}
              fill="none"
              stroke="var(--color-brand-orange)"
              strokeWidth={1.5}
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            {/* Loss curve (ink) */}
            <path
              d={lossPath}
              fill="none"
              stroke={DEMO.ink}
              strokeWidth={1.5}
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            {/* Current epoch indicator */}
            <line
              x1={currentX}
              y1={4}
              x2={currentX}
              y2={54}
              stroke="var(--color-brand-orange)"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <rect
              x={currentX - 3}
              y={currentLossY - 3}
              width={6}
              height={6}
              fill={DEMO.ink}
              stroke={DEMO.kalk}
              strokeWidth={1}
            />
            <rect
              x={currentX - 3}
              y={currentAccY - 3}
              width={6}
              height={6}
              fill="var(--color-brand-orange)"
              stroke={DEMO.kalk}
              strokeWidth={1}
            />
          </svg>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 2,
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              color: DEMO.schiefer,
              letterSpacing: "0.1em",
            }}
          >
            <span>E0</span>
            <span>E{EPOCH_MAX}</span>
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              color: DEMO.schiefer,
              letterSpacing: "0.12em",
              fontWeight: 700,
            }}
          >
            {text("EPOCHE", "EPOCH")}
          </span>
          <input
            data-ft-slider
            type="range"
            min={0}
            max={EPOCH_MAX}
            step={1}
            value={epoch}
            onChange={(e) => setEpoch(Number(e.target.value))}
            style={
              {
                flex: 1,
                WebkitAppearance: "none",
                appearance: "none",
                background: "transparent",
                minHeight: 44,
                height: 20,
                cursor: "grab",
                "--ft-progress": `${(epoch / EPOCH_MAX) * 100}%`,
              } as React.CSSProperties
            }
            aria-label={
              locale === "de"
                ? `Trainingsepoche auswählen, aktuell ${epoch} von ${EPOCH_MAX}`
                : `Select training epoch, currently ${epoch} of ${EPOCH_MAX}`
            }
            aria-valuemin={0}
            aria-valuemax={EPOCH_MAX}
            aria-valuenow={epoch}
          />
          <span
            style={{
              fontFamily: DEMO.font.mono,
              fontSize: 12,
              fontWeight: 700,
              color: "var(--color-brand-orange)",
              minWidth: 42,
              textAlign: "right",
            }}
          >
            {String(epoch).padStart(2, "0")}/{EPOCH_MAX}
          </span>
        </div>
      </div>
    </div>
  );
}

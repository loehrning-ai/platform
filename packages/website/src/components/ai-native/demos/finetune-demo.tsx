"use client";

import { useMemo, useState, type JSX } from "react";
import { DemoOverline } from "./_shared";
import { cn } from "@/lib/utils";

/**
 * FineTuneDemo — Base-Model vs. Fine-Tuned side-by-side with epoch slider.
 *
 * Provenance: first-party loehrning.ai implementation by Tim Löhr.
 * Ported 2026-04-21. See AI-native demo gallery implementation.
 */

interface Prompt {
  readonly question: string;
  readonly base: string;
  readonly tuned: string;
}

const PROMPTS: readonly Prompt[] = [
  {
    question: "Wie lange ist die Standardgarantie auf Motor XR-2200?",
    base: "Die Garantie für einen Motor hängt vom Hersteller ab. In der Regel liegt sie zwischen 12 und 36 Monaten. Für spezifische Informationen kontaktieren Sie bitte den Hersteller.",
    tuned:
      "Auf den Motor XR-2200 gewähren wir 36 Monate Garantie ab Inbetriebnahme, gemäß AGB §14.2. Verschleißteile (Lager, Dichtungen) sind ausgenommen. Verlängerung auf 60 Monate über Wartungsvertrag WV-Premium möglich.",
  },
  {
    question: "Welche Werkstoffe sind für Offshore-Anwendungen freigegeben?",
    base: "Für Offshore-Anwendungen werden üblicherweise korrosionsbeständige Materialien wie Edelstahl 316L oder Duplex-Stähle verwendet. Die genaue Wahl hängt von der Anwendung ab.",
    tuned:
      "Freigegeben sind 1.4462 (Duplex), 1.4529 (Super-Austenit) und Hastelloy C-276. Für Zone 3 ab Nordsee (H2S-haltig) zwingend Duplex plus Schutzanstrich System SP-3B. Dokumentiert in internem Standard WST-OFF-01.",
  },
  {
    question: "Wie bepreisen wir Express-Aufträge?",
    base: "Express-Aufträge haben in der Regel einen Zuschlag. Die genaue Höhe variiert je nach Unternehmen und Dringlichkeit.",
    tuned:
      "Express <72h: Priorität hoch. Express <24h: Priorität kritisch. Wochenend-Rush: zusätzliche Freigabe nötig. Materialkosten separat prüfen. Ausnahme Rahmenvertrag-Stufe A laut interner Freigabematrix.",
  },
];

export function FineTuneDemo(): JSX.Element {
  const [selIdx, setSelIdx] = useState(0);
  const [epoch, setEpoch] = useState(0);

  const metrics = useMemo(() => {
    return {
      loss: (2.8 - Math.log(1 + epoch * 0.8) * 0.9).toFixed(3),
      accuracy: Math.min(98, 42 + epoch * 8 + Math.sin(epoch) * 2).toFixed(1),
      specificity: Math.min(96, 18 + epoch * 10).toFixed(0),
    };
  }, [epoch]);

  const active = PROMPTS[selIdx];

  return (
    <div
      className="flex flex-col gap-4 overflow-hidden"
      role="region"
      aria-label="Fine-Tuning Playground"
    >
      <div>
        <DemoOverline>Fine-Tuning Playground</DemoOverline>
        <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-foreground md:text-[26px]">
          Generisch vs.{" "}
          <span className="text-brand-orange">Domänenbeispiel.</span>
        </h3>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          Beispielantworten mit und ohne Domänenkontext. Kein echtes
          Modelltraining und keine echten Firmendokumente.
        </p>
      </div>

      {/* Prompt picker */}
      <div className="flex flex-wrap gap-1.5">
        {PROMPTS.map((p, i) => {
          const isActive = selIdx === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelIdx(i)}
              aria-pressed={isActive}
              className={cn(
                "min-h-11 flex-1 basis-[180px] border px-3 py-2 text-left text-[12px] transition-colors",
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-transparent text-foreground hover:border-foreground",
              )}
            >
              <span
                className={cn(
                  "font-mono text-[12px] font-bold uppercase tracking-[0.12em]",
                  isActive
                    ? "text-[var(--color-kupfer-light)]"
                    : "text-muted-foreground",
                )}
              >
                PROMPT {String(i + 1).padStart(2, "0")}
              </span>
              <div className="mt-0.5">
                {p.question.slice(0, 50)}
                {p.question.length > 50 ? "…" : ""}
              </div>
            </button>
          );
        })}
      </div>

      {/* Side-by-side responses */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <div className="border border-border bg-card/60 p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 border border-border bg-background px-2 py-0.5 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Base Model
            </span>
            <span className="font-mono text-[12px] text-muted-foreground">
              Basismodell · Simulation
            </span>
          </div>
          <p className="text-[13px] leading-[1.55] text-muted-foreground">
            {active.base}
          </p>
          <div className="mt-3.5 flex flex-wrap gap-3.5 border-t border-border pt-2.5 font-mono text-[12px] text-muted-foreground">
            <span>
              <strong className="text-foreground">generisch</strong> Antworttyp
            </span>
            <span>
              <strong className="text-foreground">keine</strong> Quellenprüfung
            </span>
          </div>
        </div>

        <div className="border border-brand-orange border-t-[3px] border-t-brand-orange bg-background p-4 shadow-[3px_3px_0_0_var(--color-foreground)]">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 border border-brand-orange bg-brand-orange/10 px-2 py-0.5 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-brand-orange">
              Simuliert
            </span>
            <span className="font-mono text-[12px] text-muted-foreground">
              + fiktive Domänendokumente
            </span>
          </div>
          <p className="text-[13px] leading-[1.55] text-foreground">
            {active.tuned}
          </p>
          <div className="mt-3.5 flex flex-wrap gap-3.5 border-t border-border pt-2.5 font-mono text-[12px] text-muted-foreground">
            <span>
              <strong className="text-brand-orange">domänenspezifisch</strong>{" "}
              Antworttyp
            </span>
            <span>
              <strong className="text-brand-orange">offen</strong>{" "}
              Quellenprüfung
            </span>
          </div>
        </div>
      </div>

      {/* Training metrics */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <DemoOverline>Simulationskurve · Epoche {epoch}</DemoOverline>
          <div className="font-mono text-[12px] text-muted-foreground">
            LoRA rank 16 · batch 32
          </div>
        </div>
        <div className="dark-section grid grid-cols-3 gap-4 bg-[var(--color-dark-bg)] p-3.5">
          {[
            ["Loss · simuliert", metrics.loss, "↓"],
            ["Trefferquote · simuliert", `${metrics.accuracy}%`, "↑"],
            ["Domänen-Score · simuliert", `${metrics.specificity}%`, "↑"],
          ].map(([label, val, dir]) => (
            <div key={label}>
              <div className="font-mono text-[12px] tracking-[0.14em] text-[var(--color-dark-muted)]">
                {label}
              </div>
              <div
                className={cn(
                  "mt-1 font-mono text-[22px] font-bold tracking-[-0.03em] md:text-[28px]",
                  dir === "↑"
                    ? "text-brand-orange"
                    : "text-[var(--color-dark-fg)]",
                )}
              >
                {val}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="font-mono text-[12px] tracking-[0.12em] text-muted-foreground">
            EPOCHE
          </span>
          <input
            type="range"
            min={0}
            max={6}
            step={1}
            value={epoch}
            onChange={(e) => setEpoch(+e.target.value)}
            className="min-h-11 flex-1 accent-brand-orange"
            aria-label="Epoche auswählen"
          />
          <span className="min-w-[30px] font-mono text-[12px] font-bold text-brand-orange">
            {epoch}/6
          </span>
        </div>
        <p className="mt-2 text-[12px] leading-[1.5] text-muted-foreground">
          Didaktische Werte, keine gemessene Modellgüte. Ein reales Training
          benötigt getrennte Evaluationsdaten, Fehlersichten und
          Freigabekriterien.
        </p>
      </div>
    </div>
  );
}

export default FineTuneDemo;

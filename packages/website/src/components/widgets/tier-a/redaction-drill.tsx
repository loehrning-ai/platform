"use client";

import { useMemo, useState, type JSX } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { useCheckpoint } from "@/lib/progress";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "./_frame";

/**
 * RedactionDrill — before you paste a log / E-Mail into a KI-Tool, click every
 * piece that should never leave the company. Ported from
 * `claude/js/widgets.js:994` (RedactionDrill), rewritten with German
 * Mittelstand scenarios and a second, harder scenario.
 *
 * Schema note (shared course architecture): the AI-Native `PiiSpotterSpec`
 * (`components/ai-native/exercises/pii-spotter.tsx`) tokenises text on
 * whitespace and tracks `piiIndices`. This Tier-A+ variant follows the same
 * "mark the sensitive parts, then grade precision + recall" model but at the
 * SEGMENT level (the source RedactionDrill shape): a segment is either safe or
 * carries a labelled `sensitive` reason. Segment redaction is the more honest
 * "redact before paste" interaction and keeps the grading deterministic.
 *
 *  - Each risky segment is a native button (keyboard + a11y for free).
 *  - Fully deterministic grading: caught == sensitive, mistakes == redacted
 *    safe segments. No Date.now / Math.random.
 *  - Two scenarios; the checkpoint is awarded once BOTH are cleaned perfectly.
 *  - The only motion is the verdict reveal, gated by `prefers-reduced-motion`.
 *
 * German copy throughout. No em dashes.
 */

export interface RedactionSegment {
  /** The literal text of this segment. */
  readonly text: string;
  /**
   * If present, this segment is sensitive and must be redacted. The string is
   * the human-readable reason shown on hover / in the verdict (e.g. "Kunden-E-Mail").
   */
  readonly sensitive?: string;
}

export interface RedactionScenario {
  readonly id: string;
  /** Short label, e.g. "Server-Log" or "Kunden-E-Mail". */
  readonly label: string;
  /** One-line setup shown above the passage. */
  readonly intro: string;
  readonly segments: readonly RedactionSegment[];
}

export interface RedactionDrillWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly title?: string;
  readonly scenario?: string;
  /** Override the default two scenarios. */
  readonly scenarios?: readonly RedactionScenario[];
}

/**
 * Two German Mittelstand scenarios. Scenario 1 (easy): an obvious server log
 * with a token + customer e-mail. Scenario 2 (harder): a customer e-mail where
 * the sensitive bits hide between plausible-but-safe ones (IBAN vs Bestellnr.,
 * Privatname vs Firmenname, Klartext-Passwort).
 */
const DEFAULT_SCENARIOS: readonly RedactionScenario[] = [
  {
    id: "s1",
    label: "Server-Log",
    intro:
      "Ein Kollege will dieses Fehlerprotokoll in ein KI-Tool kopieren, um den Fehler zu finden. Markiere alles, was niemals den Betrieb verlassen darf.",
    segments: [
      { text: "Bitte hilf mir, diesen Fehler im Bestellsystem zu finden:\n\n" },
      { text: "[2026-05-14 14:22] POST /api/v2/auftraege " },
      {
        text: "Authorization: Bearer sk-EXAMPLE-nicht-echt",
        sensitive: "API-Zugangstoken",
      },
      { text: "\n[2026-05-14 14:22] kunde=" },
      {
        text: "kunde-alpha@example.invalid",
        sensitive: "Kunden-E-Mail (personenbezogen)",
      },
      { text: " betrag=128,40 EUR\n[2026-05-14 14:22] fehler: ZAHLUNG_ABGELEHNT (Versuch 3 von 3)\nlieferschein=" },
      { text: "LS-2026-04881" },
      { text: "\n\nWarum schlägt die Zahlung fehl und was soll die Wiederholung tun?" },
    ],
  },
  {
    id: "s2",
    label: "Kunden-E-Mail",
    intro:
      "Diese Beschwerde-Mail soll von der KI zusammengefasst werden. Achtung: hier stecken die sensiblen Stellen zwischen harmlosen. Markiere nur, was wirklich geschützt gehört.",
    segments: [
      { text: "Fasse diese Kundenbeschwerde in zwei Sätzen zusammen:\n\n" },
      { text: "Sehr geehrte Damen und Herren, ich beziehe mich auf Bestellung " },
      { text: "BST-99214" },
      { text: " der ausdrücklich fiktiven Fiktivwerk Beispiel GmbH. Die Lieferung kam beschädigt an. Bitte erstatten Sie den Betrag auf mein Konto " },
      {
        text: "DE00 0000 0000 0000 0000 00 (DUMMY)",
        sensitive: "IBAN (Bankverbindung)",
      },
      { text: ". Sie erreichen mich unter " },
      {
        text: "+49 000 000000 (DUMMY)",
        sensitive: "private Telefonnummer",
      },
      { text: ". Mein Kundenkonto-Login lautet kunde4471, das Passwort ist " },
      {
        text: "DUMMY-PASSWORT-NICHT-VERWENDEN",
        sensitive: "Passwort im Klartext",
      },
      { text: ". Mit freundlichen Grüßen, " },
      {
        text: "Fiktivperson Alpha",
        sensitive: "Name einer Privatperson",
      },
    ],
  },
];

export function RedactionDrillWidget({
  lessonId,
  cpId,
  title = "Redigiere, bevor du einfügst",
  scenario = "Bevor Sie ein Protokoll oder eine E-Mail in ein KI-Tool kopieren: lesen, dann einfügen. Klicken Sie jede Stelle an, die niemals Ihr Haus verlassen darf.",
  scenarios = DEFAULT_SCENARIOS,
}: RedactionDrillWidgetProps): JSX.Element {
  const reduced = useReducedMotion();
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [active, setActive] = useState(0);
  // Per-scenario redaction state, keyed by scenario id → set of segment indices.
  const [redacted, setRedacted] = useState<
    Readonly<Record<string, ReadonlySet<number>>>
  >({});
  const [submittedIds, setSubmittedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  const sc = scenarios[active];
  const scRedacted = redacted[sc.id] ?? new Set<number>();
  const submitted = submittedIds.has(sc.id);

  const sensitiveIdxs = useMemo(
    () =>
      sc.segments
        .map((s, i) => (s.sensitive ? i : -1))
        .filter((i) => i >= 0),
    [sc],
  );
  const caught = sensitiveIdxs.filter((i) => scRedacted.has(i)).length;
  const mistakes = Array.from(scRedacted).filter(
    (i) => !sc.segments[i]?.sensitive,
  ).length;
  const totalSensitive = sensitiveIdxs.length;
  const allClean = caught === totalSensitive && mistakes === 0;

  // Checkpoint awarded only when EVERY scenario has been cleaned perfectly.
  const allScenariosClean = scenarios.every((s) => {
    const r = redacted[s.id] ?? new Set<number>();
    const sens = s.segments
      .map((seg, i) => (seg.sensitive ? i : -1))
      .filter((i) => i >= 0);
    const c = sens.filter((i) => r.has(i)).length;
    const m = Array.from(r).filter((i) => !s.segments[i]?.sensitive).length;
    return c === sens.length && m === 0 && submittedIds.has(s.id);
  });

  const toggle = (i: number) => {
    if (submitted) return;
    setRedacted((prev) => {
      const cur = new Set(prev[sc.id] ?? []);
      if (cur.has(i)) cur.delete(i);
      else cur.add(i);
      return { ...prev, [sc.id]: cur };
    });
  };

  const submit = () => {
    const next = new Set(submittedIds);
    next.add(sc.id);
    setSubmittedIds(next);
    // Recompute "all clean" with this scenario now counted as submitted.
    const okHere = allClean;
    if (okHere) {
      const everyOk = scenarios.every((s) => {
        const r = redacted[s.id] ?? new Set<number>();
        const sens = s.segments
          .map((seg, i) => (seg.sensitive ? i : -1))
          .filter((i) => i >= 0);
        const c = sens.filter((i) => r.has(i)).length;
        const m = Array.from(r).filter(
          (i) => !s.segments[i]?.sensitive,
        ).length;
        return c === sens.length && m === 0 && next.has(s.id);
      });
      if (everyOk) complete();
    }
  };

  const reset = () => {
    setRedacted((prev) => ({ ...prev, [sc.id]: new Set<number>() }));
    setSubmittedIds((prev) => {
      const next = new Set(prev);
      next.delete(sc.id);
      return next;
    });
  };

  return (
    <WidgetFrame
      kindLabel="Datenschutz-Drill"
      title={title}
      scenario={scenario}
      done={done}
      xpLabel="+20 XP"
    >
      {/* Scenario tabs */}
      <div
        role="group"
        aria-label="Szenario wählen"
        className="mb-4 flex flex-wrap gap-2"
      >
        {scenarios.map((s, i) => {
          const isActive = i === active;
          const sDone =
            submittedIds.has(s.id) &&
            (() => {
              const r = redacted[s.id] ?? new Set<number>();
              const sens = s.segments
                .map((seg, k) => (seg.sensitive ? k : -1))
                .filter((k) => k >= 0);
              const c = sens.filter((k) => r.has(k)).length;
              const m = Array.from(r).filter(
                (k) => !s.segments[k]?.sensitive,
              ).length;
              return c === sens.length && m === 0;
            })();
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActive(i)}
              className={cn(
                "inline-flex items-center gap-1.5 border-2 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-colors",
                isActive
                  ? "border-brand-orange bg-brand-orange/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-brand-orange/60",
              )}
            >
              {sDone && (
                <CheckCircle2 size={12} className="text-[#22c55e]" />
              )}
              Szenario {i + 1}
            </button>
          );
        })}
      </div>

      <p className="mb-3 text-[13.5px] leading-[1.55] text-muted-foreground">
        {sc.intro}
      </p>

      {/* Passage */}
      <div
        data-state={submitted ? (allClean ? "clean" : "leaky") : "editing"}
        className={cn(
          "whitespace-pre-wrap [overflow-wrap:anywhere] break-words border-2 p-4 font-mono text-[13px] leading-[1.9] transition-colors",
          submitted && allClean && "border-[#22c55e] bg-[#22c55e]/5",
          submitted && !allClean && "border-destructive bg-destructive/5",
          !submitted && "border-border bg-background",
        )}
      >
        {sc.segments.map((seg, i) => {
          const isSensitive = !!seg.sensitive;
          const isRedacted = scRedacted.has(i);
          const isMistake = submitted && isRedacted && !isSensitive;
          const isMissed = submitted && isSensitive && !isRedacted;

          if (!isSensitive && !isRedacted) {
            return (
              <span key={i} className="text-foreground">
                {seg.text}
              </span>
            );
          }

          if (isRedacted) {
            return (
              <button
                key={i}
                type="button"
                disabled={submitted}
                onClick={() => toggle(i)}
                aria-pressed={true}
                aria-label={`Redigiert: ${seg.sensitive ?? "harmlos"} (klicken zum Wiederherstellen)`}
                className={cn(
                  "mx-0.5 inline-block px-2 align-baseline font-mono text-[12px] font-bold uppercase tracking-[0.05em] text-white",
                  isMistake
                    ? "bg-brand-amber"
                    : submitted
                      ? "bg-[#22c55e]"
                      : "bg-foreground",
                )}
              >
                &lt;REDIGIERT&gt;
              </button>
            );
          }

          // Sensitive (or revealed-after-submit) clickable segment.
          return (
            <button
              key={i}
              type="button"
              disabled={submitted}
              onClick={() => toggle(i)}
              title={seg.sensitive}
              aria-pressed={false}
              aria-label={`Riskant: ${seg.sensitive} (klicken zum Redigieren)`}
              className={cn(
                "mx-0.5 inline align-baseline border-b-2 px-1 font-mono text-[13px] transition-colors",
                isMissed
                  ? "border-destructive bg-destructive/15 font-semibold text-foreground"
                  : "border-dashed border-brand-amber bg-brand-amber/20 text-foreground hover:bg-brand-amber/35",
              )}
            >
              {seg.text}
            </button>
          );
        })}
      </div>

      {/* Legend + count */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-3.5 w-3.5 border-b-2 border-dashed border-brand-amber bg-brand-amber/20"
          />
          riskant, zum Redigieren klicken
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block bg-foreground px-1.5 font-mono text-[8px] font-bold uppercase text-white"
          >
            redigiert
          </span>
          bereinigt
        </span>
        <span className="ml-auto font-mono">
          {caught} / {totalSensitive} erfasst
        </span>
      </div>

      {/* Verdict */}
      <AnimatePresence>
        {submitted && (
          <m.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.28, ease: EASE_OUT_EXPO }
            }
            className={cn(
              "mt-4 border-l-[3px] p-4 text-[13.5px] leading-[1.55]",
              allClean
                ? "border-[#22c55e] bg-[#22c55e]/5"
                : "border-destructive bg-destructive/5",
            )}
          >
            {allClean ? (
              <p>
                <span className="font-semibold text-[#22c55e]">
                  Sicher zum Einfügen.
                </span>{" "}
                Alle {totalSensitive} sensiblen Stellen erfasst, keine
                Übertreibung. Genau diese Gewohnheit zählt: lesen, bevor man
                einfügt.
              </p>
            ) : (
              <div>
                <p className="font-semibold text-destructive">
                  Noch nicht abschicken.
                </p>
                {totalSensitive - caught > 0 && (
                  <p className="mt-1">
                    {totalSensitive - caught}{" "}
                    {totalSensitive - caught === 1
                      ? "sensible Stelle ist"
                      : "sensible Stellen sind"}{" "}
                    noch offen (rot markiert).
                  </p>
                )}
                {mistakes > 0 && (
                  <p className="mt-1">
                    Sie haben {mistakes} harmlose{" "}
                    {mistakes === 1 ? "Stelle" : "Stellen"} redigiert (amber).
                    Unnötig, aber kein Schaden.
                  </p>
                )}
              </div>
            )}
          </m.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground">
          {allScenariosClean
            ? "Beide Szenarien bereinigt"
            : `Szenario ${active + 1} von ${scenarios.length}`}
        </span>
        {!submitted ? (
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center gap-1.5 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
          >
            Einfügen prüfen
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em]",
                allClean ? "text-[#22c55e]" : "text-destructive",
              )}
            >
              {allClean ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {allClean ? "Sauber" : "Leck"}
            </span>
            <button
              type="button"
              onClick={reset}
              className="border-2 border-foreground bg-background px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-foreground shadow-[3px_3px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
            >
              Nochmal
            </button>
          </div>
        )}
      </div>
    </WidgetFrame>
  );
}

export default RedactionDrillWidget;

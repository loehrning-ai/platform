"use client";

import { useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/**
 * L06 bespoke interactive — "Done checklist engine".
 * Ported from `codex/js/lessons/L06.js` (functional parity; the source's
 * anchor-tag dropdown is a native `<select>` here for real keyboard/a11y
 * support — the graded interaction is picking the correct, checkable
 * rewrite for each ambiguous phrase, not the dropdown chrome).
 *
 * Seven ambiguous phrases ("should work well", "handles edge cases", …),
 * each with three rewrite options where exactly one is genuinely checkable.
 * Picking the correct option marks that row satisfied; picking either
 * distractor marks it unsatisfied. The checkpoint awards once all 7 rows
 * are satisfied.
 */

interface ChecklistItem {
  readonly ambiguous: string;
  readonly options: readonly string[];
  readonly correct: number;
}

const ITEMS_EN: readonly ChecklistItem[] = [
  {
    ambiguous: "should work well",
    options: [
      "works",
      "the documented unit-test command exits successfully; review its failures, skips, and log",
      "QA is happy",
    ],
    correct: 1,
  },
  {
    ambiguous: "handles edge cases",
    options: [
      "does not crash",
      "empty input returns 400, null input returns 400, 2GB input is rejected with 413",
      "tested some edges",
    ],
    correct: 1,
  },
  {
    ambiguous: "performant",
    options: [
      "fast enough",
      "the named load test meets the service's documented p95 latency and error-rate budgets",
      "no slow queries",
    ],
    correct: 1,
  },
  {
    ambiguous: "looks good",
    options: [
      "no broken layout",
      "the agreed viewport and keyboard-flow checks pass; attach visual evidence",
      "design approved",
    ],
    correct: 1,
  },
  {
    ambiguous: "well-documented",
    options: [
      "has docs",
      "new public functions have JSDoc; README section updated",
      "self-explanatory",
    ],
    correct: 1,
  },
  {
    ambiguous: "tested",
    options: [
      "has tests",
      "tests cover the changed branches and fail when the required behavior is removed",
      "manually verified",
    ],
    correct: 1,
  },
  {
    ambiguous: "secure",
    options: [
      "no bugs",
      "configured security checks pass; authorization, secret handling, and new dependencies are reviewed",
      "reviewed by security",
    ],
    correct: 1,
  },
];

const ITEMS_DE: readonly ChecklistItem[] = [
  {
    ambiguous: "soll gut funktionieren",
    options: [
      "funktioniert",
      "der dokumentierte Unit-Test-Befehl endet erfolgreich; Fehler, übersprungene Tests und Protokoll werden geprüft",
      "QA ist zufrieden",
    ],
    correct: 1,
  },
  {
    ambiguous: "behandelt Randfälle",
    options: [
      "stürzt nicht ab",
      "leere und null-Eingaben liefern 400; Eingaben über 2 GB werden mit 413 abgelehnt",
      "einige Randfälle getestet",
    ],
    correct: 1,
  },
  {
    ambiguous: "performant",
    options: [
      "schnell genug",
      "der benannte Lasttest erfüllt die dokumentierten p95-Latenz- und Fehlerratenbudgets des Dienstes",
      "keine langsamen Queries",
    ],
    correct: 1,
  },
  {
    ambiguous: "sieht gut aus",
    options: [
      "kein defektes Layout",
      "die vereinbarten Viewport- und Tastaturprüfungen bestehen; visuelle Nachweise sind beigefügt",
      "Design freigegeben",
    ],
    correct: 1,
  },
  {
    ambiguous: "gut dokumentiert",
    options: [
      "hat Dokumentation",
      "neue öffentliche Funktionen besitzen JSDoc; README-Abschnitt ist aktualisiert",
      "selbsterklärend",
    ],
    correct: 1,
  },
  {
    ambiguous: "getestet",
    options: [
      "hat Tests",
      "Tests decken die geänderten Verzweigungen ab und schlagen ohne das geforderte Verhalten fehl",
      "manuell geprüft",
    ],
    correct: 1,
  },
  {
    ambiguous: "sicher",
    options: [
      "keine Fehler",
      "konfigurierte Sicherheitsprüfungen bestehen; Autorisierung, Umgang mit Zugangsdaten und neue Abhängigkeiten sind geprüft",
      "von Security geprüft",
    ],
    correct: 1,
  },
];

const COPY = {
  en: {
    heading: "◆ Exercise · Acceptance checklist",
    definition: "definition of done",
    rewrite: (source: string) => `Rewrite for "${source}"`,
    select: "pick rewrite",
    ready: "READY",
    draft: "DRAFT",
    check: "Check",
    items: ITEMS_EN,
  },
  de: {
    heading: "◆ Praxis · Definition of Done",
    definition: "Fertigstellungskriterien",
    rewrite: (source: string) => `Prüfbare Fassung für „${source}“`,
    select: "Prüfbare Fassung wählen",
    ready: "BEREIT",
    draft: "ENTWURF",
    check: "Prüfung",
    items: ITEMS_DE,
  },
} as const satisfies Record<
  Locale,
  {
    readonly heading: string;
    readonly definition: string;
    readonly rewrite: (source: string) => string;
    readonly select: string;
    readonly ready: string;
    readonly draft: string;
    readonly check: string;
    readonly items: readonly ChecklistItem[];
  }
>;

interface L06DoneChecklistProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly locale?: Locale;
}

export function L06DoneChecklist({
  lessonId,
  cpId,
  locale = "en",
}: L06DoneChecklistProps): JSX.Element {
  const copy = COPY[locale];
  const items = copy.items;
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [picked, setPicked] = useState<Record<number, number>>({});

  const satisfiedCount = Object.entries(picked).filter(
    ([i, opt]) => opt === items[Number(i)].correct,
  ).length;
  const ready = satisfiedCount === items.length;

  const choose = (itemIndex: number, optionIndex: number) => {
    const next = { ...picked, [itemIndex]: optionIndex };
    setPicked(next);
    const nextSatisfied = Object.entries(next).filter(
      ([i, opt]) => opt === items[Number(i)].correct,
    ).length;
    if (nextSatisfied === items.length) complete();
  };

  return (
    <div className="min-w-0 max-w-full border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        {copy.heading}
      </p>
      <p className="mb-3 font-mono text-[12px] text-muted-foreground">
        {copy.definition}: {satisfiedCount}/{items.length}
      </p>
      <div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="flex min-w-0 flex-col gap-2.5">
          {items.map((item, i) => {
            const pickedIdx = picked[i];
            const isCorrect = pickedIdx === item.correct;
            const attempted = pickedIdx !== undefined;
            return (
              <div
                key={item.ambiguous}
                className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
              >
                <span className="min-w-0 break-words font-mono text-[12px] italic text-muted-foreground line-through sm:w-40 sm:shrink-0">
                  {item.ambiguous}
                </span>
                <div className="flex min-w-0 items-center gap-3 sm:flex-1">
                  <select
                    value={pickedIdx ?? ""}
                    onChange={(e) => choose(i, Number(e.target.value))}
                    aria-label={copy.rewrite(item.ambiguous)}
                    className="w-full min-w-0 flex-1 border border-border bg-background px-2 py-1.5 font-mono text-[12px] text-foreground"
                  >
                    <option value="" disabled>
                      {copy.select}
                    </option>
                    {item.options.map((opt, j) => (
                      <option key={j} value={j}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-4 w-4 shrink-0 rounded-full border-2 border-border",
                      attempted &&
                        isCorrect &&
                        "border-risk-green bg-risk-green",
                      attempted &&
                        !isCorrect &&
                        "border-brand-amber bg-brand-amber",
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="min-w-0 border-2 border-border bg-background p-3">
          <p
            className={cn(
              "mb-3 font-mono text-[12px] font-bold uppercase tracking-[0.08em]",
              ready ? "text-risk-green" : "text-muted-foreground",
            )}
          >
            {ready ? `${copy.ready}${done ? " ✓" : ""}` : copy.draft}
          </p>
          <div className="flex flex-col gap-1 font-mono text-[11.5px] text-foreground">
            {items.map((item, i) => (
              <span key={item.ambiguous}>
                {picked[i] === item.correct ? "☑" : "☐"} {copy.check} {i + 1}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default L06DoneChecklist;

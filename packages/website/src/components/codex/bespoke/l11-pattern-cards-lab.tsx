"use client";

import { useState, type JSX } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";

/**
 * L11 bespoke interactive — "Pattern cards lab".
 * Ported from `codex/js/lessons/L11.js` (functional parity; the source's
 * HTML5 drag-and-drop is simplified to click-to-flip then click-to-sort —
 * drag events are unreliable in jsdom and, per the source's own click/
 * keyboard handlers as a fallback, click was always a first-class input
 * here too).
 *
 * 8 pattern cards, flip each to reveal its description, then sort it into
 * PROVEN or AVOID. Sorting into the wrong pile counts as a mistake (no
 * penalty beyond the counter) and the card stays unsorted. The checkpoint
 * awards once all 8 are correctly sorted.
 */

interface PatternCard {
  readonly id: number;
  readonly type: "proven" | "anti";
  readonly title: Readonly<Record<Locale, string>>;
  readonly desc: Readonly<Record<Locale, string>>;
}

const CARDS: readonly PatternCard[] = [
  {
    id: 1,
    type: "proven",
    title: { en: "the AGENTS.md handshake", de: "der AGENTS.md-Auftakt" },
    desc: {
      en: "Use AGENTS.md for durable repository rules that are not already obvious from code or tooling.",
      de: "Nutze AGENTS.md für dauerhafte Repository-Regeln, die nicht bereits aus Code oder Werkzeugen hervorgehen.",
    },
  },
  {
    id: 2,
    type: "proven",
    title: { en: "one PR one scope", de: "ein PR, ein Umfang" },
    desc: {
      en: "Give each task one coherent purpose and an explicit review boundary.",
      de: "Gib jedem Auftrag einen zusammenhängenden Zweck und eine ausdrückliche Review-Grenze.",
    },
  },
  {
    id: 3,
    type: "proven",
    title: { en: "tests as contract", de: "Tests als Vertrag" },
    desc: {
      en: "Reviewed tests provide executable examples; their logs and coverage still require inspection.",
      de: "Geprüfte Tests liefern ausführbare Beispiele; Protokolle und Abdeckung müssen weiterhin kontrolliert werden.",
    },
  },
  {
    id: 4,
    type: "proven",
    title: {
      en: "parallel with git worktrees",
      de: "parallel mit Git-Worktrees",
    },
    desc: {
      en: "Use separate worktrees for independent local file state, then review merge and shared-service risk.",
      de: "Nutze getrennte Worktrees für unabhängigen lokalen Dateistand und prüfe anschließend Merge- sowie gemeinsam genutzte Dienste.",
    },
  },
  {
    id: 5,
    type: "proven",
    title: { en: "independent review pass", de: "unabhängiger Prüfauftrag" },
    desc: {
      en: "A separate review pass can surface findings, but the accountable human still accepts or rejects the diff.",
      de: "Ein getrennter Prüfauftrag kann Befunde liefern; Annahme oder Ablehnung des Diffs bleibt eine menschliche Entscheidung.",
    },
  },
  {
    id: 6,
    type: "anti",
    title: {
      en: "vague roving refactor",
      de: "unklares, grenzenloses Refactoring",
    },
    desc: { en: "Clean up the codebase.", de: "Räume die Codebasis auf." },
  },
  {
    id: 7,
    type: "anti",
    title: {
      en: "conflate local and cloud controls",
      de: "lokale und Cloud-Kontrollen vermischen",
    },
    desc: {
      en: "Assuming every Codex surface has the same filesystem, approval, network, and persistence model.",
      de: "Annehmen, dass jede Codex-Oberfläche dasselbe Dateisystem-, Freigabe-, Netzwerk- und Persistenzmodell besitzt.",
    },
  },
  {
    id: 8,
    type: "anti",
    title: { en: "skip the sandbox", de: "Sandbox umgehen" },
    desc: {
      en: "Disabling the sandbox to just make it work.",
      de: "Die Sandbox abschalten, damit es irgendwie funktioniert.",
    },
  },
];

interface L11PatternCardsLabProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly locale?: Locale;
}

const COPY: Record<
  Locale,
  {
    readonly eyebrow: string;
    readonly sorted: string;
    readonly mistakes: string;
    readonly proven: string;
    readonly avoid: string;
    readonly flipCard: string;
    readonly complete: string;
  }
> = {
  en: {
    eyebrow: "◆ Exercise · Task pattern classification",
    sorted: "sorted",
    mistakes: "mistakes",
    proven: "Use with review",
    avoid: "High risk",
    flipCard: "Flip card",
    complete: "All patterns classified",
  },
  de: {
    eyebrow: "◆ Interaktiv · Musterkarten",
    sorted: "sortiert",
    mistakes: "Fehler",
    proven: "Mit Review nutzen",
    avoid: "Hohes Risiko",
    flipCard: "Karte umdrehen",
    complete: "Muster korrekt eingeordnet",
  },
};

export function L11PatternCardsLab({
  lessonId,
  cpId,
  locale = "en",
}: L11PatternCardsLabProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const copy = COPY[locale];
  const [flipped, setFlipped] = useState<ReadonlySet<number>>(() => new Set());
  const [sorted, setSorted] = useState<ReadonlySet<number>>(() => new Set());
  const [mistakes, setMistakes] = useState(0);

  const flip = (id: number) => {
    if (sorted.has(id)) return;
    setFlipped((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const sortInto = (card: PatternCard, target: "proven" | "anti") => {
    if (sorted.has(card.id)) return;
    if (card.type === target) {
      const next = new Set(sorted);
      next.add(card.id);
      setSorted(next);
      if (next.size === CARDS.length) complete();
    } else {
      setMistakes((n) => n + 1);
    }
  };

  return (
    <div className="min-w-0 max-w-full border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
        {copy.eyebrow}
      </p>
      <p className="mb-3 font-mono text-xs text-muted-foreground">
        {copy.sorted}: {sorted.size}/{CARDS.length} · {copy.mistakes}:{" "}
        {mistakes}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CARDS.map((card) => {
          const isFlipped = flipped.has(card.id);
          const isSorted = sorted.has(card.id);
          if (isSorted) return null;
          return (
            <div
              key={card.id}
              className="min-w-0 border-2 border-border bg-background p-2 text-center"
            >
              {isFlipped ? (
                <>
                  <p className="break-words font-mono text-xs font-bold text-brand-orange">
                    {card.title[locale]}
                  </p>
                  <p className="mt-1 break-words font-mono text-xs text-muted-foreground">
                    {card.desc[locale]}
                  </p>
                  <div className="mt-2 flex flex-col gap-1 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => sortInto(card, "proven")}
                      aria-label={`${copy.proven}: ${card.title[locale]}`}
                      className="min-h-11 flex-1 border border-risk-green bg-risk-green/10 px-1.5 py-1 font-mono text-xs font-bold uppercase text-risk-green"
                    >
                      {copy.proven}
                    </button>
                    <button
                      type="button"
                      onClick={() => sortInto(card, "anti")}
                      aria-label={`${copy.avoid}: ${card.title[locale]}`}
                      className="min-h-11 flex-1 border border-destructive bg-destructive/10 px-1.5 py-1 font-mono text-xs font-bold uppercase text-destructive"
                    >
                      {copy.avoid}
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => flip(card.id)}
                  aria-label={`${copy.flipCard} ${card.id}`}
                  className="flex h-16 w-full items-center justify-center font-mono text-[18px] text-foreground hover:text-brand-orange"
                >
                  {String(card.id).padStart(2, "0")}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {sorted.size === CARDS.length && (
        <p
          className={cn(
            "mt-4 text-center font-mono text-[13px] font-bold text-risk-green",
          )}
        >
          {copy.complete} {done ? "✓" : ""}
        </p>
      )}
    </div>
  );
}

export default L11PatternCardsLab;

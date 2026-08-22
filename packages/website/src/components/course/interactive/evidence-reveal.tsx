"use client";

import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { PredictionPrompt, type PredictionOption } from "./prediction-prompt";

/*
 * EvidenceReveal — a claim, the learner's guess, and the numbers that settle
 * it, in that order.
 *
 * Lessons usually assert a figure and move on, which asks the reader to
 * believe rather than to check. Here the evidence stays out of the document
 * until a prediction exists, then lands beside the guess so the gap is the
 * lesson. Sources are named on every row, because a figure the reader cannot
 * trace is no better than the assertion it replaced.
 *
 * A client component: it hands PredictionPrompt a function child in order to
 * render the committed answer next to the real one.
 *
 * Chrome copy is bilingual here; `claim`, `question`, `actual`, `reading` and
 * the evidence rows come from the callsite, which owns their translations.
 */

export interface EvidenceItem {
  /** What was measured. */
  readonly label: string;
  /** The figure or finding itself. */
  readonly value: string;
  /** Where it comes from, e.g. "Destatis, Unternehmensregister 2024". */
  readonly source?: string;
  /** Primary source for `source`. Opened in a new tab. */
  readonly sourceHref?: string;
}

export interface EvidenceRevealProps {
  /** The statement the evidence is held against. */
  readonly claim: string;
  /** What the learner predicts before seeing any of it. */
  readonly question: string;
  /** The real answer, shown beside the learner's guess. */
  readonly actual: string;
  readonly evidence: readonly EvidenceItem[];
  readonly locale: Locale;
  /** Fixed choices. Omit for a free-text estimate. */
  readonly options?: readonly PredictionOption[];
  readonly placeholder?: string;
  /** One line on what the distance between guess and evidence means. */
  readonly reading?: string;
  readonly className?: string;
}

interface EvidenceCopy {
  readonly kicker: string;
  readonly guessLabel: string;
  readonly actualLabel: string;
  readonly evidenceLabel: string;
  readonly readingLabel: string;
}

const COPY: Readonly<Record<Locale, EvidenceCopy>> = {
  de: {
    kicker: "Beleg prüfen",
    guessLabel: "Deine Schätzung",
    actualLabel: "Tatsächlich",
    evidenceLabel: "Belege",
    readingLabel: "Einordnung",
  },
  en: {
    kicker: "Check the evidence",
    guessLabel: "Your prediction",
    actualLabel: "Actual",
    evidenceLabel: "Evidence",
    readingLabel: "What it means",
  },
};

export function EvidenceReveal({
  claim,
  question,
  actual,
  evidence,
  locale,
  options,
  placeholder,
  reading,
  className,
}: EvidenceRevealProps) {
  const copy = COPY[locale];

  return (
    <PredictionPrompt
      question={question}
      context={claim}
      kicker={copy.kicker}
      locale={locale}
      options={options}
      placeholder={placeholder}
      className={className}
    >
      {(answer) => (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <ValueTile label={copy.guessLabel} value={answer.text} />
            <ValueTile label={copy.actualLabel} value={actual} isActual />
          </div>

          {evidence.length > 0 && (
            <>
              <p className="mt-6 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {copy.evidenceLabel}
              </p>
              <ul className="mt-2 divide-y divide-border border-t border-border">
                {evidence.map((item) => (
                  <li
                    key={item.label}
                    className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline"
                  >
                    <span className="min-w-0">
                      <span className="block break-words text-[14px] leading-[1.5] text-foreground">
                        {item.label}
                      </span>
                      {item.source && (
                        <span className="mt-0.5 block break-words text-[12.5px] leading-[1.5] text-muted-foreground">
                          <SourceRef
                            source={item.source}
                            href={item.sourceHref}
                          />
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[15px] font-semibold text-foreground sm:text-right">
                      {item.value}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {reading && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
                {copy.readingLabel}
              </p>
              <p className="mt-1.5 max-w-[640px] text-[14px] leading-[1.6] text-foreground">
                {reading}
              </p>
            </div>
          )}
        </>
      )}
    </PredictionPrompt>
  );
}

function ValueTile({
  label,
  value,
  isActual = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly isActual?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-2 bg-background p-4",
        isActual ? "border-brand-orange" : "border-border",
      )}
    >
      <p
        className={cn(
          "font-mono text-[10.5px] font-bold uppercase tracking-[0.14em]",
          isActual ? "text-brand-orange" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <p className="mt-2 break-words text-[18px] font-semibold leading-[1.3] tracking-[-0.02em] text-foreground">
        {value}
      </p>
    </div>
  );
}

function SourceRef({
  source,
  href,
}: {
  readonly source: string;
  readonly href?: string;
}) {
  if (!href) return <>{source}</>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 transition-colors hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {source}
    </a>
  );
}

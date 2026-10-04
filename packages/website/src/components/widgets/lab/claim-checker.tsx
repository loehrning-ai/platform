"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, FileText, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AnimatedNumber,
  LAB_SPRING,
  LabButton,
  LabLive,
  LabSurface,
  LabVerdictPill,
  labLocale,
  useLabCompletion,
  type LabBaseProps,
} from "./_lab";

export type ClaimVerdict = "supported" | "contradicted" | "missing";

export interface ClaimSource {
  readonly id: string;
  readonly label: string;
  readonly text: string;
}

export type ClaimDraftSegment =
  | { readonly text: string; readonly claimId?: undefined }
  | { readonly text: string; readonly claimId: string };

export interface ClaimDefinition {
  readonly id: string;
  readonly verdict: ClaimVerdict;
  /** Source that supports or contradicts the claim. */
  readonly sourceId?: string;
  /** Exact quote from the source pack. */
  readonly evidence?: string;
  /** Correct wording (for contradicted / missing claims). */
  readonly correction?: string;
  readonly why: string;
}

export interface ClaimCheckerProps extends LabBaseProps {
  readonly sources: readonly ClaimSource[];
  readonly draftLabel?: string;
  readonly draft: readonly ClaimDraftSegment[];
  readonly claims: readonly ClaimDefinition[];
  /** Share of claims that must be judged right to count as done. Default 0. */
  readonly passRatio?: number;
}

const COPY = {
  de: {
    region: "Aussagen gegen Quellen prüfen",
    sources: "Quellenpaket",
    draft: "KI-Entwurf",
    pickClaim: "Tippe eine unterstrichene Aussage an und bewerte sie.",
    verdictFor: "Diese Aussage ist",
    verdicts: {
      supported: "belegt",
      contradicted: "widersprochen",
      missing: "nicht in den Quellen",
    },
    marked: (n: number, total: number) => `${n} von ${total} Aussagen bewertet`,
    evaluate: "Auswerten",
    again: "Nochmal prüfen",
    score: "richtig bewertet",
    correctVerdict: "Richtig wäre",
    evidence: "Beleg",
    correction: "Korrekt",
    notMarked: "nicht bewertet",
    previous: "Vorherige Aussage",
    next: "Nächste Aussage",
    belowPass: "Mehrere Aussagen falsch bewertet. Lies die Belege und prüfe nochmal.",
  },
  en: {
    region: "Check claims against sources",
    sources: "Source pack",
    draft: "AI draft",
    pickClaim: "Tap an underlined claim and judge it.",
    verdictFor: "This claim is",
    verdicts: {
      supported: "supported",
      contradicted: "contradicted",
      missing: "not in the sources",
    },
    marked: (n: number, total: number) => `${n} of ${total} claims judged`,
    evaluate: "Evaluate",
    again: "Check again",
    score: "judged correctly",
    correctVerdict: "Correct verdict",
    evidence: "Evidence",
    correction: "Correct wording",
    notMarked: "not judged",
    previous: "Previous claim",
    next: "Next claim",
    belowPass: "Several claims judged wrongly. Read the evidence and check again.",
  },
} as const;

const VERDICTS: readonly ClaimVerdict[] = ["supported", "contradicted", "missing"];

/** Pure scoring (exported for tests). */
export function scoreClaims(
  claims: readonly ClaimDefinition[],
  marks: Readonly<Record<string, ClaimVerdict>>,
): number {
  return claims.filter((claim) => marks[claim.id] === claim.verdict).length;
}

export function ClaimCheckerWidget({
  sources,
  draftLabel,
  draft,
  claims,
  passRatio = 0,
  lessonId,
  cpId,
  locale,
  title,
}: ClaimCheckerProps): JSX.Element {
  const lang = labLocale(locale);
  const copy = COPY[lang];
  const { complete } = useLabCompletion({ lessonId, cpId });
  const [marks, setMarks] = useState<Record<string, ClaimVerdict>>({});
  const [active, setActive] = useState<string | null>(claims[0]?.id ?? null);
  const [revealed, setRevealed] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // The evaluate button disappears on reveal: move focus to the result.
  useEffect(() => {
    if (revealed) resultRef.current?.focus();
  }, [revealed]);

  const markedCount = claims.filter((claim) => marks[claim.id]).length;
  const allMarked = markedCount === claims.length && claims.length > 0;
  const score = scoreClaims(claims, marks);
  const passed = claims.length > 0 && score / claims.length >= passRatio;
  const claimById = new Map(claims.map((claim) => [claim.id, claim]));
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const activeIndex = claims.findIndex((claim) => claim.id === active);

  const mark = (claimId: string, verdict: ClaimVerdict) => {
    if (revealed) return;
    const next = { ...marks, [claimId]: verdict };
    setMarks(next);
    const nextOpen = claims.find((claim) => !next[claim.id]);
    if (nextOpen) setActive(nextOpen.id);
  };

  const evaluate = () => {
    setRevealed(true);
    if (claims.length > 0 && scoreClaims(claims, marks) / claims.length >= passRatio) {
      complete();
    }
  };

  const reset = () => {
    setMarks({});
    setRevealed(false);
    setActive(claims[0]?.id ?? null);
  };

  return (
    <LabSurface label={copy.region} title={title}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Sources */}
        <div>
          <p className="mb-2 text-label text-muted-foreground">{copy.sources}</p>
          <ul className="space-y-2">
            {sources.map((source) => (
              <li
                key={source.id}
                data-source-id={source.id}
                className="rounded-2xl border border-lab-line bg-paper p-3 shadow-lab-sm"
              >
                <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <FileText className="h-4 w-4 text-lab-accent" aria-hidden="true" />
                  {source.label}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/90">{source.text}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Draft */}
        <div>
          <p className="mb-2 text-label text-muted-foreground">{draftLabel ?? copy.draft}</p>
          <div className="rounded-2xl border border-lab-line bg-card p-4 text-[17px] leading-[1.9] text-foreground shadow-lab-sm">
            {draft.map((segment, index) => {
              if (!segment.claimId) return <span key={index}>{segment.text}</span>;
              const claim = claimById.get(segment.claimId);
              const verdict = marks[segment.claimId];
              const right = revealed && claim && verdict === claim.verdict;
              const wrong = revealed && claim && verdict !== claim.verdict;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActive(segment.claimId)}
                  aria-pressed={active === segment.claimId}
                  data-claim-id={segment.claimId}
                  className={cn(
                    "mx-0.5 inline min-h-11 rounded-md px-1 py-0.5 text-left underline decoration-2 underline-offset-4 transition-[background-color,text-decoration-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent",
                    !revealed && !verdict && "decoration-lab-accent/60 hover:bg-lab-accent-soft",
                    !revealed && verdict && "bg-lab-accent-soft decoration-lab-accent",
                    active === segment.claimId && !revealed && "ring-2 ring-lab-accent/40",
                    right && "bg-lab-good-soft decoration-lab-good",
                    wrong && "bg-lab-bad-soft decoration-lab-bad",
                  )}
                >
                  {segment.text}
                  {verdict ? <span className="sr-only"> ({copy.verdicts[verdict]})</span> : null}
                </button>
              );
            })}
          </div>

          {/* Verdict picker */}
          {!revealed && active && activeIndex >= 0 ? (
            <div className="mt-3 rounded-2xl bg-inset/60 p-3" role="group" aria-label={copy.verdictFor}>
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 text-sm text-muted-foreground">
                  <span className="tabular-nums">{activeIndex + 1}/{claims.length}</span> · {copy.verdictFor}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label={copy.previous}
                    disabled={activeIndex <= 0}
                    onClick={() => setActive(claims[activeIndex - 1]?.id ?? active)}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-foreground hover:bg-card disabled:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={copy.next}
                    disabled={activeIndex >= claims.length - 1}
                    onClick={() => setActive(claims[activeIndex + 1]?.id ?? active)}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-foreground hover:bg-card disabled:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <p className="mt-1 rounded-xl bg-card px-3 py-2 text-[15px] text-foreground">
                „{draft.find((segment) => segment.claimId === active)?.text}“
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {VERDICTS.map((verdict) => (
                  <button
                    key={verdict}
                    type="button"
                    aria-pressed={marks[active] === verdict}
                    onClick={() => mark(active, verdict)}
                    className={cn(
                      "min-h-11 rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent",
                      marks[active] === verdict
                        ? "border-lab-accent bg-lab-accent text-paper"
                        : "border-lab-line bg-card text-foreground hover:border-lab-accent/50",
                    )}
                  >
                    {copy.verdicts[verdict]}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground tabular-nums">
              {revealed ? null : copy.marked(markedCount, claims.length)}
            </p>
            {revealed ? (
              <LabButton tone="ghost" onClick={reset}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {copy.again}
              </LabButton>
            ) : (
              <LabButton onClick={evaluate} disabled={!allMarked}>
                {copy.evaluate}
              </LabButton>
            )}
          </div>
          {!revealed ? <p className="mt-1 text-xs text-muted-foreground">{copy.pickClaim}</p> : null}
        </div>
      </div>

      <LabLive className="sr-only">
        {revealed
          ? `${score}/${claims.length} ${copy.score}.${passed ? "" : ` ${copy.belowPass}`}`
          : null}
      </LabLive>
      <div>
        <AnimatePresence initial={false}>
          {revealed ? (
            <m.div
              ref={resultRef}
              tabIndex={-1}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-5 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
            >
              <div className="flex flex-wrap items-baseline gap-3">
                <p className="text-num-lg font-bold text-foreground">
                  <AnimatedNumber value={score} format={(value) => String(Math.round(value))} />
                  <span className="text-muted-foreground">/{claims.length}</span>
                </p>
                <LabVerdictPill tone={passed ? "good" : "warn"}>{copy.score}</LabVerdictPill>
              </div>
              {!passed ? <p className="mt-2 text-sm text-lab-warn">{copy.belowPass}</p> : null}
              <ol className="mt-3 space-y-2">
                {claims.map((claim, index) => {
                  const verdict = marks[claim.id];
                  const right = verdict === claim.verdict;
                  const source = claim.sourceId ? sourceById.get(claim.sourceId) : undefined;
                  const text = draft.find((segment) => segment.claimId === claim.id)?.text ?? claim.id;
                  return (
                    <m.li
                      key={claim.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...LAB_SPRING, delay: index * 0.06 }}
                      data-claim-result={right ? "right" : "wrong"}
                      className={cn(
                        "rounded-2xl border p-3 text-sm leading-relaxed",
                        right ? "border-lab-good/30 bg-lab-good-soft" : "border-lab-bad/30 bg-lab-bad-soft",
                      )}
                    >
                      <p className="flex items-start gap-2 font-semibold text-foreground">
                        <span aria-hidden="true" className={right ? "text-lab-good" : "text-lab-bad"}>
                          {right ? <Check className="mt-0.5 h-4 w-4" /> : <X className="mt-0.5 h-4 w-4" />}
                        </span>
                        <span>„{text}“</span>
                      </p>
                      <p className="mt-1 text-foreground">
                        {copy.correctVerdict}: <strong>{copy.verdicts[claim.verdict]}</strong>
                        {!right ? ` (${verdict ? copy.verdicts[verdict] : copy.notMarked})` : null}
                      </p>
                      {claim.evidence ? (
                        <p className="mt-1 text-muted-foreground">
                          {copy.evidence}
                          {source ? ` (${source.label})` : ""}: „{claim.evidence}“
                        </p>
                      ) : null}
                      {claim.correction ? (
                        <p className="mt-1 text-foreground">
                          {copy.correction}: {claim.correction}
                        </p>
                      ) : null}
                      <p className="mt-1 text-muted-foreground">{claim.why}</p>
                    </m.li>
                  );
                })}
              </ol>
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>
    </LabSurface>
  );
}

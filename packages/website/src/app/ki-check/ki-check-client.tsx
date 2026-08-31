"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { withMotionProvider } from "@/components/motion/with-motion-provider";
import { BrandButton } from "@/components/ui/brand-button";
import type { Locale } from "@/lib/i18n/locale";
import { DIMENSION_ORDER } from "@/lib/ki-check/questions";
import {
  KI_CHECK_CONTENT,
  KI_CHECK_UI_COPY,
  localizedDimension,
  localizedRating,
  localizedStage,
} from "@/lib/ki-check/localization";
import { computeResult } from "@/lib/ki-check/scoring";
import { recommend } from "@/lib/ki-check/recommend";
import type {
  Answer,
  DimensionId,
  DimensionResult,
} from "@/lib/ki-check/types";
import { iconByName } from "@/lib/courses/track-icon";
import { DimensionRail } from "./step-indicator";
import { RUNG_INK, dimensionTone } from "./dimension-tones";
import { CompetencyLegend, RadarChart } from "./radar-chart";
import { DimensionBars } from "./dimension-bars";
import { dimensionIcon } from "./dimension-icons";
import { DiagnosticFrame } from "./diagnostic-frame";

/** The six rungs of the KI-Kompetenzweg, in order, for the pathway strip. */
const STAGE_ORDER = [
  "pruefen",
  "grundlagen",
  "regeln",
  "anwenden",
  "dokumentieren",
  "vertiefen",
] as const;

/** Maps the recommended focus dimension to the rung it lights up. */
const FOCUS_TO_STAGE: Record<DimensionId, (typeof STAGE_ORDER)[number]> = {
  grundlagen: "grundlagen",
  urteil: "grundlagen",
  recht: "regeln",
  verantwortung: "regeln",
  praxis: "anwenden",
};

const stateVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

function KiCheckClientContent({ locale = "de" }: { readonly locale?: Locale }) {
  const content = KI_CHECK_CONTENT[locale];
  const prefersReducedMotion = useReducedMotion();
  const questions = content.questions;
  const ui = KI_CHECK_UI_COPY[locale];
  const [hydrated, setHydrated] = useState(false);
  const [index, setIndex] = useState(0);
  // questionId -> chosen option index. Single source of truth for the whole run.
  const [choices, setChoices] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  // Focus moves via ref callbacks (not an effect) so it survives the
  // AnimatePresence exit->enter swap: the new heading focuses the moment it
  // actually mounts, whether that is instant (tests) or after the exit (app).
  const pendingFocus = useRef(false);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const focusHeading = useCallback((node: HTMLHeadingElement | null) => {
    if (node && pendingFocus.current) {
      pendingFocus.current = false;
      node.focus();
    }
  }, []);

  const question = questions[index];
  const selected = choices[question?.id] ?? null;
  const isLast = index === questions.length - 1;
  const answeredCount = Object.keys(choices).length;

  const totalByDimension = useMemo(() => {
    const acc = Object.fromEntries(
      DIMENSION_ORDER.map((id) => [id, 0]),
    ) as Record<DimensionId, number>;
    for (const q of questions) acc[q.dimensionId] += 1;
    return acc;
  }, [questions]);

  const answeredByDimension = useMemo(() => {
    const acc = Object.fromEntries(
      DIMENSION_ORDER.map((id) => [id, 0]),
    ) as Record<DimensionId, number>;
    for (const q of questions) {
      if (choices[q.id] !== undefined) acc[q.dimensionId] += 1;
    }
    return acc;
  }, [choices, questions]);

  const rawResult = useMemo(() => {
    if (!done) return null;
    const answers: Answer[] = questions
      .filter((q) => choices[q.id] !== undefined)
      .map((q) => ({
        questionId: q.id,
        dimensionId: q.dimensionId,
        score: q.options[choices[q.id]].score,
      }));
    return computeResult(answers);
  }, [done, choices, questions]);

  const result = useMemo(() => {
    if (!rawResult) return null;
    const localizeDimensionResult = (
      dimension: DimensionResult,
    ): DimensionResult => {
      const meta = localizedDimension(locale, dimension.id);
      const rating = localizedRating(locale, dimension.normalizedScore);
      return {
        ...dimension,
        name: meta.name,
        short: meta.short,
        description: meta.description,
        ratingLabel: rating.label,
        ratingToneVar: rating.toneVar,
      };
    };
    const stage = localizedStage(locale, rawResult.stageLevel);
    return {
      ...rawResult,
      stageLabel: stage.label,
      stageBlurb: stage.blurb,
      dimensions: rawResult.dimensions.map(localizeDimensionResult),
      strengths: rawResult.strengths.map(localizeDimensionResult),
      gaps: rawResult.gaps.map(localizeDimensionResult),
    };
  }, [locale, rawResult]);

  const recommendation = rawResult ? recommend(rawResult, locale) : null;

  function pick(optionIndex: number) {
    setChoices((prev) => ({ ...prev, [question.id]: optionIndex }));
  }

  function handleOptionKeyDown(
    optionIndex: number,
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) {
    const lastIndex = question.options.length - 1;
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = optionIndex === lastIndex ? 0 : optionIndex + 1;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = optionIndex === 0 ? lastIndex : optionIndex - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    pick(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  }

  function goNext() {
    if (selected === null) return;
    pendingFocus.current = true;
    if (isLast) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function goBack() {
    if (index === 0) return;
    pendingFocus.current = true;
    setIndex((i) => i - 1);
  }

  function restart() {
    pendingFocus.current = true;
    setChoices({});
    setIndex(0);
    setDone(false);
  }

  // ------------------------------------------------------------------ RESULT
  if (done && result && recommendation) {
    const RecIcon = iconByName(recommendation.iconName);
    const activeStage = FOCUS_TO_STAGE[recommendation.focusDimensionId];
    const strongest = result.strengths[0];
    const alsoStrong = result.strengths[1];
    const weakest = result.gaps[0];
    const alsoGap = result.gaps[1];
    const StrongIcon = strongest ? dimensionIcon(strongest.iconName) : Sparkles;
    const WeakIcon = weakest ? dimensionIcon(weakest.iconName) : Target;

    // A one-time staggered settle across the result's six primary blocks, not
    // a loop: each block finishes at opacity 1 / y 0 and stays there.
    const reveal = (step: number) => ({
      initial: prefersReducedMotion ? false : { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3,
        delay: prefersReducedMotion ? 0 : step * 0.06,
      },
    });

    return (
      <DiagnosticFrame state="result" wide>
        <m.header
          className="border-b border-foreground bg-brand-sky/12 p-4 pt-6 sm:p-6 sm:pt-7"
          {...reveal(0)}
        >
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
            {ui.resultEyebrow}
          </p>
          <h1
            ref={focusHeading}
            tabIndex={-1}
            className="mt-2 max-w-[18ch] text-[clamp(2.125rem,1.7rem+2vw,3.25rem)] font-bold leading-[1.02] tracking-[-0.04em] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            {ui.resultTitle}
          </h1>
          <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
            {ui.resultIntroduction}
          </p>
        </m.header>

        <m.section
          className="dark-section grid min-w-0 border-b border-border md:grid-cols-[minmax(0,0.9fr)_minmax(20rem,1.1fr)]"
          aria-label={ui.scorePlateLabel}
          data-score-plate
          {...reveal(1)}
        >
          <div className="min-w-0 p-4 sm:p-6 md:border-r md:border-border">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
              {ui.overall}
            </p>
            <div className="mt-3 flex min-w-0 items-end gap-2">
              <span className="break-words text-[clamp(4.5rem,16vw,7.5rem)] font-bold leading-[0.78] tracking-[-0.07em] text-foreground">
                {Math.round(result.compositeScore)}
              </span>
              <span className="pb-1 font-mono text-sm font-semibold text-muted-foreground sm:pb-2 sm:text-base">
                / 100
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {ui.answered}: {result.answeredCount}/{result.totalQuestions}
            </p>
            <p className="mt-5 break-words text-xl font-semibold text-foreground sm:text-2xl">
              {ui.level} {result.stageLevel}: {result.stageLabel}
            </p>
            <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-muted-foreground">
              {result.stageBlurb}
            </p>
          </div>
          <div className="grid min-w-0 items-center gap-4 border-t border-border p-4 sm:grid-cols-[minmax(12rem,0.9fr)_minmax(0,1fr)] sm:p-6 md:border-t-0">
            <div className="flex min-w-0 justify-center">
              <RadarChart dimensions={result.dimensions} />
            </div>
            <CompetencyLegend
              dimensions={result.dimensions}
              label={ui.competencyLegendLabel}
            />
          </div>
        </m.section>

        <m.div
          className="grid min-w-0 border-b border-foreground sm:grid-cols-2 sm:divide-x sm:divide-border"
          {...reveal(2)}
        >
          {strongest ? (
            <div className="flex min-w-0 items-center gap-3 border-l-[3px] border-l-brand-teal bg-brand-teal/10 p-4 sm:p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-background">
                <StrongIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  {ui.strength}
                </p>
                <p className="mt-1 break-words text-base font-semibold text-foreground">
                  {strongest.name}
                </p>
                {alsoStrong ? (
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    {ui.alsoStrength}: {alsoStrong.name}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
          {weakest ? (
            <div className="flex min-w-0 items-center gap-3 border-t border-l-[3px] border-border border-l-brand-peach bg-brand-peach/14 p-4 sm:border-t-0 sm:p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-background">
                <WeakIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  {ui.gap}
                </p>
                <p className="mt-1 break-words text-base font-semibold text-foreground">
                  {weakest.name}
                </p>
                {alsoGap ? (
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    {ui.alsoGap}: {alsoGap.name}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </m.div>

        <m.section
          className="min-w-0 border-b border-foreground p-4 sm:p-6"
          {...reveal(3)}
        >
          <h2 className="text-xl font-bold tracking-[-0.02em] text-foreground sm:text-2xl">
            {ui.fieldsTitle}
          </h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
            {ui.fieldsBody}
          </p>
          <div className="mt-4 min-w-0">
            <DimensionBars dimensions={result.dimensions} />
          </div>
        </m.section>

        <m.section
          className="min-w-0 border-b border-l-[3px] border-foreground border-l-brand-orange bg-kupfer-mist p-4 sm:p-6"
          data-next-proof-panel
          {...reveal(4)}
        >
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
            {ui.nextStep}
          </p>
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-[3rem_minmax(0,1fr)]">
            <span className="flex h-12 w-12 items-center justify-center border border-border bg-background">
              <RecIcon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="break-words font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                {recommendation.badge}
              </p>
              <h3 className="mt-2 break-words text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
                {recommendation.courseTitle}
              </h3>
              <p className="mt-3 max-w-[65ch] break-words text-base leading-relaxed text-muted-foreground">
                {recommendation.reasoning}
              </p>
              <div className="mt-5 flex min-w-0 flex-wrap items-center gap-2">
                <span data-primary-action>
                  <BrandButton
                    href={recommendation.startHref}
                    prefetch={false}
                    className="max-w-full"
                  >
                    {ui.startCourse}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </BrandButton>
                </span>
                <BrandButton
                  href={recommendation.courseHref}
                  variant="ghost"
                  size="sm"
                >
                  {ui.courseOverview}
                </BrandButton>
              </div>
            </div>
          </div>
        </m.section>

        <m.section
          className="min-w-0 border-b border-foreground p-4 sm:p-6"
          {...reveal(5)}
        >
          <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {ui.pathway}
          </p>
          <ol className="grid min-w-0 border border-border sm:grid-cols-3 lg:grid-cols-6">
            {STAGE_ORDER.map((stageId, i) => {
              const isActive = stageId === activeStage;
              return (
                <li
                  key={stageId}
                  aria-current={isActive ? "step" : undefined}
                  className={`relative min-w-0 border-b border-border px-3 py-3 last:border-b-0 sm:border-b sm:border-r lg:border-b-0 ${
                    isActive ? "bg-kupfer-mist" : ""
                  }`}
                >
                  <span className="block font-mono text-xs font-bold tabular-nums text-brand-orange">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-1 block break-words text-sm font-semibold text-foreground">
                    {ui.pathwayLabels[stageId]}
                  </span>
                  {isActive ? (
                    <span
                      className="absolute inset-y-0 left-0 w-1 bg-brand-orange"
                      aria-hidden="true"
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </m.section>

        <details className="group min-w-0 border-b border-foreground" data-method-limits>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground marker:content-none sm:px-6">
            <span className="min-w-0 break-words">{ui.methodSummary}</span>
            <span
              className="shrink-0 font-mono text-brand-orange transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none"
              aria-hidden="true"
            >
              +
            </span>
          </summary>
          <div className="border-t border-border px-4 py-4 sm:px-6">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
              {ui.methodTitle}
            </h2>
            <p className="mt-2 max-w-[72ch] break-words text-sm leading-relaxed text-muted-foreground">
              {ui.methodBody}
            </p>
            <p className="mt-2 max-w-[72ch] break-words text-sm leading-relaxed text-muted-foreground">
              {ui.privacyBody}
            </p>
          </div>
        </details>

        <div className="p-4 sm:px-6">
          <button
            type="button"
            onClick={restart}
            className="inline-flex min-h-11 max-w-full items-center gap-2 break-words py-2 text-left text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
            {ui.restart}
          </button>
        </div>
      </DiagnosticFrame>
    );
  }

  // -------------------------------------------------------------------- QUIZ
  const meta = localizedDimension(locale, question.dimensionId);
  const DimIcon = dimensionIcon(meta.iconName);
  const progress = Math.round((answeredCount / questions.length) * 100);
  const chosenOption = selected !== null ? question.options[selected] : null;
  const questionHeadingId = `ki-check-question-${question.id}`;

  return (
    <DiagnosticFrame state="question">
      <header className="border-b border-foreground bg-brand-sky/12 p-4 pt-6 sm:p-6 sm:pt-7">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
          {ui.quizEyebrow}
        </p>
        <h1 className="mt-2 max-w-[18ch] text-[clamp(2.125rem,1.7rem+2vw,3.25rem)] font-bold leading-[1.02] tracking-[-0.04em] text-foreground">
          {ui.quizTitle}
        </h1>
        <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
          {ui.quizIntroduction}
        </p>
        {/* The five fields, as a key. It tells the learner up front what the
            run measures, and it is the legend for the colours the rail and the
            field chip use from here on. */}
        <ul className="mt-4 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          {content.dimensions.map((dim) => (
            <li
              key={dim.id}
              className="flex min-w-0 items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground"
            >
              <span
                aria-hidden="true"
                className={`block h-2.5 w-2.5 border border-foreground/30 ${dimensionTone(dim.id).solid}`}
              />
              <span className="min-w-0 break-words">{dim.short}</span>
            </li>
          ))}
        </ul>
      </header>

      <div className="grid min-w-0 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="min-w-0 lg:border-r lg:border-foreground">
          <DimensionRail
            label={ui.dimensionRailLabel}
            currentDimensionId={question.dimensionId}
            answeredByDimension={answeredByDimension}
            totalByDimension={totalByDimension}
            dimensions={content.dimensions}
            factsLabel={ui.railFactsLabel}
            facts={ui.railFacts}
          />
        </aside>

        <div className="min-w-0 p-4 sm:p-6" data-question-instrument>
          <div>
            <div
              role="status"
              aria-live="polite"
              className="mb-2 flex min-w-0 items-center justify-between gap-3 font-mono text-xs font-medium text-muted-foreground"
            >
              <span className="min-w-0 break-words">
                {ui.question} {index + 1} {ui.of} {questions.length}
              </span>
              <span className="shrink-0 tabular-nums">{progress}%</span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden bg-track"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={ui.progressLabel}
            >
              <m.div
                className="h-full origin-left bg-brand-orange"
                initial={false}
                animate={{ scaleX: progress / 100 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                style={{ transformOrigin: "left center" }}
              />
            </div>
          </div>

          <section className="mt-5 min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={question.id}
                variants={stateVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center border border-border ${dimensionTone(question.dimensionId).wash}`}
                  >
                    <DimIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 break-words font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    {meta.name}
                  </span>
                </div>

                <h2
                  id={questionHeadingId}
                  ref={focusHeading}
                  tabIndex={-1}
                  className="mt-4 max-w-[34ch] break-words text-[clamp(1.375rem,1.15rem+1vw,1.75rem)] font-bold leading-snug tracking-[-0.02em] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                >
                  {question.text}
                </h2>

                <div
                  className="mt-5 min-w-0 border border-border"
                  role="radiogroup"
                  aria-labelledby={questionHeadingId}
                  data-answer-group
                >
                  {question.options.map((option, i) => {
                    const isPicked = selected === i;
                    // The options ARE a Likert ladder, so the rung meter is
                    // drawn from the option's own score rather than its
                    // position. It is visible before anything is picked, which
                    // is what makes the four rows read as one ordered scale
                    // instead of four unrelated boxes.
                    const rung = option.score;
                    return (
                      <button
                        key={option.text}
                        ref={(node) => {
                          optionRefs.current[i] = node;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={isPicked}
                        tabIndex={isPicked || (selected === null && i === 0) ? 0 : -1}
                        disabled={!hydrated}
                        onClick={() => pick(i)}
                        onKeyDown={(event) => handleOptionKeyDown(i, event)}
                        className={`group flex min-h-11 w-full min-w-0 items-start gap-3 border-b border-l-[3px] border-border px-3 py-3 text-left last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 ${
                          isPicked
                            ? "border-l-brand-orange bg-kupfer-mist"
                            : "border-l-transparent hover:border-l-brand-orange/40 hover:bg-card-hover"
                        }`}
                        data-answer-option
                      >
                        <span
                          className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center border ${
                            isPicked
                              ? "border-brand-orange bg-brand-orange"
                              : "border-muted-foreground group-hover:border-brand-orange"
                          }`}
                          aria-hidden="true"
                        >
                          {isPicked ? (
                            <span className="h-1.5 w-1.5 bg-white" />
                          ) : null}
                        </span>
                        <span
                          className="mt-1.5 flex shrink-0 items-end gap-[2px]"
                          aria-hidden="true"
                        >
                          {[1, 2, 3, 4].map((step) => (
                            <span
                              key={step}
                              className={`block w-1 ${
                                step <= rung
                                  ? RUNG_INK[rung - 1]
                                  : "bg-muted-foreground/20"
                              }`}
                              style={{ height: `${2 + step * 2}px` }}
                            />
                          ))}
                        </span>
                        <span className="min-w-0 break-words text-[15px] leading-relaxed text-foreground">
                          {option.text}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div
                  className="mt-4 min-h-12"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  data-answer-feedback
                >
                  {chosenOption ? null : (
                    <p className="grid min-w-0 grid-cols-[1.25rem_minmax(0,1fr)] gap-3 border-l-[3px] border-l-border pl-3 text-sm leading-relaxed text-muted-foreground">
                      <ArrowRight
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 break-words">
                        {ui.chooseHint}
                      </span>
                    </p>
                  )}
                  <AnimatePresence initial={false}>
                    {chosenOption ? (
                      <m.div
                        key={`reveal-${selected}`}
                        initial={prefersReducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                        className="grid min-w-0 grid-cols-[1.25rem_minmax(0,1fr)] gap-3 border-l-[3px] border-l-brand-orange bg-card p-3"
                      >
                        <Compass
                          className="mt-0.5 h-4 w-4 shrink-0 text-brand-sand"
                          aria-hidden="true"
                        />
                        <p className="min-w-0 break-words text-sm leading-relaxed text-foreground">
                          {chosenOption.meaning}
                        </p>
                      </m.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </m.div>
            </AnimatePresence>
          </section>

          <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            {hydrated && index > 0 ? (
              <BrandButton onClick={goBack} variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {ui.back}
              </BrandButton>
            ) : (
              <span aria-hidden="true" className="min-h-11" />
            )}
            <span data-primary-action>
              <BrandButton
                onClick={goNext}
                disabled={!hydrated || selected === null}
                size="sm"
              >
                {isLast ? ui.result : ui.next}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </BrandButton>
            </span>
          </div>

          <p className="mt-3 flex min-w-0 items-start gap-2 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">{ui.reassurance}</span>
          </p>
        </div>
      </div>
    </DiagnosticFrame>
  );
}

export const KiCheckClient = withMotionProvider(KiCheckClientContent);

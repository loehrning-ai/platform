"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
import { StepIndicator } from "./step-indicator";
import { RadarChart } from "./radar-chart";
import { DimensionBars } from "./dimension-bars";
import { dimensionIcon } from "./dimension-icons";

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
    const weakest = result.gaps[0];
    const StrongIcon = strongest ? dimensionIcon(strongest.iconName) : Sparkles;
    const WeakIcon = weakest ? dimensionIcon(weakest.iconName) : Target;

    return (
      <div
        className="mx-auto w-full max-w-[960px] px-4 pb-12 pt-6 sm:px-6 sm:pt-8"
        data-diagnostic-state="result"
      >
        <header className="border-y-2 border-foreground py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-orange">
            {ui.resultEyebrow}
          </p>
          <h1
            ref={focusHeading}
            tabIndex={-1}
            className="mt-2 text-[34px] font-bold leading-[1.02] tracking-[-0.03em] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:text-[44px]"
          >
            {ui.resultTitle}
          </h1>
          <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-muted-foreground">
            {ui.resultIntroduction}
          </p>
        </header>

        <section className="mt-8 grid border-y border-border sm:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)] sm:items-center">
          <div className="py-5 sm:border-r sm:border-border sm:pr-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-orange">
              {ui.overall}
            </p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-[64px] font-bold leading-none tracking-[-0.04em] text-foreground">
                {Math.round(result.compositeScore)}
              </span>
              <span className="pb-2 text-lg font-medium text-muted-foreground">
                / 100
              </span>
            </div>
            <p className="mt-3 text-xl font-semibold text-foreground">
              {ui.level} {result.stageLevel}: {result.stageLabel}
            </p>
            <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-muted-foreground">
              {result.stageBlurb}
            </p>
          </div>
          <div className="flex justify-center border-t border-border py-3 sm:border-t-0 sm:pl-4">
            <RadarChart dimensions={result.dimensions} />
          </div>
        </section>

        <div className="mt-6 grid border-y border-border sm:grid-cols-2 sm:divide-x sm:divide-border">
          {strongest ? (
            <div className="flex items-center gap-3 py-4 sm:pr-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-border">
                <StrongIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {ui.strength}
                </p>
                <p className="text-base font-semibold text-foreground">
                  {strongest.name}
                </p>
              </div>
            </div>
          ) : null}
          {weakest ? (
            <div className="flex items-center gap-3 border-t border-border py-4 sm:border-t-0 sm:pl-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-border">
                <WeakIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {ui.gap}
                </p>
                <p className="text-base font-semibold text-foreground">
                  {weakest.name}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-[-0.02em] text-foreground">
            {ui.fieldsTitle}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{ui.fieldsBody}</p>
          <div className="mt-4">
            <DimensionBars dimensions={result.dimensions} />
          </div>
        </section>

        <section className="mt-10 border-y-2 border-foreground py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-orange">
            {ui.nextStep}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-[3rem_minmax(0,1fr)]">
            <span className="flex h-12 w-12 items-center justify-center border border-border">
              <RecIcon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                {recommendation.badge}
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-foreground">
                {recommendation.courseTitle}
              </h3>
              <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
                {recommendation.reasoning}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                <Link
                  href={recommendation.startHref}
                  prefetch={false}
                  className="inline-flex min-h-11 items-center gap-2 bg-brand-orange px-5 py-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                  data-primary-action
                >
                  {ui.startCourse}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={recommendation.courseHref}
                  className="inline-flex min-h-11 items-center py-2 text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                >
                  {ui.courseOverview}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {ui.pathway}
          </p>
          <ol className="grid border-y border-border sm:grid-cols-3 lg:grid-cols-6">
            {STAGE_ORDER.map((stageId, i) => {
              const isActive = stageId === activeStage;
              return (
                <li
                  key={stageId}
                  className={`min-w-0 border-b-2 px-3 py-3 sm:border-r sm:border-border ${
                    isActive
                      ? "border-b-brand-orange text-brand-orange"
                      : "border-b-transparent text-muted-foreground"
                  }`}
                >
                  <span className="block font-mono text-xs font-bold tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-1 block break-words text-sm font-semibold text-foreground">
                    {ui.pathwayLabels[stageId]}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        <button
          type="button"
          onClick={restart}
          className="mt-6 inline-flex min-h-11 items-center gap-2 py-2 text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {ui.restart}
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------------- QUIZ
  const meta = localizedDimension(locale, question.dimensionId);
  const DimIcon = dimensionIcon(meta.iconName);
  const progress = Math.round((answeredCount / questions.length) * 100);
  const chosenOption = selected !== null ? question.options[selected] : null;

  return (
    <div
      className="mx-auto w-full max-w-[820px] px-4 pb-12 pt-6 sm:px-6 sm:pt-8"
      data-diagnostic-state="question"
    >
      <header className="border-y-2 border-foreground py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-orange">
          {ui.quizEyebrow}
        </p>
        <h1 className="mt-2 text-[34px] font-bold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-[44px]">
          {ui.quizTitle}
        </h1>
        <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
          {ui.quizIntroduction}
        </p>
      </header>

      <div className="mt-5">
        <StepIndicator
          currentDimensionId={question.dimensionId}
          answeredByDimension={answeredByDimension}
          totalByDimension={totalByDimension}
          dimensions={content.dimensions}
        />
      </div>

      <div className="mt-4">
        <div
          role="status"
          aria-live="polite"
          className="mb-2 flex items-center justify-between font-mono text-xs font-medium text-muted-foreground"
        >
          <span>
            {ui.question} {index + 1} {ui.of} {questions.length}
          </span>
          <span className="tabular-nums">{progress}%</span>
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
            className="h-full bg-brand-orange"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          />
        </div>
      </div>

      <section className="mt-5 border-y border-border py-5">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={question.id}
            variants={stateVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center border border-border">
                <DimIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {meta.name}
              </span>
            </div>

            <h2
              ref={focusHeading}
              tabIndex={-1}
              className="mt-4 text-[22px] font-bold leading-snug tracking-[-0.01em] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:text-[26px]"
            >
              {question.text}
            </h2>

            <div className="mt-5 border-y border-border">
              {question.options.map((option, i) => {
                const isPicked = selected === i;
                return (
                  <button
                    key={option.text}
                    type="button"
                    aria-pressed={isPicked}
                    disabled={!hydrated}
                    onClick={() => pick(i)}
                    className={`flex min-h-11 w-full items-start gap-3 border-b border-border px-3 py-3 text-left last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange disabled:cursor-not-allowed disabled:opacity-60 ${
                      isPicked
                        ? "border-l-4 border-l-brand-orange bg-kupfer-mist"
                        : "border-l-4 border-l-transparent hover:border-l-brand-orange hover:bg-card-hover"
                    }`}
                  >
                    <span
                      className={`mt-1 h-3 w-3 shrink-0 border ${
                        isPicked
                          ? "border-brand-orange bg-brand-orange"
                          : "border-muted-foreground"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-[15px] leading-relaxed text-foreground">
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence initial={false}>
              {chosenOption ? (
                <m.div
                  key={`reveal-${selected}`}
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                  className="mt-4 flex items-start gap-3 border-l-4 border-brand-sand py-2 pl-3"
                >
                  <Compass
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand-sand"
                    aria-hidden="true"
                  />
                  <p className="text-sm leading-relaxed text-foreground">
                    {chosenOption.meaning}
                  </p>
                </m.div>
              ) : null}
            </AnimatePresence>
          </m.div>
        </AnimatePresence>
      </section>

      <div className="mt-4 flex items-center justify-between gap-4">
        {hydrated && index > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="inline-flex min-h-11 items-center gap-1.5 py-2 text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {ui.back}
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="invisible inline-flex min-h-11 items-center gap-1.5 py-2 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {ui.back}
          </span>
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={!hydrated || selected === null}
          className="inline-flex min-h-11 items-center gap-2 bg-brand-orange px-5 py-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:bg-track disabled:text-muted-foreground"
          data-primary-action
        >
          {isLast ? ui.result : ui.next}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <p className="mt-6 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <TrendingUp className="h-4 w-4" aria-hidden="true" />
        {ui.reassurance}
      </p>
    </div>
  );
}

export const KiCheckClient = withMotionProvider(KiCheckClientContent);

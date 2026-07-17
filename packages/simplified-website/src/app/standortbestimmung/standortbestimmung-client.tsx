"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Card, IconTile } from "@/components/ui/card";
import { BrandButton } from "@/components/ui/brand-button";
import { PATHWAY_STAGE_DISPLAY } from "@/lib/learning-graph";
import {
  DIMENSION_ORDER,
  QUESTIONS,
  TOTAL_QUESTIONS,
  dimensionMetaFor,
} from "@/lib/ki-check/questions";
import { computeResult } from "@/lib/ki-check/scoring";
import { recommend } from "@/lib/ki-check/recommend";
import type { Answer, DimensionId } from "@/lib/ki-check/types";
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

const slideVariants = {
  enter: { opacity: 0, x: 28 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -28 },
};

export function StandortbestimmungClient() {
  const [index, setIndex] = useState(0);
  // questionId -> chosen option index. Single source of truth for the whole run.
  const [choices, setChoices] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  // Focus moves via ref callbacks (not an effect) so it survives the
  // AnimatePresence exit->enter swap: the new heading focuses the moment it
  // actually mounts, whether that is instant (tests) or after the exit (app).
  const pendingFocus = useRef(false);
  const focusHeading = useCallback((node: HTMLHeadingElement | null) => {
    if (node && pendingFocus.current) {
      pendingFocus.current = false;
      node.focus();
    }
  }, []);

  const question = QUESTIONS[index];
  const selected = choices[question?.id] ?? null;
  const isLast = index === QUESTIONS.length - 1;
  const answeredCount = Object.keys(choices).length;

  const totalByDimension = useMemo(() => {
    const acc = Object.fromEntries(
      DIMENSION_ORDER.map((id) => [id, 0]),
    ) as Record<DimensionId, number>;
    for (const q of QUESTIONS) acc[q.dimensionId] += 1;
    return acc;
  }, []);

  const answeredByDimension = useMemo(() => {
    const acc = Object.fromEntries(
      DIMENSION_ORDER.map((id) => [id, 0]),
    ) as Record<DimensionId, number>;
    for (const q of QUESTIONS) {
      if (choices[q.id] !== undefined) acc[q.dimensionId] += 1;
    }
    return acc;
  }, [choices]);

  const result = useMemo(() => {
    if (!done) return null;
    const answers: Answer[] = QUESTIONS.filter(
      (q) => choices[q.id] !== undefined,
    ).map((q) => ({
      questionId: q.id,
      dimensionId: q.dimensionId,
      score: q.options[choices[q.id]].score,
    }));
    return computeResult(answers);
  }, [done, choices]);

  const recommendation = result ? recommend(result) : null;

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
      <div className="mx-auto max-w-[880px] px-6 pb-32 pt-16 sm:pt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-orange">
          KI-Check · Dein Ergebnis
        </p>
        <h1
          ref={focusHeading}
          tabIndex={-1}
          className="mt-4 text-[34px] font-bold leading-[1.02] tracking-[-0.03em] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:text-[44px]"
        >
          Hier stehst du gerade.
        </h1>
        <p className="mt-4 max-w-[560px] text-base leading-relaxed text-muted-foreground">
          Dein Profil über fünf Kompetenzfelder, dazu der Kurs, der dich am
          weitesten bringt. Alles nur in deinem Browser gerechnet.
        </p>

        {/* Hero band: composite score + radar */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-10 grid gap-8 rounded-2xl bg-kupfer-mist p-8 sm:grid-cols-[1fr_auto] sm:items-center sm:p-10"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-orange">
              Gesamtstand
            </p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-[68px] font-bold leading-none tracking-[-0.04em] text-foreground">
                {Math.round(result.compositeScore)}
              </span>
              <span className="pb-2 text-lg font-medium text-muted-foreground">
                / 100
              </span>
            </div>
            <p className="mt-3 text-xl font-semibold text-foreground">
              Stufe {result.stageLevel}: {result.stageLabel}
            </p>
            <p className="mt-2 max-w-[420px] text-sm leading-relaxed text-muted-foreground">
              {result.stageBlurb}
            </p>
          </div>
          <div className="flex justify-center">
            <RadarChart dimensions={result.dimensions} />
          </div>
        </m.div>

        {/* Strength + gap at a glance */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {strongest && (
            <Card accent="sand" className="gap-1">
              <div className="flex items-center gap-3">
                <IconTile icon={StrongIcon} accent="sand" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Deine Stärke
                  </p>
                  <p className="text-base font-semibold text-foreground">
                    {strongest.name}
                  </p>
                </div>
              </div>
            </Card>
          )}
          {weakest && (
            <Card accent="amber" className="gap-1">
              <div className="flex items-center gap-3">
                <IconTile icon={WeakIcon} accent="amber" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Größtes Potenzial
                  </p>
                  <p className="text-base font-semibold text-foreground">
                    {weakest.name}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Per-dimension breakdown */}
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-[-0.02em] text-foreground">
            Deine fünf Kompetenzfelder
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            So verteilt sich dein Stand. Je voller der Balken, desto sicherer.
          </p>
          <div className="mt-6">
            <DimensionBars dimensions={result.dimensions} />
          </div>
        </section>

        {/* Recommendation */}
        <section className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-orange">
            Dein nächster Schritt
          </p>
          <Card accent={recommendation.accent} className="mt-3 gap-0">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <IconTile icon={RecIcon} accent={recommendation.accent} size="lg" />
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center rounded-full bg-kupfer-mist px-3 py-1 text-xs font-semibold text-brand-orange">
                  {recommendation.badge}
                </span>
                <h3 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-foreground">
                  {recommendation.courseTitle}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {recommendation.reasoning}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <BrandButton href={recommendation.startHref} size="md">
                    Kurs starten
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </BrandButton>
                  <Link
                    href={recommendation.courseHref}
                    className="text-sm font-semibold text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    Erst zur Kursübersicht
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Pathway strip */}
        <section className="mt-12">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Dein Platz auf dem KI-Kompetenzweg
          </p>
          <ol className="flex flex-wrap gap-2">
            {STAGE_ORDER.map((stageId, i) => {
              const display = PATHWAY_STAGE_DISPLAY[stageId];
              const isActive = stageId === activeStage;
              return (
                <li
                  key={stageId}
                  className={
                    isActive
                      ? "flex items-center gap-2 rounded-lg bg-kupfer-mist px-4 py-2.5 text-brand-orange shadow-tile"
                      : "flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-muted-foreground"
                  }
                >
                  <span className="text-xs font-bold tabular-nums">{i + 1}</span>
                  <span
                    className={
                      isActive
                        ? "text-sm font-semibold"
                        : "text-sm font-medium text-foreground"
                    }
                  >
                    {display.displayLabel}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="mt-10">
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Check nochmal starten
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------- QUIZ
  const meta = dimensionMetaFor(question.dimensionId);
  const DimIcon = dimensionIcon(meta.iconName);
  const progress = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);
  const chosenOption = selected !== null ? question.options[selected] : null;

  return (
    <div className="mx-auto max-w-[720px] px-6 pb-32 pt-16 sm:pt-20">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-orange">
        KI-Kompetenzweg · KI-Check
      </p>
      <h1 className="mt-4 text-[34px] font-bold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-[44px]">
        Wo stehst du?
      </h1>
      <p className="mt-4 max-w-[560px] text-base leading-relaxed text-muted-foreground">
        Zehn kurze Fragen, kein Login, keine Datenspeicherung. Am Ende siehst du
        dein Profil und den Kurs, der zu deinem Stand passt.
      </p>

      {/* Step indicator across the five fields */}
      <div className="mt-10">
        <StepIndicator
          currentDimensionId={question.dimensionId}
          answeredByDimension={answeredByDimension}
          totalByDimension={totalByDimension}
        />
      </div>

      {/* Progress */}
      <div className="mt-8">
        <div
          role="status"
          aria-live="polite"
          className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground"
        >
          <span>
            Frage {index + 1} von {QUESTIONS.length}
          </span>
          <span className="tabular-nums">{progress}%</span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Fortschritt im KI-Check"
        >
          <m.div
            className="h-full rounded-full bg-brand-orange"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          <m.div
            key={question.id}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <Card accent={meta.accent} className="gap-0">
              <div className="flex items-center gap-3">
                <IconTile icon={DimIcon} accent={meta.accent} />
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {meta.name}
                </span>
              </div>

              <h2
                ref={focusHeading}
                tabIndex={-1}
                className="mt-5 text-[22px] font-bold leading-snug tracking-[-0.01em] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-4 focus-visible:ring-offset-card sm:text-[26px]"
              >
                {question.text}
              </h2>

              <div className="mt-6 flex flex-col gap-3">
                {question.options.map((option, i) => {
                  const isPicked = selected === i;
                  return (
                    <button
                      key={option.text}
                      type="button"
                      aria-pressed={isPicked}
                      onClick={() => pick(i)}
                      className={
                        isPicked
                          ? "flex w-full items-start gap-3 rounded-lg border border-brand-orange bg-kupfer-mist px-5 py-4 text-left transition-colors"
                          : "flex w-full items-start gap-3 rounded-lg border border-border bg-background px-5 py-4 text-left transition-colors hover:border-brand-orange/50 hover:bg-card-hover"
                      }
                    >
                      <span
                        className={
                          isPicked
                            ? "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[5px] border-brand-orange"
                            : "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border"
                        }
                        aria-hidden="true"
                      />
                      <span className="text-[15px] leading-relaxed text-foreground">
                        {option.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Meaning reveal once an option is picked */}
              <AnimatePresence initial={false}>
                {chosenOption && (
                  <m.div
                    key={`reveal-${selected}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 flex items-start gap-3 rounded-lg bg-brand-sand/10 px-5 py-4">
                      <Compass
                        className="mt-0.5 h-4 w-4 shrink-0 text-brand-sand"
                        aria-hidden="true"
                      />
                      <p className="text-sm leading-relaxed text-foreground">
                        {chosenOption.meaning}
                      </p>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </Card>
          </m.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            disabled={index === 0}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:pointer-events-none disabled:opacity-0"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Zurück
          </button>
          <BrandButton onClick={goNext} disabled={selected === null} size="md">
            {isLast ? "Zum Ergebnis" : "Weiter"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </BrandButton>
        </div>
      </div>

      {/* Reassurance line */}
      <p className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
        Ehrlich geantwortet triffst du am Ende die beste Kurswahl. Es gibt kein
        richtig oder falsch.
      </p>
    </div>
  );
}

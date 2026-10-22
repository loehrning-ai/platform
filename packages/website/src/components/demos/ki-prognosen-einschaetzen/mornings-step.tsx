"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { CUSTOM_ROLE_MAX, MORNINGS, OWNER_KEYS, type OwnerKey, type Triple } from "@/lib/demo-cases/ki-prognosen-einschaetzen/data";
import type { ForecastCopy } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy-types";
import { fmtTriple } from "@/lib/demo-cases/ki-prognosen-einschaetzen/fmt";
import {
  deviatesFromMedian,
  gradeMorning,
  isRed,
  MEDIAN_DELIVERY,
  ownerAccepted,
  standingDelivery,
  type DemoAction,
  type DemoState,
  type Grade,
} from "@/lib/demo-cases/ki-prognosen-einschaetzen/logic";
import type { Locale } from "@/lib/i18n/locale";
import { GateBoard } from "./gate-board";
import { CheckGlyph, CrossGlyph, OutcomeGlyph } from "./glyphs";
import { clamp01, easeOutQuad, useProgress } from "./use-progress";
import { WeekStrip, type WeekSlot } from "./week-strip";

interface Props {
  readonly state: DemoState;
  readonly plan: Triple;
  readonly copy: ForecastCopy;
  readonly locale: Locale;
  readonly dispatch: (action: DemoAction) => void;
}

interface Ghost {
  readonly day: number;
  readonly left: number;
  readonly top: number;
  readonly dx: number;
  readonly dy: number;
  readonly grade: Grade;
}

export function gradesOf(state: DemoState, plan: Triple): (Grade | null)[] {
  return MORNINGS.map((morning, i) => {
    const option = state.answers[i];
    return option ? gradeMorning(morning, option, plan) : null;
  });
}

export function slotsOf(grades: readonly (Grade | null)[]): (WeekSlot | null)[] {
  return grades.map((grade) => (grade ? { outcome: grade.outcome, stamp: grade.stamp } : null));
}

function ownerLabel(state: DemoState, copy: ForecastCopy): string {
  if (!state.owner) return "";
  return state.owner.key === "custom" ? state.owner.custom : copy.mornings.ownerOptions[state.owner.key];
}

function OwnerQuestion({ state, copy, dispatch, onStart }: Pick<Props, "state" | "copy" | "dispatch"> & { readonly onStart: () => void }) {
  const m = copy.mornings;
  const [role, setRole] = useState(state.owner?.key === "custom" ? state.owner.custom : "");
  const [customOpen, setCustomOpen] = useState(state.owner?.key === "custom");
  const picked = state.owner?.key ?? null;
  const accepted = ownerAccepted(state.owner);
  const answerKey: OwnerKey | null = picked === "custom" && !accepted ? null : picked;

  const pick = (key: OwnerKey) => {
    if (key === "custom") {
      setCustomOpen(true);
      return;
    }
    setCustomOpen(false);
    dispatch({ type: "PICK_OWNER", owner: { key, custom: "" } });
  };

  return (
    <div className="fr-owner">
      <h3 className="fr-h3" id="fr-owner-q">
        {m.ownerQuestion}
      </h3>
      <div className="fr-owner-options" role="group" aria-labelledby="fr-owner-q">
        {OWNER_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className="fr-btn fr-option"
            aria-pressed={key === "custom" ? customOpen : !customOpen && picked === key}
            onClick={() => pick(key)}
          >
            {m.ownerOptions[key]}
          </button>
        ))}
      </div>

      {customOpen ? (
        <form
          className="fr-custom"
          onSubmit={(event) => {
            event.preventDefault();
            if (role.trim() === "") return;
            dispatch({ type: "PICK_OWNER", owner: { key: "custom", custom: role } });
          }}
        >
          <label htmlFor="fr-custom-role" className="fr-label">
            {m.customLabel}
          </label>
          <div className="fr-custom-row">
            <input
              id="fr-custom-role"
              className="fr-input"
              type="text"
              maxLength={CUSTOM_ROLE_MAX}
              autoComplete="off"
              value={role}
              onChange={(event) => setRole(event.currentTarget.value)}
            />
            <button type="submit" className="fr-btn" disabled={role.trim() === ""}>
              {m.customUse}
            </button>
          </div>
        </form>
      ) : null}

      <div aria-live="polite" className="fr-owner-answer">
        {answerKey && !(answerKey !== "custom" && customOpen) ? (
          <p data-right={ownerAccepted(state.owner) ? "" : undefined}>
            <span className="fr-mark">
              {ownerAccepted(state.owner) ? <CheckGlyph /> : <CrossGlyph />}
              {ownerAccepted(state.owner) ? m.ownerRightMark : m.ownerWrongMark}
            </span>{" "}
            {m.ownerAnswers[answerKey]}
          </p>
        ) : null}
      </div>

      {accepted && !(customOpen && picked !== "custom") ? (
        <button
          type="button"
          className="fr-btn fr-btn-primary"
          onClick={() => {
            dispatch({ type: "START_MORNINGS" });
            onStart();
          }}
        >
          {m.start}
        </button>
      ) : null}
    </div>
  );
}

function Answer({
  grade,
  copy,
  locale,
  isLast,
  headingRef,
  stampRef,
  onNext,
}: {
  readonly grade: Grade;
  readonly copy: ForecastCopy;
  readonly locale: Locale;
  readonly isLast: boolean;
  readonly headingRef: RefObject<HTMLHeadingElement | null>;
  readonly stampRef: RefObject<HTMLSpanElement | null>;
  readonly onNext: () => void;
}) {
  const m = copy.mornings;
  const index = grade.day - 1;
  const morning = MORNINGS[index];
  const consequences = m.consequences[index] ?? {};
  const units = grade.delivery.units;
  const delivery = (() => {
    switch (grade.delivery.kind) {
      case "model":
        return m.deliveryModel(fmtTriple(units ?? [0, 0, 0], locale));
      case "standing":
        return m.deliveryStanding(fmtTriple(units ?? [0, 0, 0], locale));
      case "waitData":
        return m.deliveryWaitData;
      case "waitStock":
        return m.deliveryWaitStock;
      case "waitRetrain":
        return m.deliveryWaitRetrain;
    }
  })();
  const medianNote =
    grade.delivery.kind === "standing" && units && deviatesFromMedian(units)
      ? ` ${m.deliveryMedianNote(fmtTriple(MEDIAN_DELIVERY, locale))}`
      : "";
  const others = morning?.options.filter((option) => option !== grade.option) ?? [];

  return (
    <div className="fr-answer" data-outcome={grade.outcome}>
      <h4 ref={headingRef} tabIndex={-1} className="fr-stamp-line">
        <span ref={stampRef} className="fr-stamp" data-outcome={grade.outcome}>
          <OutcomeGlyph outcome={grade.outcome} />
          {m.stamps[grade.stamp]}
        </span>
      </h4>
      <p className="fr-pick">
        <span className="fr-pick-label">{m.yourPick}:</span> {m.options[grade.option]}
      </p>
      {grade.outcome !== "right" && consequences[grade.option] ? <p className="fr-consequence">{consequences[grade.option]}</p> : null}
      <p className="fr-why">
        <strong>{m.lessons[index]}</strong> {m.why[index]}
      </p>
      <p className="fr-delivery">
        {delivery}
        {medianNote}
      </p>
      <div className="fr-others">
        <p className="fr-small fr-others-label">{m.otherPaths}</p>
        <ul>
          {others.map((option) => (
            <li key={option} data-right={option === grade.right ? "" : undefined}>
              <span className="fr-others-option">{m.options[option]}</span>
              <span className="fr-others-text">
                {option === grade.right ? (
                  <span className="fr-mark">
                    <CheckGlyph />
                    {m.rightPath}
                  </span>
                ) : (
                  consequences[option]
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <button type="button" className="fr-btn fr-btn-primary" onClick={onNext}>
        {isLast ? m.toResult : m.next}
      </button>
    </div>
  );
}

/**
 * Part 2: the owner question, then one morning at a time. One tap answers;
 * the answer replaces the three options in place, and its stamp files itself
 * into today's slot of the week strip (400 ms, seek(t)).
 */
export function MorningsStep({ state, plan, copy, locale, dispatch }: Props) {
  const m = copy.mornings;
  const day = state.day;
  const morning = MORNINGS[day];
  const grades = gradesOf(state, plan);
  const grade = grades[day] ?? null;
  const standing = standingDelivery(plan);
  const morningHeading = useRef<HTMLHeadingElement>(null);
  const answerHeading = useRef<HTMLHeadingElement>(null);
  const stamp = useRef<HTMLSpanElement>(null);
  const [focusTarget, setFocusTarget] = useState<"morning" | "answer" | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const { t, start } = useProgress(400);

  useEffect(() => {
    if (!focusTarget) return;
    const target = focusTarget === "morning" ? morningHeading.current : answerHeading.current;
    target?.focus({ preventScroll: focusTarget === "answer" });
    if (focusTarget === "morning") target?.scrollIntoView?.({ block: "start", behavior: "auto" });
    setFocusTarget(null);
  }, [focusTarget, day, grade]);

  // Motion 2: measure the stamp and today's slot once the answer is on screen.
  useLayoutEffect(() => {
    if (!grade || ghost?.day === day || focusTarget !== "answer") return;
    const from = stamp.current?.getBoundingClientRect();
    const slot = document
      .getElementById("fr-week")
      ?.querySelector<HTMLElement>(`[data-slot="${day}"]`)
      ?.getBoundingClientRect();
    if (!from || !slot || typeof window === "undefined") return;
    const inView = slot.bottom > 0 && slot.top < window.innerHeight;
    if (!inView || from.width === 0) return;
    setGhost({
      day,
      left: from.left,
      top: from.top,
      dx: slot.left + slot.width / 2 - 0.2 * from.width - from.left,
      dy: slot.top + slot.height / 2 - 0.2 * from.height - from.top,
      grade,
    });
    start();
  }, [grade, day, ghost?.day, focusTarget, start]);

  const flying = ghost && ghost.day === day && t < 1 ? ghost : null;
  const e = easeOutQuad(t);

  if (!state.ownerLocked || !morning) {
    return (
      <OwnerQuestion
        state={state}
        copy={copy}
        dispatch={dispatch}
        onStart={() => setFocusTarget("morning")}
      />
    );
  }

  const red = isRed(morning);
  const statusId = `fr-status-${day}`;
  const promptId = `fr-prompt-${day}`;

  return (
    <div className="fr-mornings">
      <p className="fr-record">{m.ownerRecord(ownerLabel(state, copy))}</p>
      <WeekStrip slots={slotsOf(grades)} today={day} landing={flying ? day : null} copy={copy} id="fr-week" />

      <div className="fr-morning" data-day={morning.day}>
        <div className="fr-morning-board">
          <h3 ref={morningHeading} tabIndex={-1} className="fr-h3 fr-morning-heading">
            {m.morningHeading(morning.day)}
          </h3>
          <GateBoard morning={morning} standing={standing} copy={copy} locale={locale} statusId={statusId} />
        </div>

        <div className="fr-morning-decide">
          {grade ? (
            <Answer
              grade={grade}
              copy={copy}
              locale={locale}
              isLast={day === MORNINGS.length - 1}
              headingRef={answerHeading}
              stampRef={stamp}
              onNext={() => {
                dispatch({ type: "NEXT" });
                if (day < MORNINGS.length - 1) setFocusTarget("morning");
              }}
            />
          ) : (
            <>
              <p id={promptId} className="fr-prompt">
                {red ? m.promptRed : m.promptGreen}
              </p>
              <div className="fr-options" role="group" aria-labelledby={promptId} aria-describedby={statusId}>
                {morning.options.map((option, i) => (
                  <button
                    key={option}
                    type="button"
                    className="fr-btn fr-option"
                    onClick={() => {
                      dispatch({ type: "ANSWER", day, option });
                      setFocusTarget("answer");
                    }}
                  >
                    <span className="fr-option-n" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span>{m.options[option]}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {flying ? (
        <span
          aria-hidden="true"
          className="fr-stamp fr-stamp-ghost"
          data-outcome={flying.grade.outcome}
          style={{
            left: flying.left,
            top: flying.top,
            opacity: 1 - clamp01((t - 0.8) / 0.2),
            transform: `translate(${(flying.dx * e).toFixed(2)}px, ${(flying.dy * e).toFixed(2)}px) scale(${(1 - 0.6 * e).toFixed(4)})`,
          }}
        >
          <OutcomeGlyph outcome={flying.grade.outcome} />
          {m.stamps[flying.grade.stamp]}
        </span>
      ) : null}
    </div>
  );
}

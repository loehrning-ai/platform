"use client";

import { useEffect, useRef, type Dispatch, type ReactNode } from "react";
import type { EsgCopy } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { isComplete, STATUS_LABEL } from "@/lib/demo-cases/esg-berichte-mit-ki/core";
import type { Fact, Status } from "@/lib/demo-cases/esg-berichte-mit-ki/types";
import type { Locale } from "@/lib/i18n/locale";
import { getMotionAwareScrollBehavior } from "@/lib/animation-policy";
import { useEsg } from "./esg-context";
import { Excerpt } from "./excerpt";
import { GradeGlyph, StatusGlyph } from "./glyphs";
import { Refs } from "./refs";
import type { CardState, DemoAction, Slot } from "./state";

const STATUSES: readonly Status[] = ["ok", "check", "notFound"];

interface Props {
  readonly fact: Fact;
  readonly slot: Slot;
  readonly card: CardState;
  readonly dispatch: Dispatch<DemoAction>;
  readonly copy: EsgCopy;
  readonly locale: Locale;
  readonly heading: string;
  readonly headingLevel: 2 | 3;
  /** The rows this fact answers, printed above the files ("Gefragt in"). */
  readonly askedIn?: ReactNode;
  readonly hint: string | null;
  /** Changes when the card should take focus (index, "Weiter", a deep link). */
  readonly focusKey: number;
  /** Rendered inside the feedback, after the lines: "Wirkt auf", a card's beat, "Weiter". */
  readonly after?: ReactNode;
  readonly onChecked?: () => void;
}

/**
 * One fact: the file lines, three decisions (status, then the line, the
 * reason or the missing document, then the action after OK), "Prüfen" and
 * the feedback in place. Nothing hides: decisions render below each other,
 * a new status re-renders decisions 2 and 3, and the feedback stays.
 */
export function FactCard({
  fact,
  slot,
  card,
  dispatch,
  copy,
  locale,
  heading,
  headingLevel,
  askedIn,
  hint,
  focusKey,
  after,
  onChecked,
}: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLHeadingElement>(null);
  const wasSubmitted = useRef(card.submitted !== undefined);
  const { draft, submitted, verdict } = card;
  const locked = submitted !== undefined;
  const status = draft.status;
  const name = `eb-${slot}`;
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const FeedbackHeading = headingLevel === 2 ? "h3" : "h4";

  useEffect(() => {
    if (focusKey === 0) return;
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView?.({ block: "start", behavior: getMotionAwareScrollBehavior() });
  }, [focusKey]);

  useEffect(() => {
    if (submitted && !wasSubmitted.current) {
      feedbackRef.current?.focus({ preventScroll: true });
      feedbackRef.current?.scrollIntoView?.({ block: "nearest", behavior: getMotionAwareScrollBehavior() });
    }
    wasSubmitted.current = submitted !== undefined;
  }, [submitted]);

  const { detailOptions } = useEsg().logic;
  const second = status ? detailOptions(fact, status) : [];

  return (
    <section
      id={slot === "monday" ? "strom-montag" : fact.id}
      className="eb-card"
      aria-labelledby={`${name}-h`}
      data-fact={fact.id}
      data-slot={slot}
    >
      <Heading id={`${name}-h`} ref={headingRef} tabIndex={-1} className="eb-card-h">
        {heading}
      </Heading>
      {askedIn ? <div className="eb-asked">{askedIn}</div> : null}

      <Excerpt
        excerpt={fact.excerpt}
        copy={copy.card}
        marks={locked ? fact.decisive : []}
      />

      {hint && !locked ? <p className="eb-hint">{hint}</p> : null}

      <fieldset className="eb-q" disabled={locked} data-decision="status">
        <legend className="eb-q-legend">{copy.card.ask}</legend>
        <div className="eb-opts">
          {STATUSES.map((value) => (
            <label key={value} className="eb-opt" data-checked={status === value ? "" : undefined}>
              <input
                type="radio"
                name={`${name}-status`}
                value={value}
                checked={status === value}
                onChange={() => dispatch({ type: "status", slot, status: value })}
              />
              <span className="eb-opt-body">
                <span className="eb-opt-status">
                  <StatusGlyph status={value} />
                  {STATUS_LABEL[value]}
                </span>
                <span className="eb-opt-desc">{copy.card.status[value]}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {status ? (
        <fieldset className="eb-q" disabled={locked} data-decision="detail" key={`detail-${status}`}>
          <legend className="eb-q-legend">{copy.card.second[status]}</legend>
          <div className="eb-opts">
            {second.map((option) => (
              <label
                key={option.id}
                className="eb-opt"
                data-checked={draft.detail === option.id ? "" : undefined}
              >
                <input
                  type="radio"
                  name={`${name}-detail`}
                  value={option.id}
                  checked={draft.detail === option.id}
                  onChange={() => dispatch({ type: "detail", slot, detail: option.id })}
                />
                <span className="eb-opt-body">
                  <span className="eb-opt-text">
                    <Refs text={option.label[locale]} />
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {status === "ok" ? (
        <fieldset className="eb-q" disabled={locked} data-decision="action">
          <legend className="eb-q-legend">{copy.card.third}</legend>
          <div className="eb-opts eb-opts-row">
            {([true, false] as const).map((value) => (
              <label
                key={String(value)}
                className="eb-opt"
                data-checked={draft.action === value ? "" : undefined}
              >
                <input
                  type="radio"
                  name={`${name}-action`}
                  value={value ? "yes" : "no"}
                  checked={draft.action === value}
                  onChange={() => dispatch({ type: "action", slot, action: value })}
                />
                <span className="eb-opt-body">
                  <span className="eb-opt-text">{value ? copy.card.yes : copy.card.no}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {locked ? null : (
        <div className="eb-actions">
          <button
            type="button"
            className="eb-primary"
            disabled={!isComplete(draft)}
            onClick={() => {
              dispatch({ type: "submit", slot });
              onChecked?.();
            }}
          >
            {copy.card.check}
          </button>
        </div>
      )}

      {verdict ? (
        <div className="eb-fb" data-grade={verdict.grade}>
          <div className="eb-fb-head">
            <FeedbackHeading ref={feedbackRef} tabIndex={-1} className="eb-fb-grade">
              <GradeGlyph grade={verdict.grade} />
              {copy.feedback.grades[verdict.grade]}
            </FeedbackHeading>
            <span className="eb-rule">{copy.feedback.rule(verdict.rule)}</span>
          </div>
          <p className="eb-fb-key">
            <Refs text={verdict.lines[0]?.[locale] ?? ""} />
          </p>
          {verdict.lines.slice(1).map((line, index) => (
            <p key={index} className="eb-fb-line">
              <Refs text={line[locale]} />
            </p>
          ))}
          {after}
        </div>
      ) : null}
    </section>
  );
}

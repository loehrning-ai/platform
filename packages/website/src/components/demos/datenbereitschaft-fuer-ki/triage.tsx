"use client";

import { useEffect, useRef, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { BEHAVIORS, FRESH_TICKS, GAPS, LOCKS, TRIAGE_CARDS, cardAnchor, requestAnchor } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/cases";
import { askBackSentence, fill, type DemoText } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-shared";
import type { Action, CardState, DemoState } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/engine";
import type { TriageCardSpec } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/model";
import { liveCardText, shortPath, triageTexts } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/text";
import { Chip } from "./chip";
import { focusFirstInput, useReducedMotionScroll } from "./focus";
import { VerdictGlyph } from "./glyphs";
import { Rich } from "./rich";

const quote = (text: string, locale: Locale): string => (locale === "de" ? `„${text}“` : `“${text}”`);

interface CardProps {
  readonly card: TriageCardSpec;
  readonly state: CardState;
  readonly text: DemoText;
  readonly dispatch: (action: Action) => void;
  readonly announce: (message: string) => void;
}

function FollowUp({ card, state, text, dispatch }: Omit<CardProps, "announce">) {
  const { locale } = text;
  const base = cardAnchor(card.id);
  if (card.followUp === "gaps") {
    const gaps = new Set(state.choice.gaps ?? []);
    return (
      <fieldset className="dr3-fieldset" data-follow-up="gaps">
        <legend className="dr3-legend">
          {text.gapsLegend}
          <span className="dr3-legend-hint">{text.multiHint}</span>
        </legend>
        <div className="dr3-chips" data-columns="2">
          {GAPS.map((gap) => (
            <Chip
              key={gap}
              type="checkbox"
              name={`${base}-gaps`}
              value={gap}
              checked={gaps.has(gap)}
              onChange={() => dispatch({ type: "toggleGap", card: card.id, value: gap })}
              label={text.gaps[gap]}
            />
          ))}
        </div>
        <p className="dr3-ask" data-ask-back="">
          <span className="dr3-ask-label">{text.yourAsk}</span>
          <Rich text={askBackSentence(gaps, text)} locale={locale} />
        </p>
      </fieldset>
    );
  }
  if (card.followUp === "lock") {
    return (
      <fieldset className="dr3-fieldset" data-follow-up="lock">
        <legend className="dr3-legend dr3-lock-legend">
          <Rich text={text.lockLegend} locale={locale} />
        </legend>
        <div className="dr3-chips">
          {LOCKS.map((lock) => (
            <Chip
              key={lock}
              type="radio"
              name={`${base}-lock`}
              value={lock}
              checked={state.choice.lock === lock}
              onChange={() => dispatch({ type: "chooseLock", card: card.id, value: lock })}
              label={<span lang="en">{text.locks[lock].label}</span>}
              gloss={<Rich text={text.locks[lock].gloss ?? ""} locale={locale} />}
            />
          ))}
        </div>
      </fieldset>
    );
  }
  if (card.followUp === "freshTicks") {
    const ticks = new Set(state.choice.ticks ?? []);
    return (
      <fieldset className="dr3-fieldset" data-follow-up="freshTicks">
        <legend className="dr3-legend">
          {text.ticksLegend}
          <span className="dr3-legend-hint">{text.multiHint}</span>
        </legend>
        <div className="dr3-chips">
          {FRESH_TICKS.map((tick) => (
            <Chip
              key={tick}
              type="checkbox"
              name={`${base}-ticks`}
              value={tick}
              checked={ticks.has(tick)}
              onChange={() => dispatch({ type: "toggleTick", card: card.id, value: tick })}
              label={<Rich text={text.ticks[tick]} locale={locale} />}
            />
          ))}
        </div>
      </fieldset>
    );
  }
  return null;
}

function TriageCardView({ card, state, text, dispatch, announce }: CardProps) {
  const { locale } = text;
  const anchor = cardAnchor(card.id);
  const heading = useRef<HTMLHeadingElement>(null);
  const behaviorFieldset = useRef<HTMLFieldSetElement>(null);
  const followUpBox = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  const scroll = useReducedMotionScroll();
  const receipt = state.receipt;

  useEffect(() => {
    if (!pending.current || !receipt) return;
    pending.current = false;
    if (receipt.verdict === "open") {
      const target = receipt.params.open === "lock" ? followUpBox.current : behaviorFieldset.current;
      focusFirstInput(target, scroll());
    } else {
      heading.current?.focus();
    }
    announce(liveCardText(card.id, receipt, text));
  }, [state.attempt, receipt, announce, card.id, text, scroll]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    pending.current = true;
    dispatch({ type: "checkCard", card: card.id });
  };

  const followUpName = card.followUp ? text.parts[card.followUp] : undefined;

  return (
    <article id={anchor} aria-labelledby={`${anchor}-h`} className="dr3-card" data-card={card.id}>
      <div className="dr3-card-head">
        <h3 id={`${anchor}-h`} className="dr3-h3">
          {text.cardWord} {card.id}
        </h3>
        <code className="dr3-card-anchor">#{anchor}</code>
      </div>
      <p className="dr3-card-q">
        <Rich text={quote(text.cards[card.id], locale)} locale={locale} />
      </p>
      <form className="dr3-form" onSubmit={onSubmit} noValidate aria-label={`${text.cardWord} ${card.id}`}>
        <fieldset className="dr3-fieldset" ref={behaviorFieldset} data-follow-up="behavior">
          <legend className="dr3-legend">{text.behaviorLegend}</legend>
          <div className="dr3-chips" data-columns="2">
            {BEHAVIORS.map((behavior) => (
              <Chip
                key={behavior}
                type="radio"
                name={`${anchor}-behavior`}
                value={behavior}
                checked={state.choice.behavior === behavior}
                onChange={() => dispatch({ type: "chooseBehavior", card: card.id, value: behavior })}
                label={text.behaviors[behavior]}
              />
            ))}
          </div>
        </fieldset>
        {card.followUp ? (
          <div ref={followUpBox}>
            <FollowUp card={card} state={state} text={text} dispatch={dispatch} />
          </div>
        ) : null}
        <div>
          <button type="submit" className="dr3-btn dr3-btn-wide anti-btn" data-check-card={card.id}>
            {text.check}
          </button>
        </div>
      </form>

      <div
        className="dr3-receipt"
        data-receipt={card.id}
        data-verdict={receipt?.verdict ?? "none"}
        data-stale={state.stale ? "true" : "false"}
      >
        {state.stale ? <div className="dr3-receipt-hatch" aria-hidden="true" /> : null}
        <h4 ref={heading} tabIndex={-1} className="dr3-receipt-title">
          {receipt ? fill(text.receipt, { n: receipt.attempt }) : text.receiptHeading}
        </h4>
        {receipt ? (
          <>
            <p className="dr3-verdict" data-verdict-line="">
              <VerdictGlyph verdict={receipt.verdict} />
              <span>{text.verdicts[receipt.verdict]}</span>
            </p>
            {state.stale ? <p className="dr3-stale">{text.stale}</p> : null}
            {followUpName && receipt.behavior !== "open" ? (
              <ul className="dr3-parts" data-parts="">
                <li>
                  {text.parts.behavior}: <strong>{text.parts[receipt.behavior === "right" ? "right" : "wrong"]}</strong>
                </li>
                {receipt.followUp ? (
                  <li>
                    {followUpName}: <strong>{text.parts[receipt.followUp === "right" ? "right" : receipt.followUp === "open" ? "open" : "wrong"]}</strong>
                  </li>
                ) : null}
              </ul>
            ) : null}
            {triageTexts(receipt, text).map((line) => (
              <p key={line} className="dr3-why" data-why="">
                <Rich text={line} locale={locale} />
              </p>
            ))}
          </>
        ) : (
          <p className="dr3-empty">{text.receiptEmptyCard}</p>
        )}
      </div>
    </article>
  );
}

interface SectionProps {
  readonly state: DemoState;
  readonly text: DemoText;
  readonly dispatch: (action: Action) => void;
  readonly announce: (message: string) => void;
}

/**
 * Display order pairs cards of like length on desktop (G01 | R01 short,
 * C01 | R02 long) and gives F01 the full width; the DOM follows the same
 * order, so reading and focus order match what is seen.
 */
const DISPLAY_ORDER = ["G01", "R01", "C01", "R02", "F01"] as const;

/** Request 04: five cards, each its own small form with its own receipt. */
export function TriageSection({ state, text, dispatch, announce }: SectionProps) {
  const anchor = requestAnchor("04");
  return (
    <section id={anchor} aria-labelledby={`${anchor}-h`} className="dr3-section" data-request="04">
      <h2 id={`${anchor}-h`} tabIndex={-1} className="dr3-h2">
        {text.requestWord} 04 · {text.requestTitles["04"]}
      </h2>
      <p className="dr3-path">
        {text.path} <code>{shortPath(anchor, text)}</code>
      </p>
      <p className="dr3-intro">{text.intro04}</p>
      <p className="dr3-context">{text.context}</p>
      <div className="dr3-cards">
        {DISPLAY_ORDER.map((id) => TRIAGE_CARDS.find((card) => card.id === id)!).map((card) => (
          <TriageCardView
            key={card.id}
            card={card}
            state={state.cards[card.id]}
            text={text}
            dispatch={dispatch}
            announce={announce}
          />
        ))}
      </div>
    </section>
  );
}

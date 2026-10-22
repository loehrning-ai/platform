"use client";

import { useEffect, useRef, type Dispatch } from "react";
import type { EsgCopy } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { BILLS_2025, BILLS_2025_MONDAY, PREDICTION_ROWS } from "@/lib/demo-cases/esg-berichte-mit-ki/constants";
import { STATUS_LABEL, scorePrediction, yearFromBills } from "@/lib/demo-cases/esg-berichte-mit-ki/core";
import type { RowId, SheetRow } from "@/lib/demo-cases/esg-berichte-mit-ki/types";
import type { Locale } from "@/lib/i18n/locale";
import { AskedIn } from "./card-extras";
import { useEsg } from "./esg-context";
import { FactCard } from "./fact-card";
import { StatusGlyph } from "./glyphs";
import { InvoiceSheet } from "./invoice-sheet";
import { Refs } from "./refs";
import { MonthStrip } from "./month-strip";
import { isInvoiceRight, mondayPhase, type DemoAction, type DemoState, type MondayPhase } from "./state";

interface Props {
  readonly state: DemoState;
  readonly dispatch: Dispatch<DemoAction>;
  readonly copy: EsgCopy;
  readonly locale: Locale;
  readonly friday: readonly SheetRow[];
  readonly monday: readonly SheetRow[];
  readonly changed: readonly RowId[];
  readonly valueChanged: readonly RowId[];
  readonly onAnnounce: (text: string) => void;
}

const fmt = (value: number, locale: Locale): string =>
  locale === "de" ? value.toFixed(1).replace(".", ",") : value.toFixed(1);

const ORDER: readonly MondayPhase[] = ["locked", "ready", "predict", "invoice", "restamp", "reveal"];
const atLeast = (phase: MondayPhase, step: MondayPhase): boolean => ORDER.indexOf(phase) >= ORDER.indexOf(step);

/**
 * The following Monday: predict which answers change, read the September
 * invoice, stamp electricity again, then see what changed and why the rest
 * stays. Always rendered; before all ten facts are stamped it shows one
 * lock line (a locked step, not a collapse).
 */
export function MondayPanel({ state, dispatch, copy, locale, friday, monday, changed, valueChanged, onAnnounce }: Props) {
  const phase = mondayPhase(state);
  const headRef = useRef<HTMLHeadingElement>(null);
  const invoiceRef = useRef<HTMLParagraphElement>(null);
  const invoiceFeedbackRef = useRef<HTMLParagraphElement>(null);
  const previous = useRef(phase);
  const m = copy.monday;
  const { pack, logic, rowById } = useEsg();
  const strom = logic.world.strom;

  const before = yearFromBills(BILLS_2025);
  const after = yearFromBills(BILLS_2025_MONDAY);
  const score = scorePrediction(state.picked, changed);
  const scoreText = m.score(score.hits.length, score.falseAlarms, score.misses);

  useEffect(() => {
    const from = previous.current;
    previous.current = phase;
    if (from === phase) return;
    if (from === "ready" && phase === "predict") headRef.current?.focus();
    if (from === "predict" && phase === "invoice") invoiceRef.current?.focus();
    if (from === "invoice" && phase === "restamp") invoiceFeedbackRef.current?.focus();
    // Focus stays on the restamp feedback; the reveal is announced politely.
    if (from === "restamp" && phase === "reveal") onAnnounce(`${m.revealHeading}. ${scoreText}`);
  }, [phase, onAnnounce, m.revealHeading, scoreText]);
  const cellOf = (rows: readonly SheetRow[], id: RowId) => rows.find((entry) => entry.row.id === id)?.key;

  return (
    <section id="montag" className="eb-monday" aria-labelledby="eb-monday-h" data-phase={phase}>
      <h2 id="eb-monday-h" className="eb-h2">
        {m.heading}
      </h2>

      {phase === "locked" ? <p className="eb-lock">{m.locked}</p> : null}
      {phase === "ready" ? (
        <div className="eb-actions">
          <button
            type="button"
            className="eb-btn"
            onClick={() => {
              dispatch({ type: "startMonday" });
              onAnnounce(m.announceDay);
            }}
          >
            {m.start}
          </button>
        </div>
      ) : null}

      {atLeast(phase, "predict") ? (
        <>
          <p className="eb-date" data-day="monday">
            {copy.date.monday}
          </p>
          <h3 ref={headRef} tabIndex={-1} className="eb-h3">
            {m.head}
          </h3>
          <div className="eb-q" role="group" aria-labelledby="eb-predict-h">
            <p id="eb-predict-h" className="eb-q-legend">
              {m.predict}
            </p>
            <p className="eb-hint">{m.predictHint}</p>
            <div className="eb-picks">
              {PREDICTION_ROWS.map((id) => {
                const pressed = state.picked.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    className="eb-pick"
                    aria-pressed={pressed}
                    disabled={state.pickLocked}
                    onClick={() => dispatch({ type: "togglePick", id })}
                  >
                    <span className="eb-id">{id}</span>
                    <span className="eb-pick-label">{rowById(id).label[locale]}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {phase === "predict" ? (
            <div className="eb-actions">
              <button type="button" className="eb-btn" onClick={() => dispatch({ type: "openInvoice" })}>
                {m.openInvoice}
              </button>
            </div>
          ) : (
            <p className="eb-tip">{state.picked.length > 0 ? m.yourTip(state.picked.join(", ")) : m.noTip}</p>
          )}
        </>
      ) : null}

      {atLeast(phase, "invoice") ? (
        <>
          <InvoiceSheet caption={m.invoiceCaption} mixNote={state.invoice ? m.mixNote : null} />
          <fieldset className="eb-q" disabled={state.invoice !== undefined} data-decision="invoice">
            <legend className="eb-q-legend">
              <span ref={invoiceRef} tabIndex={-1}>
                {m.invoiceAsk}
              </span>
            </legend>
            <div className="eb-opts eb-opts-row">
              {pack.invoiceOptions.map((option) => (
                <label
                  key={option.id}
                  className="eb-opt"
                  data-checked={(state.invoice ?? state.invoiceDraft) === option.id ? "" : undefined}
                >
                  <input
                    type="radio"
                    name="eb-invoice"
                    value={option.id}
                    checked={(state.invoice ?? state.invoiceDraft) === option.id}
                    onChange={() => dispatch({ type: "invoiceDraft", id: option.id })}
                  />
                  <span className="eb-opt-body">
                    <span className="eb-opt-text eb-mono">{option.label[locale]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {state.invoice ? (
            <p ref={invoiceFeedbackRef} tabIndex={-1} className="eb-fb-inline" data-right={isInvoiceRight(state) ? "" : undefined}>
              <strong>{isInvoiceRight(state) ? m.invoiceRight : m.invoiceWrong}</strong> <Refs text={m.invoiceMath} />
            </p>
          ) : (
            <div className="eb-actions">
              <button
                type="button"
                className="eb-primary"
                disabled={!state.invoiceDraft}
                onClick={() => dispatch({ type: "submitInvoice" })}
              >
                {copy.card.check}
              </button>
            </div>
          )}
        </>
      ) : null}

      {atLeast(phase, "restamp") ? (
        <>
          <p className="eb-lead">{m.restampLead}</p>
          <FactCard
            fact={strom}
            slot="monday"
            card={state.cards.monday}
            dispatch={dispatch}
            copy={copy}
            locale={locale}
            heading={strom.title[locale]}
            headingLevel={3}
            askedIn={<AskedIn fact={logic.factById("strom")} copy={copy} locale={locale} />}
            hint={null}
            focusKey={0}
          />
        </>
      ) : null}

      {phase === "reveal" ? (
        <div className="eb-reveal" data-testid="eb-reveal">
          <h3 className="eb-h3">{m.revealHeading}</h3>
          <MonthStrip
            mode="september"
            label={copy.feedback.stripLabel(after.months, fmt(after.mwh, locale))}
            noBill={copy.feedback.noBill}
            septLabel={`${fmt(41.2, locale)} MWh`}
            year={{
              before: copy.feedback.year(fmt(before.mwh, locale), before.months),
              after: copy.feedback.year(fmt(after.mwh, locale), after.months),
            }}
          />
          <p className="eb-reveal-k">{m.changes}</p>
          <ul className="eb-reveal-list">
            {changed.map((id) => {
              const was = cellOf(friday, id);
              const now = cellOf(monday, id);
              const row = rowById(id);
              return (
                <li key={id} className="eb-reveal-row" data-row={id}>
                  <span className="eb-id">{id}</span> {row.label[locale]}:{" "}
                  {was?.state === "filled" ? (
                    <span className="eb-cell-status">
                      <StatusGlyph status={was.status} />
                      {STATUS_LABEL[was.status]}
                    </span>
                  ) : null}{" "}
                  <span aria-hidden="true">→</span>
                  <span className="sr-only">{` ${m.to} `}</span>{" "}
                  <span className="eb-nb">
                    {now?.state === "filled" ? (
                      <span className="eb-cell-status">
                        <StatusGlyph status={now.status} />
                        {STATUS_LABEL[now.status]}
                      </span>
                    ) : null}
                    ,
                  </span>{" "}
                  <Refs text={(row.value.monday ?? row.value.friday)[locale]} />
                </li>
              );
            })}
          </ul>
          <p className="eb-reveal-k">{m.stays}</p>
          <ul className="eb-reveal-list">
            {(Object.keys(pack.stays) as RowId[]).map((id) => {
              const now = cellOf(monday, id);
              const status = now?.state === "filled" ? STATUS_LABEL[now.status] : "";
              return (
                <li key={id} className="eb-reveal-row" data-row={id}>
                  <span className="eb-id">{id}</span>{" "}
                  {valueChanged.includes(id) ? (
                    <>
                      {fmt(before.mwh, locale)} <span aria-hidden="true">→</span>
                      <span className="sr-only"> {m.to} </span> <Refs text={`${fmt(after.mwh, locale)} MWh`} />, {m.staysStatus(status)}:{" "}
                    </>
                  ) : null}
                  <Refs text={pack.stays[id]?.[locale] ?? ""} />
                </li>
              );
            })}
          </ul>
          <p className="eb-score" data-testid="eb-score">
            {scoreText}
          </p>
        </div>
      ) : null}
    </section>
  );
}

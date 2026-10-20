"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { SourceLine } from "@/components/book-figures/shared/source-line";
import { usePrefersReducedMotion } from "@/components/book-figures/story/use-motion";
import {
  EXPLORER_COPY,
  fieldCounts,
  FIELD_SQUARES,
  formatNumber,
  numeralPerHundred,
  predict,
  readoutSentence,
  staticTable,
  supportText,
  type ExplorerFactor,
  type ExplorerLocale,
  type ExplorerModel,
  type ExplorerSelection,
} from "@/lib/explorer/model";
import { easeCounts, fieldPaths, VIEW_HEIGHT, VIEW_WIDTH } from "./field-geometry";
import "./explorer.css";

/**
 * "Wo stehe ich?" (INSIGHT-SPEC 3.4, DIRECTION section 5). One instrument:
 * the field of 1.000 squares (solid Mennige = the estimate, outlined = the
 * 95 % band), four native controls in the lower half, one aria-live sentence.
 * The browser computes everything from the coefficients in `model`; nothing is
 * sent, stored or logged. The server renders the worked example (the model's
 * default) and the static table, so reduced motion, no script and print show
 * real numbers.
 */

const MOVE_MS = 180;

function factorOf(model: ExplorerModel, id: ExplorerFactor["id"]): ExplorerFactor {
  return model.factors.find((f) => f.id === id) as ExplorerFactor;
}

export function Explorer({ model, locale = "de" }: { readonly model: ExplorerModel; readonly locale?: ExplorerLocale }) {
  const copy = EXPLORER_COPY[locale];
  const uid = useId();
  const reduced = usePrefersReducedMotion();
  const [selection, setSelection] = useState<ExplorerSelection>(model.default);
  const prediction = useMemo(() => predict(model, selection), [model, selection]);
  const target = useMemo(() => fieldCounts(prediction), [prediction]);
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  // Re-sort the field by column in 180 ms (instantly under reduced motion). The tween only reads two refs and one state.
  useEffect(() => {
    if (reduced) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    const from = shownRef.current;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / MOVE_MS);
      const next = easeCounts(from, target, t);
      shownRef.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced]);

  const paths = useMemo(() => fieldPaths(shown), [shown]);
  const table = useMemo(() => staticTable(model, locale), [model, locale]);
  const sentence = readoutSentence(prediction, locale);
  const textFactor = factorOf(model, "textmenge");
  const textLevel = textFactor.levels.find((l) => l.id === selection.textmenge) ?? textFactor.levels[0];
  const select = (id: ExplorerFactor["id"], value: string): void => setSelection((s) => ({ ...s, [id]: value }));

  const fieldLabel = copy.fieldLabel(formatNumber(FIELD_SQUARES, 0, locale), target.solid, target.partial > 0, target.bandFrom + 1, target.bandTo);

  return (
    <section className="ex" id="wo-stehe-ich" data-explorer aria-labelledby={`${uid}-title`}>
      <h2 id={`${uid}-title`} className="ex-title">
        {copy.title}
      </h2>
      <div className="ex-stage">
        {/* The mini readout: the number, the caveat that qualifies it and the sentence. On a phone it is the one
            sticky piece, so you change a control below it and see the result without scrolling back; on a wide
            screen it dissolves into the stage grid. The caveat sits right under the number, always visible: the
            group size and the rescan note (Land, size and industry hang on websites that are being checked, so
            the numbers are recalculated). */}
        <div className="ex-mini">
          <p className="ex-numeral" aria-hidden="true">
            <span className="ex-numeral-n">{numeralPerHundred(prediction.p, locale)}</span>
            <span className="ex-numeral-of">{copy.of100}</span>
          </p>
          <p className="ex-caveat" data-explorer-caveat>
            {supportText(prediction, locale)}{" "}
            <span className="ex-caveat-rescan" data-rescan-note="">{model.rescanNote || copy.rescan}</span>
          </p>
          <p className="ex-readout" role="status" aria-live="polite" data-explorer-readout>
            {sentence}
          </p>
        </div>
        <svg
          className="ex-field"
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          role="img"
          aria-label={fieldLabel}
          preserveAspectRatio="xMinYMax meet"
        >
          <path className="ex-sq ex-sq--rest" d={paths.rest} />
          <path className="ex-sq ex-sq--solid" d={paths.solid} />
          <path className="ex-sq ex-sq--solid" d={paths.partial} />
          <path className="ex-sq ex-sq--band" d={paths.band} />
        </svg>
        <p className="ex-unit">{copy.unit}</p>
      </div>

      <form className="ex-controls" onSubmit={(event) => event.preventDefault()} aria-label={copy.controlsAria}>
        {(["branche"] as const).map((id) => {
          const factor = factorOf(model, id);
          const chosen = factor.levels.find((l) => l.id === selection[id]);
          return (
            <div className="ex-field-row" key={id}>
              <label className="ex-label" htmlFor={`${uid}-${id}`}>
                {factor.label}
              </label>
              <select
                id={`${uid}-${id}`}
                className="ex-select"
                value={selection[id]}
                onChange={(event) => select(id, event.target.value)}
              >
                {factor.levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.label}
                  </option>
                ))}
              </select>
              <p className="ex-note">
                {chosen?.pooled && chosen.pooledNote ? `${chosen.pooledNote}. ` : ""}
                {factor.hint ? `${factor.hint}. ` : ""}
              </p>
            </div>
          );
        })}
        <fieldset className="ex-field-row ex-chips" data-explorer-textmenge>
          <legend className="ex-label">{textFactor.label}</legend>
          <div className="ex-chip-row">
            {textFactor.levels.map((level) => (
              <label className="ex-chip" key={level.id}>
                <input
                  className="ex-chip-input"
                  type="radio"
                  name={`${uid}-textmenge`}
                  value={level.id}
                  checked={selection.textmenge === level.id}
                  onChange={() => select("textmenge", level.id)}
                />
                <span className="ex-chip-face">{level.label}</span>
              </label>
            ))}
          </div>
          <p className="ex-note ex-note--strong">{textLevel?.example}</p>
        </fieldset>
        {(["bundesland", "size"] as const).map((id) => {
          const factor = factorOf(model, id);
          const chosen = factor.levels.find((l) => l.id === selection[id]);
          return (
            <div className="ex-field-row" key={id}>
              <label className="ex-label" htmlFor={`${uid}-${id}`}>
                {factor.label}
              </label>
              <select
                id={`${uid}-${id}`}
                className="ex-select"
                value={selection[id]}
                onChange={(event) => select(id, event.target.value)}
              >
                {factor.levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.label}
                  </option>
                ))}
              </select>
              <p className="ex-note">
                {chosen?.pooled && chosen.pooledNote ? `${chosen.pooledNote}. ` : ""}
                {factor.hint ? `${factor.hint}. ` : ""}
              </p>
            </div>
          );
        })}
      </form>
      <p className="ex-meaning">{copy.meaning}</p>
      <p className="ex-privacy">{copy.privacy}</p>

      <SourceLine
        fields={{
          id: "explorer",
          n: model.n,
          asOf: model.asOf,
          limitation: "",
          sourceLine: model.sourceLine,
        }}
      />

      <div className="ex-table-wrap" data-horizontal-scroll role="region" aria-label={copy.tableAria} tabIndex={0}>
        <table className="ex-table">
          <caption className="ex-table-caption">
            {copy.tableCaption(table.fixed)}
          </caption>
          <thead>
            <tr>
              <th scope="col">{copy.tableBranche}</th>
              {table.columnLabels.map((label) => (
                <th scope="col" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rowLabels.map((row, r) => (
              <tr key={row}>
                <th scope="row">{row}</th>
                {(table.cells[r] ?? []).map((cell, c) => (
                  <td key={c}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

"use client";

import { useId } from "react";
import { fill } from "@/lib/demo-cases/esg-berichte-mit-ki/takeaways";
import type { DemoPack, MonthCell } from "@/lib/demo-cases/esg-berichte-mit-ki/types";
import type { OwnSeries } from "./use-own-series";

/** Editable text of a cell: plain digits in the locale's decimal sign, no grouping. */
function plain(cell: MonthCell, locale: "de" | "en"): string {
  if (cell.value === null) return "";
  const text = String(cell.value);
  const marked = cell.state === "estimate" ? `~${text}` : text;
  return locale === "de" ? marked.replace(".", ",") : marked;
}

/**
 * The visitor's own numbers: a paste area, a label and a unit, and below it
 * the twelve months exactly as they were read, each one editable. Everything
 * the parser is unsure about is shown, never decided silently.
 */
export function OwnData({ pack, own }: { readonly pack: DemoPack; readonly own: OwnSeries }) {
  const ids = { text: useId(), label: useId(), unit: useId() };
  const locale = pack.locale;
  const { parsed, resolved } = own;
  const unread = parsed.entries.filter((entry) => entry.kind === "unread");
  const duplicates = resolved.duplicates;

  return (
    <section className="esg-own" aria-label={pack.datasets.own}>
      <label className="esg-own__intro" htmlFor={ids.text}>{pack.own.intro}</label>
      <div className="esg-own__row esg-own__row--buttons">
        <button type="button" className="esg-btn esg-btn--primary" onClick={own.loadExample}>{pack.own.example}</button>
        <button type="button" className="esg-btn" onClick={own.clear} disabled={!own.hasInput}>{pack.own.clear}</button>
      </div>
      <textarea
        id={ids.text}
        className="esg-input esg-own__text"
        rows={4}
        spellCheck={false}
        autoComplete="off"
        placeholder={pack.own.placeholder}
        value={own.text}
        onChange={(event) => own.setText(event.target.value)}
      />
      <div className="esg-own__row">
        <label className="esg-own__field" htmlFor={ids.label}>
          <span>
            {pack.own.label}
            {own.prefilled ? <em className="esg-own__prefilled"> {pack.own.prefilled}</em> : null}
          </span>
          <input
            id={ids.label}
            className="esg-input"
            data-prefilled={own.prefilled ? "" : undefined}
            value={own.label}
            placeholder={pack.own.defaultLabel}
            autoComplete="off"
            onChange={(event) => own.setLabel(event.target.value)}
          />
        </label>
        <label className="esg-own__field esg-own__field--unit" htmlFor={ids.unit}>
          <span>{pack.own.unit}</span>
          <input
            id={ids.unit}
            className="esg-input"
            value={own.unit}
            autoComplete="off"
            maxLength={12}
            placeholder={pack.own.unitPlaceholder}
            onChange={(event) => own.setUnit(event.target.value)}
          />
        </label>
      </div>
      <p className="esg-sub esg-own__privacy">{pack.own.privacy}</p>

      {parsed.countMismatch !== null ? (
        <p className="esg-note" role="status">{fill(pack.own.count, { n: parsed.countMismatch })}</p>
      ) : null}

      <ul className="esg-cells" aria-label={pack.own.cellsAria}>
        {resolved.cells.map((cell, index) => {
          const name = pack.months[index] ?? "";
          const hint = resolved.unitHints.includes(cell.month);
          const zero = resolved.zeroHints.includes(cell.month);
          const edited = own.choice.edits.get(cell.month);
          return (
            <li key={cell.month} className="esg-cell" data-state={cell.state}>
              <label className="esg-cell__label">
                <span>{name.slice(0, 3)}</span>
                <input
                  className="esg-input esg-cell__input"
                  inputMode="decimal"
                  autoComplete="off"
                  aria-label={fill(pack.own.cellAria, { month: name })}
                  value={edited ?? plain(cell, locale)}
                  placeholder="-"
                  onChange={(event) => own.edit(cell.month, event.target.value)}
                />
              </label>
              {hint ? <span className="esg-cell__chip esg-cell__chip--warn">{pack.own.unitHint}</span> : null}
              {zero ? <span className="esg-cell__chip esg-cell__chip--warn">{pack.own.zeroHint}</span> : null}
            </li>
          );
        })}
      </ul>

      {duplicates.length > 0 || unread.length > 0 ? (
        <ul className="esg-issues">
          {duplicates.map((dup) => (
            <li key={`d${dup.month}`} className="esg-issue">
              <span className="esg-issue__tag">{pack.own.duplicate}</span>
              <button type="button" className="esg-chip" aria-pressed={own.choice.swaps.has(dup.month)} onClick={() => own.swap(dup.month)}>
                {fill(pack.own.duplicateSwap, { month: pack.months[dup.month - 1] ?? "" })}
              </button>
            </li>
          ))}
          {unread.map((entry) => (
            <li key={`u${entry.id}`} className="esg-issue esg-issue--unread">
              {fill(pack.own.unread, { raw: entry.raw })}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

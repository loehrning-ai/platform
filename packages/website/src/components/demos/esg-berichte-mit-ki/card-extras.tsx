"use client";

import { useMemo } from "react";
import type { EsgCopy } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { STATUS_LABEL, rowCell, type Stamps, weakest, yearFromBills } from "@/lib/demo-cases/esg-berichte-mit-ki/core";
import type { Answer, Fact, FactId, RowId } from "@/lib/demo-cases/esg-berichte-mit-ki/types";
import type { Locale } from "@/lib/i18n/locale";
import { useEsg } from "./esg-context";
import { StatusGlyph } from "./glyphs";
import { MonthStrip } from "./month-strip";

/** "Gefragt in": the rows a fact answers, before anyone decides. */
export function AskedIn({
  fact,
  copy,
  locale,
}: {
  readonly fact: Fact;
  readonly copy: EsgCopy;
  readonly locale: Locale;
}) {
  const { rowById } = useEsg();
  return (
    <p className="eb-asked-line">
      <span className="eb-asked-k">{copy.card.askedIn}</span>{" "}
      {fact.feeds.map((id, index) => (
        <span key={id} className="eb-asked-row">
          <span className="eb-id">{id}</span> {rowById(id).label[locale]}
          {index < fact.feeds.length - 1 ? " · " : ""}
        </span>
      ))}
    </p>
  );
}

/** The key's stamps, but only for facts the user has stamped (nothing is spoiled). */
function shownKeys(keys: Record<FactId, Answer>, yours: Stamps): Stamps {
  const out: Stamps = {};
  for (const id of Object.keys(yours) as FactId[]) out[id] = keys[id];
  return out;
}

/**
 * "Wirkt auf": each row this fact feeds, with its status as text. A row with
 * several parts prints its parts and the weakest one (rule 3); a part that is
 * not stamped yet reads "offen".
 */
function Feeds({
  fact,
  yours,
  copy,
  locale,
}: {
  readonly fact: Fact;
  readonly yours: Stamps;
  readonly copy: EsgCopy;
  readonly locale: Locale;
}) {
  const { logic, rowById } = useEsg();
  const { factById } = logic;
  const keys = useMemo(() => logic.keyStamps(), [logic]);
  const shown = shownKeys(keys, yours);
  return (
    <div className="eb-feeds">
      <p className="eb-feeds-h">{copy.feedback.feeds}</p>
      <ul className="eb-feeds-list">
        {fact.feeds.map((id: RowId) => {
          const row = rowById(id);
          const cell = rowCell(row, shown);
          const parts = row.deps.map((dep) => ({ dep, status: shown[dep]?.status }));
          return (
            <li key={id} className="eb-feed" data-row={id}>
              <span className="eb-feed-row">
                <span className="eb-id">{id}</span> {row.label[locale]}
              </span>
              <span className="eb-feed-status">
                {cell.state === "filled" ? (
                  <>
                    <StatusGlyph status={cell.status} />
                    {STATUS_LABEL[cell.status]}
                  </>
                ) : (
                  copy.feedback.open
                )}
              </span>
              {row.deps.length > 1 ? (
                <span className="eb-feed-parts">
                  {copy.feedback.parts}:{" "}
                  {parts
                    .map(({ dep, status }) =>
                      `${factById(dep).short[locale]} ${status ? STATUS_LABEL[status] : copy.feedback.open}`,
                    )
                    .join(" + ")}{" "}
                  → {cell.state === "filled" ? STATUS_LABEL[weakest(parts.map((p) => p.status ?? "ok"))] : copy.feedback.open}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The one extra beat three cards carry: electricity, glass and certificates. */
function Beat({ fact, copy, locale }: { readonly fact: Fact; readonly copy: EsgCopy; readonly locale: Locale }) {
  if (fact.id === "strom") {
    const year = yearFromBills();
    const mwh = locale === "de" ? String(year.mwh).replace(".", ",") : String(year.mwh);
    return (
      <div className="eb-beat">
        <MonthStrip
          mode="count"
          label={copy.feedback.stripLabel(year.months, mwh)}
          noBill={copy.feedback.noBill}
          septLabel={copy.feedback.noBill}
          year={{ before: copy.feedback.year(mwh, year.months) }}
        />
        <p className="eb-beat-line">{copy.feedback.coverage}</p>
      </div>
    );
  }
  if (fact.id === "glas") return <p className="eb-beat-line eb-beat-action">{copy.feedback.glasAction}</p>;
  if (fact.id === "zert") return <p className="eb-beat-line">{copy.feedback.zertNote}</p>;
  return null;
}

export function FridayAfter({
  fact,
  yours,
  copy,
  locale,
  nextLabel,
  onNext,
}: {
  readonly fact: Fact;
  readonly yours: Stamps;
  readonly copy: EsgCopy;
  readonly locale: Locale;
  readonly nextLabel: string;
  readonly onNext: () => void;
}) {
  return (
    <>
      <Beat fact={fact} copy={copy} locale={locale} />
      <Feeds fact={fact} yours={yours} copy={copy} locale={locale} />
      <div className="eb-actions">
        <button type="button" className="eb-btn" onClick={onNext}>
          {nextLabel}
        </button>
      </div>
    </>
  );
}

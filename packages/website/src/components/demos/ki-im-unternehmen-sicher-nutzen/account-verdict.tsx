"use client";

import type { DemoPack } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/copy";
import { citeLine } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/verdict";
import type { Verdict } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";
import { LightGlyph } from "./glyphs";

interface Props {
  readonly copy: DemoPack;
  readonly verdict: Verdict;
  readonly publicText: boolean;
  readonly onPublic: (value: boolean) => void;
}

/**
 * The light (the account switch sits on the stage, next to the handle). Words and shapes carry the meaning
 * (square, triangle, circle, hatched square); the chip names its source and
 * date. Amber is the best a company account reaches; green needs the
 * visitor's own statement that the text is public.
 */
export function AccountVerdict({ copy, verdict, publicText, onPublic }: Props) {
  const ui = copy.verdict;
  const reason = ui.reasons[verdict.reason];
  const extras = verdict.todo.filter((todo) => todo === "companyNames");
  return (
    <section className="w05-block" aria-labelledby="w05-verdict-title">
      <h2 id="w05-verdict-title" className="w05-h">{ui.heading}</h2>

      <div className="w05-verdict" aria-live="polite" data-light={verdict.light}>
        <LightGlyph light={verdict.light} />
        <div className="w05-verdict-body">
          <p className="w05-verdict-text">
            <strong className="w05-verdict-word">{ui.words[verdict.light]}.</strong> {reason}
          </p>
          {verdict.light === "green" ? <p className="w05-verdict-sub">{ui.open}</p> : null}
          {extras.map((todo) => (
            <p key={todo} className="w05-verdict-sub">{ui.todos[todo]}</p>
          ))}
          {verdict.enterpriseNote ? (
            <p className="w05-verdict-sub">
              <strong>{ui.enterprise}</strong> {ui.enterpriseInfo}
            </p>
          ) : null}
          <p className="w05-verdict-source">
            {ui.source} {citeLine(verdict.cites, { slide: ui.slide, mission: ui.mission, fact: ui.fact })} · {ui.asOf}. {ui.notLegal}
          </p>
        </div>
      </div>

      <label className="w05-check">
        <input type="checkbox" checked={publicText} onChange={(event) => onPublic(event.currentTarget.checked)} />
        <span>{copy.own.publicText}</span>
      </label>
    </section>
  );
}

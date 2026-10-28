"use client";

import { useMemo, useState } from "react";
import { HUNT_RULES, huntMistakes, kitRule } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/reply-check";
import type { Fmt } from "./fmt";

/**
 * Scene 5, under the Claude window: the deck's slide 13 made interactive.
 * Four lines Claude tends to write on this folder, each from the answer
 * key's list of mistakes, and for each the visitor picks the rule of the
 * project instructions that stops it. A pick shows that rule word for word,
 * right or wrong, so every tap teaches a rule. Labelled as the kit's
 * typical mistakes, never as part of the recording above.
 */
export function MistakeHunt({ fmt }: { readonly fmt: Fmt }) {
  const h = fmt.copy.claude.hunt;
  const mistakes = useMemo(() => huntMistakes(fmt.locale), [fmt.locale]);
  const [picks, setPicks] = useState<Readonly<Record<number, number>>>({});
  const solved = mistakes.filter((mistake) => picks[mistake.rule] === mistake.rule).length;
  const quote = (text: string) => (fmt.locale === "de" ? `„${text}“` : `“${text}”`);
  return (
    <section className="w05-hunt" aria-labelledby="w05-hunt-title" data-w05-hunt={solved}>
      <div className="w05-hunt-head">
        <h3 id="w05-hunt-title" className="w05-hunt-title">
          {h.title}
        </h3>
        <span className="w05-hunt-count" aria-live="polite" data-w05-hunt-found={solved}>
          {fmt.t(h.found, { n: solved, total: mistakes.length })}
        </span>
      </div>
      <p className="w05-hint">{h.source}</p>
      <ol className="w05-hunt-cards">
        {mistakes.map((mistake) => {
          const pick = picks[mistake.rule];
          const right = pick === mistake.rule;
          return (
            <li key={mistake.rule} className="w05-hunt-card" data-solved={right ? "" : undefined} data-w05-hunt-card={mistake.rule}>
              <p className="w05-hunt-line">{mistake.line}</p>
              <div className="w05-hunt-rules" role="group" aria-label={h.which}>
                {HUNT_RULES.map((rule) => (
                  <button
                    key={rule}
                    type="button"
                    className="w05-hunt-rule"
                    aria-pressed={pick === rule}
                    data-verdict={pick === rule ? (right ? "right" : "wrong") : undefined}
                    onClick={() => setPicks((current) => ({ ...current, [mistake.rule]: rule }))}
                    data-w05-hunt-rule={rule}
                  >
                    {fmt.t(h.rule, { n: rule })}
                  </button>
                ))}
              </div>
              {pick !== undefined ? (
                <p className="w05-hunt-verdict" key={pick} data-verdict={right ? "right" : "wrong"}>
                  <span className="w05-hunt-verdict-head">{fmt.t(right ? h.right : h.wrong, { n: pick })}</span> {quote(kitRule(fmt.locale, pick))}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

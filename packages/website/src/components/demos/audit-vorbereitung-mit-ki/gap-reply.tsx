"use client";

import { OWNERS, draftClaims, sampleReply, type ItemId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/case";
import type { W05Copy } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { fill } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/fill";
import type { Model } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
import { renderGapRequest } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/render";
import { defectOf, type Loc } from "./words";

const CLAIMS = draftClaims();
const REPLY = sampleReply();

/**
 * "Lückenliste und Antwort": the six items that are not covered, each with
 * its owner and the request filled from the template; under it the draft's
 * four sentences against the files, and the reply the files carry.
 */
export function GapReply({
  model,
  copy,
  locale,
  shown,
  selected,
  onSelect,
}: {
  readonly model: Model;
  readonly copy: W05Copy;
  readonly locale: Loc;
  readonly shown: boolean;
  readonly selected: ItemId;
  readonly onSelect: (id: ItemId) => void;
}) {
  const gaps = model.rows.filter((row) => row.best.status !== "covered");
  const mailRow = gaps.find((row) => row.item.id === selected) ?? gaps.find((row) => row.item.id === "R7") ?? gaps[0];
  const r5 = model.r5.tests.quote.figures;
  const r4 = model.rows.find((row) => row.item.id === "R4")?.best.tests.scope;
  const evidence = copy.gaps.draftEvidence.map((line) =>
    fill(line, {
      unique: r5.unique ?? 0,
      staff: r5.staff ?? 0,
      systems: r4?.coveredSystems.length ?? 0,
      total: (r4?.coveredSystems.length ?? 0) + (r4?.missingSystems.length ?? 0),
    }),
  );
  return (
    <section className="w05-section" aria-labelledby="w05-gaps" id="lueckenliste" data-w05-gaps="">
      <h2 id="w05-gaps" className="w05-h2">
        {copy.gaps.heading}
      </h2>
      {!shown ? (
        <p className="w05-lede">{copy.gaps.waiting}</p>
      ) : (
        <>
          <p className="w05-lede">{fill(copy.gaps.lede, { n: gaps.length })}</p>
          <div className="w05-gap-picks" role="group" aria-label={copy.gaps.mailGroup}>
            {gaps.map((row) => (
              <button
                key={row.item.id}
                type="button"
                className="w05-pick"
                aria-pressed={mailRow?.item.id === row.item.id}
                onClick={() => onSelect(row.item.id)}
                data-w05-gap={row.item.id}
              >
                <b>{row.item.id}</b> <span>{copy.status[row.best.status]}</span>
              </button>
            ))}
          </div>
          {mailRow ? (
            <div className="w05-gap-card" data-w05-gap-card={mailRow.item.id}>
              <dl className="w05-gap-facts">
                <div>
                  <dt>{copy.gaps.missing}</dt>
                  <dd>
                    {copy.test[mailRow.best.failed[0] ?? "quote"]}: {defectOf(mailRow.best, copy, locale)}
                  </dd>
                </div>
                <div>
                  <dt>{copy.gaps.closes}</dt>
                  <dd>{mailRow.item.closing[locale]}</dd>
                </div>
                <div>
                  <dt>{copy.gaps.owner}</dt>
                  <dd>
                    {OWNERS[mailRow.item.owner][locale]} ({OWNERS[mailRow.item.owner].first})
                  </dd>
                </div>
              </dl>
              <pre className="w05-mail" data-w05-mail="">
                {renderGapRequest(mailRow.best, model.context, copy.gapTemplate, locale).trimEnd()}
              </pre>
            </div>
          ) : null}

          <h3 className="w05-h3">{copy.gaps.draftHeading}</h3>
          <p className="w05-note">{copy.gaps.draftNote}</p>
          <ol className="w05-claims">
            {CLAIMS.map((claim, index) => (
              <li key={claim} className="w05-claim">
                <s>{claim}</s>
                <span className="w05-claim-evidence">{evidence[index]}</span>
              </li>
            ))}
          </ol>

          <h3 className="w05-h3">{copy.gaps.replyHeading}</h3>
          <p className="w05-note">{copy.gaps.replyNote}</p>
          <pre className="w05-mail" data-w05-reply="" lang="en">
            {REPLY}
          </pre>
        </>
      )}
    </section>
  );
}

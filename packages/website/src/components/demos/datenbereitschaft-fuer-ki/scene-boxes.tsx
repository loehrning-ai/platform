"use client";

import type { Pack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import {
  ACTIVE_ACCOUNTS,
  APPROVED_VIEW,
  ENDING_MRR,
  EXPORT_TABLES,
  F01_CLOCK_UTC,
  LOAD_UTC,
  NET_NEW_2026,
  STATUS,
  TABLE_TRAPS,
  WARN_AFTER_H,
} from "@/lib/demo-cases/datenbereitschaft-fuer-ki/data";
import { fill } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/files";
import { formatNumber, NBSP } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/format";
import {
  boundaryOutcome,
  countWho,
  counts,
  freshness,
  gradeValue,
  type Boundary,
  type Kind,
  type WhoFilter,
} from "@/lib/demo-cases/datenbereitschaft-fuer-ki/logic";
import { readingFigures } from "./scene-answer";
import { phase } from "./tween";

const n = (value: number, pack: Pack) => formatNumber(value, pack.locale);
const LEVELS = [ENDING_MRR["2026-04"], ENDING_MRR["2026-05"], ENDING_MRR["2026-06"]];

/** The rows of the approved view the card shows, March to June 2026. */
const VIEW_ROWS = [
  { month: "2026-03", ending: ENDING_MRR["2026-03"], change: NET_NEW_2026[2] as number, accounts: ACTIVE_ACCOUNTS["2026-03"] as number | null },
  { month: "2026-04", ending: ENDING_MRR["2026-04"], change: NET_NEW_2026[3] as number, accounts: null },
  { month: "2026-05", ending: ENDING_MRR["2026-05"], change: NET_NEW_2026[4] as number, accounts: null },
  { month: "2026-06", ending: ENDING_MRR["2026-06"], change: NET_NEW_2026[5] as number, accounts: ACTIVE_ACCOUNTS["2026-06"] as number | null },
];

/** "354.635 − 19.960 = 334.675 · + 9.775 = 344.450 · + 42.565 = 387.015", from the kit values. */
function identity(pack: Pack): string {
  const parts = VIEW_ROWS.slice(1).map((row, index) => {
    const sign = row.change < 0 ? "−" : "+";
    const head = index === 0 ? `${n(ENDING_MRR["2026-03"], pack)} ` : "";
    return `${head}${sign} ${n(Math.abs(row.change), pack)} = ${n(row.ending, pack)}`;
  });
  return parts.join(" · ");
}

/** Beat 3: box 1 (a vague or the exact question) and box 2 (seven export tables or one approved view). */
export function ViewScene({ pack, exact, view, fold }: { readonly pack: Pack; readonly exact: boolean; readonly view: boolean; readonly fold: number }) {
  const copy = pack.view;
  const question = exact ? "exact" : "vague";
  return (
    <div className="fk-boxes">
      <section className="fk-box" aria-label={copy.box1} data-fk-question={question}>
        <p className="fk-box-title">{copy.box1}</p>
        <p className="fk-question">{copy.questions[question]}</p>
        <ul className="fk-checks" data-ok={exact ? "" : undefined}>
          {copy.checks.map((check) => (
            <li key={check}>
              <span aria-hidden="true">{exact ? "✓" : "✕"}</span> {check}
            </li>
          ))}
        </ul>
        <p className="fk-expect" data-fk-expect={question}>
          {copy.expects[question]}
        </p>
      </section>
      <section className="fk-box fk-box-grow" aria-label={copy.box2}>
        <p className="fk-box-title">{copy.box2}</p>
        {view ? (
          <div className="fk-view" style={{ opacity: fold, transform: `translateY(${(1 - fold) * 12}px)` }} data-fk-view="">
            <p className="fk-view-name">{APPROVED_VIEW}</p>
            <table className="fk-view-table">
              <thead>
                <tr>
                  <th>month_start</th>
                  <th>ending_mrr_eur</th>
                  <th>net_new_mrr_eur</th>
                  <th className="fk-col-wide">active_accounts</th>
                </tr>
              </thead>
              <tbody>
                {VIEW_ROWS.map((row) => (
                  <tr key={row.month} data-base={row.month === "2026-03" ? "" : undefined}>
                    <td>{row.month}</td>
                    <td data-strong={row.month === "2026-03" ? undefined : ""}>{n(row.ending, pack)}</td>
                    <td>{n(row.change, pack)}</td>
                    <td className="fk-col-wide">{row.accounts === null ? "" : row.accounts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="fk-identity">{identity(pack)}</p>
          </div>
        ) : (
          <ul className="fk-tiles" data-fk-tiles="">
            {EXPORT_TABLES.map((table) => {
              const trap = TABLE_TRAPS[table];
              return (
                <li key={table} className="fk-tile" data-trap={trap ? "" : undefined}>
                  <span className="fk-tile-name">{table}</span>
                  {trap ? (
                    <span className="fk-tile-trap">
                      {copy.traps[trap]} <span className="fk-tile-id">{trap}</span>
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

const WHO: readonly WhoFilter[] = ["active", "A", "AC", "AN"];
const KIND_ROW: readonly Kind[] = ["level", "change", "rate"];

/** The three cells of "Darf ich addieren?", every number from the kit values. */
function addCells(pack: Pack): readonly { readonly kind: Kind; readonly name: string; readonly rule: string }[] {
  const whole = countWho("AC", STATUS).matched;
  const part = whole - countWho("A", STATUS).matched;
  const pct = `${formatNumber((part / whole) * 100, pack.locale, 1)}${NBSP}%`;
  const values = {
    level: n(ENDING_MRR["2026-06"], pack),
    sum: n(NET_NEW_2026.slice(3).reduce((total, value) => total + value, 0), pack),
    part,
    whole,
    pct,
  };
  return KIND_ROW.map((kind) => ({ kind, name: pack.who.addCells[kind].name, rule: fill(pack.who.addCells[kind].rule, values) }));
}

/** Beat 4: box 3. The kind in one line, then 144 accounts and four counting rules. */
export function WhoScene({
  pack,
  who,
  previous,
  share,
}: {
  readonly pack: Pack;
  readonly who: WhoFilter | null;
  /** The rule before the last tap, for the fade. */
  readonly previous: WhoFilter | null;
  /** 0..1 since the last tap. */
  readonly share: number;
}) {
  const copy = pack.who;
  const result = who ? countWho(who, STATUS) : null;
  const line = who ? fill(copy.lines[who], { n: who === "A" ? countWho("AN", STATUS).matched - countWho("A", STATUS).matched : result?.matched ?? 0 }) : copy.rule;
  return (
    <div className="fk-who">
      <p className="fk-box-title">{copy.box3}</p>
      <p className="fk-kind">{copy.kind}</p>
      <ol className="fk-add" aria-label={copy.addLabel}>
        {addCells(pack).map((cell) => (
          <li key={cell.kind} className="fk-add-cell" data-on={cell.kind === "level" ? "" : undefined}>
            <span className="fk-add-name">{cell.name}</span> {cell.rule}
          </li>
        ))}
      </ol>
      <div className="fk-who-body">
        <ol className="fk-squares" aria-label={copy.legend}>
          {[...STATUS].map((code, index) => {
            const on = (filter: WhoFilter | null) => (filter === null ? 1 : counts(filter, code) ? 1 : 0.2);
            const from = on(previous);
            const to = on(who);
            const local = phase(share, (index / STATUS.length) * 0.8, (index / STATUS.length) * 0.8 + 0.2);
            return <li key={index} className="fk-sq" data-code={code} style={{ opacity: from + (to - from) * local }} />;
          })}
        </ol>
        <div className="fk-who-side">
          <p className="fk-count" data-fk-count={result?.matched ?? ""}>
            {result ? fill(copy.count, { n: result.matched, total: result.of }) : "144"}
          </p>
          <p className="fk-who-line">{line}</p>
          {who ? <p className="fk-origin">{copy.origins[who]}</p> : null}
        </div>
      </div>
      <p className="fk-legend">
        <span className="fk-key" data-code="A" aria-hidden="true" /> {copy.codes.A}
        <span className="fk-key" data-code="C" aria-hidden="true" /> {copy.codes.C}
        <span className="fk-key" data-code="N" aria-hidden="true" /> {copy.codes.N}
      </p>
    </div>
  );
}

export { WHO };

/** Beat 5: box 4. A request for contact data against three setups; only two of them lock. */
export function BoundaryScene({ pack, boundary }: { readonly pack: Pack; readonly boundary: Boundary }) {
  const copy = pack.boundary;
  const outcome = boundaryOutcome(boundary);
  return (
    <div className="fk-boundary" data-fk-boundary={boundary}>
      <p className="fk-box-title">{copy.box4}</p>
      <div className="fk-lane">
        <p className="fk-request" data-bounce={boundary === "grant" ? "" : undefined}>
          <span className="fk-request-case">{copy.requestCase}</span>
          {copy.request}
        </p>
        <div className="fk-barrier" aria-hidden="true">
          {boundary === "instruction" ? <span className="fk-dashed" /> : null}
          {boundary === "grant" ? <span className="fk-wall" /> : null}
        </div>
        <p className="fk-data" data-empty={boundary === "notUploaded" ? "" : undefined}>
          {boundary === "notUploaded" ? copy.shelf : copy.data}
        </p>
      </div>
      {boundary === "notUploaded" ? null : (
        <p className="fk-barrier-label" data-kind={boundary}>
          <span className="fk-barrier-key" aria-hidden="true" />
          {boundary === "grant" ? copy.wall : copy.line}
        </p>
      )}
      <p className="fk-outcome" data-fk-outcome={outcome}>
        {copy.outcomes[outcome]}
      </p>
      <p className="fk-origin">{copy.footnote}</p>
    </div>
  );
}

/**
 * Beat 6: box 5. Expected values outside Claude; "Prüfen" grades the four
 * readings of G01. The three behaviour cases are recorded rehearsal runs and
 * say so from the start: the button never pretends to test Claude.
 */
export function TestScene({ pack, tested, run }: { readonly pack: Pack; readonly tested: boolean; readonly run: number }) {
  const copy = pack.test;
  const values = LEVELS.map((value) => n(value, pack)).join(" · ");
  const age = freshness(LOAD_UTC, F01_CLOCK_UTC, WARN_AFTER_H);
  const shownAt = (step: number) => tested && phase(run, step * 0.22, step * 0.22 + 0.12) >= 1;
  return (
    <div className="fk-test">
      <div className="fk-test-head">
        <p className="fk-expected">{fill(copy.expected, { values })}</p>
        <p className="fk-outside">{copy.outside}</p>
      </div>
      <ol className="fk-cases">
        {copy.rows.map((row, rowIndex) => (
          <li key={row.id} className="fk-case">
            <p className="fk-case-head">
              <span className="fk-case-id">{row.id}</span> {row.question}
            </p>
            {rowIndex === 0 ? null : (
              <p className="fk-case-expect">{fill(row.expect, { age: age.ageH, warn: WARN_AFTER_H })}</p>
            )}
            {rowIndex === 0 ? (
              <ol className="fk-grades">
                {[0, 1, 2, 3].map((detent) => {
                  const grade = gradeValue(readingFigures(detent), LEVELS);
                  const visible = shownAt(detent);
                  const result = grade.pass
                    ? `✓ ${copy.pass}`
                    : `✕ ${grade.reason === "length" ? copy.gradeLength : fill(copy.gradeValue, { got: n(grade.got, pack), want: n(grade.want, pack) })}`;
                  return (
                    <li key={detent} className="fk-grade" data-pass={visible ? String(grade.pass) : undefined}>
                      <span className="fk-grade-name">{fill(copy.readingShort, { n: detent + 1 })}</span>
                      <span>{visible ? result : ""}</span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="fk-grade" data-fk-rehearsed="">
                ✓ {copy.rehearsed}
              </p>
            )}
          </li>
        ))}
      </ol>
      <p className="fk-origin">{copy.recorded}</p>
    </div>
  );
}

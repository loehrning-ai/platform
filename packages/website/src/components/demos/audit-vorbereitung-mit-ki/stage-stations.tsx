"use client";

import { OWNERS, type ItemId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/case";
import type { W05Copy } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { formatDecimal, formatPercent, readCsv } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/counts";
import { formatShort } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/dates";
import { TEST_ORDER, type Evaluation, type TestId } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/evidence";
import { fill } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/fill";
import { kitText } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/kit";
import type { Model } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
import { within } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/motion";
import { FileName } from "./stage-links";
import { dateLine, defectOf, type Loc } from "./words";

/** The four tests as marks: ink outline when a test holds, Mennige fill when it fails, hairline before it ran. */
export function TestMarks({ copy, result, shown }: { readonly copy: W05Copy; readonly result: Evaluation; readonly shown: number }) {
  return (
    <span className="w05-marks">
      {TEST_ORDER.map((test, index) => {
        const ran = shown > index;
        const failed = result.failed.includes(test);
        return (
          <span key={test} className="w05-mark" data-test={test} data-state={!ran ? "open" : failed ? "fail" : "pass"}>
            {copy.test[test]}
          </span>
        );
      })}
    </span>
  );
}

function Head({ children, sub }: { readonly children: React.ReactNode; readonly sub?: React.ReactNode }) {
  return (
    <div className="w05-head">
      <p className="w05-head-a">{children}</p>
      {sub ? <p className="w05-head-b">{sub}</p> : null}
    </div>
  );
}

/** Beat 3: the tool, the four tests with their one-line rules. */
export function ToolStage({ model, copy, locale }: { readonly model: Model; readonly copy: W05Copy; readonly locale: Loc }) {
  return (
    <div className="w05-stage w05-tool" data-w05-stage="tool">
      <Head sub={copy.toolSource}>{copy.toolCaption}</Head>
      <ul className="w05-tool-grid">
        {TEST_ORDER.map((test: TestId) => (
          <li key={test} className="w05-tool-cell">
            <span className="w05-mark" data-state="pass">
              {copy.test[test]}
            </span>
            <span className="w05-tool-line">{fill(copy.tool.lines[test], { window: formatShort(model.context.windowStart, locale) })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Beat 4: three files for R7; after the pick the four tests run on each, the picked one outlined. */
export function R7Stage({ model, copy, locale, pick, t }: { readonly model: Model; readonly copy: W05Copy; readonly locale: Loc; readonly pick: number | null; readonly t: number }) {
  const shown = pick === null ? 0 : Math.floor(Math.min(1, t) * 4.999);
  const done = pick !== null && t >= 1;
  const r7 = model.rows.find((row) => row.item.id === "R7");
  return (
    <div className="w05-stage w05-r7" data-w05-stage="r7" data-done={done ? "" : undefined}>
      <Head>{`R7 · ${r7?.item.request ?? ""}`}</Head>
      <ol className="w05-cards">
        {model.r7.map((result, index) => {
          const quote = result.tests.quote.quote;
          const reason = reasonOf(result, copy, locale);
          return (
            <li key={result.doc.file} className="w05-card" data-picked={pick === index ? "" : undefined} data-status={done ? result.status : undefined}>
              <span className="w05-card-top">
                <FileName name={result.doc.file} className="w05-card-name" />
                <span className="w05-card-type">{copy.type[result.doc.type]}</span>
              </span>
              <span className="w05-card-quote">{quote ? `"${quote}"` : copy.all.noQuote}</span>
              <span className="w05-card-foot">
                <TestMarks copy={copy} result={result} shown={shown} />
                {done ? <span className="w05-card-status">{copy.status[result.status]}</span> : null}
              </span>
              {shown >= 4 && reason ? <span className="w05-card-reason">{reason}</span> : null}
            </li>
          );
        })}
      </ol>
      {done ? <p className="w05-moral">{copy.r7.moral}</p> : <p className="w05-hint">{copy.r7.waiting}</p>}
    </div>
  );
}

function reasonOf(result: Evaluation, copy: W05Copy, locale: Loc): string {
  const parts: string[] = [];
  if (result.failed.includes("date")) parts.push(fill(copy.r7.reasons.date, { approved: formatShort(result.tests.date.used?.iso ?? "", locale) }));
  if (result.failed.includes("approval")) parts.push(copy.r7.reasons.notReviewed);
  if (result.tests.quote.kind === "intent") parts.push(copy.r7.reasons.intent);
  if (result.tests.quote.kind === "notMet") parts.push(copy.r7.reasons.notMet);
  return parts.join(" · ");
}

const TRAINING = readCsv(kitText("folder/training-records_2026.csv")).rows.map((row) => row.staff_id ?? "");
const COLUMNS = 13;

/** Beat 5: the training rows drop into a counter, the duplicate merges, the bar fills against the target tick. */
export function R5Stage({ model, copy, locale, t }: { readonly model: Model; readonly copy: W05Copy; readonly locale: Loc; readonly t: number }) {
  const figures = model.r5.tests.quote.figures;
  const duplicate = figures.duplicateId ?? "";
  const first = TRAINING.indexOf(duplicate);
  const second = TRAINING.lastIndexOf(duplicate);
  const merge = within(t, 0.42, 0.6);
  const bar = within(t, 0.62, 0.85);
  const target = model.context.trainingShare;
  const staff = figures.staff ?? 0;
  const unique = figures.unique ?? 0;
  const counted = merge >= 1;
  return (
    <div className="w05-stage w05-r5" data-w05-stage="r5">
      <Head sub={copy.r5.mistakes}>{`R5 · ${model.rows.find((row) => row.item.id === "R5")?.item.label[locale] ?? ""}`}</Head>
      <ol className="w05-squares" aria-label={fill(copy.r5.rows, { rows: TRAINING.length })}>
        {TRAINING.map((id, index) => {
          const drop = within(t, index * 0.012, index * 0.012 + 0.1);
          const twin = index === second;
          const dx = twin ? ((first % COLUMNS) - (second % COLUMNS)) * merge : 0;
          const dy = twin ? (Math.floor(first / COLUMNS) - Math.floor(second / COLUMNS)) * merge : 0;
          return (
            <li
              key={`${id}-${index}`}
              className="w05-square"
              data-dup={index === first || twin ? "" : undefined}
              style={{ opacity: drop, "--dx": dx, "--dy": dy - (1 - drop) } as React.CSSProperties}
            >
              {id.replace(/^E0?/, "")}
            </li>
          );
        })}
      </ol>
      <p className="w05-count" data-counted={counted ? "" : undefined}>
        {counted ? fill(copy.r5.merged, { id: duplicate, unique }) : fill(copy.r5.rows, { rows: TRAINING.length })}
      </p>
      <div className="w05-bar" role="img" aria-label={fill(copy.r5.lever, { unique, staff, share: formatPercent(unique / staff, locale) })}>
        <span className="w05-bar-fill" style={{ transform: `scaleX(${(unique / staff) * bar})` }} />
        <span className="w05-bar-tick" style={{ left: `${target * 100}%` }}>
          <span>{fill(copy.r5.tick, { share: formatPercent(target, locale) })}</span>
        </span>
      </div>
      <p className="w05-needed" style={{ opacity: within(t, 0.86, 0.96) }}>
        {fill(copy.r5.needed, { needed: figures.needed ?? 0, staff, missing: figures.missing ?? 0 })}
      </p>
    </div>
  );
}

/** Beat 6: one request at a time, its best file, the four tests, the quote, the status, what closes it and who owns it. */
export function AllStage({ model, copy, locale, selected }: { readonly model: Model; readonly copy: W05Copy; readonly locale: Loc; readonly selected: ItemId }) {
  const row = model.rows.find((entry) => entry.item.id === selected) ?? model.rows[0];
  if (!row) return null;
  const result = row.best;
  const quote = result.tests.quote.quote;
  const hours = result.tests.quote.figures.hours;
  const note =
    row.item.id === "R1"
      ? copy.all.r1
      : hours !== undefined && result.status === "covered"
        ? fill(copy.all.r6, { hours: formatDecimal(hours, locale), allowed: model.context.noticeHours })
        : result.failed.length > 0
          ? fill(copy.all.fails, { tests: result.failed.map((test) => copy.test[test]).join(", ") })
          : null;
  const defect = result.status !== "covered" ? defectOf(result, copy, locale) : null;
  return (
    <div className="w05-stage w05-all" data-w05-stage="all" data-item={row.item.id} data-status={result.status}>
      <Head sub={`${copy.all.request}: "${row.item.request}"`}>
        <b>{row.item.id}</b> {row.item.label[locale]} <span className="w05-all-status">{copy.status[result.status]}</span>
      </Head>
      <div className="w05-all-body">
        <p className="w05-all-file">
          <span className="w05-label">{copy.all.bestFile}</span>
          <FileName name={result.doc.file} className="w05-all-name" />
          <span className="w05-all-date">
            {dateLine(result, copy)} · {copy.type[result.doc.type]}
          </span>
        </p>
        <TestMarks copy={copy} result={result} shown={4} />
        <p className="w05-all-quote">{quote ? `"${quote}"` : copy.all.noQuote}</p>
        {defect && defect !== `"${quote}"` ? <p className="w05-defect">{defect}</p> : null}
        {note ? <p className="w05-all-note">{note}</p> : null}
        {result.status !== "covered" ? (
          <p className="w05-all-close">
            <span className="w05-label">{copy.all.closes}</span> {row.item.closing[locale]}.{" "}
            <span className="w05-label">{copy.all.owner}</span> {OWNERS[row.item.owner][locale]}
          </p>
        ) : null}
      </div>
      <ol className="w05-all-overview" aria-hidden="true">
        {model.rows.map((entry) => (
          <li key={entry.item.id} data-status={entry.status} data-current={entry.item.id === row.item.id ? "" : undefined}>
            <b>{entry.item.id}</b>
            <span className="w05-all-overview-label">{entry.item.label[locale]}</span>
            <span className="w05-all-overview-status">{copy.status[entry.status]}</span>
            <FileName name={entry.best.doc.file} className="w05-all-overview-file" />
          </li>
        ))}
      </ol>
    </div>
  );
}

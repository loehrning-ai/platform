"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import type { AppCopy } from "@/lib/demo-cases/esg-berichte-mit-ki/app-copy";
import { fill } from "@/lib/demo-cases/esg-berichte-mit-ki/app-data";
import type { AppFile } from "@/lib/demo-cases/esg-berichte-mit-ki/app-data";
import { STROM, YEAR } from "@/lib/demo-cases/esg-berichte-mit-ki/kit";
import { distinctMonths } from "@/lib/demo-cases/esg-berichte-mit-ki/rules";
import { INVOICE_IMAGE } from "../scene-invoice";

/** The nearest ancestor that scrolls (the panel body, or the sheet's content on a phone). */
function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let at = node.parentElement; at; at = at.parentElement) {
    const overflow = getComputedStyle(at).overflowY;
    if ((overflow === "auto" || overflow === "scroll") && at.scrollHeight > at.clientHeight) return at;
  }
  return null;
}

const linesOf = (text: string) => text.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");

/**
 * A project file as Claude's preview shows it, with editor line numbers (the
 * project instructions say "lines as in a text editor"), the cited lines
 * marked and scrolled into view inside the panel.
 */
export function FileView({ file, from, to, copy, invoiceAlt }: { readonly file: AppFile; readonly from: number | null; readonly to: number | null; readonly copy: AppCopy; readonly invoiceAlt: string }) {
  const listRef = useRef<HTMLOListElement>(null);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || !from) return;
    const line = list.querySelector<HTMLElement>(`[data-line="${from}"]`);
    const scroller = scrollParent(list);
    if (line && scroller) scroller.scrollTop += line.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 56;
  }, [file.path, from]);

  if (file.kind === "png") {
    return (
      <figure className="w4a-image" data-w4a-fileview={file.path}>
        <Image src={INVOICE_IMAGE[file.path.startsWith("nachreichung") ? "de" : "en"]} alt={invoiceAlt} sizes="(min-width: 64rem) 26rem, 100vw" />
      </figure>
    );
  }
  const lines = linesOf(file.text ?? "");
  const marked = (n: number) => from !== null && n >= from && n <= (to ?? from);
  return (
    <div className="w4a-fileview" data-w4a-fileview={file.path}>
      {from ? <p className="w4a-fileview-note">{to && to !== from ? fill(copy.panel.lines, { from, to }) : fill(copy.panel.line, { n: from })}</p> : null}
      <ol ref={listRef} className="w4a-lines">
        {lines.map((text, index) => {
          const n = index + 1;
          return (
            <li key={n} data-line={n} data-marked={marked(n) ? "" : undefined}>
              <span className="w4a-ln" aria-hidden="true">
                {n}
              </span>
              <span className="w4a-lt">{text || " "}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * Step 1 by hand: the electricity file's twelve bill rows, tapped one by one.
 * The count follows the rule Claude used in code (month and invoice number
 * are the key), so twelve rows make eleven months and September is missing.
 */
export function MonthCheck({ file, copy }: { readonly file: AppFile; readonly copy: AppCopy }) {
  const [picked, setPicked] = useState<ReadonlySet<number>>(new Set());
  const lines = linesOf(file.text ?? "");
  const rows = STROM.filter((row) => picked.has(row.line));
  const count = distinctMonths(rows, YEAR);
  const all = distinctMonths(STROM, YEAR);
  const done = picked.size === STROM.length;
  const monthName = (month: string) => copy.monthNames[Number(month.slice(5)) - 1] ?? month;
  const toggle = (line: number) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(line)) next.delete(line);
      else next.add(line);
      return next;
    });
  return (
    <div className="w4a-months" data-w4a-months="" data-done={done ? "" : undefined}>
      <p className="w4a-check-lead">{copy.monthCheck.lead}</p>
      <ol className="w4a-lines" data-pick="">
        {lines.map((text, index) => {
          const n = index + 1;
          const row = STROM.find((item) => item.line === n);
          if (!row) {
            return (
              <li key={n} data-line={n}>
                <span className="w4a-ln" aria-hidden="true">
                  {n}
                </span>
                <span className="w4a-lt">{text || " "}</span>
              </li>
            );
          }
          const on = picked.has(n);
          const twin = done && all.duplicates.some((item) => item.lines.includes(n));
          return (
            <li key={n} data-line={n}>
              <button
                type="button"
                className="w4a-line-pick"
                aria-pressed={on}
                aria-label={fill(copy.monthCheck.row, { n, month: monthName(row.month), invoice: row.invoice })}
                onClick={() => toggle(n)}
                data-twin={twin ? "" : undefined}
                data-w4a-month-line={n}
              >
                <span className="w4a-ln" aria-hidden="true">
                  {n}
                </span>
                <span className="w4a-lt">{text}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="w4a-months-foot" aria-live="polite">
        <p className="w4a-months-count" data-w4a-month-count={count.months.length}>
          {fill(copy.monthCheck.count, { rows: rows.length, months: count.months.length })}
        </p>
        {count.duplicates.map((item) => (
          <p key={item.invoice} className="w4a-months-note">
            {fill(copy.monthCheck.duplicate, { a: item.lines[0] ?? "", b: item.lines[1] ?? "", invoice: item.invoice })}
          </p>
        ))}
        {done ? (
          <p className="w4a-months-note" data-w4a-month-missing="">
            {fill(copy.monthCheck.missing, { missing: all.missing.map((month) => `${copy.monthNames[month - 1]} ${YEAR}`).join(", ") })}
          </p>
        ) : null}
        <button type="button" className="w4a-link" onClick={() => setPicked(done ? new Set() : new Set(STROM.map((row) => row.line)))} data-w4a-month-all="">
          {done ? copy.monthCheck.clear : copy.monthCheck.all}
        </button>
      </div>
    </div>
  );
}

/** The Register sheet of the file Claude wrote, cell for cell (read with openpyxl after step 5). */
export function RegisterSheetView({ rows, label }: { readonly rows: readonly (readonly string[])[]; readonly label: string }) {
  const [head, ...body] = rows;
  return (
    <div className="w4a-sheetview" role="region" aria-label={label} tabIndex={0} data-w4a-register-sheet="">
      <table>
        <thead>
          <tr>
            {(head ?? []).map((cell, index) => (
              <th key={index}>{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, index) => (
            <tr key={index}>
              {row.map((cell, at) => (
                <td key={at}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

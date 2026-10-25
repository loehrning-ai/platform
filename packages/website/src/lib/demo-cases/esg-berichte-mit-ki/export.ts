/**
 * The visitor's list as text: the reasons and missing documents in words,
 * the safe wording, a Markdown table for Claude, the Nachweisregister as CSV
 * (the kit template's columns) and one mail per missing document (the kit's
 * mail template). Pure: the words come in from the locale pack.
 */
import type { Destination, Evidence, MissingDoc, OwnInput, OwnResult, OwnRow, Reason } from "./own";
import { usesMonths, usesValidity } from "./own";
import type { Status } from "./rules";

export interface ExportWords {
  readonly statuses: Readonly<Record<Status, string>>;
  readonly destinations: Readonly<Record<Destination, string>>;
  /** As in "laut {evidence}". */
  readonly evidenceAfterLaut: Readonly<Record<Evidence, string>>;
  readonly evidence: Readonly<Record<Evidence, string>>;
  readonly months: readonly string[];
  readonly and: string;
  readonly wholeYear: string;
  readonly decisions: { readonly raus: string; readonly streichen: string; readonly mitStatus: string };
  readonly reasons: {
    readonly nothing: string;
    readonly noMonths: string;
    readonly monthsMissing: string;
    readonly expired: string;
    readonly noValidity: string;
    readonly scopePart: string;
    readonly notFinal: string;
    readonly gate: Readonly<Record<"4c" | "4a" | "4b" | "2a" | "zukunft", string>>;
  };
  readonly missing: {
    readonly nothing: string;
    readonly months: string;
    readonly valid: string;
    readonly signed: string;
    readonly released: string;
    readonly rest: string;
  };
  readonly safe: { readonly pattern: string; readonly periodMonths: string; readonly periodValid: string; readonly withStatus: string; readonly cut: string };
  readonly table: readonly string[];
  readonly csv: { readonly separator: string; readonly header: readonly string[]; readonly request: string };
  readonly mail: {
    readonly subject: string;
    readonly greeting: string;
    readonly need: string;
    readonly answer: string;
    readonly withoutAnswer: string;
    readonly withoutClaim: string;
    readonly ifNone: string;
    readonly thanks: string;
  };
}

/** "{a} und {b}" style placeholders; unknown keys stay visible so a test catches them. */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));
}

/** "Januar, März und September". */
export function monthList(months: readonly number[], words: ExportWords): string {
  const names = months.map((month) => words.months[month - 1] ?? String(month));
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} ${words.and} ${names.at(-1)}`;
}

export function reasonText(reason: Reason, words: ExportWords): string {
  switch (reason.code) {
    case "gate":
      return words.reasons.gate[reason.gate];
    case "monthsMissing":
      return fill(words.reasons.monthsMissing, { months: monthList(reason.months, words), count: 12 - reason.months.length });
    case "expired":
      return fill(words.reasons.expired, { days: reason.days, date: reason.validUntil });
    case "notFinal":
      return fill(words.reasons.notFinal, { evidence: words.evidence[reason.evidence] });
    default:
      return words.reasons[reason.code];
  }
}

export function missingText(doc: MissingDoc, words: ExportWords): string {
  switch (doc.code) {
    case "months":
      return fill(words.missing.months, { months: monthList(doc.months, words) });
    case "valid":
      return fill(words.missing.valid, { evidence: words.evidence[doc.evidence], date: doc.stichtag });
    default:
      return words.missing[doc.code];
  }
}

/** The period as the visitor entered it, or "" when there is none to state. */
export function periodText(input: OwnInput, words: ExportWords): string {
  if (usesMonths(input.evidence)) {
    const ticked = input.months.flatMap((on, index) => (on ? [index + 1] : []));
    if (ticked.length === 0) return "";
    return ticked.length === 12 ? words.wholeYear : monthList(ticked, words);
  }
  if (usesValidity(input.evidence) && input.validUntil.trim() !== "") return input.validUntil.trim();
  return "";
}

/**
 * "Sichere Fassung (Muster)": built only from what the visitor entered. A cut
 * claim gets "Streichen."; an answer that is not BELEGT keeps its status.
 */
export function safeWording(input: OwnInput, result: OwnResult, sentence: string, words: ExportWords): string | null {
  if (result.decision === "streichen") return null;
  const period = periodText(input, words);
  const periodPart = period === ""
    ? ""
    : fill(usesValidity(input.evidence) ? words.safe.periodValid : words.safe.periodMonths, { period });
  const base = fill(words.safe.pattern, {
    sentence: sentence.replace(/[.!]+$/, ""),
    evidence: words.evidenceAfterLaut[input.evidence],
    period: periodPart,
  });
  if (result.status === "belegt") return base;
  const missing = result.missing.map((doc) => missingText(doc, words)).join("; ");
  return `${base} ${fill(words.safe.withStatus, { status: words.statuses[result.status], missing })}`;
}

export function decisionText(result: OwnResult, words: ExportWords): string {
  return words.decisions[result.decision];
}

const cellMd = (text: string) => text.replace(/\r?\n|\r/g, " ").replace(/\|/g, "\\|");

/** "Als Tabelle für Claude kopieren": | Satz | Wohin | Nachweis | Status | Fehlt |. */
export function toMarkdownTable(rows: readonly OwnRow[], words: ExportWords): string {
  const header = `| ${words.table.join(" | ")} |`;
  const rule = `|${words.table.map(() => "---").join("|")}|`;
  const body = rows.map((entry) => {
    const status = entry.result.decision === "mitStatus"
      ? words.statuses[entry.result.status]
      : `${words.statuses[entry.result.status]}, ${decisionText(entry.result, words)}`;
    const cells = [
      entry.sentence,
      words.destinations[entry.destination],
      words.evidence[entry.evidence],
      status,
      entry.result.missing.map((doc) => missingText(doc, words)).join("; "),
    ];
    return `| ${cells.map(cellMd).join(" | ")} |`;
  });
  return [header, rule, ...body].join("\n");
}

/** RFC 4180: quote when the cell holds the separator, a quote or a line break. */
export function csvCell(text: string, separator: string): string {
  return text.includes(separator) || /["\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const BOM = "﻿";

/** "Nachweisregister herunterladen": the kit template's twelve columns, UTF-8 with BOM for Excel. */
export function toRegisterCsv(rows: readonly OwnRow[], words: ExportWords): string {
  const { separator } = words.csv;
  const lines = [words.csv.header.map((cell) => csvCell(cell, separator)).join(separator)];
  rows.forEach((entry, index) => {
    const cells = [
      words.destinations[entry.destination],
      String(index + 1),
      entry.sentence,
      entry.safe ?? words.safe.cut,
      words.evidence[entry.evidence],
      "",
      words.statuses[entry.result.status],
      entry.result.reasons.map((reason) => reasonText(reason, words)).join("; "),
      entry.result.missing.map((doc) => missingText(doc, words)).join("; "),
      entry.result.decision === "streichen" ? words.decisions.streichen : "",
      "",
      "",
    ];
    lines.push(cells.map((cell) => csvCell(cell, separator)).join(separator));
  });
  return `${BOM}${lines.join("\r\n")}\r\n`;
}

export interface Mail {
  readonly doc: string;
  readonly text: string;
}

/** One mail per distinct missing document, from the kit's mail template, with nothing left to fill in. */
export function missingDocMails(rows: readonly OwnRow[], words: ExportWords): readonly Mail[] {
  const mails = new Map<string, Mail>();
  for (const entry of rows) {
    for (const doc of entry.result.missing) {
      const name = missingText(doc, words);
      if (mails.has(name)) continue;
      const consumer = entry.result.decision !== "mitStatus";
      const text = [
        fill(words.mail.subject, { doc: name }),
        "",
        words.mail.greeting,
        "",
        fill(words.mail.need, { destination: words.destinations[entry.destination], doc: name }),
        fill(words.mail.answer, { sentence: entry.sentence }),
        consumer ? words.mail.withoutClaim : fill(words.mail.withoutAnswer, { status: words.statuses[entry.result.status] }),
        "",
        words.mail.ifNone,
        "",
        words.mail.thanks,
      ].join("\n");
      mails.set(name, { doc: name, text });
    }
  }
  return [...mails.values()];
}
